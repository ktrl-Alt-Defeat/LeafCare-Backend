import { SUPPORTED_CROPS, SupportedCrop } from '../crop-normalization/supported-crops.js';
import {
  IDiseaseDetectionService,
  DiseaseDetectionResult,
} from './disease-detection.interface.js';
import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';

export interface TopPrediction {
  class: string;
  confidence: number;
  confidence_percentage?: number;
}

/**
 * Union of the label/score key names the inference service may use.
 *
 * The deployed EfficientNetV2-S service returns `predicted_class` plus
 * `top_5_predictions`; the other keys are kept so swapping in a different
 * model deployment does not require a code change here.
 */
export interface ConvNextResponsePayload {
  predicted_class?: string;
  disease_name?: string;
  disease?: string;
  label?: string;
  class?: string;
  class_name?: string;
  prediction?: string;
  result?: string;
  confidence?: number;
  confidence_percentage?: number;
  score?: number;
  prob?: number;
  probability?: number;
  top_5_predictions?: TopPrediction[];
  inference_time_ms?: number;
}

/**
 * Service adapter for the ConvNeXt disease detection model.
 *
 * IMPORTANT: ConvNeXt MUST ONLY be called after the backend orchestrator
 * has verified that crop.supported === true.
 */
export class DiseaseDetectionService implements IDiseaseDetectionService {
  /**
   * Reads the crop half of a PlantVillage class label and maps it onto our
   * SupportedCrop vocabulary.
   *
   * The dataset's crop segments are not clean identifiers — they carry
   * qualifiers and punctuation ("Corn_(maize)", "Pepper,_bell",
   * "Cherry_(including_sour)") — so this compares on letters only.
   */
  private labelCrop(rawLabel: string): string | null {
    if (!rawLabel.includes('___')) return null;

    const segment = rawLabel.split('___')[0] ?? '';
    const letters = segment.toLowerCase().replace(/[^a-z]/g, '');
    if (!letters) return null;

    for (const candidate of SUPPORTED_CROPS) {
      const canonical = candidate.toLowerCase().replace(/[^a-z]/g, '');
      // "pepperbell" vs "bellpepper", "cornmaize" vs "corn": accept either
      // direction of containment rather than demanding an exact match.
      if (letters.includes(canonical) || canonical.includes(letters)) return candidate;
    }

    return null;
  }

  /**
   * Chooses the prediction to report.
   *
   * The inference service classifies across all 38 PlantVillage classes and
   * ignores the crop we send, so its top result can belong to a different
   * plant entirely — a tomato photo returning "Cedar Apple Rust". Because the
   * orchestrator has already identified the crop, we prefer the best-scoring
   * prediction that actually belongs to it and fall back to the raw top
   * result only when the model offers nothing for this crop.
   */
  private selectPrediction(
    payload: ConvNextResponsePayload,
    crop: SupportedCrop
  ): { label: string; confidence: number; crossCrop: boolean } | null {
    const globalLabel =
      payload.predicted_class ||
      payload.disease_name ||
      payload.disease ||
      payload.label ||
      payload.class_name ||
      payload.class ||
      payload.prediction ||
      payload.result;

    const globalConfidence =
      payload.confidence ?? payload.score ?? payload.prob ?? payload.probability ?? 0;

    const forThisCrop = (payload.top_5_predictions ?? []).filter(
      (entry) => entry.class && this.labelCrop(entry.class) === crop
    );

    if (forThisCrop.length > 0) {
      const best = forThisCrop.reduce((a, b) => (b.confidence > a.confidence ? b : a));
      return { label: best.class, confidence: best.confidence, crossCrop: false };
    }

    if (!globalLabel) return null;

    return {
      label: globalLabel,
      confidence: globalConfidence,
      crossCrop: this.labelCrop(globalLabel) !== crop,
    };
  }

