/**
 * Contract for the YOLO11x leaf-localization service.
 *
 * That service describes itself as "Stage 1 (Leaf Localization & High-Res Crop
 * Extraction)" with a downstream task of "Stage 2 Plant Pathology" — Stage 2
 * being this backend. It answers one question: is there a leaf in this frame,
 * and where.
 *
 * Shapes below were read from the deployed service, not from documentation:
 * POST /api/predict takes multipart `file` (NOT `image`) plus `conf` and
 * `imgsz`, and answers with the payload modelled by YoloPredictPayload.
 */

/** A single detected leaf. Boxes are xyxy — corners, not width/height. */
export interface LeafBoundingBox {
  confidence: number;
  /** Absolute pixel corners: [x1, y1, x2, y2]. */
  boxPixel: [number, number, number, number];
  /** Same corners normalised to 0..1 against the frame. */
  boxNorm: [number, number, number, number];
}

export type LeafDetectionStatus =
  | 'detected'
  | 'no_leaf'
  | 'not_configured'
  | 'unavailable';

export interface LeafDetectionResult {
  status: LeafDetectionStatus;
  /** Detections at or above the confidence floor. */
  leafCount: number;
  /** Highest confidence seen, before the floor is applied. */
  topConfidence: number | null;
  /** Largest-area box among those that cleared the floor; the crop candidate. */
  best: LeafBoundingBox | null;
  latencyMs?: number;
  message?: string;
}

/** Raw prediction entry as the service emits it. */
export interface YoloPrediction {
  class?: string;
  class_id?: number;
  confidence?: number;
  box_pixel?: number[];
  box_norm?: number[];
}

/** Raw body of POST /api/predict. */
export interface YoloPredictPayload {
  success?: boolean;
  latency_ms?: number;
  fps?: number;
  leaf_count?: number;
  predictions?: YoloPrediction[];
}

/** Raw body of GET /api/health. */
export interface YoloHealthPayload {
  status?: string;
  service?: string;
  /** "ready" once weights are resident. "loading" still answers HTTP 200. */
  model_status?: string;
  parameters_million?: number;
  device?: string;
  cuda_available?: boolean;
  uptime_seconds?: number;
}

export interface LeafDetectorStatus {
  status: 'up' | 'down' | 'not_configured';
  configured: boolean;
  endpoint?: string;
  latencyMs?: number;
  detail?: string;
  /** Reported by the detector itself; never fabricated here. */
  model?: {
    service?: string;
    modelStatus?: string;
    parametersMillion?: number;
    device?: string;
    gpuAvailable?: boolean;
    uptimeSeconds?: number;
  };
}
