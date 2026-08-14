import { Router } from 'express';
import { checkHealth, checkReadiness, checkAiHealth } from '../controllers/health.controller.js';

const router = Router();

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     summary: Liveness probe with database connectivity
 *     tags: [Operations]
 *     responses:
 *       200: { description: Service healthy }
 *       503: { description: Database unreachable }
 */
router.get('/health', (req, res) => {
  void checkHealth(req, res);
});

/**
 * @openapi
 * /api/v1/ready:
 *   get:
 *     summary: Readiness probe across required and optional dependencies
 *     tags: [Operations]
 *     responses:
 *       200: { description: Ready to accept traffic }
 *       503: { description: A required dependency is unavailable }
 */
router.get('/ready', (req, res) => {
  void checkReadiness(req, res);
});

/**
 * @openapi
 * /api/v1/ai/health:
 *   get:
 *     summary: Status of the external AI inference service
 *     description: >
 *       Reports what the inference service says about itself. Returns
 *       `not_configured` when AI_SERVICE_URL is unset — no model details are
 *       fabricated.
 *     tags: [Operations]
 *     responses:
 *       200: { description: Reachable, or not configured for this environment }
 *       503: { description: Configured but unreachable }
 */
router.get('/ai/health', (req, res) => {
  void checkAiHealth(req, res);
});

export default router;
