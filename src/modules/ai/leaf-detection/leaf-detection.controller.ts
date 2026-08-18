import { Request, Response, NextFunction } from 'express';
import { leafDetectionService } from './leaf-detection.service.js';
import { sendSuccess } from '../../../utils/api-response.js';
import { BadRequestError } from '../../../utils/app-error.js';

/**
 * Controller for POST /api/v1/ai/leaf-detection
 *
 * Serves the live viewfinder: the scanner posts a downscaled frame a few times
 * a second and gets back boxes to draw and a verdict on whether the shot is
 * worth taking. No crop is requested and nothing downstream runs, so this stays
 * an order of magnitude cheaper than a full scan.
 */
export const detectLeafInFrame = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    if (!req.file) {
      throw new BadRequestError(
        'Image file is required. Upload a single frame in the "image" field.'
      );
    }

    const result = await leafDetectionService.detectLeaf(
      req.file.buffer,
      req.file.mimetype
    );

    return sendSuccess({
      res,
      statusCode: 200,
      message: result.message ?? 'Leaf detection completed',
      data: {
        status: result.status,
        leafCount: result.leafCount,
        topConfidence: result.topConfidence,
        best: result.best,
        ...(result.latencyMs !== undefined ? { latencyMs: result.latencyMs } : {}),
      },
    });
  } catch (error) {
    next(error);
  }
};
