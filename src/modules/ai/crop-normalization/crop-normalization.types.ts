import { SupportedCrop } from './supported-crops.js';

export interface CropNormalizationResult {
  supported: boolean;
  crop: SupportedCrop | null;
  name: string;
  scientificName: string | null;
}
