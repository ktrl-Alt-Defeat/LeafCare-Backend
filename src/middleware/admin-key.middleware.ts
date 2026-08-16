import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';

/**
 * Guards the write endpoints behind a shared secret.
 *
 * This is deliberately NOT authentication. There is no user identity here, no
 * sessions and no per-user permissions — it only proves the caller knows a
 * secret. It exists so the admin and seller dashboards can persist changes
 * without leaving the knowledge base and marketplace writable by anyone who
 * finds the URL.
 *
 * Replace this with real per-user auth before this handles anything beyond a
 * pilot. The header must only ever be attached server-side: if it reaches the
 * browser, the secret is public and this guard is worthless.
 */

const HEADER = 'x-leafcare-admin-key';

/** Compares in constant time so a wrong key cannot be found by timing it. */
const matches = (provided: string, expected: string): boolean => {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch, which would itself leak length.
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

export const requireAdminKey = (req: Request, _res: Response, next: NextFunction): void => {
  if (!env.LEAFCARE_ADMIN_KEY) {
    // Fail closed. An unset secret must never mean "allow everything".
    logger.error('A write endpoint was called but LEAFCARE_ADMIN_KEY is not configured.');
    next(new ForbiddenError('Write access is not configured on this server.'));
    return;
  }

  const provided = req.get(HEADER);

  if (!provided) {
    next(new UnauthorizedError('Missing admin key.'));
    return;
  }

  if (!matches(provided, env.LEAFCARE_ADMIN_KEY)) {
    logger.warn(`Rejected write attempt with an invalid admin key from ${req.ip}`);
    next(new ForbiddenError('Invalid admin key.'));
    return;
  }

  next();
};
