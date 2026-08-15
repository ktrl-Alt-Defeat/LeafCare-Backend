import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';
import { AppError } from '../../../utils/app-error.js';
import {
  PlantIdentificationResult,
  PlantNetIdentifyResponse,
} from './plant-identification.types.js';

export class PlantIdentificationService {
  /**
   * Identifies a plant from an image buffer using the Pl@ntNet API.
   *
   * @param imageBuffer Raw image buffer
   * @param filename Optional filename
   * @param mimeType Optional MIME type
   */
  public async identifyPlant(
    imageBuffer: Buffer,
    filename: string = 'image.jpg',
    mimeType: string = 'image/jpeg'
  ): Promise<PlantIdentificationResult> {
    if (!env.PLANTNET_API_KEY) {
      throw new AppError(
        'PLANTNET_API_KEY is missing. Pl@ntNet integration cannot proceed.',
        500
      );
    }

    const startedAt = Date.now();
    logger.info(`Pl@ntNet identification started (buffer size: ${imageBuffer.length} bytes)`);

    // Prepare FormData payload
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(imageBuffer)], { type: mimeType });
    formData.append('images', blob, filename);
    formData.append('organs', 'leaf');

    // Build URL with query param
    const url = new URL(env.PLANTNET_API_URL);
    url.searchParams.append('api-key', env.PLANTNET_API_KEY);

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      env.PLANTNET_TIMEOUT_MS
    );

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startedAt;

      if (!response.ok) {
        logger.warn(
          `Pl@ntNet API returned HTTP status ${response.status} in ${latencyMs}ms`
        );
        if (response.status === 401 || response.status === 403) {
          throw new AppError(
            'Plant identification external service authentication error.',
            502
          );
        }
        if (response.status === 429) {
          throw new AppError(
            'Plant identification external service rate limit exceeded. Try again later.',
            429
          );
        }
        throw new AppError(
          `Plant identification service unavailable (HTTP ${response.status}).`,
          502
        );
      }

      const payload = (await response.json()) as PlantNetIdentifyResponse;

      if (!payload.results || payload.results.length === 0) {
        logger.info(`Pl@ntNet returned no matching results (${latencyMs}ms)`);
        return {
          isConfident: false,
          name: null,
          scientificName: null,
          confidence: 0,
        };
      }

      const topMatch = payload.results[0];
      const confidence = topMatch.score || 0;
      const scientificName =
        topMatch.species?.scientificNameWithoutAuthor ||
        topMatch.species?.scientificName ||
        null;
      const commonName =
        topMatch.species?.commonNames && topMatch.species.commonNames.length > 0
          ? topMatch.species.commonNames[0]
          : scientificName || 'Unknown Plant';

      const isConfident = confidence >= env.PLANTNET_MIN_CONFIDENCE;

      logger.info(
        `Pl@ntNet plant identified: "${commonName}" (${scientificName}) with confidence ${(
          confidence * 100
        ).toFixed(1)}% [isConfident=${isConfident}] in ${latencyMs}ms`
      );

      return {
        isConfident,
        name: commonName,
        scientificName,
        confidence,
        rawScore: confidence,
      };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const aborted = error instanceof Error && error.name === 'AbortError';

      if (aborted) {
        logger.warn(`Pl@ntNet API request timed out after ${env.PLANTNET_TIMEOUT_MS}ms`);
        throw new AppError(
          `Plant identification request timed out after ${env.PLANTNET_TIMEOUT_MS}ms.`,
          504
        );
      }

      if (error instanceof AppError) {
        throw error;
      }

      logger.error(
        `Pl@ntNet API network/parsing error (${latencyMs}ms): ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw new AppError('Failed to communicate with plant identification service.', 502);
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const plantIdentificationService = new PlantIdentificationService();
