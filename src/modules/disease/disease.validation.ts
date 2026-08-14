import { z } from 'zod';
import { disease_severity, pathogen_type } from '@prisma/client';

export const diseaseQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  lang: z.string().optional(),
  severity: z.nativeEnum(disease_severity).optional(),
  pathogen_type: z.nativeEnum(pathogen_type).optional(),
  q: z.string().optional(),
  search: z.string().optional(),
});

export const diseaseParamSchema = z.object({
  id_or_slug: z.string().min(1, 'Disease ID or slug is required'),
});

export type DiseaseQuery = z.infer<typeof diseaseQuerySchema>;
export type DiseaseParam = z.infer<typeof diseaseParamSchema>;
