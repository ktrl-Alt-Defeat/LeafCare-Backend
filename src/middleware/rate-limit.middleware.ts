import rateLimit, { Options } from 'express-rate-limit';
import { Request, Response } from 'express';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Rate limiters, one per class of endpoint. Every ceiling is configurable
 * through the environment so limits can be tightened in production without a
 * code change, and relaxed in tests.
 *
 * All limiters share the same window (RATE_LIMIT_WINDOW_MS, default 60s).
 */

const buildLimiter = (max: number, scope: string) => {
  const options: Partial<Options> = {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    // Disabling still returns a middleware, so callers do not need branches.
    skip: () => !env.RATE_LIMIT_ENABLED,
    handler: (req: Request, res: Response) => {
      logger.warn(`Rate limit exceeded [${scope}] from ${req.ip} on ${req.originalUrl}`);
      res.status(429).json({
        success: false,
        error: {
          code: 429,
          message: 'Too many requests. Please slow down and try again shortly.',
          scope,
          retryAfterSeconds: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000),
        },
        timestamp: new Date().toISOString(),
      });
    },
  };

  return rateLimit(options);
};

/** Everything under /api/v1 that has no tighter limiter of its own. */
export const generalLimiter = buildLimiter(env.RATE_LIMIT_GENERAL_MAX, 'general');

/** Login, registration, password reset — brute-force surface. */
export const authLimiter = buildLimiter(env.RATE_LIMIT_AUTH_MAX, 'auth');

/** AI inference: the most expensive call in the system. */
export const aiLimiter = buildLimiter(env.RATE_LIMIT_AI_MAX, 'ai');

/** File and image uploads. */
export const uploadLimiter = buildLimiter(env.RATE_LIMIT_UPLOAD_MAX, 'upload');

/**
 * Live viewfinder leaf detection. Cheap, local and polled continuously while
 * the camera is open, so it gets its own much higher ceiling.
 */
export const visionLimiter = buildLimiter(env.RATE_LIMIT_VISION_MAX, 'vision');

/**
 * Paths the general limiter must not apply to.
 *
 * Health and readiness are polled continuously by an orchestrator, where a 429
 * would read as an outage. Live leaf detection is polled just as continuously
 * by every open scanner, and is governed by `visionLimiter` instead - leaving
 * it under the general ceiling would stop the guidance after a minute of aiming
 * and take the rest of the API's budget with it.
 */
export const skipGeneralLimiter = (req: Request): boolean =>
  req.path === '/health' || req.path === '/ready' || req.path === '/ai/leaf-detection';
