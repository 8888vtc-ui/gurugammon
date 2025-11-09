/**
 * Middleware de sécurité - Rate limiting et protections
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils';

// Export fonctionnel pour compatibilité
export const securityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  SecurityMiddleware.applySecurityHeaders(req, res, next);
};

// Rate limiting simple en mémoire (production: Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Types locaux pour éviter les dépendances externes dans les middleware
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

export class SecurityMiddleware {
  /**
   * Appliquer les headers de sécurité
   */
  public static applySecurityHeaders(req: Request, res: Response, next: NextFunction): void {
    // Headers de sécurité
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Logger requêtes suspectes
    const userAgent = req.get('User-Agent') || '';
    const suspiciousPatterns = [/bot/i, /crawler/i, /scanner/i];
    
    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      Logger.warn('Suspicious request detected', {
        ip: req.ip,
        userAgent,
        path: req.path,
        action: 'suspicious_request'
      });
    }
    
    next();
  }

  /**
   * Rate limiting basique
   */
  public static rateLimit(config: RateLimitConfig) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
      const key = `rate_limit_${clientIP}`;
      const now = Date.now();
      
      let record = rateLimitStore.get(key);
      
      if (!record || now > record.resetTime) {
        // Nouvelle fenêtre de temps
        record = {
          count: 1,
          resetTime: now + config.windowMs
        };
        rateLimitStore.set(key, record);
        return next();
      }
      
      if (record.count >= config.maxRequests) {
        Logger.warn('Rate limit exceeded', { 
          requestId: req.headers['x-request-id'] as string,
          action: 'rate_limit',
          ip: clientIP,
          endpoint: req.path
        });
        
        res.status(429).json({
          success: false,
          error: config.message,
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        });
        return;
      }
      
      record.count++;
      next();
    };
  }

  /**
   * Protection contre les attaques par force brute sur login
   */
  public static loginRateLimit = SecurityMiddleware.rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 tentatives max
    message: 'Too many login attempts. Please try again later.'
  });

  /**
   * Rate limiting général pour les APIs
   */
  public static apiRateLimit = SecurityMiddleware.rateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requêtes par minute
    message: 'Too many requests. Please slow down.'
  });

  /**
   * Headers de sécurité
   */
  public static securityHeaders(_req: Request, res: Response, next: NextFunction): void {
    // Protection contre XSS
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // HTTPS en production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    // CORS restrictif
    res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || 'https://gammonguru.netlify.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    next();
  }

  /**
   * Validation de la taille des requêtes
   */
  public static requestSizeLimit(maxSize: number) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const contentLength = parseInt(req.headers['content-length'] || '0');
      
      if (contentLength > maxSize) {
        Logger.warn('Request size limit exceeded', {
          requestId: req.headers['x-request-id'] as string,
          action: 'size_limit',
          size: contentLength,
          maxSize
        });
        
        res.status(413).json({
          success: false,
          error: 'Request entity too large'
        });
        return;
      }
      
      next();
    };
  }

  /**
   * Nettoyage périodique du store de rate limiting
   */
  public static cleanupRateLimitStore(): void {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }
}

// Nettoyage toutes les 5 minutes
setInterval(SecurityMiddleware.cleanupRateLimitStore, 5 * 60 * 1000);
