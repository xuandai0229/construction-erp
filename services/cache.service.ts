import { LoggerService } from "./logger.service";
import { redis } from "@/lib/redis";

interface CacheEntry {
  value: unknown;
  expiry: number;
}

export class CacheService {
  private static cache = new Map<string, CacheEntry>();
  private static DEFAULT_TTL = 300000; // 5 minutes
  private static MAX_CACHE_SIZE = 5000; // Hard memory limit
  private static sweepInterval: NodeJS.Timeout | null = null;
  private static isRedisAvailable = false;
  private static lastFallbackLogAt = 0;
  private static FALLBACK_LOG_COOLDOWN_MS = 300000;

  static {
    if (typeof global !== 'undefined') {
      this.startSweeper();
      this.initializeRedisListeners();
    }
  }

  private static initializeRedisListeners() {
    this.isRedisAvailable = redis.status === 'ready';

    redis.on('connect', () => {
      this.isRedisAvailable = true;
    });

    redis.on('error', () => {
      if (this.isRedisAvailable) {
        this.isRedisAvailable = false;
        this.logFallbackOnce();
      }
    });
    
    redis.on('end', () => {
      this.isRedisAvailable = false;
    });
  }

  private static logFallbackOnce() {
    const now = Date.now();
    if (now - this.lastFallbackLogAt < this.FALLBACK_LOG_COOLDOWN_MS) return;
    this.lastFallbackLogAt = now;
    LoggerService.warn('[CacheService] Redis unavailable, falling back to bounded memory cache.');
  }

  private static startSweeper() {
    const globalForCache = globalThis as unknown as { cacheSweepInterval: NodeJS.Timeout | undefined };
    if (globalForCache.cacheSweepInterval) {
      clearInterval(globalForCache.cacheSweepInterval);
    }
    this.sweepInterval = setInterval(() => {
      this.sweepExpired();
    }, 60000); // Check every minute instead of 5 minutes for tighter cleanup
    
    globalForCache.cacheSweepInterval = this.sweepInterval;
    
    if (this.sweepInterval.unref) {
      this.sweepInterval.unref();
    }
  }

  static sweepExpired() {
    // We still sweep memory cache even if Redis is available, just in case we have stale memory data from when Redis was down
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

  static async set(key: string, value: unknown, ttlMs: number = this.DEFAULT_TTL) {
    if (this.isRedisAvailable) {
      try {
        await redis.set(key, JSON.stringify(value), 'PX', ttlMs);
        return;
      } catch {
        this.isRedisAvailable = false; // Fallback
        this.logFallbackOnce();
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
      } catch {
        this.isRedisAvailable = false;
        this.logFallbackOnce();
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
      } catch {
        this.isRedisAvailable = false;
        this.logFallbackOnce();
      }
    }
    this.cache.delete(key);
  }

  static async invalidatePrefix(prefix: string) {
    if (this.isRedisAvailable) {
      try {
        let cursor = '0';
        do {
          const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 250);
          cursor = nextCursor;
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        } while (cursor !== '0');
      } catch {
        this.isRedisAvailable = false;
        this.logFallbackOnce();
      }
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  static async invalidateFinancialProject(projectId: string) {
    await Promise.all([
      this.invalidatePrefix(`wbs:${projectId}`),
      this.invalidatePrefix(`aggregation:${projectId}`),
      this.invalidatePrefix(`reporting:${projectId}`),
      this.invalidatePrefix(`dashboard:${projectId}`),
      this.invalidatePrefix(`financial:${projectId}`),
    ]);
  }

  static diagnostics() {
    return {
      redisAvailable: this.isRedisAvailable,
      memoryEntries: this.cache.size,
      maxMemoryEntries: this.MAX_CACHE_SIZE,
    };
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
