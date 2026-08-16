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

/**
 * Body for a seller creating a listing.
 *
 * `price` is accepted as a string as well as a number: HTML number inputs and
 * JSON clients disagree on which they send, and rejecting one of them would be
 * an avoidable 400.
 */
export const createProductSchema = z.object({
  seller_id: z.string().uuid('seller_id must be a valid user id'),
  name: z.string().trim().min(2, 'Name is required').max(150),
  category: z.nativeEnum(product_category),
  description: z.string().trim().max(5000).optional(),
  price: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'string' ? Number.parseFloat(val) : val))
    .refine((val) => Number.isFinite(val) && val >= 0, 'Price must be zero or more'),
  currency_code: z.string().trim().length(3).default('INR'),
  unit: z.string().trim().min(1, 'Unit is required').max(50),
  stock_quantity: z
    .union([z.number(), z.string()])
    .default(0)
    .transform((val) => (typeof val === 'string' ? Number.parseInt(val, 10) : val))
    .refine((val) => Number.isInteger(val) && val >= 0, 'Stock must be zero or more'),
  is_organic: z.boolean().default(false),
  image_url: z.string().url('image_url must be a valid URL').max(500).optional(),
});

/**
 * Same fields, all optional — a seller may edit one thing at a time.
 *
 * Kept as a plain object rather than adding `.refine()` for "at least one
 * field": a refinement produces a ZodEffects, which the shared
 * `validateRequest` middleware does not accept. The empty-body case is checked
 * in the service instead.
 */
export const updateProductSchema = createProductSchema.partial().omit({ seller_id: true });

export type MarketplaceQuery = z.infer<typeof marketplaceQuerySchema>;
export type MarketplaceParam = z.infer<typeof marketplaceParamSchema>;
export type CreateProductBody = z.infer<typeof createProductSchema>;
export type UpdateProductBody = z.infer<typeof updateProductSchema>;
