import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import config from './config/index.js';
import logger from './config/logger.js';
import { testConnection, isDurableStorageRequired, isDbConnected, getDbDiagnosticInfo, closeDbConnection } from './config/database.js';
import routes from './routes/index.js';
import { initSocketServer } from './realtime/socketServer.js';
import voiceScheduler from './services/voiceScheduler.js';
import { parseCookies } from './middleware/cookieMiddleware.js';
import { sanitizeRequest } from './middleware/sanitize.js';

const app = express();
const server = http.createServer(app);

// 1. Security & Core Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
        connectSrc: ["'self'", 'ws:', 'wss:', 'http:', 'https:'],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: config.env === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: config.env === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
    xFrameOptions: { action: 'sameorigin' },
    xContentTypeOptions: true,
  })
);

app.use(
  cors({
    origin: config.clientUrl || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(parseCookies);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeRequest);

// Logging HTTP requests
if (config.env !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
}

// 2. Global Rate Limiter
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});
app.use('/api', limiter);

// 3. Mount Routes
app.use('/api', routes);

// 4. Root & Health Check
app.get('/', (req, res) => {
  res.json({
    name: 'SMART ROUTE API',
    description: 'Real-Time Private Bus Booking & Operations Platform',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health',
  });
});

app.get('/health', (req, res) => {
  const dbInfo = getDbDiagnosticInfo();
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'smartroute-backend',
    version: '1.0.0',
    server: {
      status: 'ready',
      port: config.port,
      environment: config.env,
      uptimeSeconds: Math.floor(process.uptime()),
    },
    database: {
      status: dbInfo.connected ? 'connected' : 'unreachable',
      storageMode: dbInfo.storageMode,
      host: dbInfo.host,
      port: dbInfo.port,
      database: dbInfo.database,
      error: dbInfo.error,
    },
  });
});

// 5. 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
});

// 6. Centralized Error Handler (Prevents stack trace / database credential leaks in production)
app.use((err, req, res, next) => {
  logger.error('Unhandled server error:', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  const statusCode = err.statusCode || err.status || 500;
  const isProd = config.env === 'production';

  let safeMessage = err.message || 'Internal server error';
  if (statusCode >= 500) {
    safeMessage = isProd ? 'Internal server error' : (err.message || 'Internal server error');
  }

  res.status(statusCode).json({
    success: false,
    error: safeMessage,
    code: err.code || 'INTERNAL_ERROR',
    ...(!isProd && statusCode >= 500 && { stack: err.stack }),
  });
});

// 7. Initialize Real-Time WebSockets
initSocketServer(server);

// 8. Start HTTP Server
if (process.env.NODE_ENV !== 'test') {
  testConnection().then((connected) => {
    if (!connected) {
      if (isDurableStorageRequired()) {
        logger.error('❌ Critical: Durable database persistence is required, but PostgreSQL connection failed. Halting.');
        process.exit(1);
      } else {
        logger.warn('⚠️ Server running in development mode with ephemeral in-memory fallback store.');
      }
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${config.port} is already in use by another process. Please free port ${config.port} or stop other backend instances.`);
    } else {
      logger.error(`Server error: ${err.message}`);
    }
    process.exit(1);
  });

  server.listen(config.port, () => {
    logger.info(`🚀 SMART ROUTE Backend running in [${config.env}] on port ${config.port}`);
    logger.info(`📡 Client URL allowed: ${config.clientUrl}`);
    voiceScheduler.startScheduler();
  });
}

// Graceful Shutdown
async function handleShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  voiceScheduler.stopScheduler();
  await closeDbConnection();
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export { app, server };
export default app;
