import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/app-error.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

/**
 * Voice notes are short by design (the assistant listens for a single spoken
 * question), so a much smaller ceiling than images is plenty and keeps a stuck
 * recorder from streaming megabytes at the transcription API.
 */
const MAX_AUDIO_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB

/**
 * Browsers do not agree on a container: Chrome records `audio/webm`, Safari
 * `audio/mp4`, and Firefox `audio/ogg`. The prefix check accepts all of them
 * along with the codec suffix browsers append (`audio/webm;codecs=opus`),
 * while still rejecting non-audio uploads.
 */
const ALLOWED_AUDIO_PREFIXES = ['audio/', 'video/webm', 'video/mp4'];

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (!file) {
    return cb(new BadRequestError('No image file provided. Field "image" is required.'));
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())) {
    return cb(
      new BadRequestError(
        `Invalid file type "${file.mimetype}". Only image/jpeg, image/png, and image/webp are allowed.`
      )
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter,
}).single('image');

/**
 * Express middleware to validate and parse a single uploaded image under field "image".
 */
export const uploadSingleImage = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  upload(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new BadRequestError('Image file size exceeds the maximum limit of 10 MB.'));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(
            new BadRequestError(
              'Unexpected field or too many files uploaded. Upload a single file in the "image" field.'
            )
          );
        }
        return next(new BadRequestError(`Image upload error: ${err.message}`));
      }
      return next(err);
    }

    if (!req.file) {
      return next(new BadRequestError('Missing uploaded image file. Field "image" is required.'));
    }

    next();
  });
};

/* -------------------------------------------------------------------------- */
/* Audio                                                                      */
/* -------------------------------------------------------------------------- */

const audioFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (!file) {
    return cb(new BadRequestError('No audio file provided. Field "audio" is required.'));
  }

  const mimeType = file.mimetype.toLowerCase();
  const accepted = ALLOWED_AUDIO_PREFIXES.some((prefix) => mimeType.startsWith(prefix));

  if (!accepted) {
    return cb(
      new BadRequestError(
        `Invalid file type "${file.mimetype}". Upload a recorded audio clip (webm, mp4, ogg, mpeg or wav).`
      )
    );
  }

  cb(null, true);
};

const uploadAudio = multer({
  storage,
  limits: {
    fileSize: MAX_AUDIO_SIZE_BYTES,
    files: 1,
  },
  fileFilter: audioFileFilter,
}).single('audio');

/**
 * Express middleware to validate and parse a single recorded clip under field "audio".
 */
export const uploadSingleAudio = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  uploadAudio(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new BadRequestError('Audio clip exceeds the maximum size of 8 MB. Record a shorter question.')
          );
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(
            new BadRequestError(
              'Unexpected field or too many files uploaded. Upload a single clip in the "audio" field.'
            )
          );
        }
        return next(new BadRequestError(`Audio upload error: ${err.message}`));
      }
      return next(err);
    }

    if (!req.file) {
      return next(new BadRequestError('Missing uploaded audio file. Field "audio" is required.'));
    }

    next();
  });
};
