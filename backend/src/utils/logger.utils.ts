/**
 * Utilitaire de logging - Structuré et configuré
 */

import { LogContext } from '../types';
import { EnvConfig } from '../config';

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: Date;
  readonly context?: LogContext | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
}

export class Logger {
  private static readonly isProduction = EnvConfig.isProduction();

  /**
   * Log niveau ERROR
   */
  public static error(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    Logger.log(LogLevel.ERROR, message, context, metadata);
  }

  /**
   * Log niveau WARN
   */
  public static warn(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    Logger.log(LogLevel.WARN, message, context, metadata);
  }

  /**
   * Log niveau INFO
   */
  public static info(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    Logger.log(LogLevel.INFO, message, context, metadata);
  }

  /**
   * Log niveau DEBUG
   */
  public static debug(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    Logger.log(LogLevel.DEBUG, message, context, metadata);
  }

  /**
   * Log structuré principal
   */
  private static log(level: LogLevel, message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: context || undefined,
      metadata: metadata || undefined
    };

    // Filtrage par niveau en fonction de l'environnement
    if (Logger.shouldLog(level)) {
      Logger.output(logEntry);
    }
  }

  /**
   * Détermine si le log doit être affiché
   */
  private static shouldLog(level: LogLevel): boolean {
    if (Logger.isProduction) {
      return level === LogLevel.ERROR || level === LogLevel.WARN;
    }
    return true; // En développement, tout logger
  }

  /**
   * Sortie du log (console ou service externe)
   */
  private static output(logEntry: LogEntry): void {
    const { level, message, timestamp, context, metadata } = logEntry;
    
    // Format structuré pour la production
    if (Logger.isProduction) {
      const structuredLog = {
        level,
        message,
        timestamp: timestamp.toISOString(),
        ...context,
        ...metadata
      };
      console.log(JSON.stringify(structuredLog));
    } else {
      // Format lisible pour le développement
      const contextStr = context ? ` [${context.userId || ''}:${context.gameId || ''}:${context.action || ''}]` : '';
      const metaStr = metadata && Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : '';
      
      const timestampStr = timestamp.toTimeString().split(' ')[0];
      console.log(`[${timestampStr}] ${level}${contextStr} ${message}${metaStr}`);
    }
  }

  /**
   * Création d'un logger avec contexte pré-rempli
   */
  public static withContext(context: LogContext): {
    error: (message: string, metadata?: Record<string, unknown>) => void;
    warn: (message: string, metadata?: Record<string, unknown>) => void;
    info: (message: string, metadata?: Record<string, unknown>) => void;
    debug: (message: string, metadata?: Record<string, unknown>) => void;
    timer: (label: string) => () => void;
    errorWithStack: (message: string, error: Error) => void;
  } {
    return {
      error: (message: string, metadata?: Record<string, unknown>) => 
        Logger.error(message, context, metadata),
      warn: (message: string, metadata?: Record<string, unknown>) => 
        Logger.warn(message, context, metadata),
      info: (message: string, metadata?: Record<string, unknown>) => 
        Logger.info(message, context, metadata),
      debug: (message: string, metadata?: Record<string, unknown>) => 
        Logger.debug(message, context, metadata),
      timer: (label: string) => Logger.timer(label, context),
      errorWithStack: (message: string, error: Error) => 
        Logger.errorWithStack(message, error, context)
    };
  }

  /**
   * Mesure de performance
   */
  public static timer(label: string, context?: LogContext): () => void {
    const start = Date.now();
    const timerContext = { ...context, action: `timer_${label}` };
    
    Logger.debug(`Timer started: ${label}`, timerContext);
    
    return () => {
      const duration = Date.now() - start;
      Logger.info(`Timer completed: ${label}`, timerContext, { duration: `${duration}ms` });
    };
  }

  /**
   * Log d'erreur avec stack trace
   */
  public static errorWithStack(message: string, error: Error, context?: LogContext): void {
    Logger.error(message, context, {
      error: error.message,
      stack: error.stack
    });
  }
}
