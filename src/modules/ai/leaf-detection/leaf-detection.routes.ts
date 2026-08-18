import { Router } from 'express';
import { detectLeafInFrame } from './leaf-detection.controller.js';
import { uploadSingleImage } from '../../../middleware/upload.middleware.js';
import { visionLimiter } from '../../../middleware/rate-limit.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/v1/ai/leaf-detection:
 *   post:
 *     summary: Locate leaves in a single camera frame (live viewfinder)
 *     description: >
 *       Stage 0 on its own. The scanner polls this while the farmer frames a
 *       shot, so it returns boxes and a confidence but never identifies the
 *       plant and never runs disease detection. Governed by its own high rate
 *       limit rather than the AI limit.
 *     tags:
 *       - AI & Pathology
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: A downscaled camera frame (JPEG, PNG or WebP)
 *     responses:
 *       200:
 *         description: Detection completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [detected, no_leaf, not_configured, unavailable]
 *                     leafCount:
 *                       type: integer
 *                       example: 2
 *                     topConfidence:
 *                       type: number
 *                       nullable: true
 *                       example: 0.87
 *                     best:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         confidence:
 *                           type: number
 *                         boxPixel:
 *                           type: array
 *                           items: { type: number }
 *                         boxNorm:
 *                           type: array
 *                           items: { type: number }
 *                     latencyMs:
 *                       type: number
 *       400:
 *         description: Missing or invalid frame
 *       429:
 *         description: Vision rate limit exceeded
 */
router.post('/leaf-detection', visionLimiter, uploadSingleImage, detectLeafInFrame);

export default router;
