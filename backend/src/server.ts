/**
 * Point d'entrée principal du serveur GammonGuru
 */

import dotenv from 'dotenv';
import { Logger } from './utils/logger.utils';
import { EnvConfig } from './config/env.config';
import App from './app';

// Charger les variables d'environnement
dotenv.config();

/**
 * Fonction principale de démarrage du serveur
 */
async function startServer(): Promise<void> {
  try {
    // Valider la configuration
    EnvConfig.validate();
    
    Logger.info('Starting GammonGuru Backend Server...', {
      environment: process.env.NODE_ENV,
      port: process.env.PORT,
      action: 'server_startup_initiated'
    });

    // Créer et démarrer l'application
    const app = new App();
    app.listen();

    Logger.info('GammonGuru Backend Server is running successfully!', {
      environment: process.env.NODE_ENV,
      port: process.env.PORT || 3000,
      action: 'server_startup_completed'
    });

    // Gérer l'arrêt gracieux
    setupGracefulShutdown();

  } catch (error) {
    Logger.error('Failed to start GammonGuru Backend Server', {
      error: error instanceof Error ? error.message : 'Unknown error',
      action: 'server_startup_failed'
    });
    
    process.exit(1);
  }
}

/**
 * Configuration de l'arrêt gracieux du serveur
 */
function setupGracefulShutdown(): void {
  const gracefulShutdown = (signal: string) => {
    Logger.info(`Received ${signal}. Starting graceful shutdown...`, {
      signal,
      action: 'graceful_shutdown_initiated'
    });

    // Fermer les connexions, nettoyer les ressources, etc.
    setTimeout(() => {
      Logger.info('Graceful shutdown completed', {
        action: 'graceful_shutdown_completed'
      });
      process.exit(0);
    }, 5000); // 5 secondes pour l'arrêt gracieux
  };

  // Écouter les signaux d'arrêt
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Gérer les erreurs non capturées
  process.on('uncaughtException', (error) => {
    Logger.error('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
      action: 'uncaught_exception'
    });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    Logger.error('Unhandled Rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      promise: promise.toString(),
      action: 'unhandled_rejection'
    });
    process.exit(1);
  });
}

// Démarrer le serveur
if (require.main === module) {
  startServer();
}

export default startServer;
