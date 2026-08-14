import { Request, Response, NextFunction } from 'express';
import { diseaseService } from './disease.service.js';
import { parseQueryParams } from '../../utils/query-parser.js';
import { sendSuccess } from '../../utils/api-response.js';
import type { disease_severity, pathogen_type } from '@prisma/client';

export class DiseaseController {
  /**
   * GET /api/v1/diseases
   */
  async getDiseases(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams = parseQueryParams(req.query);
      const result = await diseaseService.getDiseases({
        ...queryParams,
        severity: req.query.severity as disease_severity | undefined,
        pathogen_type: req.query.pathogen_type as pathogen_type | undefined,
      });

      sendSuccess({
        res,
        statusCode: 200,
        message: 'Diseases retrieved successfully',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/diseases/search
   */
  async searchDiseases(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const queryParams = parseQueryParams(req.query);
      const result = await diseaseService.searchDiseases({
        ...queryParams,
        search: queryParams.search || (typeof req.query.q === 'string' ? req.query.q : undefined),
      });

      sendSuccess({
        res,
        statusCode: 200,
        message: 'Disease search results',
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/diseases/:id_or_slug
   */
  async getDiseaseByIdOrSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const idOrSlug = Array.isArray(req.params.id_or_slug) ? req.params.id_or_slug[0] : req.params.id_or_slug;
      const { lang } = parseQueryParams(req.query);
      const disease = await diseaseService.getDiseaseByIdOrSlug(idOrSlug, lang);

      sendSuccess({
        res,
        statusCode: 200,
        message: 'Disease details retrieved successfully',
        data: disease,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const diseaseController = new DiseaseController();
