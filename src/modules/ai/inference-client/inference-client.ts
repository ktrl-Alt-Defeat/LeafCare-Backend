import { env } from '../../../config/env.js';
import { logger } from '../../../utils/logger.js';

/**
 * Transport to the inference host.
 *
 * Both vision models live in one FastAPI process on a workstation, reached from
 * this backend over a tunnel. That shapes everything here:
 *
 *  - The link is a public WAN hop, not localhost, so every request carries the
 *    shared secret and every call has a deadline.
 *  - The far end may be a laptop that someone closed. A transport fault is a
 *    normal operating condition, not an exception: callers get a typed failure
 *    and decide whether the scan can continue without that model.
 *  - Uploads are billed in seconds on a home uplink, so the caller is given the
 *    means to avoid sending the same pixels twice (see the ROI handle on the
 *    detect response).
 */

/** A call that reached the service and came back with a body. */
export interface InferenceSuccess<T> {
  ok: true;
  data: T;
  latencyMs: number;
}

/** A call that did not produce a usable answer, and why. */
export interface InferenceFailure {
  ok: false;
  /** `not_configured` when no URL is set, `timeout`, `http`, or `network`. */
  kind: 'not_configured' | 'timeout' | 'http' | 'network';
  status?: number;
  message: string;
  latencyMs: number;
}

export type InferenceResult<T> = InferenceSuccess<T> | InferenceFailure;

/** Error body the inference service returns for every non-2xx response. */
interface InferenceErrorBody {
  request_id?: string;
  error?: string;
  detail?: string;
  status_code?: number;
}

export class InferenceClient {
  /** Whether an inference host is configured at all. */
  public get configured(): boolean {
    return Boolean(env.INFERENCE_SERVICE_URL);
  }

  /** Absolute URL for a path on the inference host. */
  public url(path: string): string {
    const base = (env.INFERENCE_SERVICE_URL ?? '').replace(/\/$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private headers(requestId?: string): Record<string, string> {
    const headers: Record<string, string> = { Accept: 'application/json' };

    if (env.INFERENCE_API_KEY) headers['X-API-Key'] = env.INFERENCE_API_KEY;
    // Lets one scan be followed from this log into the inference host's log.
    if (requestId) headers['X-Request-ID'] = requestId;

    return headers;
  }

  /**
   * POST a multipart body and decode the JSON answer.
   *
   * Never throws for anything the network can do to it. The orchestrator treats
   * a missing model as a degraded scan rather than a failed one, and that is
   * only possible if the transport hands back a value instead of an exception.
   */
  public async postForm<T>(
    path: string,
    form: FormData,
    options: { timeoutMs?: number; requestId?: string; label?: string } = {}
  ): Promise<InferenceResult<T>> {
    const label = options.label ?? path;

    if (!this.configured) {
      return {
        ok: false,
        kind: 'not_configured',
        message:
          'INFERENCE_SERVICE_URL is unset. The vision models are hosted separately; ' +
          'set it to the tunnel URL of the inference host.',
        latencyMs: 0,
      };
    }

    const timeoutMs = options.timeoutMs ?? env.INFERENCE_TIMEOUT_MS;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      const response = await fetch(this.url(path), {
        method: 'POST',
        body: form,
        headers: this.headers(options.requestId),
        signal: controller.signal,
      });

      const latencyMs = Date.now() - startedAt;

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as InferenceErrorBody;
        const message =
          body.detail ?? `Inference host answered HTTP ${response.status} for ${label}.`;

        // 401 is a misconfiguration, not a blip: say so plainly rather than
        // letting it read as another flaky-tunnel warning.
        if (response.status === 401) {
          logger.error(
            `Inference host rejected the API key on ${label}. ` +
              `INFERENCE_API_KEY must match the API_KEY on the inference host.`
          );
        } else {
          logger.warn(`Inference host returned HTTP ${response.status} on ${label} in ${latencyMs}ms`);
        }

        return { ok: false, kind: 'http', status: response.status, message, latencyMs };
      }

      return { ok: true, data: (await response.json()) as T, latencyMs };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const aborted = error instanceof Error && error.name === 'AbortError';

      logger.warn(
        `Inference host call ${label} failed after ${latencyMs}ms: ` +
          `${aborted ? 'timeout' : error instanceof Error ? error.message : String(error)}`
      );

      return aborted
        ? {
            ok: false,
            kind: 'timeout',
            message: `Inference host did not answer ${label} within ${timeoutMs}ms.`,
            latencyMs,
          }
        : {
            ok: false,
            kind: 'network',
            message:
              'Inference host is unreachable. It runs on a workstation, so check that the ' +
              'machine is awake and the tunnel is up.',
            latencyMs,
          };
    } finally {
      clearTimeout(timeout);
    }
  }

  /** GET a JSON document from the inference host, for the health probes. */
  public async getJson<T>(
    path: string,
    options: { timeoutMs?: number } = {}
  ): Promise<InferenceResult<T>> {
    if (!this.configured) {
      return {
        ok: false,
        kind: 'not_configured',
        message: 'INFERENCE_SERVICE_URL is unset.',
        latencyMs: 0,
      };
    }

    const timeoutMs = options.timeoutMs ?? env.INFERENCE_HEALTH_TIMEOUT_MS;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      const response = await fetch(this.url(path), {
        headers: this.headers(),
        signal: controller.signal,
      });
      const latencyMs = Date.now() - startedAt;

      if (!response.ok) {
        return {
          ok: false,
          kind: 'http',
          status: response.status,
          message: `Inference host answered HTTP ${response.status} for ${path}.`,
          latencyMs,
        };
      }

      return { ok: true, data: (await response.json()) as T, latencyMs };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const aborted = error instanceof Error && error.name === 'AbortError';

      return {
        ok: false,
        kind: aborted ? 'timeout' : 'network',
        message: aborted
          ? `No response within ${timeoutMs}ms.`
          : error instanceof Error
          ? error.message
          : 'Unknown error contacting the inference host.',
        latencyMs,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Wraps a buffer as a multipart file part. */
  public static filePart(buffer: Buffer, mimeType: string): Blob {
    return new Blob([new Uint8Array(buffer)], { type: mimeType });
  }
}

export const inferenceClient = new InferenceClient();
