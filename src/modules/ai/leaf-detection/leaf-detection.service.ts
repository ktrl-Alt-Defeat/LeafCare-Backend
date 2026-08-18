import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';
import { ILeafDetectionService } from './leaf-detection.interface.js';
import {
  LeafBoundingBox,
  LeafDetectionResult,
  LeafDetectorStatus,
  YoloHealthPayload,
  YoloPredictPayload,
  YoloPrediction,
} from './leaf-detection.types.js';

/**
 * Adapter for the YOLO11x leaf detector (Stage 1).
 *
 * Runs ahead of Pl@ntNet so a frame with no leaf in it is rejected before it
 * costs a third-party identification call. Detection is advisory, not
 * authoritative: the detector is a single CPU-bound container that restarts
 * under load, so every transport fault resolves to `unavailable` and the
 * orchestrator carries on. A flaky Stage 1 must never take Stage 2 down with it.
 *
 * Only `/api/predict` is used. The service also exposes `/api/capture`, which
 * additionally writes an annotated frame and one file per detected leaf; that
 * endpoint was observed completing its work and then killing the container
 * before it could respond, so it is deliberately not called from here.
 */
export class LeafDetectionService implements ILeafDetectionService {
  /** Pixel area of a box. Boxes are xyxy, so this is a corner subtraction. */
  private area(box: LeafBoundingBox): number {
    const [x1, y1, x2, y2] = box.boxPixel;
    return Math.abs((x2 - x1) * (y2 - y1));
  }

  /**
   * Picks the crop candidate.
   *
   * Largest area, not highest confidence: on a real photo the detector returns
   * many overlapping boxes, and the most confident is often a small fragment of
   * a leaf rather than the leaf the user was aiming at. Area is the better proxy
   * for subject-of-the-photo.
   */
  private selectBest(boxes: LeafBoundingBox[]): LeafBoundingBox | null {
    if (boxes.length === 0) return null;
    return boxes.reduce((best, candidate) =>
      this.area(candidate) > this.area(best) ? candidate : best
    );
  }

  /** Keep only well-formed detections that clear the confidence floor. */
  private toBoxes(predictions: YoloPrediction[]): LeafBoundingBox[] {
    const floor = env.YOLO_MIN_CONFIDENCE;

    return predictions.reduce<LeafBoundingBox[]>((acc, prediction) => {
      const confidence = prediction.confidence;
      const pixel = prediction.box_pixel;
      const norm = prediction.box_norm;

      if (typeof confidence !== 'number' || confidence < floor) return acc;
      if (!Array.isArray(pixel) || pixel.length !== 4) return acc;
      if (!Array.isArray(norm) || norm.length !== 4) return acc;

      acc.push({
        confidence: Number(confidence.toFixed(4)),
        boxPixel: [pixel[0], pixel[1], pixel[2], pixel[3]],
        boxNorm: [norm[0], norm[1], norm[2], norm[3]],
      });
      return acc;
    }, []);
  }

  /** Highest confidence across raw predictions, before the floor is applied. */
  private topConfidenceOf(predictions: YoloPrediction[]): number | null {
    return predictions.reduce<number | null>((max, prediction) => {
      const confidence = prediction.confidence;
      if (typeof confidence !== 'number') return max;
      return max === null || confidence > max ? confidence : max;
    }, null);
  }

