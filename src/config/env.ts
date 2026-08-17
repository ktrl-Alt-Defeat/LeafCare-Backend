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

  /**
   * Shared secret guarding the admin and seller write endpoints.
   *
   * Not authentication — it carries no identity and no per-user permissions.
   * It exists so the dashboards can persist changes without leaving the
   * knowledge base and marketplace writable by anyone. Optional: when unset the
   * write endpoints fail closed with 403 rather than opening up.
   */
  LEAFCARE_ADMIN_KEY: z.string().min(16, 'LEAFCARE_ADMIN_KEY must be at least 16 characters').optional(),

  // --- External AI inference service ---------------------------------------
  /**
   * Base URL of the disease-prediction inference service. Left unset until that
   * service is deployed; /ready and /ai/health report `not_configured` rather
   * than pretending a model is available.
   */
  AI_SERVICE_URL: z.string().url().optional(),
  AI_SERVICE_TIMEOUT_MS: z
    .string()
    .default('30000')
    .transform((val) => parseInt(val, 10)),

  // --- Pl@ntNet API Configuration -----------------------------------------
  PLANTNET_API_KEY: z
    .string({ required_error: 'PLANTNET_API_KEY is required' })
    .min(1, 'PLANTNET_API_KEY cannot be empty'),
  PLANTNET_API_URL: z
    .string()
    .url()
    .default('https://my-api.plantnet.org/v2/identify/all'),
  PLANTNET_MIN_CONFIDENCE: z
    .string()
    .default('0.50')
    .transform((val) => parseFloat(val)),
  PLANTNET_TIMEOUT_MS: z
    .string()
    .default('20000')
    .transform((val) => parseInt(val, 10)),

  // --- ElevenLabs voice (text-to-speech + speech-to-text) ------------------
  /**
   * Optional: when unset the voice endpoints answer 503 with a clear message
   * rather than failing deep inside a fetch. The rest of the API is unaffected,
   * so a missing key degrades the read-aloud button instead of the whole app.
   */
  ELEVEN_LABS_API_KEY: z.string().min(1).optional(),
  ELEVEN_LABS_API_URL: z.string().url().default('https://api.elevenlabs.io/v1'),
  /**
   * Flash is the default because this powers a tap-to-listen button: it is the
   * lowest-latency multilingual model and the cheapest per character. It also
   * accepts `language_code`, which pins pronunciation instead of letting the
   * model guess from the script. Set `eleven_v3` for Telugu, Kannada and
   * Malayalam, which the v2.5 model family does not cover.
   */
  ELEVEN_LABS_TTS_MODEL: z.string().default('eleven_flash_v2_5'),
  ELEVEN_LABS_STT_MODEL: z.string().default('scribe_v1'),
  /**
   * Default narrator: the premade "Sarah" voice.
   *
   * Not every premade voice works on every plan — ElevenLabs classifies some
   * (Rachel, Aria) as *library* voices and answers 402 for free accounts. This
   * one is verified to synthesize on the free tier.
   */
  ELEVEN_LABS_VOICE_ID: z.string().default('EXAVITQu4vr4xnSDxMaL'),
  ELEVEN_LABS_TIMEOUT_MS: z
    .string()
    .default('30000')
    .transform((val) => parseInt(val, 10)),
  /**
   * Synthesis is billed per character, so an accidental request carrying a
   * whole article is a real cost. The frontend trims before sending; this is
   * the server-side backstop.
   */
  ELEVEN_LABS_MAX_CHARS: z
    .string()
    .default('2500')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'ELEVEN_LABS_MAX_CHARS must be a positive integer',
    }),
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
