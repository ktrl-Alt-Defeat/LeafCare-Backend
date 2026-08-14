import { Router } from 'express';
import { knowledgeController } from './knowledge.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { articleQuerySchema, articleParamSchema } from './knowledge.validation.js';

const router = Router();

/**
 * @openapi
 * /api/v1/knowledge:
 *   get:
 *     summary: Knowledge Base API index
 *     tags: [Knowledge Base API]
 *     responses:
 *       200:
 *         description: Available endpoints in this module
 */
router.get('/', (_req, res) => {
  res.json({
    service: 'Knowledge Base API',
    version: 'v1',
    endpoints: ["/api/v1/knowledge/categories","/api/v1/knowledge/articles","/api/v1/knowledge/articles/{id_or_slug}"],
    timestamp: new Date().toISOString(),
  });
});

/**
 * @openapi
 * /api/v1/knowledge/categories:
 *   get:
 *     summary: Retrieve CMS knowledge base categories
 *     tags: [Knowledge Base]
 *     parameters:
 *       - in: query
 *         name: lang
 *         schema: { type: string, default: en }
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', (req, res, next) =>
  knowledgeController.getCategories(req, res, next)
);

/**
 * @openapi
 * /api/v1/knowledge/articles:
 *   get:
 *     summary: Retrieve published knowledge base articles
 *     tags: [Knowledge Base]
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
 *         description: Paginated list of articles
 */
router.get('/articles', validateRequest({ query: articleQuerySchema }), (req, res, next) =>
  knowledgeController.getArticles(req, res, next)
);

/**
 * @openapi
 * /api/v1/knowledge/articles/{id_or_slug}:
 *   get:
 *     summary: Get knowledge base article details by ID or slug
 *     tags: [Knowledge Base]
 *     parameters:
 *       - in: path
 *         name: id_or_slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Full knowledge article content
 *       404:
 *         description: Article not found
 */
router.get(
  '/articles/:id_or_slug',
  validateRequest({ params: articleParamSchema, query: articleQuerySchema }),
  (req, res, next) => knowledgeController.getArticleByIdOrSlug(req, res, next)
);

export default router;