  public async detectLeaf(
    imageBuffer: Buffer,
    mimeType: string = 'image/jpeg'
  ): Promise<LeafDetectionResult> {
    if (!env.YOLO_SERVICE_URL) {
      return {
        status: 'not_configured',
        leafCount: 0,
        topConfidence: null,
        best: null,
        message:
          'YOLO_SERVICE_URL is unset. Leaf localization is skipped and the image ' +
          'goes straight to plant identification.',
      };
    }

    const endpoint = `${env.YOLO_SERVICE_URL.replace(/\/$/, '')}/api/predict`;
    const startedAt = Date.now();

    // Field name is `file`. The disease service uses `image`; sending `image`
    // here returns a 422 from FastAPI request validation.
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(imageBuffer)], { type: mimeType });
    formData.append('file', blob, 'frame.jpg');
    formData.append('conf', String(env.YOLO_MIN_CONFIDENCE));
    formData.append('imgsz', String(env.YOLO_IMAGE_SIZE));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.YOLO_SERVICE_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startedAt;

      if (!response.ok) {
        // A 502 here is the container having just restarted; the next request
        // usually succeeds. Advisory, so this does not fail the scan.
        logger.warn(`Leaf detector returned HTTP ${response.status} in ${latencyMs}ms`);
        return {
          status: 'unavailable',
          leafCount: 0,
          topConfidence: null,
          best: null,
          latencyMs,
          message: `Leaf detector responded with HTTP ${response.status}.`,
        };
      }

      const payload = (await response.json()) as YoloPredictPayload;
      const predictions = Array.isArray(payload.predictions) ? payload.predictions : [];

      const topConfidence = this.topConfidenceOf(predictions);
      const boxes = this.toBoxes(predictions);

      if (boxes.length === 0) {
        logger.info(
          `Leaf detection found no leaf above ${env.YOLO_MIN_CONFIDENCE} ` +
            `(best was ${topConfidence ?? 'none'}) in ${latencyMs}ms`
        );
        return {
          status: 'no_leaf',
          leafCount: 0,
          topConfidence: topConfidence !== null ? Number(topConfidence.toFixed(4)) : null,
          best: null,
          latencyMs,
          message: 'No leaf was found in this image.',
        };
      }

      const best = this.selectBest(boxes);

      logger.info(
        `Leaf detection found ${boxes.length} leaf(s), best ${(
          (best?.confidence ?? 0) * 100
        ).toFixed(1)}% in ${latencyMs}ms`
      );

      return {
        status: 'detected',
        leafCount: boxes.length,
        topConfidence: topConfidence !== null ? Number(topConfidence.toFixed(4)) : null,
        best,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const aborted = error instanceof Error && error.name === 'AbortError';

      logger.warn(
        `Leaf detection failed (${latencyMs}ms): ${
          aborted ? 'Timeout' : error instanceof Error ? error.message : String(error)
        }`
      );

      return {
        status: 'unavailable',
        leafCount: 0,
        topConfidence: null,
        best: null,
        latencyMs,
        message: aborted
          ? `Leaf detection timed out after ${env.YOLO_SERVICE_TIMEOUT_MS}ms.`
          : 'Leaf detection service is currently unreachable.',
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  public async checkStatus(): Promise<LeafDetectorStatus> {
    if (!env.YOLO_SERVICE_URL) {
      return {
        status: 'not_configured',
        configured: false,
        detail: 'YOLO_SERVICE_URL is unset. Leaf localization is skipped; scans still run.',
      };
    }

    const endpoint = `${env.YOLO_SERVICE_URL.replace(/\/$/, '')}/api/health`;
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.YOLO_SERVICE_TIMEOUT_MS);

    try {
      const response = await fetch(endpoint, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      const latencyMs = Date.now() - startedAt;

      if (!response.ok) {
        return {
          status: 'down',
          configured: true,
          endpoint,
          latencyMs,
          detail: `Leaf detector responded with HTTP ${response.status}`,
        };
      }

      const payload = (await response.json()) as YoloHealthPayload;

      // This endpoint answers 200 while weights are still downloading, by
      // design, so a `healthy` status alone does not mean it can serve a
      // prediction. `model_status` is the field that actually decides.
      const ready = payload.model_status === 'ready';

      return {
        status: ready ? 'up' : 'down',
        configured: true,
        endpoint,
        latencyMs,
        ...(ready
          ? {}
          : { detail: `Detector reachable but model_status is "${payload.model_status}"` }),
        model: {
          service: payload.service,
          modelStatus: payload.model_status,
          parametersMillion: payload.parameters_million,
          device: payload.device,
          gpuAvailable: payload.cuda_available,
          uptimeSeconds: payload.uptime_seconds,
        },
      };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const aborted = error instanceof Error && error.name === 'AbortError';

      return {
        status: 'down',
        configured: true,
        endpoint,
        latencyMs,
        detail: aborted
          ? `No response within ${env.YOLO_SERVICE_TIMEOUT_MS}ms`
          : error instanceof Error
          ? error.message
          : 'Unknown error contacting the leaf detector',
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const leafDetectionService = new LeafDetectionService();
