export interface UnifiedPlantAnalysisResponse {
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
