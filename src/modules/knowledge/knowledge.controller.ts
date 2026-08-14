import { Request, Response, NextFunction } from 'express';
import { knowledgeService } from './knowledge.service.js';
import { parseQueryParams } from '../../utils/query-parser.js';
import { sendSuccess } from '../../utils/api-response.js';

export class KnowledgeController {
  /**
   * GET /api/v1/knowledge/categories
   */
  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lang } = parseQueryParams(req.query);
      const categories = await knowledgeService.getCategories(lang);

      sendSuccess({
        res,
        statusCode: 200,
        message: 'Knowledge base categories retrieved successfully',
        data: categories,
        meta: { total: categories.length },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/knowledge/articles
   */
  async getArticles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams = parseQueryParams(req.query);
      const result = await knowledgeService.getArticles({
        ...queryParams,
        category_id: typeof req.query.category_id === 'string' ? req.query.category_id : undefined,
        crop_id: typeof req.query.crop_id === 'string' ? req.query.crop_id : undefined,
        disease_id: typeof req.query.disease_id === 'string' ? req.query.disease_id : undefined,
        search: queryParams.search || (typeof req.query.q === 'string' ? req.query.q : undefined),
      });

      sendSuccess({
        res,
        statusCode: 200,
        message: 'Knowledge base articles retrieved successfully',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/knowledge/articles/:id_or_slug
   */
  async getArticleByIdOrSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idOrSlug = Array.isArray(req.params.id_or_slug) ? req.params.id_or_slug[0] : req.params.id_or_slug;
      const { lang } = parseQueryParams(req.query);
      const article = await knowledgeService.getArticleByIdOrSlug(idOrSlug, lang);

      sendSuccess({
        res,
        statusCode: 200,
        message: 'Knowledge article content retrieved successfully',
        data: article,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const knowledgeController = new KnowledgeController();
