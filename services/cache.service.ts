
import { LoggerService } from "./logger.service";

interface CacheEntry {
  value: any;
  expiry: number;
}

export class CacheService {
  private static cache = new Map<string, CacheEntry>();
  private static DEFAULT_TTL = 300000; // 5 minutes
  private static MAX_CACHE_SIZE = 5000; // Hard memory limit
  private static sweepInterval: NodeJS.Timeout | null = null;

  static {
    // Principal-grade automatic memory management: Start background sweeper
    if (typeof global !== 'undefined') {
      this.startSweeper();
    }
  }

  private static startSweeper() {
    if (this.sweepInterval) return;
    
    // Sweep expired keys every 5 minutes to prevent memory leaks
    this.sweepInterval = setInterval(() => {
      this.sweepExpired();
    }, 300000); // 5 minutes
    
    // Prevent the interval from keeping the Node process alive in tests/scripts
    if (this.sweepInterval.unref) {
      this.sweepInterval.unref();
    }
  }

  /**
   * Performs a sweep of all expired keys to prevent memory leaks
   */
  static sweepExpired() {
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

  /**
   * Sets a value in cache
   */
  static async set(key: string, value: any, ttlMs: number = this.DEFAULT_TTL) {
    // Eviction policy: If size exceeds limit, run sweep first
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.sweepExpired();
      
      // If still over limit, evict the oldest key (LRU fallback)
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey !== undefined) {
          this.cache.delete(oldestKey);
        }
      }
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });
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
