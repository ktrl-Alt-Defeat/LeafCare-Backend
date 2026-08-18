import { LeafBoundingBox, LeafDetectionStatus } from '../leaf-detection/leaf-detection.types.js';
import { NoveltyVerdict } from '../disease-detection/disease-detection.interface.js';

/**
 * How a scan ended.
 *
 * Additive to the response, and every existing field keeps its meaning, so a
 * client that ignores this behaves exactly as it did before. A client that
 * reads it can tell the three "no diagnosis" outcomes apart, which previously
 * all looked like an absent disease:
 *
 * - `diagnosed`          a supported crop, with a disease named
 * - `unsupported_plant`  not a crop the model was trained on; retaking will not help
 * - `uncertain`          plausibly a supported crop, but not clear enough to call
 * - `unavailable`        the models could not be reached; nothing was decided
 */
export type ScanVerdict = 'diagnosed' | 'unsupported_plant' | 'uncertain' | 'unavailable';

export interface UnifiedPlantAnalysisResponse {
  /**
   * Stage 0 leaf localization. Always reported, even when it was skipped or
   * unreachable, so a client can tell "we looked and found nothing" apart from
   * "we never looked" — those imply different advice to the user.
   *
   * Advisory throughout: a scan is never refused because this found nothing.
   */
  leafDetection: {
    status: LeafDetectionStatus;
    leafCount: number;
    topConfidence: number | null;
    /** Largest detected leaf; the box the analysed ROI was cut from. */
    best: LeafBoundingBox | null;
    /** Whether the classifier actually read that ROI rather than the frame. */
    cropped: boolean;
    latencyMs?: number;
    message?: string;
  };
  /** How the scan ended. See ScanVerdict. */
  verdict: ScanVerdict;
  /**
   * The crop the classifier's winning label belongs to.
   *
   * Null whenever no diagnosis was reached. The scientific name is the species
   * the crop category stands for, taken from our own botanical vocabulary — it
   * is not an identification of this specimen, because nothing in the pipeline
   * identifies species any more.
   */
  plant: {
    name: string;
    scientificName: string | null;
    /** How much of the model's belief sits on this crop across all its classes. */
    confidence: number;
  } | null;
  crop: {
    name?: string;
    /** Canonical crop key, e.g. BELL_PEPPER. Present only for supported crops. */
    id?: string;
    supported: boolean;
  };
  diseaseDetection: {
    available: boolean;
    disease: {
      name: string;
      /** Probability of this disease given the crop, not across all 38 classes. */
      confidence: number;
    } | null;
    message?: string;
  };
  /** The evidence behind the verdict. Absent when the host has no novelty check. */
  novelty?: NoveltyVerdict;
  message?: string;
}
