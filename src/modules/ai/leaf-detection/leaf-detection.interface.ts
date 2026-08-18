import { LeafDetectionResult, LeafDetectorStatus } from './leaf-detection.types.js';

export interface ILeafDetectionService {
  /** Locate leaves in a frame. Never throws: transport faults become a result. */
  detectLeaf(imageBuffer: Buffer, mimeType?: string): Promise<LeafDetectionResult>;
  /** Read-only probe of the detector, for /ai/health. */
  checkStatus(): Promise<LeafDetectorStatus>;
}
