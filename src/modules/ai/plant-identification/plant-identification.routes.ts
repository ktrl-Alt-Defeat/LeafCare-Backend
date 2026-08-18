import { Router } from 'express';
import { identifyPlantAndDetectDisease } from './plant-identification.controller.js';
import { uploadSingleImage } from '../../../middleware/upload.middleware.js';
import { aiLimiter } from '../../../middleware/rate-limit.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/v1/ai/plant-identification:
 *   post:
 *     summary: Analyse a leaf photo and return a diagnosis, or say why it cannot
 *     description: >
 *       Locates a leaf with YOLO11 and crops to it when it can, classifies the
 *       result across the 38 trained PlantVillage classes, and decides whether
 *       the answer is trustworthy before reporting it. Leaf detection never
 *       blocks a scan: if no leaf is found the whole frame is classified.
 *
 *
 *       Always answers 200 with a `verdict`:
 *       `diagnosed` a supported crop with a disease named;
 *       `unsupported_plant` the image does not resemble any trained crop, so no
 *       disease is reported and retaking the photo will not change that;
 *       `uncertain` plausibly a supported crop but not clear enough to call;
 *       `unavailable` the models could not be reached.
 *
 *
 *       Also served at `/api/v1/ai/analyze`. The two paths are the same handler.
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
 *         description: Analysis completed. Read `data.verdict` for the outcome.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message:
 *                   type: string
 *                   example: This does not look like one of the crops LeafCare can diagnose.
 *                 data:
 *                   type: object
 *                   properties:
 *                     verdict:
 *                       type: string
 *                       enum: [diagnosed, unsupported_plant, uncertain, unavailable]
 *                     leafDetection:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [detected, no_leaf, not_configured, unavailable]
 *                         leafCount: { type: integer, example: 1 }
 *                         cropped:
 *                           type: boolean
 *                           description: Whether the classifier read the leaf crop or the full frame.
 *                     plant:
 *                       type: object
 *                       nullable: true
 *                       description: The crop the winning label belongs to. Null unless diagnosed.
 *                       properties:
 *                         name: { type: string, example: Tomato }
 *                         scientificName: { type: string, example: solanum lycopersicum }
 *                         confidence:
 *                           type: number
 *                           example: 0.98
 *                           description: Share of the model's belief sitting on this crop.
 *                     crop:
 *                       type: object
 *                       properties:
 *                         name: { type: string, example: Tomato }
 *                         id: { type: string, example: TOMATO }
 *                         supported: { type: boolean, example: true }
 *                     diseaseDetection:
 *                       type: object
 *                       properties:
 *                         available: { type: boolean, example: true }
 *                         disease:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             name: { type: string, example: Early Blight }
 *                             confidence:
 *                               type: number
 *                               example: 0.97
 *                               description: Probability given the crop, not across all classes.
 *                         message: { type: string }
 *                     novelty:
 *                       type: object
 *                       description: Evidence behind the verdict. Absent if the host has no novelty check.
 *                       properties:
 *                         verdict:
 *                           type: string
 *                           enum: [accept, reject_unsupported, reject_uncertain]
 *                         accepted: { type: boolean }
 *                         knnDistance: { type: number, example: 0.11 }
 *                         energy: { type: number, example: -20.4 }
 *                         confidence: { type: number, example: 0.99 }
 *                         reason: { type: string }
 *                     message: { type: string }
 *                 timestamp: { type: string }
 *       400:
 *         description: Bad request (missing image, invalid mime type, or file too large)
 *       429:
 *         description: AI rate limit exceeded
 */
// Both paths, one handler. `/analyze` is the honest name now that nothing
// identifies species; `/plant-identification` stays because a deployed frontend
// calls it and a URL rename is not worth a broken client.
router.post('/plant-identification', aiLimiter, uploadSingleImage, identifyPlantAndDetectDisease);
router.post('/analyze', aiLimiter, uploadSingleImage, identifyPlantAndDetectDisease);

export default router;
