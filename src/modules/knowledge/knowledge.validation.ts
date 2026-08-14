import { z } from 'zod';

export const articleQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  lang: z.string().optional(),
  category_id: z.string().optional(),
  crop_id: z.string().optional(),
  disease_id: z.string().optional(),
  q: z.string().optional(),
  search: z.string().optional(),
});

export const articleParamSchema = z.object({
  id_or_slug: z.string().min(1, 'Article ID or slug is required'),
});

export type ArticleQuery = z.infer<typeof articleQuerySchema>;
export type ArticleParam = z.infer<typeof articleParamSchema>;
