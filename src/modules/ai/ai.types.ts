export interface PlantDiagnosisRequestDTO {
  image_base64?: string;
  image_url?: string;
  crop_id?: string;
  user_id?: string;
}

export interface DiseasePredictionCandidate {
  disease_id: string;
  disease_name: string;
  confidence: number; // Percentage 0.00 - 100.00
  is_healthy: boolean;
}

export interface PlantDiagnosisResponseDTO {
  prediction_id: string;
  is_healthy: boolean;
  top_prediction: DiseasePredictionCandidate;
  alternative_predictions: DiseasePredictionCandidate[];
  model_version: string;
  processing_time_ms: number;
}
