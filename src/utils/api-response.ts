import { Response } from 'express';

export interface ApiResponseOptions<T> {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponseOptions {
  res: Response;
  statusCode?: number;
  message?: string;
  errors?: unknown;
  stack?: string;
}

/**
 * Sends a standardized success JSON response
 */
export const sendSuccess = <T>({
  res,
  statusCode = 200,
  message = 'Success',
  data,
  meta,
}: ApiResponseOptions<T>): Response => {
  const payload: Record<string, unknown> = {
    success: true,
    message,
    data: data !== undefined ? data : null,
    timestamp: new Date().toISOString(),
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

/**
 * Sends a standardized error JSON response
 */
export const sendError = ({
  res,
  statusCode = 500,
  message = 'Internal server error',
  errors,
  stack,
}: ApiErrorResponseOptions): Response => {
  const errorObj: Record<string, unknown> = {
    code: statusCode,
    message,
  };

  if (errors !== undefined) {
    errorObj.details = errors;
  }

  if (stack) {
    errorObj.stack = stack;
  }

  return res.status(statusCode).json({
    success: false,
    error: errorObj,
    timestamp: new Date().toISOString(),
  });
};
