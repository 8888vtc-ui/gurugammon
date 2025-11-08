// src/utils/logger.ts
export class Logger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }
  
  info(message: string, data?: any) {
    console.log(`[${new Date().toISOString()}] [${this.context}] INFO: ${message}`, data || '');
  }
  
  error(message: string, error?: Error) {
    console.error(`[${new Date().toISOString()}] [${this.context}] ERROR: ${message}`, error || '');
  }
  
  warn(message: string, data?: any) {
    console.warn(`[${new Date().toISOString()}] [${this.context}] WARN: ${message}`, data || '');
  }
}

// Export par défaut
export const logger = new Logger('GammonGuru');
