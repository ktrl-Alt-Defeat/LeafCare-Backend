import { z } from 'zod';
import { post_category } from '@prisma/client';

export const communityQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  category: z.nativeEnum(post_category).optional(),
  crop_id: z.string().optional(),
  q: z.string().optional(),
  search: z.string().optional(),
});

export const communityParamSchema = z.object({
  id: z.string().min(1, 'Post ID is required'),
});

export type CommunityQuery = z.infer<typeof communityQuerySchema>;
export type CommunityParam = z.infer<typeof communityParamSchema>;
