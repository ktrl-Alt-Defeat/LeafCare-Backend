import { Request, Response, NextFunction } from 'express';
import { languageService } from './language.service.js';
import { sendSuccess } from '../../utils/api-response.js';

export class LanguageController {
  /**
   * GET /api/v1/languages
   */
  async getLanguages(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const languages = await languageService.getActiveLanguages();
      sendSuccess({
        res,
        statusCode: 200,
        message: 'Active system languages retrieved successfully',
        data: languages,
        meta: { total: languages.length },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const languageController = new LanguageController();
