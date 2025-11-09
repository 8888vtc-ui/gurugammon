/**
 * Middleware d'authentification - Sécurité renforcée
 */

import { Request, Response, NextFunction } from 'express';
import { JwtConfig, Token } from '../config';
import { SecurityUtils } from '../utils';
import { Logger } from '../utils';

// Interface pour étendre Request avec les infos utilisateur
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Export fonctionnel pour compatibilité
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  AuthMiddleware.authenticate(req, res, next);
};

export class AuthMiddleware {
  /**
   * Vérification du token JWT
   */
  public static authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          error: 'Authorization token required'
        });
        return;
      }
      
      const token = authHeader.substring(7); // Remove 'Bearer '
      
      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Token missing'
        });
        return;
      }
      
      // Validation du token
      const payload = JwtConfig.validateToken((token as unknown) as Token);
      
      // Ajout des infos utilisateur à la requête
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role
      };
      
      // Log de sécurité
      Logger.info('User authenticated', {
        requestId: req.headers['x-request-id'] as string,
        userId: payload.userId,
        action: 'auth_success',
        endpoint: req.path
      });
      
      next();
    } catch (error) {
      Logger.warn('Authentication failed', {
        requestId: req.headers['x-request-id'] as string,
        action: 'auth_failed',
        endpoint: req.path,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
  }

  /**
   * Vérification du rôle utilisateur
   */
  public static requireRole(requiredRole: string) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }
      
      if (req.user.role !== requiredRole && req.user.role !== 'ADMIN') {
        Logger.warn('Access denied - insufficient role', {
          requestId: req.headers['x-request-id'] as string,
          userId: req.user.userId,
          userRole: req.user.role,
          requiredRole,
          endpoint: req.path
        });
        
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
        return;
      }
      
      next();
    };
  }

  /**
   * Vérification que l'utilisateur accède à ses propres ressources
   */
  public static requireOwnership(paramUserId: string = 'userId') {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }
      
      const targetUserId = req.params[paramUserId];
      
      // Admin peut accéder à tout
      if (req.user.role === 'ADMIN') {
        next();
        return;
      }
      
      // Vérification que l'utilisateur accède à ses propres données
      if (req.user.userId !== targetUserId) {
        Logger.warn('Access denied - ownership violation', {
          requestId: req.headers['x-request-id'] as string,
          userId: req.user.userId,
          targetUserId,
          endpoint: req.path
        });
        
        res.status(403).json({
          success: false,
          error: 'Access denied: You can only access your own resources'
        });
        return;
      }
      
      next();
    };
  }

  /**
   * Rate limiting par utilisateur pour les actions sensibles
   */
  public static userRateLimit(maxRequests: number, windowMs: number) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        next(); // Pas de rate limiting si non authentifié (géré par autre middleware)
        return;
      }
      
      if (!SecurityUtils.checkUserRateLimit(req.user.userId, maxRequests, windowMs)) {
        Logger.warn('User rate limit exceeded', {
          requestId: req.headers['x-request-id'] as string,
          userId: req.user.userId,
          endpoint: req.path
        });
        
        res.status(429).json({
          success: false,
          error: 'Too many requests. Please try again later.'
        });
        return;
      }
      
      next();
    };
  }

  /**
   * Validation du token refresh
   */
  public static validateRefreshToken(req: Request, res: Response, next: NextFunction): void {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token required'
        });
        return;
      }
      
      const payload = JwtConfig.validateRefreshToken(refreshToken as Token);
      
      // Ajout du payload à la requête pour le prochain middleware
      (req as any).refreshPayload = payload;
      
      next();
    } catch (error) {
      Logger.warn('Refresh token validation failed', {
        requestId: req.headers['x-request-id'] as string,
        action: 'refresh_token_failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }
  }

  /**
   * Optionnel: Authentification (ne bloque pas si pas de token)
   */
  public static optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next(); // Pas de token, continue sans auth
        return;
      }
      
      const token = authHeader.substring(7);
      
      if (token) {
        const payload = JwtConfig.validateToken((token as unknown) as Token);
        req.user = {
          userId: payload.userId,
          email: payload.email,
          role: payload.role
        };
      }
      
      next();
    } catch (error) {
      // En optionel, on continue même si le token est invalide
      Logger.debug('Optional auth failed', {
        requestId: req.headers['x-request-id'] as string,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      next();
    }
  }
}
