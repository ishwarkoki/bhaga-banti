import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import { logger, toLogError } from './config/logger.js';
import { generalRateLimiter } from './middleware/rate-limit.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { requestLogger } from './middleware/request-logger.js';
import routes from './routes/index.js';
import { verifyEmailConfig } from './config/email.js';

const app: express.Express = express();

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }),
);

// CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(generalRateLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Bhaga-Banti API Documentation',
  }),
);

// Health check
app.get('/', (_req, res) => {
  const baseUrl = process.env.BETTER_AUTH_URL || `http://localhost:${PORT}`;

  res.json({
    status: 'ok',
    service: 'bhaga-banti',
    docsUrl: `${baseUrl}/api-docs`,
    healthUrl: `${baseUrl}/health`,
    authUrl: `${baseUrl}/api/auth`,
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'bhaga-banti',
  });
});

// API routes
app.use(routes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
const PORT = parseInt(process.env.PORT || '3000');

// Verify email config on startup
verifyEmailConfig().catch((error) => {
  logger.error('Email configuration verification failed', {
    error: toLogError(error),
  });
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    error: toLogError(reason),
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: toLogError(error),
  });
});

const server = app.listen(PORT, () => {
  logger.info('Bhaga-Banti server started', {
    port: PORT,
    serverUrl: `http://localhost:${PORT}`,
    docsUrl: `http://localhost:${PORT}/api-docs`,
    authUrl: `http://localhost:${PORT}/api/auth`,
  });
});

server.on('error', (error) => {
  logger.error('HTTP server failed', {
    error: toLogError(error),
  });
});

export default app;
