import { Router } from 'express';
import { marketplaceController } from './marketplace.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { marketplaceQuerySchema, marketplaceParamSchema } from './marketplace.validation.js';

const router = Router();

/**
 * @openapi
 * /api/v1/marketplace:
 *   get:
 *     summary: Marketplace API index
 *     tags: [Marketplace API]
 *     responses:
 *       200:
 *         description: Available endpoints in this module
 */
router.get('/', (_req, res) => {
  res.json({
    service: 'Marketplace API',
    version: 'v1',
    endpoints: ["/api/v1/marketplace/categories","/api/v1/marketplace/products","/api/v1/marketplace/search","/api/v1/marketplace/products/{id}"],
    timestamp: new Date().toISOString(),
  });
});

/**
 * @openapi
 * /api/v1/marketplace/categories:
 *   get:
 *     summary: Retrieve public marketplace product categories
 *     tags: [Marketplace]
 *     responses:
 *       200:
 *         description: List of marketplace categories
 */
router.get('/categories', (req, res, next) =>
  marketplaceController.getCategories(req, res, next)
);

/**
 * @openapi
 * /api/v1/marketplace/products:
 *   get:
 *     summary: Retrieve public marketplace products
 *     tags: [Marketplace]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [seeds, fertilizers, crop_protection, tools, equipment] }
 *       - in: query
 *         name: is_organic
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Paginated list of products
 */
router.get('/products', validateRequest({ query: marketplaceQuerySchema }), (req, res, next) =>
  marketplaceController.getProducts(req, res, next)
);

/**
 * @openapi
 * /api/v1/marketplace/search:
 *   get:
 *     summary: Search marketplace products by name or description
 *     tags: [Marketplace]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', validateRequest({ query: marketplaceQuerySchema }), (req, res, next) =>
  marketplaceController.searchProducts(req, res, next)
);

/**
 * @openapi
 * /api/v1/marketplace/products/{id}:
 *   get:
 *     summary: Get detailed marketplace product by ID
 *     tags: [Marketplace]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Detailed product information with reviews
 *       404:
 *         description: Product not found
 */
router.get(
  '/products/:id',
  validateRequest({ params: marketplaceParamSchema }),
  (req, res, next) => marketplaceController.getProductById(req, res, next)
);

export default router;
