import { CacheService } from "../cache.service";
import { LoggerService } from "../logger.service";

export class DistributedCacheService {
  private static localMemoryCache = new Map<string, { value: any; expiry: number; tags: string[] }>();
  private static isRedisAlive = true;

  /**
   * Generates a tenant-isolated cache key
   */
  private static getTenantKey(companyId: string, key: string): string {
    return `tenant:${companyId}:${key}`;
  }

  /**
   * Set cache entry with optional tags and custom TTL
   */
  static async set(
    companyId: string,
    key: string,
    value: any,
    ttlSeconds: number = 300,
    tags: string[] = []
  ): Promise<boolean> {
    const tenantKey = this.getTenantKey(companyId, key);
    const expiry = Date.now() + ttlSeconds * 1000;

    LoggerService.info(`[Distributed Cache] SET key: ${tenantKey} with TTL ${ttlSeconds}s (Tags: ${tags.join(", ")})`);

    // Always maintain local memory cache replica for split-brain/disconnect resilience
    this.localMemoryCache.set(tenantKey, { value, expiry, tags });

    if (this.isRedisAlive) {
      try {
        // Use native Redis cache service
        await CacheService.set(tenantKey, value, ttlSeconds);
        
        // Save tag mapping in Redis
        for (const tag of tags) {
          const tagKey = `tag:${companyId}:${tag}`;
          const currentTagged = (await CacheService.get(tagKey) as string[]) || [];
          if (!currentTagged.includes(tenantKey)) {
            currentTagged.push(tenantKey);
            await CacheService.set(tagKey, currentTagged, 86400); // 1-day TTL for tag indices
          }
        }
        
        return true;
      } catch (err) {
        LoggerService.warn("[Distributed Cache] Redis write failed! Falling back to local memory replica...", { error: err });
        this.isRedisAlive = false;
      }
    }

    return true;
  }

  /**
   * Get cache entry with lazy-expiry check
   */
  static async get<T>(companyId: string, key: string): Promise<T | null> {
    const tenantKey = this.getTenantKey(companyId, key);

    if (this.isRedisAlive) {
      try {
        const val = await CacheService.get<T>(tenantKey);
        if (val !== null) {
          LoggerService.info(`[Distributed Cache] HIT (Redis): ${tenantKey}`);
          return val;
        }
      } catch (err) {
        LoggerService.warn("[Distributed Cache] Redis read failed! Falling back to memory replica...", { error: err });
        this.isRedisAlive = false;
      }
    }

    // Local fallback check
    const local = this.localMemoryCache.get(tenantKey);
    if (local) {
      if (Date.now() <= local.expiry) {
        LoggerService.info(`[Distributed Cache] HIT (Local Memory Fallback): ${tenantKey}`);
        return local.value as T;
      } else {
        // Lazy cleanup
        this.localMemoryCache.delete(tenantKey);
      }
    }

    LoggerService.info(`[Distributed Cache] MISS: ${tenantKey}`);
    return null;
  }

  /**
   * Invalidate a specific key
   */
  static async invalidate(companyId: string, key: string): Promise<void> {
    const tenantKey = this.getTenantKey(companyId, key);
    LoggerService.info(`[Distributed Cache] INVALIDATE key: ${tenantKey}`);

    this.localMemoryCache.delete(tenantKey);

    if (this.isRedisAlive) {
      try {
        await CacheService.invalidate(tenantKey);
      } catch (err) {
        // Quietly fail
      }
    }
  }

  /**
   * Invalidate all keys matching a specific tag (e.g. invalidating all cache entries tagged with "project:xyz")
   */
  static async invalidateTag(companyId: string, tag: string): Promise<void> {
    LoggerService.warn(`[Distributed Cache] INVALIDATING ALL CACHES WITH TAG: [${tag}] for tenant ${companyId}`);

    // Local memory invalidation
    for (const [key, val] of this.localMemoryCache.entries()) {
      if (val.tags.includes(tag) && key.startsWith(`tenant:${companyId}:`)) {
        this.localMemoryCache.delete(key);
      }
    }

    if (this.isRedisAlive) {
      try {
        const tagKey = `tag:${companyId}:${tag}`;
        const keysToInvalidate = (await CacheService.get(tagKey) as string[]) || [];
        
        for (const key of keysToInvalidate) {
          await CacheService.invalidate(key);
        }

        // Clean tag index
        await CacheService.invalidate(tagKey);
      } catch (err) {
        // Quietly fail
      }
    }
  }

  /**
   * Heartbeat to attempt Redis reconnect recovery and trigger warm ups
   */
  static checkRedisReconnection(status: boolean) {
    if (status && !this.isRedisAlive) {
      LoggerService.info("[Distributed Cache] Redis link restored! Performing cache warming and synchronization...");
      this.isRedisAlive = true;
      this.warmCache();
    } else if (!status && this.isRedisAlive) {
      LoggerService.warn("[Distributed Cache] Redis link offline. Routing all read/write pools to memory replica.");
      this.isRedisAlive = false;
    }
  }

  /**
   * Warm up the Redis cache from memory replica
   */
  private static async warmCache() {
    LoggerService.info("[Distributed Cache] Warming up Redis store...");
    for (const [key, item] of this.localMemoryCache.entries()) {
      if (Date.now() < item.expiry) {
        const ttlSeconds = Math.max(1, Math.round((item.expiry - Date.now()) / 1000));
        try {
          await CacheService.set(key, item.value, ttlSeconds);
        } catch (err) {
          // Suppress warming errors
        }
      }
    }
    LoggerService.info("[Distributed Cache] Redis warming synchronization complete.");
  }
}
