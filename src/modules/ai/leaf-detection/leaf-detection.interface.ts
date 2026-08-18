import { LeafDetectionResult, LeafDetectorStatus } from './leaf-detection.types.js';

export interface ILeafDetectionService {
  /**
   * Locate leaves in a frame. Never throws: transport faults become a result.
   *
   * `returnCrop` asks the detector to cut the largest leaf out and send it
   * back. Only the capture path wants that; the live viewfinder polls for boxes
   * alone and would otherwise pay for a JPEG encode on every frame.
   */
  detectLeaf(
    imageBuffer: Buffer,
    mimeType?: string,
    options?: { returnCrop?: boolean; requestId?: string }
  ): Promise<LeafDetectionResult>;
  /** Read-only probe of the detector, for /ai/health. */
  checkStatus(): Promise<LeafDetectorStatus>;
}
