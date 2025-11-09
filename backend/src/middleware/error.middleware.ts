/**
 * Error Middleware - Middleware de gestion des erreurs
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger.utils';

/**
 * Middleware de gestion des erreurs global
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  Logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    action: 'unhandled_error'
  });

  // Ne pas exposer les détails de l'erreur en production
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
};
