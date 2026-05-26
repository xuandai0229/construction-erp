import Redis, { RedisOptions } from 'ioredis';
import { LoggerService } from '@/services/logger.service';

const getRedisUrl = () => {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  // Local fallback for dev if redis is running
  return 'redis://localhost:6379';
};

class RedisManager {
  public client: Redis;
  private isConnected = false;
  private connectionAttempts = 0;
  private maxRetries = 10;
  private lastErrorLogTime = 0;
  private logThrottleMs = 10000; // Log at most once every 10s

  constructor() {
    const isDev = process.env.NODE_ENV !== 'production';
    const options: RedisOptions = {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false, // Don't queue up commands indefinitely when offline
      retryStrategy: (times) => {
        this.connectionAttempts++;

        if (!process.env.REDIS_URL && isDev) {
          this.logThrottled('warn', '[RedisManager] REDIS_URL is not configured. Memory cache fallback active.');
          return null;
        }
        
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s... up to 30s
        const delay = Math.min(Math.pow(2, times - 1) * 1000, 30000);
        
        if (isDev && times > 5) {
          // Development optimization: Stop retrying after 5 attempts to prevent spam
          this.logThrottled('warn', `[RedisManager] Max retries reached in DEV mode. Stopping reconnect attempts. Memory cache fallback active.`);
          return null; // Stop retrying completely
        }
        
        if (!isDev && times > this.maxRetries) {
          // Production circuit breaker: Wait 60 seconds before trying again
          this.logThrottled('warn', `[RedisManager] Circuit breaker open. Waiting 60s before next attempt.`);
          return 60000;
        }

        this.logThrottled('warn', `[RedisManager] Retrying connection in ${delay}ms... (Attempt ${times})`);
        return delay;
      },
    };

    this.client = new Redis(getRedisUrl(), options);

    this.client.on('error', (err: Error & { code?: string }) => {
      this.isConnected = false;
      if (err.code === 'ECONNREFUSED') {
        this.logThrottled('warn', `Redis connection refused. Memory cache fallback active.`);
      } else {
        this.logThrottled('warn', `Redis unavailable: ${err.message}`);
      }
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.connectionAttempts = 0;
      LoggerService.info('[RedisManager] Redis connected successfully.');
    });
    
    this.client.on('end', () => {
      this.isConnected = false;
      this.logThrottled('warn', '[RedisManager] Redis connection ended.');
    });
  }

  private logThrottled(level: 'error' | 'warn' | 'info', message: string) {
    const now = Date.now();
    if (now - this.lastErrorLogTime > this.logThrottleMs) {
      LoggerService[level](message);
      this.lastErrorLogTime = now;
    }
  }
}

const globalForRedis = globalThis as unknown as {
  redisManager: RedisManager | undefined;
};

export const redisManager = globalForRedis.redisManager ?? new RedisManager();
export const redis = redisManager.client;

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redisManager = redisManager;
}
