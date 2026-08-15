import { SupportedCrop } from '../crop-normalization/supported-crops.js';
import {
  IDiseaseDetectionService,
  DiseaseDetectionResult,
} from './disease-detection.interface.js';
import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';

export interface ConvNextResponsePayload {
  disease_name?: string;
  disease?: string;
  label?: string;
  class?: string;
  class_name?: string;
  prediction?: string;
  result?: string;
  confidence?: number;
  score?: number;
  prob?: number;
  probability?: number;
}

/**
 * Service adapter for the ConvNeXt disease detection model.
 *
 * IMPORTANT: ConvNeXt MUST ONLY be called after the backend orchestrator
 * has verified that crop.supported === true.
 */
export class DiseaseDetectionService implements IDiseaseDetectionService {
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

      const rawLabel =
        payload.disease_name ||
        payload.disease ||
        payload.label ||
        payload.class_name ||
        payload.class ||
        payload.prediction ||
        payload.result;

      const rawConfidence =
        payload.confidence ??
        payload.score ??
        payload.prob ??
        payload.probability ??
        0;

      // Normalize confidence if reported as percentage (0-100) vs decimal (0-1)
      const confidence = rawConfidence > 1 ? rawConfidence / 100 : rawConfidence;

      if (!rawLabel) {
        logger.warn(`ConvNeXt response missing disease prediction label`);
        return {
          available: false,
          disease: null,
          message: 'Disease detection returned an unparseable response payload.',
        };
      }

      const diseaseName = this.cleanDiseaseLabel(rawLabel, crop);

      logger.info(
        `ConvNeXt disease detection completed: "${diseaseName}" (raw: "${rawLabel}") with ${(
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
