// src/server.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { config } from './config';
import { logger } from './utils/logger';
import { loggerMiddleware } from './middleware/loggerMiddleware';
import { errorHandlerMiddleware } from './middleware/errorHandlerMiddleware';
import { helmet, cors, corsOptions, generalLimiter, authLimiter, validateInput } from './middleware/securityMiddleware';
import playersRouter from './routes/players';
import authRouter from './routes/auth';
import userRouter from './routes/user';
import gamesRouter from './routes/games';
import gnubgRouter from './routes/gnubg';
import gnubgDebugRouter from './routes/gnubgDebug';

// Initialize Prisma client (shared instance)
export const prisma = new PrismaClient({
  log: config.nodeEnv === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

const app = express();

// Middleware de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de sécurité
app.use(helmet());

// CORS bypass for health check (Railway internal requests)
app.use('/health', (req, res, next) => {
  // Skip CORS for health endpoint
  next();
});

// Apply CORS to all other routes
app.use(cors(corsOptions));

// Rate limiting bypass for health check
app.use('/health', (req, res, next) => {
  // Skip rate limiting for health endpoint
  next();
});

app.use(generalLimiter);

// Middleware personnalisé
app.use(loggerMiddleware);

// Routes
app.use('/api/players', playersRouter);
app.use('/api/auth', authLimiter, authRouter); // Rate limiting strict pour auth
app.use('/api/user', userRouter);
app.use('/api/games', gamesRouter);
app.use('/api/gnubg', gnubgRouter);
app.use('/api/gnubg-debug', gnubgDebugRouter);

// Health check endpoint with database connectivity test
app.get('/health', async (req: express.Request, res: express.Response) => {
  try {
    // Test database connectivity with a simple query
    await prisma.users.count();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      environment: config.nodeEnv
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'disconnected',
      environment: config.nodeEnv,
      error: 'Database connection failed'
    });
  }
});

// Route racine
app.get('/', (req: express.Request, res: express.Response) => {
  res.json({
    message: 'GammonGuru API',
    version: '1.0.0',
    endpoints: [
      'GET /health',
      'GET /api/players',
      'POST /api/players'
    ]
  });
});

// Middleware de gestion d'erreurs
app.use(errorHandlerMiddleware);

// Démarrage du serveur
const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    logger.info('HTTP server closed');
    await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(async () => {
    logger.info('HTTP server closed');
    await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  });
});

export default app;