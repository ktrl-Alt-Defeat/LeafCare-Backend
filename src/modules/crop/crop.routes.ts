import { Router } from 'express';
import { cropController } from './crop.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { cropQuerySchema, cropParamSchema } from './crop.validation.js';

const router = Router();

/**
 * @openapi
 * /api/v1/crops:
 *   get:
 *     summary: Retrieve list of agronomy crops with localized translations
 *     tags: [Crops]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: lang
 *         schema: { type: string, default: en }
 *     responses:
 *       200:
 *         description: Paginated list of crops
 */
router.get('/', validateRequest({ query: cropQuerySchema }), (req, res, next) =>
  cropController.getCrops(req, res, next)
);

/**
 * @openapi
 * /api/v1/crops/search:
 *   get:
 *     summary: Search crops by localized name or slug
 *     tags: [Crops]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Crop search results
 */
router.get('/search', validateRequest({ query: cropQuerySchema }), (req, res, next) =>
  cropController.searchCrops(req, res, next)
);

/**
 * @openapi
 * /api/v1/crops/{id_or_slug}:
 *   get:
 *     summary: Get crop details by ID or slug
 *     tags: [Crops]
 *     parameters:
 *       - in: path
 *         name: id_or_slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Detailed crop agronomy information
 *       404:
 *         description: Crop not found
 */
router.get(
  '/:id_or_slug',
  validateRequest({ params: cropParamSchema, query: cropQuerySchema }),
  (req, res, next) => cropController.getCropByIdOrSlug(req, res, next)
);

export default router;
