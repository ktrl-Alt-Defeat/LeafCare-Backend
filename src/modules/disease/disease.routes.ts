import { Router } from 'express';
import { diseaseController } from './disease.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { diseaseQuerySchema, diseaseParamSchema } from './disease.validation.js';

const router = Router();

/**
 * @openapi
 * /api/v1/diseases:
 *   get:
 *     summary: Retrieve list of plant diseases with localized remedies and symptoms
 *     tags: [Diseases]
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
 *         description: Paginated list of plant diseases
 */
router.get('/', validateRequest({ query: diseaseQuerySchema }), (req, res, next) =>
  diseaseController.getDiseases(req, res, next)
);

/**
 * @openapi
 * /api/v1/diseases/search:
 *   get:
 *     summary: Search diseases by symptom or localized name
 *     tags: [Diseases]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Disease search results
 */
router.get('/search', validateRequest({ query: diseaseQuerySchema }), (req, res, next) =>
  diseaseController.searchDiseases(req, res, next)
);

/**
 * @openapi
 * /api/v1/diseases/{id_or_slug}:
 *   get:
 *     summary: Get disease pathology details by ID or slug
 *     tags: [Diseases]
 *     parameters:
 *       - in: path
 *         name: id_or_slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Detailed disease pathology and remedies
 *       404:
 *         description: Disease not found
 */
router.get(
  '/:id_or_slug',
  validateRequest({ params: diseaseParamSchema, query: diseaseQuerySchema }),
  (req, res, next) => diseaseController.getDiseaseByIdOrSlug(req, res, next)
);

export default router;
