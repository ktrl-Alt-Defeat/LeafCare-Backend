import type { DiseaseDetectionInput } from './disease-detection.service.js';

export interface DiseasePrediction {
  name: string;
  confidence: number; // 0.0 to 1.0
}

/**
 * Why a classification should or should not be reported.
 *
 * The classifier is closed-set: it returns one of its 38 classes for any image,
 * so something has to say whether that answer describes the photograph or is an
 * artefact of having no other option. The inference host decides, and this
 * carries the decision through unchanged.
 */
export interface NoveltyVerdict {
  /** 'accept', 'reject_unsupported' or 'reject_uncertain'. */
  verdict: string;
  accepted: boolean;
  /** Distance to the nearest training examples. Higher is stranger. */
  knnDistance: number;
  energy: number;
  confidence: number;
  /** Plain-language explanation, present when the answer was rejected. */
  reason?: string;
}

/** One ranked class, before the crop filter is applied. */
export interface RankedDisease {
  label: string;
  confidence: number;
}

export interface DiseaseDetectionResult {
  available: boolean;
  disease: DiseasePrediction | null;
  /**
   * The raw top-1 label across all classes, whatever the crop. The orchestrator
   * reads the crop out of this: with Pl@ntNet gone, the classifier's own label
   * is the only statement anyone makes about which plant this is.
   */
  topLabel?: string;
  /** The full ranking, so the caller can filter by crop. */
  ranked?: RankedDisease[];
  novelty?: NoveltyVerdict;
  message?: string;
}

export interface IDiseaseDetectionService {
  /**
   * Classify a leaf image across the whole disease vocabulary.
   *
   * Accepts either raw bytes or a descriptor carrying an ROI handle from the
   * detect call. The handle is preferred: the inference host still has that
   * crop, so quoting it avoids sending the same pixels up a second time.
   *
   * No crop is passed in any more. Nothing upstream knows the species before
   * this runs, so the caller reads the crop back out of the result.
   */
  classify(input: Buffer | DiseaseDetectionInput): Promise<DiseaseDetectionResult>;
}
