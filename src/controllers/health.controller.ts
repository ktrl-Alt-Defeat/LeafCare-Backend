import { Request, Response } from 'express';
import { sendSuccess } from '../utils/api-response.js';
import { env } from '../config/env.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { checkAiService, AiServiceStatus } from '../services/ai-status.service.js';
import { leafDetectionService } from '../modules/ai/leaf-detection/leaf-detection.service.js';

interface DependencyResult {
  status: 'up' | 'down' | 'not_configured';
  latencyMs?: number;
  detail?: string;
}

/** Single round trip to PostgreSQL. */
const pingDatabase = async (): Promise<DependencyResult> => {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'up', latencyMs: Date.now() - startedAt };
  } catch (error) {
    logger.error('Health check: database ping failed', error);
    return {
      status: 'down',
      latencyMs: Date.now() - startedAt,
      detail: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
};

/**
 * GET /api/v1/health
 *
 * Liveness plus a database ping. Returns 503 when the database is unreachable so
 * an orchestrator can act on it.
 */
export const checkHealth = async (_req: Request, res: Response): Promise<Response> => {
  const database = await pingDatabase();
  const isHealthy = database.status === 'up';

  return sendSuccess({
    res,
    statusCode: isHealthy ? 200 : 503,
    message: isHealthy
      ? 'LeafCare API and PostgreSQL database are operational'
      : 'LeafCare API is degraded (database unreachable)',
    data: {
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'leafcare-api',
      version: env.APP_VERSION,
      environment: env.NODE_ENV,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      database: {
        status: database.status,
        latencyMs: database.latencyMs,
        engine: 'PostgreSQL',
        ...(database.detail ? { detail: database.detail } : {}),
      },
      memory: {
        rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    },
  });
};

/**
 * GET /api/v1/ready
 *
 * Readiness for traffic. Every dependency the API cannot serve without must be
 * up; optional dependencies are reported but do not block readiness.
 *
 * The AI inference service is deliberately *optional*: it is an independent
 * service still being built, and the rest of the platform serves fine without it.
 */
export const checkReadiness = async (_req: Request, res: Response): Promise<Response> => {
  const [database, ai] = await Promise.all([pingDatabase(), checkAiService()]);

  const required: Record<string, DependencyResult> = { database };
  const optional: Record<string, DependencyResult> = {
    aiInference: {
      status: ai.status === 'up' ? 'up' : ai.status === 'not_configured' ? 'not_configured' : 'down',
      ...(ai.latencyMs !== undefined ? { latencyMs: ai.latencyMs } : {}),
      ...(ai.detail ? { detail: ai.detail } : {}),
    },
  };

  const isReady = Object.values(required).every((dep) => dep.status === 'up');

  return sendSuccess({
    res,
    statusCode: isReady ? 200 : 503,
    message: isReady
      ? 'LeafCare API is ready to accept traffic'
      : 'LeafCare API is not ready: a required dependency is unavailable',
    data: {
      ready: isReady,
      service: 'leafcare-api',
      version: env.APP_VERSION,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      required,
      optional,
    },
  });
};

/**
 * GET /api/v1/ai/health
 *
 * Reports the status of the external inference services. Everything here is read
 * from those services; when one is not configured this returns `not_configured`
 * rather than inventing a model name, device or load time.
 *
 * The HTTP status tracks the classifier alone. The leaf detector is a Stage 1
 * optimisation the pipeline runs without, so its being down is reported but is
 * not an outage of this endpoint.
 */
export const checkAiHealth = async (_req: Request, res: Response): Promise<Response> => {
  const [ai, leafDetector] = await Promise.all([
    checkAiService(),
    leafDetectionService.checkStatus(),
  ]);

  const httpStatus = ai.status === 'up' ? 200 : ai.status === 'not_configured' ? 200 : 503;

  return sendSuccess({
    res,
    statusCode: httpStatus,
    message:
      ai.status === 'up'
        ? 'AI inference service is reachable'
        : ai.status === 'not_configured'
        ? 'AI inference service is not configured for this environment'
        : 'AI inference service is unreachable',
    data: {
      ...(ai as AiServiceStatus),
      leafDetector,
    },
  });
};
