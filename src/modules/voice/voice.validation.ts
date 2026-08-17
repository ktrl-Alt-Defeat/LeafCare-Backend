import { z } from 'zod';
import { VOICE_LANGUAGES } from './voice.types.js';

const languageSchema = z.enum(
  VOICE_LANGUAGES as unknown as [string, ...string[]],
  { errorMap: () => ({ message: `languageCode must be one of: ${VOICE_LANGUAGES.join(', ')}` }) }
);

/**
 * POST /api/v1/voice/speech body.
 *
 * The upper bound is deliberately generous here and enforced for real in the
 * service against ELEVEN_LABS_MAX_CHARS, so the limit can be tuned per
 * deployment without a code change.
 */
export const synthesizeSpeechSchema = z.object({
  text: z
    .string({ required_error: 'text is required' })
    .trim()
    .min(1, 'text cannot be empty')
    .max(10000, 'text is far beyond any readable clip length'),
  languageCode: languageSchema.optional(),
  voiceId: z.string().trim().min(1).max(64).optional(),
});

/** Query/body fields accepted alongside the uploaded clip on /voice/transcribe. */
export const transcribeSpeechSchema = z.object({
  languageCode: languageSchema.optional(),
});

export type SynthesizeSpeechBody = z.infer<typeof synthesizeSpeechSchema>;
export type TranscribeSpeechBody = z.infer<typeof transcribeSpeechSchema>;
