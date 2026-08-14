import { Router } from 'express';
import { communityController } from './community.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { communityQuerySchema, communityParamSchema } from './community.validation.js';

const router = Router();

/**
 * @openapi
 * /api/v1/community:
 *   get:
 *     summary: Community API index
 *     tags: [Community API]
 *     responses:
 *       200:
 *         description: Available endpoints in this module
 */
router.get('/', (_req, res) => {
  res.json({
    service: 'Community API',
    version: 'v1',
    endpoints: ["/api/v1/community/categories","/api/v1/community/posts","/api/v1/community/search","/api/v1/community/posts/{id}"],
    timestamp: new Date().toISOString(),
  });
});

/**
 * @openapi
 * /api/v1/community/categories:
 *   get:
 *     summary: Retrieve public community forum categories
 *     tags: [Community Forum]
 *     responses:
 *       200:
 *         description: List of forum categories
 */
router.get('/categories', (req, res, next) =>
  communityController.getCategories(req, res, next)
);

/**
 * @openapi
 * /api/v1/community/posts:
 *   get:
 *     summary: Retrieve public community posts
 *     tags: [Community Forum]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [disease_help, crop_advice, fertilizer, irrigation, weather, marketplace, general] }
 *     responses:
 *       200:
 *         description: Paginated list of community posts
 */
router.get('/posts', validateRequest({ query: communityQuerySchema }), (req, res, next) =>
  communityController.getPosts(req, res, next)
);

/**
 * @openapi
 * /api/v1/community/search:
 *   get:
 *     summary: Search community posts by title or content
 *     tags: [Community Forum]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', validateRequest({ query: communityQuerySchema }), (req, res, next) =>
  communityController.searchPosts(req, res, next)
);

/**
 * @openapi
 * /api/v1/community/posts/{id}:
 *   get:
 *     summary: Get detailed community post by ID with comments thread
 *     tags: [Community Forum]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Detailed community post
 *       404:
 *         description: Post not found
 */
router.get(
  '/posts/:id',
  validateRequest({ params: communityParamSchema }),
  (req, res, next) => communityController.getPostById(req, res, next)
);

export default router;
