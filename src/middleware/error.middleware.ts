import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/app-error.js';
import { sendError } from '../utils/api-response.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/** Prisma error codes worth translating into meaningful HTTP responses. */
const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
  P2000: { status: 400, message: 'Value too long for the target column' },
  P2002: { status: 409, message: 'A record with these values already exists' },
  P2003: { status: 400, message: 'Related record does not exist' },
  P2011: { status: 400, message: 'A required field was null' },
  P2025: { status: 404, message: 'Record not found' },
};

/**
 * Global Express Error Handling Middleware
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.errors;
  } else if (err.name === 'SyntaxError') {
    statusCode = 400;
    message = 'Invalid JSON payload received';
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Without this, a duplicate key or a missing row surfaces as a 500 and the
    // client cannot tell a genuine server fault from its own bad request.
    const mapped = PRISMA_ERROR_MAP[err.code];
    statusCode = mapped?.status ?? 500;
    message = mapped?.message ?? 'Database request failed';
    details = { code: err.code, target: err.meta?.target };
    if (statusCode === 500) {
      logger.error(`[Prisma ${err.code}] ${err.message}`);
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid database query parameters';
  } else {
    logger.error(`[Unhandled Exception] ${err.message}`, { stack: err.stack });
  }

  const stack = env.NODE_ENV === 'development' ? err.stack : undefined;

  return sendError({
    res,
    statusCode,
    message,
    errors: details,
    stack,
  });
};

/**
 * 404 Route Not Found Middleware
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404);
  next(error);
};
