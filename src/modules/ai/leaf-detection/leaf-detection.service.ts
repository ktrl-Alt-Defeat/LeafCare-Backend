import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';
import { InferenceClient, inferenceClient } from '../inference-client/inference-client.js';
import {
  InferenceBox,
  InferenceDetectionPayload,
  InferenceHealthPayload,
  InferenceReadinessPayload,
} from '../inference-client/inference-client.types.js';
import { ILeafDetectionService } from './leaf-detection.interface.js';
import {
  LeafBoundingBox,
  LeafCrop,
  LeafDetectionResult,
  LeafDetectorStatus,
} from './leaf-detection.types.js';

/**
 * Adapter for the leaf detector (Stage 0), hosted with the disease classifier
 * in one FastAPI process on a workstation.
 *
 * A helper, never a gate. When it finds a leaf, the crop it cuts out is what
 * the classifier reads; when it finds nothing, is unreachable, or was never
 * configured, the scan carries on with the frame as submitted. Every transport
 * fault resolves to `unavailable` rather than throwing, because a detector
 * outage must never be able to refuse a farmer a diagnosis.
 */
export class LeafDetectionService implements ILeafDetectionService {
  /** A detection is only usable if it carries well-formed geometry and a score. */
  private toBox(box: InferenceBox | null | undefined): LeafBoundingBox | null {
    if (!box) return null;

    const { confidence, box_pixel: pixel, box_norm: norm } = box;
    if (typeof confidence !== 'number') return null;
    if (!Array.isArray(pixel) || pixel.length !== 4) return null;
    if (!Array.isArray(norm) || norm.length !== 4) return null;

    return {
      confidence: Number(confidence.toFixed(4)),
      boxPixel: [pixel[0], pixel[1], pixel[2], pixel[3]],
      boxNorm: [norm[0], norm[1], norm[2], norm[3]],
    };
  }

  /**
   * Decodes the ROI the host cut out, when it sent one it stands behind.
   *
   * A rejected crop is skipped deliberately. The host measured that classifying
   * a fragment is worse than classifying the frame it came from, and it reports
   * that verdict on the response; ignoring it here to "use the crop anyway"
   * would trade accuracy for nothing.
   */
  private toCrop(payload: InferenceDetectionPayload): LeafCrop | null {
    const roi = payload.roi;
    if (!roi?.image_base64) return null;

    if (roi.accepted === false) {
      logger.info(`Leaf ROI returned but not used: ${roi.reason ?? 'host rejected the crop'}`);
      return null;
    }

    const encoded = roi.image_base64;
    // Tolerate a data-URL prefix even though the host sends bare base64.
    const bare = encoded.includes(',') ? encoded.slice(encoded.indexOf(',') + 1) : encoded;

    try {
      const buffer = Buffer.from(bare, 'base64');
      if (buffer.length === 0) return null;

      return {
        buffer,
        mimeType: 'image/jpeg',
        ...(roi.roi_id ? { roiId: roi.roi_id } : {}),
        ...(roi.width !== undefined ? { width: roi.width } : {}),
        ...(roi.height !== undefined ? { height: roi.height } : {}),
        ...(roi.confidence !== undefined ? { confidence: roi.confidence } : {}),
      };
    } catch {
      logger.warn('Leaf detector returned a crop that could not be base64-decoded.');
      return null;
    }
  }

