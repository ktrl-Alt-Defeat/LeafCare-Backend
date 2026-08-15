import { Request, Response, NextFunction } from 'express';
import { aiOrchestratorService } from '../ai-orchestrator/ai-orchestrator.service.js';
import { sendSuccess } from '../../../utils/api-response.js';
import { BadRequestError } from '../../../utils/app-error.js';

/**
 * Controller for POST /api/v1/ai/plant-identification
 */
export const identifyPlantAndDetectDisease = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    if (!req.file) {
      throw new BadRequestError(
        'Image file is required. Upload a single image file in the "image" field.'
      );
    }

    const result = await aiOrchestratorService.analyzePlantImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    return sendSuccess({
      res,
      statusCode: 200,
      message: result.message || 'Plant analysis completed successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
