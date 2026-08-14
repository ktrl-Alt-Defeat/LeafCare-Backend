import morgan, { StreamOptions } from 'morgan';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Stream Morgan HTTP logs into Winston 'http' level
const stream: StreamOptions = {
  write: (message: string) => logger.http(message.trim()),
};

// Skip HTTP logging during automated tests
const skip = () => {
  return env.NODE_ENV === 'test';
};

// Production vs Development Morgan format
const morganFormat = env.NODE_ENV === 'production'
  ? ':remote-addr - :method :url :status :res[content-length] - :response-time ms'
  : ':method :url :status :res[content-length] - :response-time ms';

export const httpLogger = morgan(morganFormat, { stream, skip });
