import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { AppError, BadRequestError } from '../../utils/app-error.js';
import {
  ElevenLabsErrorResponse,
  ElevenLabsTranscriptionResponse,
  SynthesizeSpeechInput,
  SynthesizedSpeech,
  TranscribeSpeechInput,
  TranscriptionResult,
  VOICE_LANGUAGES,
  VoiceStatus,
  shouldSendLanguageCode,
} from './voice.types.js';

/**
 * ElevenLabs voice integration: reads LeafCare content aloud (text-to-speech)
 * and turns a farmer's spoken question into text (speech-to-text).
 *
 * Both directions matter for the same reason: a farmer who cannot read the
 * advice comfortably still needs it, and typing a crop question on a phone in
 * Tamil or Kannada is far slower than saying it.
 */
export class VoiceService {
  /** MP3 at 44.1 kHz / 128 kbps — plays natively in every target browser. */
  private static readonly OUTPUT_FORMAT = 'mp3_44100_128';
  private static readonly OUTPUT_MIME = 'audio/mpeg';

  private get apiKey(): string | undefined {
    return env.ELEVEN_LABS_API_KEY;
  }

  /** True once a key is present; the controllers use it to fail fast with 503. */
  public isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  public getStatus(): VoiceStatus {
    return {
      configured: this.isConfigured(),
      ttsModel: env.ELEVEN_LABS_TTS_MODEL,
      sttModel: env.ELEVEN_LABS_STT_MODEL,
      defaultVoiceId: env.ELEVEN_LABS_VOICE_ID,
      supportedLanguages: VOICE_LANGUAGES,
      maxCharacters: env.ELEVEN_LABS_MAX_CHARS,
    };
  }

  /**
   * Renders text as speech and returns the raw MP3 bytes.
   *
   * Buffered rather than streamed on purpose: clips here are a paragraph or a
   * card, and the caller re-plays them from an `<audio>` element, so a complete
   * body is simpler and lets a failed call surface as a JSON error instead of a
   * half-written audio response.
   */
  public async synthesizeSpeech({
    text,
    languageCode,
    voiceId,
  }: SynthesizeSpeechInput): Promise<SynthesizedSpeech> {
    this.assertConfigured();

    const cleaned = text.trim();
    if (!cleaned) {
      throw new BadRequestError('Text to read aloud cannot be empty.');
    }
    if (cleaned.length > env.ELEVEN_LABS_MAX_CHARS) {
      throw new BadRequestError(
        `Text is ${cleaned.length} characters, above the ${env.ELEVEN_LABS_MAX_CHARS} character limit for one request.`
      );
    }

    const resolvedVoiceId = voiceId?.trim() || env.ELEVEN_LABS_VOICE_ID;
    const modelId = env.ELEVEN_LABS_TTS_MODEL;

    const url = new URL(
      `${this.baseUrl}/text-to-speech/${encodeURIComponent(resolvedVoiceId)}`
    );
    url.searchParams.set('output_format', VoiceService.OUTPUT_FORMAT);

    const pinLanguage = Boolean(languageCode && shouldSendLanguageCode(modelId, languageCode));

    const startedAt = Date.now();
    logger.info(
      `ElevenLabs TTS started (${cleaned.length} chars, model=${modelId}, lang=${
        pinLanguage ? languageCode : 'auto'
      })`
    );

    const headers = {
      'xi-api-key': this.apiKey as string,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    };

    const send = (withLanguage: boolean): Promise<Response> => {
      const body: Record<string, unknown> = { text: cleaned, model_id: modelId };
      if (withLanguage) body.language_code = languageCode;
      return this.request(url.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    };

    let response = await send(pinLanguage);

    // ELEVEN_LABS_TTS_MODEL is configurable, so the static coverage table above
    // can go stale the moment someone switches models. Rather than fail, drop
    // the pin and let the model infer the language from the script — the audio
    // is still correct, only the pronunciation hint is lost.
    if (pinLanguage && response.status === 400 && (await this.isUnsupportedLanguage(response))) {
      logger.warn(
        `Model ${modelId} rejected language_code "${languageCode}"; retrying with auto-detection`
      );
      response = await send(false);
    }

    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      await this.throwUpstreamError(response, 'Text-to-speech', latencyMs);
    }

    const audio = Buffer.from(await response.arrayBuffer());

    // A 200 with an empty body would otherwise reach the browser as a silent
    // clip that looks like a broken speaker button rather than a failure.
    if (audio.length === 0) {
      logger.error(`ElevenLabs TTS returned an empty audio body in ${latencyMs}ms`);
      throw new AppError('The voice service returned no audio. Try again.', 502);
    }

    logger.info(
      `ElevenLabs TTS completed: ${audio.length} bytes for ${cleaned.length} chars in ${latencyMs}ms`
    );

    return {
      audio,
      mimeType: VoiceService.OUTPUT_MIME,
      voiceId: resolvedVoiceId,
      modelId,
      characters: cleaned.length,
      latencyMs,
    };
  }

