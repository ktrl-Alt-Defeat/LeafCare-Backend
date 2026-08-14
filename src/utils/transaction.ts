import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { logger } from './logger.js';
import { InternalServerError } from './app-error.js';

export interface TransactionOptions {
  maxWait?: number; // Time Prisma waits to acquire a connection (default 5000ms)
  timeout?: number; // Time transaction is allowed to run (default 10000ms)
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

/**
 * Executes a callback function inside an interactive Prisma database transaction.
 * Automatically rolls back changes if an exception is thrown.
 */
export const runInTransaction = async <T>(
  action: (tx: Prisma.TransactionClient) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> => {
  const { maxWait = 5000, timeout = 10000, isolationLevel } = options;

  try {
    return await prisma.$transaction(
      async (tx) => {
        return await action(tx);
      },
      {
        maxWait,
        timeout,
        ...(isolationLevel && { isolationLevel }),
      }
    );
  } catch (error) {
    logger.error('❌ Database Transaction Failed & Rolled Back:', error);

    // Rethrow known operational errors, or wrap unknown errors
    if (error instanceof Error) {
      throw error;
    }
    throw new InternalServerError('Database transaction execution failed');
  }
};
