import { Router } from 'express';
import { identifyPlantAndDetectDisease } from './plant-identification.controller.js';
import { uploadSingleImage } from '../../../middleware/upload.middleware.js';
import { aiLimiter } from '../../../middleware/rate-limit.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/v1/ai/plant-identification:
 *   post:
 *     summary: Identify plant from image and run disease detection for supported crops
 *     description: >
 *       Pipeline that identifies the plant using Pl@ntNet API, checks identification confidence,
 *       normalizes the plant to LeafCare crop categories, and enforces the 14-crop model gate.
 *       If the plant is one of the 14 supported crops, ConvNeXt disease detection is executed.
 *       If the crop is unsupported or identification is low confidence, disease detection is skipped.
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
 *                 description: Plant leaf image (JPEG, PNG, or WebP up to 10 MB)
 *     responses:
 *       200:
 *         description: Successful plant identification and gate analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Plant analysis completed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     plant:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: Tomato
 *                         scientificName:
 *                           type: string
 *                           example: Solanum lycopersicum
 *                         confidence:
 *                           type: number
 *                           example: 0.94
 *                     crop:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: Tomato
 *                         supported:
 *                           type: boolean
 *                           example: true
 *                     diseaseDetection:
 *                       type: object
 *                       properties:
 *                         available:
 *                           type: boolean
 *                           example: true
 *                         disease:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             name:
 *                               type: string
 *                               example: Early Blight
 *                             confidence:
 *                               type: number
 *                               example: 0.91
 *                         message:
 *                           type: string
 *                           example: Disease detection is not available for this plant.
 *                 timestamp:
 *                   type: string
 *                   example: "2026-08-15T23:24:00.000Z"
 *       400:
 *         description: Bad request (missing image, invalid mime type, or file too large)
 *       429:
 *         description: AI rate limit exceeded
 *       502:
 *         description: External service failure (Pl@ntNet or ConvNeXt unreachable)
 *       504:
 *         description: External service request timeout
 */
router.post('/plant-identification', aiLimiter, uploadSingleImage, identifyPlantAndDetectDisease);

export default router;
