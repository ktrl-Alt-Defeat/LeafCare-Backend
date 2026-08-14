import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Environment Variable Zod Validation Schema
 */
const envSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val < 65536, {
      message: 'PORT must be a valid port number between 1 and 65535',
    }),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  /**
   * Comma-separated list of allowed origins. A single value is the common case;
   * a list covers local + preview + production without a code change.
   * Use `*` to allow any origin (development only).
   */
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000')
    .transform((val) =>
      val
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    ),
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'debug'])
    .default('info'),
  DATABASE_URL: z
    .string({ required_error: 'DATABASE_URL is required' })
    .min(1, 'DATABASE_URL cannot be empty'),
  DIRECT_URL: z
    .string({ required_error: 'DIRECT_URL is required' })
    .min(1, 'DIRECT_URL cannot be empty'),

  /** Reported by /health and the API root. */
  APP_VERSION: z.string().default('1.0.0'),

  /**
   * Number of reverse proxies in front of the app. Rate limiting keys on client
   * IP, so behind a load balancer this must be set or every request appears to
   * come from the proxy and shares one bucket.
   */
  TRUST_PROXY: z
    .string()
    .default('0')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 0, {
      message: 'TRUST_PROXY must be a non-negative integer',
    }),

  // --- Rate limiting -------------------------------------------------------
  RATE_LIMIT_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((val) => val === 'true'),
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .default('60000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'RATE_LIMIT_WINDOW_MS must be a positive integer',
    }),
  RATE_LIMIT_GENERAL_MAX: z
    .string()
    .default('100')
    .transform((val) => parseInt(val, 10)),
  RATE_LIMIT_AUTH_MAX: z
    .string()
    .default('20')
    .transform((val) => parseInt(val, 10)),
  RATE_LIMIT_AI_MAX: z
    .string()
    .default('10')
    .transform((val) => parseInt(val, 10)),
  RATE_LIMIT_UPLOAD_MAX: z
    .string()
    .default('5')
    .transform((val) => parseInt(val, 10)),

  // --- External AI inference service ---------------------------------------
  /**
   * Base URL of the disease-prediction inference service. Left unset until that
   * service is deployed; /ready and /ai/health report `not_configured` rather
   * than pretending a model is available.
   */
  AI_SERVICE_URL: z.string().url().optional(),
  AI_SERVICE_TIMEOUT_MS: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10)),
});

/**
 * Validate and export environment variables
 */
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