  public async detectLeaf(
    imageBuffer: Buffer,
    mimeType: string = 'image/jpeg',
    options: { returnCrop?: boolean; requestId?: string } = {}
  ): Promise<LeafDetectionResult> {
    const form = new FormData();
    form.append('image', InferenceClient.filePart(imageBuffer, mimeType), 'frame.jpg');
    form.append('confidence', String(env.YOLO_MIN_CONFIDENCE));
    form.append('image_size', String(env.YOLO_IMAGE_SIZE));
    // The crop is only requested on the capture path. The viewfinder polls this
    // several times a second and wants boxes alone; asking for a crop would add
    // a JPEG encode and a base64 payload to every frame.
    form.append('return_roi', options.returnCrop ? 'true' : 'false');
    form.append('return_roi_image', options.returnCrop ? 'true' : 'false');

    const result = await inferenceClient.postForm<InferenceDetectionPayload>(
      '/v1/leaf/detect',
      form,
      {
        timeoutMs: env.INFERENCE_DETECT_TIMEOUT_MS,
        requestId: options.requestId,
        label: 'leaf/detect',
      }
    );

    if (!result.ok) {
      return {
        status: result.kind === 'not_configured' ? 'not_configured' : 'unavailable',
        leafCount: 0,
        topConfidence: null,
        best: null,
        crop: null,
        ...(result.latencyMs ? { latencyMs: result.latencyMs } : {}),
        message: result.message,
      };
    }

    const payload = result.data;
    const boxes = (payload.detections ?? [])
      .map((entry) => this.toBox(entry))
      .filter((box): box is LeafBoundingBox => box !== null);

    const topConfidence =
      typeof payload.top_confidence === 'number'
        ? Number(payload.top_confidence.toFixed(4))
        : null;

    if (boxes.length === 0) {
      logger.info(
        `Leaf detection found no leaf above ${env.YOLO_MIN_CONFIDENCE} ` +
          `(best was ${topConfidence ?? 'none'}) in ${result.latencyMs}ms`
      );
      return {
        status: 'no_leaf',
        leafCount: 0,
        topConfidence,
        best: null,
        crop: null,
        latencyMs: result.latencyMs,
        message: 'No leaf was found in this image.',
      };
    }

    const best = this.toBox(payload.best) ?? boxes[0];
    const crop = options.returnCrop ? this.toCrop(payload) : null;

    logger.info(
      `Leaf detection found ${boxes.length} leaf(s), best ${((best?.confidence ?? 0) * 100).toFixed(
        1
      )}% in ${result.latencyMs}ms${crop ? ` (ROI ${crop.width}x${crop.height} accepted)` : ''}`
    );

    return {
      status: 'detected',
      leafCount: boxes.length,
      topConfidence,
      best,
      crop,
      latencyMs: result.latencyMs,
    };
  }

  public async checkStatus(): Promise<LeafDetectorStatus> {
    if (!inferenceClient.configured) {
      return {
        status: 'not_configured',
        configured: false,
        detail:
          'INFERENCE_SERVICE_URL is unset. Leaf localization is skipped; scans still run.',
      };
    }

    const endpoint = inferenceClient.url('/ready');
    const [health, readiness] = await Promise.all([
      inferenceClient.getJson<InferenceHealthPayload>('/health'),
      inferenceClient.getJson<InferenceReadinessPayload>('/ready'),
    ]);

    if (!health.ok) {
      return {
        status: 'down',
        configured: true,
        endpoint,
        latencyMs: health.latencyMs,
        detail: health.message,
      };
    }

    // `/ready` answers 503 until every model is resident, so a failure here is
    // still informative: the host is up, the model is not.
    const detector = readiness.ok
      ? (readiness.data.models ?? []).find((model) => model.task === 'leaf-detection')
      : undefined;

    const ready = detector?.status === 'ready';

    return {
      status: ready ? 'up' : 'down',
      configured: true,
      endpoint,
      latencyMs: health.latencyMs,
      ...(ready
        ? {}
        : {
            detail:
              detector?.detail ??
              `Inference host reachable but the detector reports "${detector?.status ?? 'unknown'}".`,
          }),
      model: {
        service: health.data.service,
        modelStatus: detector?.status,
        parametersMillion: detector?.parameters
          ? Number((detector.parameters / 1e6).toFixed(2))
          : undefined,
        device: health.data.device,
        gpuAvailable: health.data.cuda_available,
        uptimeSeconds: health.data.uptime_seconds,
      },
    };
  }
}

export const leafDetectionService = new LeafDetectionService();
