/**
 * Contract for Stage 0, leaf localization.
 *
 * The wire shapes live in `inference-client.types.ts`; what follows is the
 * domain view the orchestrator works with, which deliberately says nothing
 * about which model or which host produced it.
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
  /**
   * The largest leaf, already cut out by the detector.
   *
   * The classifier reads this rather than the whole frame, so it sees a leaf
   * filling the image instead of one leaf among soil, hands and background.
   * Absent whenever the detector found nothing, was unreachable, or judged its
   * own crop worse than the frame — in every such case the original is used.
   */
  crop: LeafCrop | null;
  latencyMs?: number;
  message?: string;
}

/** A leaf ROI cut out of the submitted frame by the detector. */
export interface LeafCrop {
  buffer: Buffer;
  mimeType: string;
  /**
   * Handle for the same crop still held by the inference host.
   *
   * Classification can quote this instead of uploading the pixels again, which
   * over a home uplink is the difference between one image transfer per scan
   * and two.
   */
  roiId?: string;
  width?: number;
  height?: number;
  confidence?: number;
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
