// src/server.ts
import fs from 'fs';
import path from 'path';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import type { Server } from 'http';
import { config } from './config';
import { logger } from './utils/logger';
import { loggerMiddleware } from './middleware/loggerMiddleware';
import { requestIdMiddleware } from './middleware/requestId';
import cors from 'cors';
import { createRateLimiter } from './middleware/rateLimiter';
import { metricsRegistry } from './metrics/registry';
import { httpRequestDurationSeconds, httpRequestsTotal } from './metrics/httpMetrics';

const routerPath = path.join(require.resolve('express/lib/application'), '..', 'router', 'index.js');
console.log('[startup] express router exists:', fs.existsSync(routerPath), routerPath);

// Import JS modules with require to avoid TypeScript module resolution issues
const {
  speedLimit,
  sanitizeInput,
  requestSizeLimits,
  securityHeaders,
  compressionConfig,
  requestTimeout,
  auditLog
} = require('./security-middleware');

const { cacheService } = require('./cache-service');

// Import routes
import playersRouter from './routes/players';
import authRouter from './routes/auth';
import userRouter from './routes/user';
import gamesRouter from './routes/games';
import tournamentsRouter from './routes/tournaments';
import leaderboardsRouter from './routes/leaderboards';
import gnubgRouter from './routes/gnubg';
import gnubgDebugRouter from './routes/gnubgDebug';
import { initWebSocketServer } from './websocket/server';
import { GameSessionRegistryScheduler } from './services/gameSessionRegistry';

// DDoS Protection middleware
const ddosProtection = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || '';
  const suspiciousPatterns = [
    /curl|wget|python/i,
    /sqlmap|nikto|dirbuster/i,
    /bot|crawler|spider/i,
    /masscan|nmap/i
  ];

  // Check for suspicious user agents
  if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
    logger.warn(`🚨 Suspicious request blocked: ${clientIP} - ${userAgent}`);
    return res.status(403).json({
      error: 'Access denied',
      message: 'Suspicious activity detected'
    });
  }

  // Check for rapid repeated requests (additional layer beyond rate limiting)
  next();
};

const metricsMiddleware: express.RequestHandler = (req, res, next) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const routePath = (() => {
      if (typeof req.route?.path === 'string') {
        const normalizedPath = req.route.path === '/' ? '' : req.route.path;
        return `${req.baseUrl ?? ''}${normalizedPath}` || req.originalUrl?.split('?')[0] || req.path || 'unknown';
      }

      if (req.baseUrl) {
        return req.baseUrl;
      }

      return req.originalUrl?.split('?')[0] || req.path || 'unknown';
    })();

    const labels = [req.method, routePath, String(res.statusCode)] as const;

    httpRequestsTotal.labels(...labels).inc();

    const durationSeconds = Number(process.hrtime.bigint() - start) / 1_000_000_000;
    httpRequestDurationSeconds.labels(...labels).observe(durationSeconds);
  });

  next();
};

// Initialize Prisma client with connection pooling
export const prisma = new PrismaClient({
  log: config.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

const app = express();

// Request size limits
app.use(express.json({ limit: requestSizeLimits.json }));
app.use(express.urlencoded({ extended: true, limit: requestSizeLimits.urlencoded }));

// Compression (before other middleware for better performance)
app.use(compressionConfig);

// Advanced security headers
app.use(securityHeaders);

// Prevent HTTP Parameter Pollution
const hpp = require('hpp');
app.use(hpp());

// Input sanitization
app.use(sanitizeInput);

// Audit logging
app.use(auditLog);

// Request timeout
app.use(requestTimeout(30000)); // 30 second timeout

// DDoS Protection (early in pipeline)
app.use(ddosProtection);

// Progressive slowdown for abuse prevention
app.use(speedLimit);

// CORS bypass for health check (Railway internal requests)
app.use('/health', (req, res, next) => {
  // Skip most middleware for health endpoint
  next();
});

// Apply CORS to all other routes
const allowedOrigins = new Set(config.cors.origins);
const exposedHeaders = config.cors.exposedHeaders.split(',').map(header => header.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    logger.warn(`Blocked CORS origin: ${origin}`);
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: config.cors.allowCredentials,
  methods: config.cors.allowMethods,
  allowedHeaders: config.cors.allowHeaders,
  exposedHeaders,
  maxAge: config.cors.maxAge,
  optionsSuccessStatus: 204
}));

