import { Router } from 'express';
import plantIdentificationRoutes from './plant-identification/plant-identification.routes.js';
import leafDetectionRoutes from './leaf-detection/leaf-detection.routes.js';

/**
 * Everything mounted under /api/v1/ai.
 *
 * Stage 0 is exposed on its own alongside the full pipeline because the live
 * viewfinder needs leaf boxes many times a second, which is a different cost
 * and a different rate limit from a complete scan.
 */
const aiRoutes = Router();

aiRoutes.use('/', leafDetectionRoutes);
aiRoutes.use('/', plantIdentificationRoutes);

export * from './ai.types.js';
export * from './ai.interfaces.js';
export { aiRoutes };
export default aiRoutes;
