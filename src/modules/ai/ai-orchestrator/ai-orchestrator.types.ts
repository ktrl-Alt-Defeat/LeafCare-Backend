import { LeafBoundingBox, LeafDetectionStatus } from '../leaf-detection/leaf-detection.types.js';

export interface UnifiedPlantAnalysisResponse {
  /**
   * Stage 1 leaf localization. Always reported, even when it was skipped or
   * unreachable, so a client can tell "we looked and found nothing" apart from
   * "we never looked" — those imply different advice to the user.
   */
  leafDetection: {
    status: LeafDetectionStatus;
    leafCount: number;
    topConfidence: number | null;
    /** Largest detected leaf. The crop candidate, once cropping is wired up. */
    best: LeafBoundingBox | null;
    latencyMs?: number;
    message?: string;
  };
  plant: {
    name: string;
    scientificName: string | null;
    confidence: number;
  } | null;
  crop: {
    name?: string;
    supported: boolean;
  };
  diseaseDetection: {
    available: boolean;
    disease: {
      name: string;
      confidence: number;
    } | null;
    message?: string;
  };
  message?: string;
}
