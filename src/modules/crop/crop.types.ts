import { crops, crop_season, crop_life_cycle } from '@prisma/client';

export interface CropTranslationData {
  crop_name: string;
  description: string | null;
  sowing_method: string | null;
  harvesting_guide: string | null;
}

export interface CropDetailResponse extends crops {
  crop_name: string;
  description: string | null;
  sowing_method: string | null;
  harvesting_guide: string | null;
  seasons: crop_season[];
  companions?: Array<{
    companion_crop_id: string;
    companion_name: string;
    relationship: string;
  }>;
}

export interface CropFilterParams {
  page: number;
  limit: number;
  skip: number;
  lang: string;
  season?: crop_season;
  life_cycle?: crop_life_cycle;
  search?: string;
}
