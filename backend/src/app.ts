/**
 * Application Express principale - GammonGuru Backend
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { Logger } from './utils/logger.utils';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import { securityMiddleware } from './middleware/security.middleware';

// Import des routes
import gameRoutes from './routes/game.routes';
import authRoutes from './routes/auth.routes';

class App {
  public app: express.Application;
  private port: string | number;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialiser tous les middlewares
   */
  private initializeMiddlewares(): void {
    // Sécurité
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => {
            Logger.info(message.trim(), { action: 'http_request' });
          }
        }
      }));
    }

    // Middleware de sécurité personnalisé
    this.app.use(securityMiddleware);

    // Logger des requêtes
    this.app.use(requestLogger);
  }

  /**
   * Initialiser les routes
   */
  private initializeRoutes(): void {
    // Route de santé
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: '1.0.0'
      });
    });

    // Route d'information API
    this.app.get('/api', (req, res) => {
      res.status(200).json({
        name: 'GammonGuru API',
        version: '1.0.0',
        description: 'API REST pour le jeu de backgammon avec IA GNUBG',
        endpoints: {
          auth: '/api/auth',
          games: '/api/games'
        },
        documentation: '/api/docs',
        health: '/health'
      });
    });

    // Routes API
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/games', gameRoutes);

    // Route 404
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint non trouvé',
        message: `La route ${req.method} ${req.originalUrl} n'existe pas`,
        availableEndpoints: {
          auth: '/api/auth',
          games: '/api/games',
          health: '/health',
          docs: '/api'
        }
      });
    });
  }

  /**
   * Initialiser la gestion des erreurs
   */
  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  /**
   * Démarrer le serveur
   */
  public listen(): void {
    this.app.listen(this.port, () => {
      Logger.info('Server started successfully', {
        port: this.port,
        environment: process.env.NODE_ENV,
        action: 'server_started'
      });
    });
  }

  /**
   * Obtenir l'application Express
   */
  public getApp(): express.Application {
    return this.app;
  }
}

export default App;
