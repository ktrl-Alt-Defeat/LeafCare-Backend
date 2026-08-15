import { SupportedCrop } from '../crop-normalization/supported-crops.js';

export interface DiseasePrediction {
  name: string;
  confidence: number; // 0.0 to 1.0
}

export interface DiseaseDetectionResult {
  available: boolean;
  disease: DiseasePrediction | null;
  message?: string;
}

export interface IDiseaseDetectionService {
  detectDisease(
    imageBuffer: Buffer,
    crop: SupportedCrop
  ): Promise<DiseaseDetectionResult>;
}
