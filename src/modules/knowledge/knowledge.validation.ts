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

/** Slugs are used in URLs, so keep them to a predictable shape. */
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * One language's copy of an article. English is required on create so an
 * article always has a fallback to render when a translation is missing.
 */
const translationSchema = z.object({
  language_code: z.string().trim().min(2).max(10),
  title: z.string().trim().min(3, 'Title is required').max(200),
  summary: z.string().trim().max(1000).optional(),
  body: z.string().trim().min(10, 'Body is required'),
});

export const createArticleSchema = z.object({
  category_id: z.string().uuid('category_id must be a valid category id'),
  author_id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(150)
    .regex(slugPattern, 'Slug must be lowercase words separated by hyphens'),
  hero_image_url: z.string().url('hero_image_url must be a valid URL').max(500).optional(),
  /** Omit to save a draft; the list endpoint only returns published articles. */
  published: z.boolean().default(true),
  translations: z
    .array(translationSchema)
    .min(1, 'At least one translation is required')
    .refine((rows) => rows.some((row) => row.language_code === 'en'), {
      message: 'An English translation is required as the fallback',
    }),
});

/**
 * Kept as a plain object rather than a refined one: the shared
 * `validateRequest` middleware accepts ZodObject only, and a `.refine()`
 * produces a ZodEffects. The empty-body case is checked in the service.
 */
export const updateArticleSchema = z.object({
  category_id: z.string().uuid().optional(),
  slug: z.string().trim().min(3).max(150).regex(slugPattern).optional(),
  hero_image_url: z.string().url().max(500).optional(),
  published: z.boolean().optional(),
  /** Provided translations are upserted; omitted languages are left untouched. */
  translations: z.array(translationSchema).optional(),
});

export type ArticleQuery = z.infer<typeof articleQuerySchema>;
export type ArticleParam = z.infer<typeof articleParamSchema>;
export type CreateArticleBody = z.infer<typeof createArticleSchema>;
export type UpdateArticleBody = z.infer<typeof updateArticleSchema>;
