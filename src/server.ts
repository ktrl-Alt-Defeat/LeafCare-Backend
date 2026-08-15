import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

const server = http.createServer(app);

/**
 * Bind on every interface. Inside a container, binding to localhost makes the
 * service unreachable from outside it — a failure that only shows up once
 * deployed.
 */
const HOST = '0.0.0.0';

/** Long enough for in-flight requests to drain, short enough for a rolling deploy. */
const SHUTDOWN_GRACE_MS = 10_000;

const startServer = async () => {
  try {
    await connectDatabase();
  } catch (err) {
    // In production a missing database means the deployment is broken, so fail
    // immediately and let the platform retry or roll back. Staying up while
    // able only to return errors looks healthy to anything not reading /health.
    // Locally the server still starts so the status endpoints stay inspectable.
    if (env.NODE_ENV === 'production') {
      logger.error('Database connection failed on startup. Refusing to start in production.', err);
      process.exit(1);
    }

    logger.warn(
      'PostgreSQL database connection failed on startup. Server running in offline status mode.',
      err
    );
  }

  server.listen(env.PORT, HOST, () => {
    logger.info(`🚀 LeafCare Backend Server running on ${HOST}:${env.PORT} [${env.NODE_ENV}]`);
    logger.info('🔗 Health endpoint: /api/v1/health');
  });
};

/** Guards against a second signal starting a second teardown. */
let shuttingDown = false;

/**
 * @param exitCode 0 for an intentional stop, non-zero for a fault — so the
 *   orchestrator sees a crash rather than a clean exit and restarts the service.
 */
const gracefulShutdown = async (signal: string, exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  const forceTimer = setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(exitCode || 1);
  }, SHUTDOWN_GRACE_MS);
  // Must not hold the event loop open once the clean path has finished.
  forceTimer.unref();

  server.close(async () => {
    logger.info('HTTP server closed cleanly.');
    try {
      await disconnectDatabase();
    } catch (err) {
      logger.error('Error while disconnecting the database:', err);
    }
    clearTimeout(forceTimer);
    process.exit(exitCode);
  });
};

// Termination signals are an intentional stop, so exit 0.
process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Promise Rejection:', reason);
  // Exit 1: this is a fault. Exiting 0 would report a crash as a normal
  // shutdown, and the platform may then not restart the service.
  void gracefulShutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (error: Error) => {
  // Process state is unreliable after this, so skip the graceful path entirely.
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

startServer();
