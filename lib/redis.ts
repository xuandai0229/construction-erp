import Redis from 'ioredis';
import { LoggerService } from '@/services/logger.service';

const getRedisUrl = () => {
  if (process.env.REDIS_URL) return process.env.REDIS_URL;
  // Local fallback for dev if redis is running
  return 'redis://localhost:6379';
};

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(getRedisUrl(), {
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

redis.on('error', (err) => {
  LoggerService.error('Redis connection error:', err);
});

redis.on('connect', () => {
  LoggerService.info('Redis connected successfully.');
});

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
