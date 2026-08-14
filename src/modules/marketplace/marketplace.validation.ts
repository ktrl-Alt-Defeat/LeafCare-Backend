import { z } from 'zod';
import { product_category } from '@prisma/client';

export const marketplaceQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  category: z.nativeEnum(product_category).optional(),
  is_organic: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  min_price: z.string().optional(),
  max_price: z.string().optional(),
  q: z.string().optional(),
  search: z.string().optional(),
});

export const marketplaceParamSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
});

export type MarketplaceQuery = z.infer<typeof marketplaceQuerySchema>;
export type MarketplaceParam = z.infer<typeof marketplaceParamSchema>;