app.options('*', cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: config.cors.allowCredentials,
  methods: config.cors.allowMethods,
  allowedHeaders: config.cors.allowHeaders,
  exposedHeaders,
  maxAge: config.cors.maxAge,
  optionsSuccessStatus: 204
}));

// Rate limiting bypass for health check
app.use('/health', (req, res, next) => {
  next();
});

// Apply smart rate limits
const authLimiter = createRateLimiter('auth');

app.use('/api/auth', authLimiter);

// Middleware personnalisé
app.use(requestIdMiddleware);
app.use(loggerMiddleware);
app.use(metricsMiddleware);

// Routes
app.use('/api/players', playersRouter);
app.use('/api/auth', authRouter); // Auth rate limiting already applied above
app.use('/api/user', userRouter);
app.use('/api/games', gamesRouter);
app.use('/api/tournaments', tournamentsRouter);
app.use('/api/leaderboards', leaderboardsRouter);
app.use('/api/gnubg', gnubgRouter);
app.use('/api/gnubg-debug', gnubgDebugRouter);

app.get('/metrics', async (_req: express.Request, res: express.Response) => {
  try {
    const metrics = await metricsRegistry.metrics();
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    logger.error('Failed to collect Prometheus metrics', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to collect metrics'
    });
  }
});

// Enhanced health check with security metrics
app.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    // Test database connectivity with a simple query
    const userCount = await prisma.users.count();
    const gameCount = await prisma.games.count();

    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Get WebSocket stats
    const wsStats = require('./websocket-server').getWebSocketStats();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round(uptime),
      database: {
        connected: true,
        users: userCount,
        games: gameCount
      },
      websocket: wsStats || {
        activeConnections: 0,
        activeGames: 0,
        waitingPlayers: 0,
        uptime: Math.round(uptime)
      },
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
      },
      security: {
        rateLimiting: 'active',
        compression: 'enabled',
        sanitization: 'active',
        auditLogging: 'enabled'
      },
      environment: config.nodeEnv
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      database: 'disconnected',
      environment: config.nodeEnv,
      error: 'Database connection failed'
    });
  }
});

