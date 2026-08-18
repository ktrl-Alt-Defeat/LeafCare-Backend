/**
 * The inference host's wire contract.
 *
 * Mirrors the pydantic models the FastAPI service publishes at
 * `/openapi.json`. Everything is optional on the way in: this backend and that
 * service are deployed separately and can be redeployed independently, so a
 * response is validated, not assumed.
 */

/** One detection. Boxes are xyxy — corners, not width/height. */
export interface InferenceBox {
  label?: string;
  class_id?: number;
  confidence?: number;
  box_pixel?: number[];
  box_norm?: number[];
}

/** The region the detector cut out, and whether it is worth classifying. */
export interface InferenceRoi {
  roi_id?: string;
  width?: number;
  height?: number;
  confidence?: number;
  box_pixel?: number[];
  /** Bare base64 JPEG, only when the request asked for it. */
  image_base64?: string;
  area_fraction?: number;
  /**
   * False when the crop is a fragment or came from a weak box. The service
   * measured that classifying such a crop is worse than classifying the frame
   * it came from, so this is a verdict, not a hint.
   */
  accepted?: boolean;
  reason?: string;
}

/** Body of POST /v1/leaf/detect. */
export interface InferenceDetectionPayload {
  request_id?: string;
  status?: 'detected' | 'no_leaf';
  count?: number;
  top_confidence?: number | null;
  detections?: InferenceBox[];
  best?: InferenceBox | null;
  roi?: InferenceRoi | null;
  image_width?: number;
  image_height?: number;
  inference_time_ms?: number;
}

/** One ranked class from the classifier. */
export interface InferenceRankedClass {
  label?: string;
  index?: number;
  confidence?: number;
}

/**
 * The host's verdict on whether its own answer should be believed.
 *
 * A closed-set head names one of its classes for any image at all, so this
 * decides whether the ranking below describes the photograph or is just the
 * least-bad option among 38.
 */
export interface InferenceNoveltyPayload {
  verdict?: 'accept' | 'reject_unsupported' | 'reject_uncertain';
  accepted?: boolean;
  knn_distance?: number;
  energy?: number;
  confidence?: number;
  thresholds?: Record<string, number>;
  reason?: string;
}

/** Body of POST /v1/disease/classify. */
export interface InferenceClassificationPayload {
  request_id?: string;
  predicted_class?: string;
  predicted_index?: number;
  confidence?: number;
  top_k?: InferenceRankedClass[];
  source?: 'upload' | 'roi';
  inference_time_ms?: number;
  model_version?: string;
  novelty?: InferenceNoveltyPayload | null;
}

/** Body of GET /health. */
export interface InferenceHealthPayload {
  status?: string;
  service?: string;
  version?: string;
  device?: string;
  cuda_available?: boolean;
  models_ready?: boolean;
  uptime_seconds?: number;
}

/** One entry of GET /ready. */
export interface InferenceModelPayload {
  name?: string;
  task?: string;
  status?: string;
  weights?: string;
  sha256?: string | null;
  parameters?: number | null;
  device?: string | null;
  classes?: string[] | null;
  detail?: string | null;
}

/** Body of GET /ready. */
export interface InferenceReadinessPayload {
  ready?: boolean;
  models?: InferenceModelPayload[];
  roi_cache_entries?: number;
}
