/**
 * Application Express Simplifiée - GammonGuru Backend
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { Logger } from './utils/logger.utils';

// Import des routes simplifiées
import gameRoutes from './routes/game.routes.simple';
import authRoutes from './routes/auth.routes.simple';

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
   * Initialiser les middlewares
   */
  private initializeMiddlewares(): void {
    // Sécurité
    this.app.use(helmet({
      contentSecurityPolicy: false
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined'));
    }

    // Middleware de logging simple
    this.app.use((req, res, next) => {
      Logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        action: 'http_request'
      });
      next();
    });
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
    // Middleware d'erreurs simple
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      Logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        action: 'unhandled_error'
      });

      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(500).json({
        success: false,
        error: 'Erreur serveur interne',
        ...(isDevelopment && {
          details: {
            message: error.message,
            stack: error.stack
          }
        })
      });
    });
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
