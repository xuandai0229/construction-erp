import { LoggerService } from "./logger.service";
import { redis } from "@/lib/redis";

interface CacheEntry {
  value: any;
  expiry: number;
}

export class CacheService {
  private static cache = new Map<string, CacheEntry>();
  private static DEFAULT_TTL = 300000; // 5 minutes
  private static MAX_CACHE_SIZE = 5000; // Hard memory limit
  private static sweepInterval: NodeJS.Timeout | null = null;
  private static isRedisAvailable = false;

  static {
    if (typeof global !== 'undefined') {
      this.startSweeper();
      this.checkRedis();
    }
  }

  private static async checkRedis() {
    try {
      if (redis.status === 'ready' || redis.status === 'connecting') {
        // Just ping to ensure
        await redis.ping();
        this.isRedisAvailable = true;
      }
    } catch (e) {
      this.isRedisAvailable = false;
      LoggerService.warn('[CacheService] Redis unavailable, falling back to memory cache.');
    }
  }

  private static startSweeper() {
    if (this.sweepInterval) return;
    this.sweepInterval = setInterval(() => {
      this.sweepExpired();
    }, 300000);
    if (this.sweepInterval.unref) {
      this.sweepInterval.unref();
    }
  }

  static sweepExpired() {
    if (this.isRedisAvailable) return; // Redis handles its own expiry
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      LoggerService.info(`[CacheService] Swept ${count} expired cache entries from memory.`);
    }
  }

  static async set(key: string, value: any, ttlMs: number = this.DEFAULT_TTL) {
    if (this.isRedisAvailable) {
      try {
        await redis.set(key, JSON.stringify(value), 'PX', ttlMs);
        return;
      } catch (e) {
        this.isRedisAvailable = false; // Fallback
      }
    }

    // Memory fallback
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.sweepExpired();
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey !== undefined) this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
  }

  static async get<T>(key: string): Promise<T | null> {
    if (this.isRedisAvailable) {
      try {
        const val = await redis.get(key);
        if (val) return JSON.parse(val) as T;
        return null;
      } catch (e) {
        this.isRedisAvailable = false;
      }
    }

    // Memory fallback
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  static async invalidate(key: string) {
    if (this.isRedisAvailable) {
      try {
        await redis.del(key);
        return;
      } catch (e) {}
    }
    this.cache.delete(key);
  }

  static async invalidatePrefix(prefix: string) {
    if (this.isRedisAvailable) {
      try {
        const keys = await redis.keys(`${prefix}*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
        return;
      } catch (e) {}
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  static async wrap<T>(key: string, fn: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fn();
    await this.set(key, value, ttlMs);
    return value;
  }
}
