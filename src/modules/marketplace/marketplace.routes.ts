import { Router } from 'express';
import { marketplaceController } from './marketplace.controller.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import {
  marketplaceQuerySchema,
  marketplaceParamSchema,
  createProductSchema,
  updateProductSchema,
} from './marketplace.validation.js';
import { requireAdminKey } from '../../middleware/admin-key.middleware.js';

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

/* -------------------------------------------------------------------------- */
/* Seller write endpoints                                                     */
/*                                                                            */
/* Guarded by the shared admin key. This is not per-user authentication: the   */
/* key proves the caller is a trusted server, not which seller they are, so    */
/* `seller_id` is taken from the body and validated against the users table.   */
/* Replace with real auth before this leaves pilot use.                        */
/* -------------------------------------------------------------------------- */

/**
 * @openapi
 * /api/v1/marketplace/products:
 *   post:
 *     summary: List a new product (seller dashboard)
 *     tags: [Marketplace]
 *     security: [{ AdminKey: [] }]
 *     responses:
 *       201: { description: Product listed }
 *       401: { description: Missing admin key }
 *       403: { description: Invalid admin key }
 *       422: { description: Validation failed }
 */
router.post(
  '/products',
  requireAdminKey,
  validateRequest({ body: createProductSchema }),
  (req, res, next) => marketplaceController.createProduct(req, res, next)
);

/**
 * @openapi
 * /api/v1/marketplace/products/{id}:
 *   patch:
 *     summary: Update one of the seller's listings
 *     tags: [Marketplace]
 *     security: [{ AdminKey: [] }]
 *     responses:
 *       200: { description: Product updated }
 *       404: { description: Product not found }
 *   delete:
 *     summary: Remove a listing (soft delete, so past orders keep resolving)
 *     tags: [Marketplace]
 *     security: [{ AdminKey: [] }]
 *     responses:
 *       200: { description: Product removed }
 *       404: { description: Product not found }
 */
router.patch(
  '/products/:id',
  requireAdminKey,
  validateRequest({ params: marketplaceParamSchema, body: updateProductSchema }),
  (req, res, next) => marketplaceController.updateProduct(req, res, next)
);

router.delete(
  '/products/:id',
  requireAdminKey,
  validateRequest({ params: marketplaceParamSchema }),
  (req, res, next) => marketplaceController.deleteProduct(req, res, next)
);

export default router;
