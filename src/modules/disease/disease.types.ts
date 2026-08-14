import { diseases, disease_severity, pathogen_type } from '@prisma/client';

export interface DiseaseDetailResponse extends diseases {
  disease_name: string;
  symptoms: string[];
  causes: string[];
  prevention: string[];
  organic_treatment: string[];
  chemical_treatment: string[];
  affected_crops?: Array<{
    crop_id: string;
    crop_name: string;
    is_primary_host: boolean;
  }>;
}

export interface DiseaseFilterParams {
  page: number;
  limit: number;
  skip: number;
  lang: string;
  severity?: disease_severity;
  pathogen_type?: pathogen_type;
  search?: string;
}
