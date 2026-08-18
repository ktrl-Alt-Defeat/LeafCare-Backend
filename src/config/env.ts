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
   * Ceiling for the live viewfinder detector.
   *
   * Deliberately far above RATE_LIMIT_AI_MAX: this endpoint is polled several
   * times a second while the farmer frames a leaf, and the AI ceiling of ten a
   * minute would cut the guidance off after seven seconds of aiming.
   */
  RATE_LIMIT_VISION_MAX: z
    .string()
    .default('300')
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

  // --- Inference host (both vision models, one process) --------------------
  /**
   * Base URL of the FastAPI service holding the leaf detector and the disease
   * classifier.
   *
   * That service runs on a workstation and is published through a tunnel, so
   * this is a public HTTPS URL pointing at a machine that is not always awake.
   * Optional: unset means leaf localization is skipped and disease detection
   * reports itself unconfigured, rather than a scan failing.
   */
  INFERENCE_SERVICE_URL: z.string().url().optional(),
  /**
   * Shared secret sent as `X-API-Key`. Must equal `API_KEY` on the inference
   * host, which refuses to start without one.
   */
  INFERENCE_API_KEY: z.string().optional(),
  /** Default deadline for an inference call. */
  INFERENCE_TIMEOUT_MS: z
    .string()
    .default('45000')
    .transform((val) => parseInt(val, 10)),
  /**
   * Deadline for leaf detection. Tighter than the default because the live
   * viewfinder polls it: a frame the user has already moved past is worthless,
   * so giving up early beats waiting.
   */
  INFERENCE_DETECT_TIMEOUT_MS: z
    .string()
    .default('20000')
    .transform((val) => parseInt(val, 10)),
  /**
   * Deadline for classification. Generous: the farmer is already watching a
   * progress animation, and the first request after the host wakes pays for
   * weight residency.
   */
  INFERENCE_CLASSIFY_TIMEOUT_MS: z
    .string()
    .default('60000')
    .transform((val) => parseInt(val, 10)),
  /** Deadline for the health probes, which must not hang a dashboard. */
  INFERENCE_HEALTH_TIMEOUT_MS: z
    .string()
    .default('8000')
    .transform((val) => parseInt(val, 10)),

  // --- Leaf detector request parameters ------------------------------------
  //
  // The detector lives on the inference host; these are the knobs this backend
  // sends with each request. Where it lives is INFERENCE_SERVICE_URL.
  /** Detections below this score are discarded. Matches the detector default. */
  YOLO_MIN_CONFIDENCE: z
    .string()
    .default('0.35')
    .transform((val) => parseFloat(val))
    .refine((val) => !isNaN(val) && val >= 0 && val <= 1, {
      message: 'YOLO_MIN_CONFIDENCE must be between 0 and 1',
    }),
  /** Inference size passed to the detector. Larger is slower, not always better. */
  YOLO_IMAGE_SIZE: z
    .string()
    .default('640')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'YOLO_IMAGE_SIZE must be a positive integer',
    }),
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
