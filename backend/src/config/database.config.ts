/**
 * Configuration base de données - Supabase + Prisma
 */

import { PrismaClient } from '@prisma/client';
import { DatabaseConnection } from '../types';

export class DatabaseConfig {
  private static instance: PrismaClient;

  /**
   * Instance singleton Prisma
   */
  public static getInstance(): PrismaClient {
    if (!DatabaseConfig.instance) {
      DatabaseConfig.instance = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        errorFormat: 'pretty'
      });
    }
    return DatabaseConfig.instance;
  }

  /**
   * Validation de la connexion
   */
  public static async validateConnection(): Promise<boolean> {
    try {
      const prisma = DatabaseConfig.getInstance();
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  /**
   * Graceful shutdown
   */
  public static async disconnect(): Promise<void> {
    if (DatabaseConfig.instance) {
      await DatabaseConfig.instance.$disconnect();
    }
  }

  /**
   * Parse DATABASE_URL
   */
  public static parseDatabaseUrl(url: string): DatabaseConnection {
    try {
      const dbUrl = new URL(url);
      return {
        host: dbUrl.hostname,
        port: parseInt(dbUrl.port) || 5432,
        database: dbUrl.pathname.substring(1),
        user: dbUrl.username,
        password: dbUrl.password,
        ssl: true
      };
    } catch (error) {
      throw new Error(`Invalid DATABASE_URL: ${url}`);
    }
  }
}
