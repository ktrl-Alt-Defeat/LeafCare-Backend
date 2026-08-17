/** The six languages the LeafCare apps ship translations for. */
export type VoiceLanguageCode = 'en' | 'ta' | 'hi' | 'te' | 'ml' | 'kn';

export const VOICE_LANGUAGES: readonly VoiceLanguageCode[] = [
  'en',
  'ta',
  'hi',
  'te',
  'ml',
  'kn',
] as const;

/**
 * Of the six app languages, the v2.5 model family covers only these three.
 * Verified against the live API: Telugu, Kannada and Malayalam come back as
 * `400 unsupported_language`.
 */
const V2_5_LANGUAGES: ReadonlySet<string> = new Set(['en', 'hi', 'ta']);

/**
 * Decides whether to pin pronunciation with `language_code` on this request.
 *
 * Two separate constraints, both learned the hard way from the live API:
 *  - only the v2.5 family accepts the parameter at all; the older multilingual
 *    models and v3 reject or ignore it,
 *  - and even there it must be a language that model actually speaks.
 *
 * Omitting it is always safe: the model then infers the language from the
 * script, which produces usable Telugu, Kannada and Malayalam audio. Sending it
 * when unsupported fails the whole request, so this errs toward omitting.
 */
export const shouldSendLanguageCode = (modelId: string, languageCode: string): boolean => {
  if (!modelId.includes('turbo_v2_5') && !modelId.includes('flash_v2_5')) return false;
  return V2_5_LANGUAGES.has(languageCode);
};

export interface SynthesizeSpeechInput {
  text: string;
  /** Pins pronunciation. Falls back to the model's own detection when omitted. */
  languageCode?: VoiceLanguageCode;
  /** Overrides the configured default voice, e.g. a per-language narrator. */
  voiceId?: string;
}

export interface SynthesizedSpeech {
  audio: Buffer;
  mimeType: string;
  voiceId: string;
  modelId: string;
  characters: number;
  latencyMs: number;
}

export interface TranscribeSpeechInput {
  audio: Buffer;
  filename: string;
  mimeType: string;
  /** Constrains recognition; omit to let Scribe detect the spoken language. */
  languageCode?: VoiceLanguageCode;
}

export interface TranscriptionResult {
  text: string;
  /** What Scribe heard, which may differ from the requested language. */
  languageCode: string | null;
  languageProbability: number | null;
  modelId: string;
  latencyMs: number;
}

export interface VoiceStatus {
  configured: boolean;
  ttsModel: string;
  sttModel: string;
  defaultVoiceId: string;
  supportedLanguages: readonly VoiceLanguageCode[];
  maxCharacters: number;
}

/** Shape of the ElevenLabs speech-to-text response we depend on. */
export interface ElevenLabsTranscriptionResponse {
  text?: string;
  language_code?: string;
  language_probability?: number;
}

/** ElevenLabs reports failures as `{ detail: { status, message } }`. */
export interface ElevenLabsErrorResponse {
  detail?: { status?: string; message?: string } | string;
}
