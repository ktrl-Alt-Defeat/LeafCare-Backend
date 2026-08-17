import { Request, Response, NextFunction } from 'express';
import { voiceService } from './voice.service.js';
import { synthesizeSpeechSchema, transcribeSpeechSchema } from './voice.validation.js';
import { sendSuccess } from '../../utils/api-response.js';
import { BadRequestError } from '../../utils/app-error.js';
import { VoiceLanguageCode } from './voice.types.js';

export class VoiceController {
  /**
   * GET /api/v1/voice/status
   *
   * Lets the frontend hide the speaker icons and the mic bubble when no key is
   * configured, instead of showing controls that fail on the first tap.
   */
  async getStatus(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = voiceService.getStatus();
      sendSuccess({
        res,
        message: status.configured
          ? 'Voice service is configured'
          : 'Voice service is not configured',
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/voice/speech
   *
   * Responds with raw `audio/mpeg` rather than the usual JSON envelope: the
   * caller pipes it straight into an audio element, and base64 in JSON would
   * inflate every clip by a third for no benefit.
   */
  async synthesize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = synthesizeSpeechSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError('Invalid speech request.', parsed.error.flatten().fieldErrors);
      }

      const speech = await voiceService.synthesizeSpeech({
        text: parsed.data.text,
        languageCode: parsed.data.languageCode as VoiceLanguageCode | undefined,
        voiceId: parsed.data.voiceId,
      });

      res.setHeader('Content-Type', speech.mimeType);
      res.setHeader('Content-Length', speech.audio.length);
      // Metadata the JSON envelope would normally carry, kept out of the body.
      res.setHeader('X-Voice-Model', speech.modelId);
      res.setHeader('X-Voice-Id', speech.voiceId);
      res.setHeader('X-Voice-Characters', String(speech.characters));
      // Identical text is read aloud repeatedly (a card re-rendered, a farmer
      // replaying advice), and synthesis is billed per character.
      res.setHeader('Cache-Control', 'private, max-age=3600');

      res.status(200).send(speech.audio);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/voice/transcribe
   *
   * Multipart upload under field `audio`; `languageCode` may accompany it as a
   * form field to constrain recognition to the language the app is set to.
   */
  async transcribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = transcribeSpeechSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        throw new BadRequestError(
          'Invalid transcription request.',
          parsed.error.flatten().fieldErrors
        );
      }

      // `uploadSingleAudio` guarantees this, but the assertion keeps the
      // controller honest if the middleware is ever reordered.
      const file = req.file;
      if (!file) {
        throw new BadRequestError('No recording was uploaded. Field "audio" is required.');
      }

      const result = await voiceService.transcribeSpeech({
        audio: file.buffer,
        filename: file.originalname || 'recording.webm',
        mimeType: file.mimetype,
        languageCode: parsed.data.languageCode as VoiceLanguageCode | undefined,
      });

      sendSuccess({
        res,
        message: result.text
          ? 'Speech transcribed successfully'
          : 'No speech was detected in the recording',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const voiceController = new VoiceController();
