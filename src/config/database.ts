import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// Extend NodeJS global interface to store singleton client in development
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Creates and configures a PrismaClient instance
 */
const createPrismaClient = (): PrismaClient => {
  const client = new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'info' },
            { emit: 'event', level: 'warn' },
          ]
        : [
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ],
  });

  // Wire Prisma query events to Winston logger in development
  if (env.NODE_ENV === 'development') {
    client.$on('query', (e) => {
      logger.debug(`[Prisma Query] ${e.query} (${e.duration}ms)`);
    });
  }

  client.$on('error', (e) => {
    logger.error(`[Prisma Error] ${e.message}`);
  });

  client.$on('warn', (e) => {
    logger.warn(`[Prisma Warning] ${e.message}`);
  });

  return client;
};

// Use global singleton instance in development to survive hot-reloading
export const prisma: PrismaClient = globalThis.prismaGlobal ?? createPrismaClient();

if (env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

/**
 * Connect to PostgreSQL database
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('🐘 Connected to PostgreSQL database via Prisma ORM');
  } catch (error) {
    logger.error('❌ Failed to connect to PostgreSQL database:', error);
    // Rethrow so the caller can decide what to do. Swallowing this made the
    // "start in offline mode" branch in server.ts unreachable.
    throw error;
  }
};

/**
 * Disconnect from PostgreSQL database cleanly
 */
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    logger.info('🔌 Disconnected from PostgreSQL database cleanly');
  } catch (error) {
    logger.error('❌ Error during database disconnect:', error);
  }
};
