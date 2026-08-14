import { Router } from 'express';
import { languageController } from './language.controller.js';

const router = Router();

/**
 * @openapi
 * /api/v1/languages:
 *   get:
 *     summary: Retrieve active system languages
 *     tags: [Languages]
 *     responses:
 *       200:
 *         description: List of active languages
 */
router.get('/', (req, res, next) => languageController.getLanguages(req, res, next));

export default router;
