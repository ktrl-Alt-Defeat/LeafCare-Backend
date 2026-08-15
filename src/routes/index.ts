import { Router, Request, Response } from 'express';
import healthRoutes from './health.routes.js';
import { languageRoutes } from '../modules/language/index.js';
import { cropRoutes } from '../modules/crop/index.js';
import { diseaseRoutes } from '../modules/disease/index.js';
import { knowledgeRoutes } from '../modules/knowledge/index.js';
import { communityRoutes } from '../modules/community/index.js';
import { marketplaceRoutes } from '../modules/marketplace/index.js';
import { aiRoutes } from '../modules/ai/index.js';
import { env } from '../config/env.js';

const rootRouter = Router();

/**
 * Service metadata at the API root. Returning a 404 here made a correctly
 * mounted API look broken, and gave no way to discover what it serves.
 */
rootRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'LeafCare API',
    version: env.APP_VERSION,
    apiVersion: 'v1',
    environment: env.NODE_ENV,
    status: 'online',
    documentation: '/docs',
    openapi: '/docs.json',
    endpoints: {
      operations: ['/api/v1/health', '/api/v1/ready', '/api/v1/ai/health'],
      ai: ['/api/v1/ai/plant-identification'],
      languages: ['/api/v1/languages'],
      crops: ['/api/v1/crops', '/api/v1/crops/search', '/api/v1/crops/{id_or_slug}'],
      diseases: ['/api/v1/diseases', '/api/v1/diseases/search', '/api/v1/diseases/{id_or_slug}'],
      knowledge: ['/api/v1/knowledge/categories', '/api/v1/knowledge/articles'],
      community: ['/api/v1/community/categories', '/api/v1/community/posts', '/api/v1/community/search'],
      marketplace: [
        '/api/v1/marketplace/categories',
        '/api/v1/marketplace/products',
        '/api/v1/marketplace/search',
      ],
    },
    timestamp: new Date().toISOString(),
  });
});

// Operational probes are mounted at the router root so their paths stay short
// and stable (/api/v1/health rather than /api/v1/health/health).
rootRouter.use('/', healthRoutes);

// Feature routers
rootRouter.use('/ai', aiRoutes);
rootRouter.use('/languages', languageRoutes);
rootRouter.use('/crops', cropRoutes);
rootRouter.use('/diseases', diseaseRoutes);
rootRouter.use('/knowledge', knowledgeRoutes);
rootRouter.use('/community', communityRoutes);
rootRouter.use('/marketplace', marketplaceRoutes);

export default rootRouter;
