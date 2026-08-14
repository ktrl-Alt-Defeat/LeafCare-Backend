import { Request, Response, NextFunction } from 'express';
import { communityService } from './community.service.js';
import { parseQueryParams } from '../../utils/query-parser.js';
import { sendSuccess } from '../../utils/api-response.js';
import type { post_category } from '@prisma/client';

export class CommunityController {
  /**
   * GET /api/v1/community/categories
   */
  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = communityService.getCategories();
      sendSuccess({
        res,
        statusCode: 200,
        message: 'Community forum categories retrieved successfully',
        data: categories,
        meta: { total: categories.length },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/community/posts
   */
  async getPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams = parseQueryParams(req.query);
      const result = await communityService.getPosts({
        ...queryParams,
        category: req.query.category as post_category | undefined,
        crop_id: typeof req.query.crop_id === 'string' ? req.query.crop_id : undefined,
      });

      sendSuccess({
        res,
        statusCode: 200,
        message: 'Community posts retrieved successfully',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/community/search
   */
  async searchPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams = parseQueryParams(req.query);
      const result = await communityService.searchPosts({
        ...queryParams,
        search: queryParams.search || (typeof req.query.q === 'string' ? req.query.q : undefined),
      });

      sendSuccess({
        res,
        statusCode: 200,
        message: 'Community post search results',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/community/posts/:id
   */
  async getPostById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const post = await communityService.getPostById(id);

      sendSuccess({
        res,
        statusCode: 200,
        message: 'Community post details retrieved successfully',
        data: post,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const communityController = new CommunityController();
