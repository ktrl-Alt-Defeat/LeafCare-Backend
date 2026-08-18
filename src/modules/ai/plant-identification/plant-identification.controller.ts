import { Request, Response, NextFunction } from 'express';
import { aiOrchestratorService } from '../ai-orchestrator/ai-orchestrator.service.js';
import { sendSuccess } from '../../../utils/api-response.js';
import { BadRequestError } from '../../../utils/app-error.js';

/**
 * Controller for the scan endpoint.
 *
 * Reachable at both `/api/v1/ai/plant-identification` and `/api/v1/ai/analyze`.
 * The first name is a leftover from when a species-identification service ran
 * ahead of the classifier; it is kept because a deployed frontend calls it, and
 * breaking that to tidy a URL is not a trade worth making.
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

    // Always 200. "This is not a crop I know" is a completed analysis with a
    // definite answer, not a client error, and a 4xx would send the scanner
    // down its failure path instead of showing the farmer what to do next.
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