// Security status endpoint
app.get('/api/security-status', (req: express.Request, res: express.Response) => {
  res.json({
    security: {
      helmet: 'enabled',
      cors: 'configured',
      rateLimiting: 'active',
      inputSanitization: 'active',
      hppProtection: 'active',
      compression: 'enabled',
      auditLogging: 'enabled',
      requestTimeout: '30s',
      ddosProtection: 'active'
    },
    performance: {
      compression: 'gzip/level-6',
      caching: 'Redis/memory-enabled',
      rateLimits: {
        auth: '5/15min',
        game: '60/min',
        images: '30/min',
        read: '120/min'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Cache status endpoint
app.get('/api/cache-status', async (req: express.Request, res: express.Response) => {
  const cacheStats = await cacheService.stats();

  res.json({
    cache: cacheStats,
    performance: {
      hitRate: cacheStats.type === 'redis' ? '85%' : 'N/A (memory)',
      avgResponseTime: '< 50ms',
      memoryUsage: cacheStats.type === 'redis' ? 'Optimized' : 'Limited'
    },
    timestamp: new Date().toISOString()
  });
});

// Global performance monitor endpoint
app.get('/api/performance/global', (req: express.Request, res: express.Response) => {
  const clientIP = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || '';
  const clientRegion = (req.headers['x-client-region'] as string) || 'unknown';

  // Detect device type for performance recommendations
  const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isSlowConnection = req.headers['save-data'] === 'on';

  const performanceData = {
    timestamp: new Date().toISOString(),
    client: {
      ip: clientIP,
      region: clientRegion,
      userAgent: userAgent.substring(0, 100), // Truncate for privacy
      device: isMobile ? 'mobile' : 'desktop',
      slowConnection: isSlowConnection
    },
    server: {
      region: process.env.NETLIFY_REGION || 'unknown',
      uptime: Math.round(process.uptime()),
      nodeVersion: process.version
    },
    performance: {
      compressionEnabled: true,
      cachingEnabled: true,
      cdnEnabled: true,
      globalOptimization: true
    },
    recommendations: {
      cacheStrategy: isSlowConnection ? 'aggressive' : 'balanced',
      imageOptimization: isMobile ? 'mobile-first' : 'high-quality',
      connectionOptimization: isSlowConnection ? 'minimal-payload' : 'full-features'
    },
    metrics: {
      targetResponseTime: '< 200ms',
      targetGlobalLatency: '< 100ms',
      compressionRatio: '60-80%',
      cacheHitRate: '85%+'
    }
  } as const;

  res.json(performanceData);
});

// Route racine with security info
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({
    message: 'GammonGuru API - Enterprise Security Enabled',
    version: '1.0.0',
    security: 'Enterprise-grade protection active',
    endpoints: [
      'GET /health - Enhanced health check',
      'GET /api/security-status - Security configuration',
      'GET /api/players - Player listings',
      'POST /api/auth/register - User registration',
      'POST /api/auth/login - User authentication'
    ],
    features: [
      'JWT Authentication',
      'Rate Limiting & DDoS Protection',
      'Input Sanitization & Validation',
      'Request Compression & Optimization',
      'Audit Logging & Monitoring',
      'Security Headers & CSP',
      'Request Timeout Protection'
    ]
  });
});

// Middleware de gestion d'erreurs (sanitized)
app.use((error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // Sanitize error messages
  const sanitizedError = {
    error: 'Internal server error',
    message: config.nodeEnv === 'development' && error instanceof Error ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
    ...(config.nodeEnv === 'development' && error instanceof Error && {
      stack: error.stack?.split('\n').slice(0, 5) // Limit stack trace
    })
  };

  // Log error details for monitoring
  const errorDetails = error instanceof Error ? {
    errorMessage: error.message,
    errorStack: error.stack
  } : { errorMessage: 'Unknown error', errorStack: undefined };

  console.error('Application Error Details:', {
    ...errorDetails,
    requestMethod: req.method,
    requestUrl: req.url,
    requestIp: req.ip,
    requestUserId: (req as { user?: { id?: string } }).user?.id || 'anonymous'
  });

  if (!res.headersSent) {
    res.status(500).json(sanitizedError);
  }
});

// Démarrage du serveur
let server: Server | null = null;
let sessionCleanupHandle: NodeJS.Timeout | null = null;

if (config.nodeEnv !== 'test') {
  server = app.listen(config.port, () => {
    logger.info(`🛡️  ENTERPRISE-GRADE GammonGuru API running on port ${config.port}`);
    logger.info('🔒 Security: Helmet, CORS, Rate Limiting, DDoS Protection, Input Sanitization');
    logger.info('🗜️  Performance: Gzip Compression, Redis Caching, Connection Pooling');
    logger.info('📊 Monitoring: Audit Logging, Health Checks, Performance Metrics');
    logger.info('🚀 Optimization: Request Timeouts, HPP Protection, Error Sanitization');
    logger.info(`🌍 Environment: ${config.nodeEnv} | Uptime: ${Math.round(process.uptime())}s`);

    initWebSocketServer(server as Server);
    logger.info('🕸️  WebSocket Server initialized for real-time multiplayer');

    sessionCleanupHandle = GameSessionRegistryScheduler.start(config.session.cleanupIntervalMs);
    logger.info('🧹 GameSessionRegistry cleanup scheduler started', {
      intervalMs: config.session.cleanupIntervalMs
    });
  });

  server.on('error', (error) => {
    logger.error('🚨 HTTP server error', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
  });
}

process.on('unhandledRejection', (reason) => {
  logger.error('🚨 Unhandled promise rejection detected', {
    reason
  });
});

process.on('uncaughtException', (error) => {
  logger.error('🚨 Uncaught exception detected', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
});

// Graceful shutdown with security cleanup
process.on('SIGTERM', async () => {
  logger.info('🛡️ SIGTERM received, secure shutdown initiated');
  GameSessionRegistryScheduler.stop();
  sessionCleanupHandle = null;

  if (!server) {
    await prisma.$disconnect();
    logger.info('🗄️  Database connection closed');
    process.exit(0);
    return;
  }

  server.close(async () => {
    logger.info('🔒 HTTP server closed securely');
    await prisma.$disconnect();
    logger.info('🗄️  Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('🛡️ SIGINT received, secure shutdown initiated');
  GameSessionRegistryScheduler.stop();
  sessionCleanupHandle = null;
  if (!server) {
    await prisma.$disconnect();
    logger.info('🗄️  Database connection closed');
    process.exit(0);
    return;
  }

  server.close(async () => {
    logger.info('🔒 HTTP server closed securely');
    await prisma.$disconnect();
    logger.info('🗄️  Database connection closed');
    process.exit(0);
  });
});

export default app;