  /**
   * Cleans raw model class labels (e.g. "Tomato___Early_blight" -> "Early Blight")
   */
  public cleanDiseaseLabel(rawLabel: string, crop: SupportedCrop): string {
    if (!rawLabel) return 'Unknown Disease';

    let cleaned = rawLabel.trim();

    // Handle "Crop___Disease" format (e.g. PlantVillage standard format)
    if (cleaned.includes('___')) {
      const parts = cleaned.split('___');
      cleaned = parts.length > 1 ? parts[1] : parts[0];
    }

    // Replace underscores with spaces
    cleaned = cleaned.replace(/_/g, ' ').trim();

    // Strip leading crop name if present (e.g. "Tomato Early Blight" -> "Early Blight")
    const cropTitle = crop.replace(/_/g, ' ').toLowerCase();
    if (cleaned.toLowerCase().startsWith(cropTitle)) {
      cleaned = cleaned.substring(cropTitle.length).trim();
    }

    // Capitalize words
    cleaned = cleaned
      .split(' ')
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return cleaned || 'Healthy';
  }

  /**
   * Performs disease detection for a verified supported crop using ConvNeXt inference endpoint.
   *
   * @param imageBuffer Image buffer
   * @param crop Verified supported crop
   */
  public async detectDisease(
    imageBuffer: Buffer,
    crop: SupportedCrop
  ): Promise<DiseaseDetectionResult> {
    logger.info(`ConvNeXt disease detection started for crop: ${crop}`);

    if (!env.AI_SERVICE_URL) {
      logger.info(
        `AI_SERVICE_URL is unset. ConvNeXt inference service not configured.`
      );
      return {
        available: false,
        disease: null,
        message:
          'Disease detection model service is not configured for this environment.',
      };
    }

    const endpoint = `${env.AI_SERVICE_URL.replace(/\/$/, '')}/predict`;
    const startedAt = Date.now();

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' });
    formData.append('image', blob, 'leaf.jpg');
    formData.append('crop', crop);

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      env.AI_SERVICE_TIMEOUT_MS
    );

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startedAt;

      if (!response.ok) {
        logger.warn(
          `ConvNeXt service returned HTTP ${response.status} in ${latencyMs}ms`
        );
        return {
          available: false,
          disease: null,
          message: `Disease detection service responded with error (HTTP ${response.status}).`,
        };
      }

      const payload = (await response.json()) as ConvNextResponsePayload;

      logger.debug(
        `Inference candidates: ${JSON.stringify(payload.top_5_predictions ?? [])}`
      );

      const selected = this.selectPrediction(payload, crop);

      if (!selected) {
        logger.warn(`Inference response missing a disease prediction label`);
        return {
          available: false,
          disease: null,
          message: 'Disease detection returned an unparseable response payload.',
        };
      }

      // Normalize confidence if reported as percentage (0-100) vs decimal (0-1)
      const confidence =
        selected.confidence > 1 ? selected.confidence / 100 : selected.confidence;

      const diseaseName = this.cleanDiseaseLabel(selected.label, crop);

      if (selected.crossCrop) {
        // Reported rather than suppressed: the farmer still sees a result, but
        // this is the signal that the model had no class for their crop.
        logger.warn(
          `Inference returned "${selected.label}", which does not belong to crop ${crop}. ` +
            `Reporting it, but the model may not cover this crop.`
        );
      }

      logger.info(
        `Disease detection completed: "${diseaseName}" (raw: "${selected.label}") with ${(
          confidence * 100
        ).toFixed(1)}% confidence in ${latencyMs}ms`
      );

      return {
        available: true,
        disease: {
          name: diseaseName,
          confidence: Number(confidence.toFixed(4)),
        },
      };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const aborted = error instanceof Error && error.name === 'AbortError';

      logger.warn(
        `ConvNeXt disease detection failed (${latencyMs}ms): ${
          aborted ? 'Timeout' : error instanceof Error ? error.message : String(error)
        }`
      );

      return {
        available: false,
        disease: null,
        message: aborted
          ? `Disease detection timed out after ${env.AI_SERVICE_TIMEOUT_MS}ms.`
          : 'Disease detection service is currently unreachable.',
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const diseaseDetectionService = new DiseaseDetectionService();
