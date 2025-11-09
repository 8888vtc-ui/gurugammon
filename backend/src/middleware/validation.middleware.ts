/**
 * Validation Middleware - Middleware de validation avec Zod
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Logger } from '../utils/logger.utils';

/**
 * Middleware de validation Zod
 */
export const validationMiddleware = (
  schema: z.ZodSchema,
  target: 'body' | 'params' | 'query' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[target];
      const validatedData = schema.parse(data);
      
      // Remplacer les données originales par les données validées
      req[target] = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        Logger.warn('Validation failed', {
          path: req.path,
          method: req.method,
          issues: error.issues,
          action: 'validation_failed'
        });
        
        res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: error.issues
        });
        return;
      }
      
      Logger.error('Validation middleware error', {
        path: req.path,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error',
        action: 'validation_middleware_error'
      });
      
      res.status(500).json({
        success: false,
        error: 'Erreur serveur lors de la validation'
      });
    }
  };
};