  /**
   * Transcribes a recorded clip with ElevenLabs Scribe.
   *
   * `languageCode` is passed through when the caller knows which language the
   * app is set to — detection is good but not free of mistakes, and an Indic
   * language misread as another one produces text nothing downstream can match.
   */
  public async transcribeSpeech({
    audio,
    filename,
    mimeType,
    languageCode,
  }: TranscribeSpeechInput): Promise<TranscriptionResult> {
    this.assertConfigured();

    if (audio.length === 0) {
      throw new BadRequestError('The recording was empty. Hold the mic button while speaking.');
    }

    const modelId = env.ELEVEN_LABS_STT_MODEL;

    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(audio)], { type: mimeType }), filename);
    formData.append('model_id', modelId);
    if (languageCode) {
      formData.append('language_code', languageCode);
    }

    const startedAt = Date.now();
    logger.info(
      `ElevenLabs STT started (${audio.length} bytes, model=${modelId}, lang=${languageCode ?? 'auto'})`
    );

    const response = await this.request(`${this.baseUrl}/speech-to-text`, {
      method: 'POST',
      headers: { 'xi-api-key': this.apiKey as string },
      body: formData,
    });

    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      await this.throwUpstreamError(response, 'Speech-to-text', latencyMs);
    }

    let payload: ElevenLabsTranscriptionResponse;
    try {
      payload = (await response.json()) as ElevenLabsTranscriptionResponse;
    } catch {
      logger.error(`ElevenLabs STT returned an unreadable body in ${latencyMs}ms`);
      throw new AppError('The transcription service returned an unusable response.', 502);
    }

    const text = (payload.text ?? '').trim();

    logger.info(
      `ElevenLabs STT completed in ${latencyMs}ms: detected=${payload.language_code ?? 'unknown'}, ${text.length} chars`
    );

    return {
      text,
      languageCode: payload.language_code ?? null,
      languageProbability: payload.language_probability ?? null,
      modelId,
      latencyMs,
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Internals                                                              */
  /* ---------------------------------------------------------------------- */

  private get baseUrl(): string {
    return env.ELEVEN_LABS_API_URL.replace(/\/+$/, '');
  }

  private assertConfigured(): void {
    if (!this.isConfigured()) {
      // 503, not 500: the service is fine, this one capability is switched off,
      // and the caller can hide the voice controls rather than retrying.
      throw new AppError(
        'Voice features are not configured. Set ELEVEN_LABS_API_KEY on the server.',
        503
      );
    }
  }

  /** Wraps fetch with the shared timeout and a single error vocabulary. */
  private async request(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.ELEVEN_LABS_TIMEOUT_MS);

    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn(`ElevenLabs request timed out after ${env.ELEVEN_LABS_TIMEOUT_MS}ms`);
        throw new AppError(
          `The voice service did not respond within ${env.ELEVEN_LABS_TIMEOUT_MS}ms.`,
          504
        );
      }

      logger.error(
        `ElevenLabs network error: ${error instanceof Error ? error.message : String(error)}`
      );
      throw new AppError('Failed to reach the voice service.', 502);
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Always throws. Maps an upstream failure onto a status the client can act on
   * and, importantly, never leaks the API key or the raw provider payload.
   */
  private async throwUpstreamError(
    response: Response,
    operation: string,
    latencyMs: number
  ): Promise<never> {
    const detail = await this.readErrorDetail(response);
    logger.warn(
      `ElevenLabs ${operation} failed with HTTP ${response.status} in ${latencyMs}ms: ${detail ?? 'no detail'}`
    );

    if (response.status === 401 || response.status === 403) {
      throw new AppError('The voice service rejected the API key.', 502);
    }
    if (response.status === 402) {
      // The free tier refuses premade "library" voices, which is the single
      // most likely first-run failure. A bare "HTTP 402" sends whoever is
      // debugging to the wrong place, so name the setting to change.
      throw new AppError(
        detail
          ? `Voice service plan limit: ${detail} Set ELEVEN_LABS_VOICE_ID to a voice your plan allows.`
          : 'The voice service plan does not allow this request. Check ELEVEN_LABS_VOICE_ID.',
        502
      );
    }
    if (response.status === 422) {
      // Scribe and TTS both use 422 for "your input is wrong" — an unsupported
      // language or an unreadable clip — which is the caller's problem, not a
      // provider outage, so it must not be reported as a 502.
      throw new BadRequestError(
        detail ?? `The voice service could not process this ${operation.toLowerCase()} request.`
      );
    }
    if (response.status === 429) {
      throw new AppError('Voice service quota exceeded. Try again shortly.', 429);
    }

    throw new AppError(`${operation} is unavailable right now (HTTP ${response.status}).`, 502);
  }

  /**
   * True when the provider rejected the request solely because the model does
   * not speak the requested language. Reads a clone so the caller can still
   * consume the original body if this turns out not to be the cause.
   */
  private async isUnsupportedLanguage(response: Response): Promise<boolean> {
    try {
      const payload = (await response.clone().json()) as ElevenLabsErrorResponse;
      return typeof payload.detail === 'object' && payload.detail?.status === 'unsupported_language';
    } catch {
      return false;
    }
  }

  /** Best-effort extraction of the provider's own message, for the log. */
  private async readErrorDetail(response: Response): Promise<string | null> {
    try {
      const payload = (await response.clone().json()) as ElevenLabsErrorResponse;
      if (typeof payload.detail === 'string') return payload.detail;
      return payload.detail?.message ?? null;
    } catch {
      return null;
    }
  }
}

export const voiceService = new VoiceService();
