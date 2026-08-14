import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

const server = http.createServer(app);

// Start Server Bootstrap
const startServer = async () => {
  // Connect to database (gracefully handles local development or mock connection strings)
  try {
    await connectDatabase();
  } catch (err) {
    logger.warn('PostgreSQL database connection failed on startup. Server running in offline status mode.', err);
  }

  server.listen(env.PORT, () => {
    logger.info(`🚀 LeafCare Backend Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`🔗 API Health Endpoint: http://localhost:${env.PORT}/api/v1/health`);
  });
};

// Graceful Shutdown Handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    logger.info('HTTP server closed cleanly.');
    await disconnectDatabase();
    process.exit(0);
  });

  // Force shutdown after 10 seconds if connections hang
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Process Termination Signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Process Exception Monitors
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Promise Rejection:', reason);
  gracefulShutdown('unhandledRejection');
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

startServer();
