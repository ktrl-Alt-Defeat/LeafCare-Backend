import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/app-error.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

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
