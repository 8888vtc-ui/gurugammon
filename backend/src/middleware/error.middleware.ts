/**
 * Enhanced Error Middleware - Global Error Handling with Retry Logic
 */

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger.utils';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  retryable?: boolean;
  context?: Record<string, any>;
}

export class ErrorHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000;

  /**
   * Main error handler middleware
   */
  public static handle(
    error: ApiError,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    // Log the error with context
    Logger.error('API Error occurred', {
      message: error.message,
      statusCode: error.statusCode || 500,
      isOperational: error.isOperational || false,
      retryable: error.retryable || false,
      context: error.context,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Determine if this is a retryable error
    if (error.retryable && ErrorHandler.shouldRetry(req)) {
      ErrorHandler.handleRetry(req, res, error);
      return;
    }

    // Send appropriate error response
    const statusCode = error.statusCode || 500;
    const response = ErrorHandler.formatErrorResponse(error, req);

    res.status(statusCode).json(response);
  }

  /**
   * Check if request should be retried
   */
  private static shouldRetry(req: Request): boolean {
    const retryCount = parseInt(req.headers['x-retry-count'] as string || '0');
    return retryCount < this.MAX_RETRIES;
  }

  /**
   * Handle retry logic
   */
  private static async handleRetry(
    req: Request,
    res: Response,
    error: ApiError
  ): Promise<void> {
    const retryCount = parseInt(req.headers['x-retry-count'] as string || '0') + 1;
    
    Logger.info('Retrying request', {
      url: req.url,
      method: req.method,
      retryCount,
      maxRetries: this.MAX_RETRIES
    });

    // Add delay before retry
    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * retryCount));

    // Set retry header for next attempt
    res.setHeader('x-retry-count', retryCount.toString());
    
    // Return retry response
    res.status(429).json({
      success: false,
      error: {
        code: 'RETRYABLE_ERROR',
        message: 'Temporary error, retrying...',
        retryCount,
        maxRetries: this.MAX_RETRIES
      },
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Format error response
   */
  private static formatErrorResponse(error: ApiError, req: Request): any {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const baseResponse = {
      success: false,
      error: {
        code: error.name || 'INTERNAL_ERROR',
        message: error.isOperational ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      },
      requestId: req.headers['x-request-id'] || 'unknown'
    };

    // Add debug info in development
    if (isDevelopment) {
      baseResponse.error.debug = {
        stack: error.stack,
        context: error.context,
        statusCode: error.statusCode || 500
      };
    }

    // Add retry info if applicable
    if (error.retryable) {
      baseResponse.error.retryable = true;
      baseResponse.error.maxRetries = this.MAX_RETRIES;
    }

    return baseResponse;
  }

  /**
   * Create operational error (expected errors)
   */
  public static createOperationalError(
    message: string,
    statusCode: number = 400,
    context?: Record<string, any>
  ): ApiError {
    const error = new Error(message) as ApiError;
    error.statusCode = statusCode;
    error.isOperational = true;
    error.context = context;
    return error;
  }

  /**
   * Create retryable error
   */
  public static createRetryableError(
    message: string,
    statusCode: number = 503,
    context?: Record<string, any>
  ): ApiError {
    const error = new Error(message) as ApiError;
    error.statusCode = statusCode;
    error.isOperational = true;
    error.retryable = true;
    error.context = context;
    return error;
  }

  /**
   * Async error wrapper for route handlers
   */
  public static asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

/**
 * Legacy error handler (backward compatibility)
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Convert to ApiError and use new handler
  const apiError = error as ApiError;
  ErrorHandler.handle(apiError, req, res, next);
};

/**
 * 404 Handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  Logger.warn('Route not found', {
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`,
      availableEndpoints: [
        '/health',
        '/api/game/*',
        '/api/claude/*',
        '/api/openai/*',
        '/api/ws/*',
        '/api/user/*',
        '/api/stats/*'
      ],
      timestamp: new Date().toISOString()
    }
  });
};
