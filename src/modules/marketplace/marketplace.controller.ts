import { Request, Response, NextFunction } from 'express';
import { marketplaceService } from './marketplace.service.js';
import { parseQueryParams } from '../../utils/query-parser.js';
import { sendSuccess } from '../../utils/api-response.js';
import type { product_category } from '@prisma/client';

export class MarketplaceController {
  /**
   * GET /api/v1/marketplace/categories
   */
  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = marketplaceService.getCategories();
      sendSuccess({
        res,
        statusCode: 200,
        message: 'Marketplace product categories retrieved successfully',
        data: categories,
        meta: { total: categories.length },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/marketplace/products
   */
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams = parseQueryParams(req.query);
      const min_price = req.query.min_price ? parseFloat(req.query.min_price as string) : undefined;
      const max_price = req.query.max_price ? parseFloat(req.query.max_price as string) : undefined;
      const is_organic = req.query.is_organic === 'true' ? true : req.query.is_organic === 'false' ? false : undefined;

      const result = await marketplaceService.getProducts({
        ...queryParams,
        category: req.query.category as product_category | undefined,
        is_organic,
        min_price: !isNaN(min_price!) ? min_price : undefined,
        max_price: !isNaN(max_price!) ? max_price : undefined,
      });

      sendSuccess({
        res,
        statusCode: 200,
        message: 'Marketplace products retrieved successfully',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/marketplace/search
   */
  async searchProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams = parseQueryParams(req.query);
      const result = await marketplaceService.searchProducts({
        ...queryParams,
        search: queryParams.search || (typeof req.query.q === 'string' ? req.query.q : undefined),
      });

      sendSuccess({
        res,
        statusCode: 200,
        message: 'Marketplace product search results',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/marketplace/products/:id
   */
  async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const product = await marketplaceService.getProductById(id);

      sendSuccess({
        res,
        statusCode: 200,
        message: 'Marketplace product details retrieved successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const marketplaceController = new MarketplaceController();
