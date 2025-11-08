// src/middleware/errorHandlerMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function errorHandlerMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  // Log l'erreur principale
  logger.error(`🚨 ${err.message}`);
  
  // Log les détails séparément
  logger.info('Error details', {
    url: req.originalUrl,
    method: req.method,
    stack: err.stack
  });

  // Réponse standardisée
  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    }
  });
}
