export interface PlantIdentificationResult {
  isConfident: boolean;
  name: string | null;
  scientificName: string | null;
  confidence: number; // 0.0 to 1.0
  rawScore?: number;
}

/** Pl@ntNet v2 API response payload interfaces */
export interface PlantNetResultCandidate {
  score: number;
  species: {
    scientificNameWithoutAuthor: string;
    scientificName: string;
    commonNames?: string[];
    family?: {
      scientificNameWithoutAuthor: string;
    };
    genus?: {
      scientificNameWithoutAuthor: string;
    };
  };
}

export interface PlantNetIdentifyResponse {
  query?: Record<string, unknown>;
  language?: string;
  preferedReferential?: string;
  bestMatch?: string;
  results?: PlantNetResultCandidate[];
}
