import { z } from 'zod';
import { crop_season, crop_life_cycle } from '@prisma/client';

export const cropQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  lang: z.string().optional(),
  season: z.nativeEnum(crop_season).optional(),
  life_cycle: z.nativeEnum(crop_life_cycle).optional(),
  q: z.string().optional(),
  search: z.string().optional(),
});

export const cropParamSchema = z.object({
  id_or_slug: z.string().min(1, 'Crop ID or slug is required'),
});

export type CropQuery = z.infer<typeof cropQuerySchema>;
export type CropParam = z.infer<typeof cropParamSchema>;
