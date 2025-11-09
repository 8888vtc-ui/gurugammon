/**
 * Rate Limit Middleware - Middleware de limitation de requêtes
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { Logger } from '../utils/logger.utils';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

/**
 * Middleware de rate limiting personnalisé
 */
export const rateLimitMiddleware = (options: RateLimitOptions) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: options.message || 'Trop de requêtes, veuillez réessayer plus tard'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      Logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        action: 'rate_limit_exceeded'
      });
      
      res.status(429).json({
        success: false,
        error: options.message || 'Trop de requêtes, veuillez réessayer plus tard',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  });
};
