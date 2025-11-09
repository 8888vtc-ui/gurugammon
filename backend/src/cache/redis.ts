/**
 * Cache Redis - Optimisation des performances
 */

import { createClient } from 'redis';
import { Logger } from '../utils/logger.utils';

class RedisCache {
  private static client: ReturnType<typeof createClient>;
  private static isConnected = false;

  static async connect(): Promise<void> {
    if (this.isConnected) return;
    
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    this.client.on('error', (err) => {
      Logger.error('Redis error', {
        error: err.message,
        action: 'redis_error'
      });
    });

    await this.client.connect();
    this.isConnected = true;
    
    Logger.info('Redis connected successfully', {
      action: 'redis_connected'
    });
  }

  static async get(key: string): Promise<string | null> {
    await this.ensureConnection();
    return this.client.get(key);
  }

  static async set(key: string, value: string, ttlSeconds = 300): Promise<void> {
    await this.ensureConnection();
    await this.client.setEx(key, ttlSeconds, value);
  }

  static async del(key: string): Promise<void> {
    await this.ensureConnection();
    await this.client.del(key);
  }

  static async keys(pattern: string): Promise<string[]> {
    await this.ensureConnection();
    return this.client.keys(pattern);
  }

  private static async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }
  }

  static async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      Logger.info('Redis disconnected', {
        action: 'redis_disconnected'
      });
    }
  }
}

export default RedisCache;
