import { SupportedCrop } from '../crop-normalization/supported-crops.js';
import { cropNormalizationService } from '../crop-normalization/crop-normalization.service.js';
import {
  DiseaseDetectionResult,
  IDiseaseDetectionService,
  RankedDisease,
} from './disease-detection.interface.js';
import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';
import { InferenceClient, inferenceClient } from '../inference-client/inference-client.js';
import { InferenceClassificationPayload } from '../inference-client/inference-client.types.js';

/** A ranked entry as the older PlantVillage services emit it. */
export interface TopPrediction {
  class: string;
  confidence: number;
  confidence_percentage?: number;
}

/** What the classifier is asked to read. */
export interface DiseaseDetectionInput {
  /** The image bytes. Sent only when no ROI handle is available. */
  buffer: Buffer;
  /**
   * Handle for a crop the inference host is already holding from the detect
   * call. Quoting it skips a second upload of the same pixels.
   */
  roiId?: string;
  requestId?: string;
}

/**
 * Union of the label/score key names an inference service may use.
 *
 * The DINOv2 host returns `predicted_class` plus a full `top_k` ranking; the
 * EfficientNetV2-S deployment it replaced returned `top_5_predictions`. Both
 * shapes are read so a change of served model is a URL change and nothing more.
 */
export interface DiseaseResponsePayload extends InferenceClassificationPayload {
  disease_name?: string;
  disease?: string;
  label?: string;
  class?: string;
  class_name?: string;
  prediction?: string;
  result?: string;
  score?: number;
  prob?: number;
  probability?: number;
  top_5_predictions?: TopPrediction[];
}

/** Retained under its previous name so existing imports keep compiling. */
export type ConvNextResponsePayload = DiseaseResponsePayload;

/** Rescales a score reported as a percentage onto the 0-1 range. */
const toUnitScale = (value: number): number => (value > 1 ? value / 100 : value);

/**
 * Adapter for the disease classifier (DINOv2 ViT-B/14) on the inference host.
 *
 * It classifies; it does not decide. The full ranking comes back along with the
 * host's novelty verdict, and the orchestrator applies the product rules: which
 * crop this is, whether that crop is supported, and whether the answer is
 * trustworthy enough to put in front of a farmer.
 */
export class DiseaseDetectionService implements IDiseaseDetectionService {
  /** Flattens whichever ranking the host sent into one list, on a 0-1 scale. */
  private rankedCandidates(payload: DiseaseResponsePayload): RankedDisease[] {
    const fromTopK = (payload.top_k ?? [])
      .filter((entry) => typeof entry?.label === 'string' && typeof entry?.confidence === 'number')
      .map((entry) => ({
        label: entry.label as string,
        confidence: toUnitScale(entry.confidence as number),
      }));

    const fromTopFive = (payload.top_5_predictions ?? [])
      .filter((entry) => typeof entry?.class === 'string' && typeof entry?.confidence === 'number')
      .map((entry) => ({ label: entry.class, confidence: toUnitScale(entry.confidence) }));

    return [...fromTopK, ...fromTopFive];
  }

  /** The single label the host ranked first, across every class. */
  private topLabel(payload: DiseaseResponsePayload): string | undefined {
    return (
      payload.predicted_class ||
      payload.disease_name ||
      payload.disease ||
      payload.label ||
      payload.class_name ||
      payload.class ||
      payload.prediction ||
      payload.result
    );
  }

  /**
   * Best-scoring class belonging to `crop`, with its probability conditioned on
   * that crop.
   *
   * Conditioning matters once the crop is settled. The raw score is spread over
   * all 38 classes, so the right answer for a potato leaf can read as 0.02 when
   * most of the mass sits on the same disease under tomato. Renormalising over
   * the crop's own classes answers the question actually being asked - given
   * this is a potato, which potato disease is it.
   */
  public selectForCrop(
    ranked: RankedDisease[],
    crop: SupportedCrop
  ): { label: string; confidence: number } | null {
    const forCrop = ranked.filter(
      (entry) => cropNormalizationService.cropFromLabel(entry.label) === crop
    );
    if (forCrop.length === 0) return null;

    const best = forCrop.reduce((a, b) => (b.confidence > a.confidence ? b : a));
    const cropMass = forCrop.reduce((sum, entry) => sum + entry.confidence, 0);

    return {
      label: best.label,
      confidence: cropMass > 0 ? best.confidence / cropMass : best.confidence,
    };
  }

  /**
   * Cleans raw model class labels (e.g. "tomato___early_blight" -> "Early Blight")
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

  public async classify(
    input: Buffer | DiseaseDetectionInput
  ): Promise<DiseaseDetectionResult> {
    const request: DiseaseDetectionInput = Buffer.isBuffer(input) ? { buffer: input } : input;

    logger.info(
      'Disease classification started' +
        (request.roiId ? ' (classifying the cached ROI, no re-upload)' : '')
    );

    if (!inferenceClient.configured) {
      logger.info('INFERENCE_SERVICE_URL is unset. Disease inference host not configured.');
      return {
        available: false,
        disease: null,
        message: 'Disease detection model service is not configured for this environment.',
      };
    }

    const form = new FormData();
    if (request.roiId) {
      form.append('roi_id', request.roiId);
    } else {
      form.append('image', InferenceClient.filePart(request.buffer, 'image/jpeg'), 'leaf.jpg');
    }

    const result = await inferenceClient.postForm<DiseaseResponsePayload>(
      '/v1/disease/classify',
      form,
      {
        timeoutMs: env.INFERENCE_CLASSIFY_TIMEOUT_MS,
        ...(request.requestId ? { requestId: request.requestId } : {}),
        label: 'disease/classify',
      }
    );

    if (!result.ok) {
      // A stale handle is recoverable: the host expired the crop, so send the
      // pixels this time rather than failing a scan the farmer already waited for.
      if (result.kind === 'http' && result.status === 404 && request.roiId) {
        logger.info('Cached ROI expired on the inference host. Retrying with the image.');
        return this.classify({
          buffer: request.buffer,
          ...(request.requestId ? { requestId: request.requestId } : {}),
        });
      }

      return {
        available: false,
        disease: null,
        message:
          result.kind === 'timeout'
            ? `Disease detection timed out after ${env.INFERENCE_CLASSIFY_TIMEOUT_MS}ms.`
            : result.message,
      };
    }

    const payload = result.data;
    const ranked = this.rankedCandidates(payload);
    const topLabel = this.topLabel(payload);

    if (!topLabel || ranked.length === 0) {
      logger.warn('Inference response carried no usable ranking.');
      return {
        available: false,
        disease: null,
        message: 'Disease detection returned an unparseable response payload.',
      };
    }

    const novelty = payload.novelty
      ? {
          verdict: payload.novelty.verdict ?? 'accept',
          accepted: payload.novelty.accepted ?? true,
          knnDistance: payload.novelty.knn_distance ?? 0,
          energy: payload.novelty.energy ?? 0,
          confidence: payload.novelty.confidence ?? 0,
          ...(payload.novelty.reason ? { reason: payload.novelty.reason } : {}),
        }
      : undefined;

    logger.info(
      `Classification: "${topLabel}" at ${((ranked[0]?.confidence ?? 0) * 100).toFixed(1)}% ` +
        `[${novelty?.verdict ?? 'unchecked'}] in ${result.latencyMs}ms`
    );

    return {
      available: true,
      disease: null,
      topLabel,
      ranked,
      ...(novelty ? { novelty } : {}),
    };
  }
}

export const diseaseDetectionService = new DiseaseDetectionService();
