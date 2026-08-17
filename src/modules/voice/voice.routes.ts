import { Router } from 'express';
import { voiceController } from './voice.controller.js';
import { uploadSingleAudio } from '../../middleware/upload.middleware.js';
import { aiLimiter } from '../../middleware/rate-limit.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/v1/voice/status:
 *   get:
 *     summary: Report whether voice features are configured
 *     description: >
 *       Returns the active ElevenLabs models, the default voice, and the
 *       character ceiling for one synthesis request. `configured` is false when
 *       ELEVEN_LABS_API_KEY is unset, which the clients use to hide the
 *       read-aloud and microphone controls.
 *     tags:
 *       - Voice
 *     responses:
 *       200:
 *         description: Voice service status
 */
router.get('/status', (req, res, next) => voiceController.getStatus(req, res, next));

/**
 * @openapi
 * /api/v1/voice/speech:
 *   post:
 *     summary: Read a block of text aloud (text-to-speech)
 *     description: >
 *       Synthesizes the supplied text with ElevenLabs and returns raw MP3 audio,
 *       not the standard JSON envelope. Errors are still JSON.
 *     tags:
 *       - Voice
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text to read aloud, within the configured character limit
 *                 example: Remove and destroy infected leaves as soon as you spot them.
 *               languageCode:
 *                 type: string
 *                 enum: [en, ta, hi, te, ml, kn]
 *                 description: Pins pronunciation; omit to let the model detect it
 *               voiceId:
 *                 type: string
 *                 description: Overrides the server's default ElevenLabs voice
 *     responses:
 *       200:
 *         description: MP3 audio of the spoken text
 *         content:
 *           audio/mpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Missing, empty or over-length text
 *       429:
 *         description: Rate limit or provider quota exceeded
 *       502:
 *         description: The voice provider failed or rejected the key
 *       503:
 *         description: ELEVEN_LABS_API_KEY is not configured
 *       504:
 *         description: The voice provider did not respond in time
 */
router.post('/speech', aiLimiter, (req, res, next) => voiceController.synthesize(req, res, next));

/**
 * @openapi
 * /api/v1/voice/transcribe:
 *   post:
 *     summary: Turn a spoken question into text (speech-to-text)
 *     description: >
 *       Transcribes a recorded clip with ElevenLabs Scribe. Browsers record in
 *       different containers, so webm, mp4, ogg, mpeg and wav are all accepted.
 *     tags:
 *       - Voice
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Recorded clip, up to 8 MB
 *               languageCode:
 *                 type: string
 *                 enum: [en, ta, hi, te, ml, kn]
 *                 description: Constrains recognition; omit for auto-detection
 *     responses:
 *       200:
 *         description: Transcription result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                       example: What should I spray for tomato leaf spot?
 *                     languageCode:
 *                       type: string
 *                       nullable: true
 *                       example: en
 *                     languageProbability:
 *                       type: number
 *                       nullable: true
 *                       example: 0.98
 *       400:
 *         description: Missing, oversized or unreadable recording
 *       429:
 *         description: Rate limit or provider quota exceeded
 *       502:
 *         description: The voice provider failed or rejected the key
 *       503:
 *         description: ELEVEN_LABS_API_KEY is not configured
 *       504:
 *         description: The voice provider did not respond in time
 */
router.post('/transcribe', aiLimiter, uploadSingleAudio, (req, res, next) =>
  voiceController.transcribe(req, res, next)
);

export default router;
