
import { LoggerService } from "./logger.service";

interface CacheEntry {
  value: any;
  expiry: number;
}

export class CacheService {
  private static cache = new Map<string, CacheEntry>();
  private static DEFAULT_TTL = 300000; // 5 minutes

  /**
   * Sets a value in cache
   */
  static async set(key: string, value: any, ttlMs: number = this.DEFAULT_TTL) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
    // In a real enterprise app, we might persist this to DB or Redis here.
  }

  /**
   * Gets a value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Invalidates a cache key
   */
  static async invalidate(key: string) {
    this.cache.delete(key);
  }

  /**
   * Invalidates by pattern (prefix)
   */
  static async invalidatePrefix(prefix: string) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Wraps an expensive call with caching
   */
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
