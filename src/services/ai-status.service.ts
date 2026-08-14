import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Read-only observability for the external disease-prediction service.
 *
 * This module deliberately does NOT perform inference, proxy predictions, or
 * stand in for the AI service in any way. It asks that service how it is doing
 * and passes the answer through. The inference API itself is owned by a separate
 * deployment and is integrated later by setting AI_SERVICE_URL.
 *
 * Every model detail below (name, version, device, load time) is reported *by
 * the AI service*. When no service is configured these fields are absent — they
 * are never fabricated, because a made-up model version in a health dashboard is
 * worse than no answer at all.
 */
export interface AiServiceStatus {
  status: 'up' | 'down' | 'not_configured';
  configured: boolean;
  endpoint?: string;
  latencyMs?: number;
  detail?: string;
  /** Verbatim payload from the AI service's own health endpoint. */
  model?: {
    name?: string;
    version?: string;
    device?: string;
    gpuAvailable?: boolean;
    loadedAt?: string;
  };
}

/** Shape we hope the inference service returns; all fields optional. */
interface AiHealthPayload {
  model_name?: string;
  model_version?: string;
  device?: string;
  gpu_available?: boolean;
  loaded_at?: string;
}

export const checkAiService = async (): Promise<AiServiceStatus> => {
  if (!env.AI_SERVICE_URL) {
    return {
      status: 'not_configured',
      configured: false,
      detail:
        'AI_SERVICE_URL is unset. The inference service is deployed separately; ' +
        'set the variable to enable prediction and its health reporting.',
    };
  }

  const endpoint = `${env.AI_SERVICE_URL.replace(/\/$/, '')}/health`;
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.AI_SERVICE_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      return {
        status: 'down',
        configured: true,
        endpoint,
        latencyMs,
        detail: `AI service responded with HTTP ${response.status}`,
      };
    }

    let payload: AiHealthPayload = {};
    try {
      payload = (await response.json()) as AiHealthPayload;
    } catch {
      // Reachable but not speaking JSON — still up, just less informative.
      return {
        status: 'up',
        configured: true,
        endpoint,
        latencyMs,
        detail: 'AI service is reachable but returned a non-JSON health payload',
      };
    }

    return {
      status: 'up',
      configured: true,
      endpoint,
      latencyMs,
      model: {
        name: payload.model_name,
        version: payload.model_version,
        device: payload.device,
        gpuAvailable: payload.gpu_available,
        loadedAt: payload.loaded_at,
      },
    };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const aborted = error instanceof Error && error.name === 'AbortError';
    logger.warn(`AI service health probe failed: ${aborted ? 'timeout' : String(error)}`);

    return {
      status: 'down',
      configured: true,
      endpoint,
      latencyMs,
      detail: aborted
        ? `No response within ${env.AI_SERVICE_TIMEOUT_MS}ms`
        : error instanceof Error
        ? error.message
        : 'Unknown error contacting AI service',
    };
  } finally {
    clearTimeout(timeout);
  }
};
