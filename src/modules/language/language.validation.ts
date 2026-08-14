import { z } from 'zod';

export const getLanguagesQuerySchema = z.object({
  is_active: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? true : val === 'true')),
});

export type GetLanguagesQuery = z.infer<typeof getLanguagesQuerySchema>;
