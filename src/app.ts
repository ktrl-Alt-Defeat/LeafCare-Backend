import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { httpLogger } from './middleware/logger.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { generalLimiter, skipHealthChecks } from './middleware/rate-limit.middleware.js';
import apiRouter from './routes/index.js';
import { ForbiddenError } from './utils/app-error.js';

// Initialize Express Application
const app: Application = express();

// 0. Proxy awareness. Rate limiting keys on client IP, so behind a load
// balancer this must be set or every request shares one bucket.
app.set('trust proxy', env.TRUST_PROXY);

// 1. Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin, curl and server-to-server requests send no Origin header.
      if (!origin) return callback(null, true);
      if (env.CORS_ORIGIN.includes('*') || env.CORS_ORIGIN.includes(origin)) {
        return callback(null, true);
      }
      // ForbiddenError, not a bare Error: a blocked origin is a 403, and a bare
      // Error would surface as a 500 and read as a server fault.
      return callback(new ForbiddenError(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 2. Body Parsing & Compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// 3. HTTP Request Logging
app.use(httpLogger);

// 4. Swagger OpenAPI UI (/docs)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 5. API Routes (/api/v1)
// The general limiter guards every endpoint except the health and readiness
// probes, which an orchestrator polls continuously.
app.use(
  '/api/v1',
  (req, res, next) => (skipHealthChecks(req) ? next() : generalLimiter(req, res, next)),
  apiRouter
);

// 6. Root Status Route
app.get('/', (req, res) => {
  // Built from the request rather than hardcoded: behind a proxy the public
  // host and scheme are not the ones this process is listening on, and a
  // localhost URL here is useless to anyone calling the deployed API.
  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const scheme = forwardedProto ?? req.protocol;
  const host = req.get('host');

  res.json({
    message: 'LeafCare Multilingual Agricultural Advisory API',
    status: 'online',
    version: env.APP_VERSION,
    documentation: host ? `${scheme}://${host}/docs` : '/docs',
    timestamp: new Date().toISOString(),
  });
});

// 7. 404 Catch-all Handler
app.use(notFoundHandler);

// 8. Global Error Handling Middleware
app.use(errorHandler);

export default app;
