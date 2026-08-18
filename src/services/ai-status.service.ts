import { inferenceClient } from '../modules/ai/inference-client/inference-client.js';
import {
  InferenceHealthPayload,
  InferenceModelPayload,
  InferenceReadinessPayload,
} from '../modules/ai/inference-client/inference-client.types.js';
import { logger } from '../utils/logger.js';

/**
 * Read-only observability for the inference host.
 *
 * This module deliberately does NOT perform inference, proxy predictions, or
 * stand in for the models in any way. It asks the host how it is doing and
 * passes the answer through.
 *
 * Every model detail below is reported *by that host*. When none is configured
 * the fields are absent — they are never fabricated, because a made-up model
 * version in a health dashboard is worse than no answer at all.
 *
 * The host is a workstation reached over a tunnel, so `down` is a routine
 * reading here — the machine may simply be asleep — and the detail line says
 * which of "unreachable", "reachable but still loading" and "rejected the key"
 * it actually is, because the three need different fixes.
 */
export interface AiServiceStatus {
  status: 'up' | 'down' | 'not_configured';
  configured: boolean;
  endpoint?: string;
  latencyMs?: number;
  detail?: string;
  /** Verbatim from the host's own health and readiness endpoints. */
  model?: {
    name?: string;
    version?: string;
    device?: string;
    gpuAvailable?: boolean;
    loadedAt?: string;
    /** Per-model residency, so a half-loaded host is legible. */
    models?: {
      name?: string;
      task?: string;
      status?: string;
      parametersMillion?: number;
      classes?: number;
    }[];
  };
}

const summarize = (model: InferenceModelPayload) => ({
  name: model.name,
  task: model.task,
  status: model.status,
  ...(model.parameters
    ? { parametersMillion: Number((model.parameters / 1e6).toFixed(2)) }
    : {}),
  ...(model.classes ? { classes: model.classes.length } : {}),
});

export const checkAiService = async (): Promise<AiServiceStatus> => {
  if (!inferenceClient.configured) {
    return {
      status: 'not_configured',
      configured: false,
      detail:
        'INFERENCE_SERVICE_URL is unset. The vision models are hosted separately; ' +
        'set it to the inference host URL to enable prediction and its health reporting.',
    };
  }

  const endpoint = inferenceClient.url('/health');

  const health = await inferenceClient.getJson<InferenceHealthPayload>('/health');

  if (!health.ok) {
    logger.warn(`Inference host health probe failed: ${health.message}`);
    return {
      status: 'down',
      configured: true,
      endpoint,
      latencyMs: health.latencyMs,
      detail: health.message,
    };
  }

  // `/health` answers as soon as the process is up, by design, so it alone does
  // not mean a prediction can be served. `/ready` is the endpoint that knows.
  const readiness = await inferenceClient.getJson<InferenceReadinessPayload>('/ready');
  const models = readiness.ok ? readiness.data.models ?? [] : [];
  const ready = Boolean(health.data.models_ready) && (readiness.ok ? readiness.data.ready : false);

  const notReady = models.filter((model) => model.status !== 'ready');

  return {
    status: ready ? 'up' : 'down',
    configured: true,
    endpoint,
    latencyMs: health.latencyMs,
    ...(ready
      ? {}
      : {
          detail:
            notReady.length > 0
              ? `Host is up but ${notReady
                  .map((model) => `${model.name ?? 'a model'} is "${model.status}"`)
                  .join(', ')}.`
              : 'Host is up but reports that its models are not ready.',
        }),
    model: {
      name: health.data.service,
      version: health.data.version,
      device: health.data.device,
      gpuAvailable: health.data.cuda_available,
      models: models.map(summarize),
    },
  };
};
