import { Request, Response, NextFunction } from 'express';
import { cropService } from './crop.service.js';
import { parseQueryParams } from '../../utils/query-parser.js';
import { sendSuccess } from '../../utils/api-response.js';
import type { crop_season, crop_life_cycle } from '@prisma/client';

export class CropController {
  /**
   * GET /api/v1/crops
   */
  async getCrops(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams = parseQueryParams(req.query);
      const result = await cropService.getCrops({
        ...queryParams,
        season: req.query.season as crop_season | undefined,
        life_cycle: req.query.life_cycle as crop_life_cycle | undefined,
      });

      sendSuccess({
        res,
        statusCode: 200,
        message: 'Crops retrieved successfully',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/crops/search
   */
  async searchCrops(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams = parseQueryParams(req.query);
      const result = await cropService.searchCrops({
        ...queryParams,
        search: queryParams.search || (typeof req.query.q === 'string' ? req.query.q : undefined),
      });

      sendSuccess({
        res,
        statusCode: 200,
        message: 'Crop search results',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/crops/:id_or_slug
   */
  async getCropByIdOrSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idOrSlug = Array.isArray(req.params.id_or_slug) ? req.params.id_or_slug[0] : req.params.id_or_slug;
      const { lang } = parseQueryParams(req.query);
      const crop = await cropService.getCropByIdOrSlug(idOrSlug, lang);

      sendSuccess({
        res,
        statusCode: 200,
        message: 'Crop details retrieved successfully',
        data: crop,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const cropController = new CropController();
