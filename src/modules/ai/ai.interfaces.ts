import { PlantDiagnosisRequestDTO, PlantDiagnosisResponseDTO } from './ai.types.js';

export interface IAIModelProvider {
  name: string;
  version: string;
  predictPlantDisease(request: PlantDiagnosisRequestDTO): Promise<PlantDiagnosisResponseDTO>;
}

export interface IAIService {
  diagnosePlantLeaf(request: PlantDiagnosisRequestDTO): Promise<PlantDiagnosisResponseDTO>;
}
