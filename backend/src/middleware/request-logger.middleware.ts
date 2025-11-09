/**
 * Request Logger Middleware - Middleware de logging des requêtes
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger.utils';

/**
 * Middleware pour logger les requêtes HTTP
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Logger la requête entrante
  Logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    action: 'incoming_request'
  });
  
  // Intercepter la réponse pour logger le temps de traitement
  const originalSend = res.send;
  res.send = function(data) {
    const processingTime = Date.now() - startTime;
    
    Logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      processingTime: `${processingTime}ms`,
      ip: req.ip,
      action: 'request_completed'
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};
