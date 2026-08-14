/**
 * Shared Application Constants
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const APP_MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Invalid request data',
  INTERNAL_ERROR: 'Internal server error occurred',
  VALIDATION_ERROR: 'Request validation failed',
} as const;

export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  DEFAULT_SORT_ORDER: 'asc' as const,
  DEFAULT_LANGUAGE: 'en',
} as const;

export const SUPPORTED_LANGUAGES = ['en', 'ta', 'hi', 'te', 'ml', 'kn'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
