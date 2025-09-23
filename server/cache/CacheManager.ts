import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

// Cache configuration
interface CacheConfig {
  maxSize?: number;        // Maximum number of items in cache
  ttl?: number;           // Time to live in milliseconds
  updateAgeOnGet?: boolean; // Reset TTL on get
  allowStale?: boolean;    // Allow stale data while revalidating
}

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  size: number;
  maxSize: number;
}

// Cache entry metadata
interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  hits: number;
}

// Multi-layer cache manager
export class CacheManager {
  private static instance: CacheManager;
  private memoryCache: LRUCache<string, any>;
  private stats: CacheStats;
  private cacheLayers: Map<string, LRUCache<string, any>> = new Map();

  private constructor() {
    // Default cache configuration
    this.memoryCache = new LRUCache<string, any>({
      max: 500,                    // Maximum 500 items
      ttl: 1000 * 60 * 5,          // 5 minutes TTL
      allowStale: true,            // Allow stale while revalidating
      updateAgeOnGet: true,        // Reset TTL on access
      fetchMethod: async (key) => {
        // Optional async fetch method for cache misses
        return null;
      }
    });

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
      size: 0,
      maxSize: 500
    };

    // Initialize specialized cache layers
    this.initializeCacheLayers();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  private initializeCacheLayers() {
    // Trip data cache (longer TTL, larger size)
    this.cacheLayers.set('trips', new LRUCache<string, any>({
      max: 100,
      ttl: 1000 * 60 * 30,  // 30 minutes
      allowStale: true,
      updateAgeOnGet: true
    }));

    // Event data cache
    this.cacheLayers.set('events', new LRUCache<string, any>({
      max: 200,
      ttl: 1000 * 60 * 15,  // 15 minutes
      allowStale: true,
      updateAgeOnGet: true
    }));

    // Talent data cache
    this.cacheLayers.set('talent', new LRUCache<string, any>({
      max: 150,
      ttl: 1000 * 60 * 60,  // 1 hour (changes less frequently)
      allowStale: true,
      updateAgeOnGet: false
    }));

    // Port data cache
    this.cacheLayers.set('locations', new LRUCache<string, any>({
      max: 50,
      ttl: 1000 * 60 * 60 * 24,  // 24 hours (rarely changes)
      allowStale: true,
      updateAgeOnGet: false
    }));

    // Query result cache (short TTL)
    this.cacheLayers.set('queries', new LRUCache<string, any>({
      max: 1000,
      ttl: 1000 * 60 * 2,  // 2 minutes
      allowStale: false,
      updateAgeOnGet: false
    }));

    // User session cache
    this.cacheLayers.set('sessions', new LRUCache<string, any>({
      max: 200,
      ttl: 1000 * 60 * 60 * 2,  // 2 hours
      allowStale: false,
      updateAgeOnGet: true
    }));
  }

  // Generate cache key from multiple parts
  private generateKey(...parts: any[]): string {
    const keyString = parts.map(p => JSON.stringify(p)).join(':');
    return crypto.createHash('md5').update(keyString).digest('hex');
  }

  // Get from specific cache layer
  async get<T>(layer: string, key: string): Promise<T | null> {
    const cache = this.cacheLayers.get(layer) || this.memoryCache;
    const value = cache.get(key);

    if (value !== undefined) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }

    this.updateHitRate();
    return value || null;
  }

  // Set in specific cache layer
  async set<T>(layer: string, key: string, value: T, ttl?: number): Promise<void> {
    const cache = this.cacheLayers.get(layer) || this.memoryCache;

    const options = ttl ? { ttl } : undefined;
    cache.set(key, value, options);

    this.stats.sets++;
    this.stats.size = cache.size;
  }

  // Delete from specific cache layer
  async delete(layer: string, key: string): Promise<boolean> {
    const cache = this.cacheLayers.get(layer) || this.memoryCache;
    const deleted = cache.delete(key);

    if (deleted) {
      this.stats.deletes++;
      this.stats.size = cache.size;
    }

    return deleted;
  }

  // Clear specific cache layer
  async clearLayer(layer: string): Promise<void> {
    const cache = this.cacheLayers.get(layer);
    if (cache) {
      cache.clear();
    }
  }

  // Clear all caches
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    for (const [name, cache] of this.cacheLayers) {
      cache.clear();
    }
    this.resetStats();
  }

  // Invalidate cache entries by pattern
  async invalidatePattern(layer: string, pattern: RegExp): Promise<number> {
    const cache = this.cacheLayers.get(layer) || this.memoryCache;
    let invalidated = 0;

    for (const key of cache.keys()) {
      if (pattern.test(key)) {
        cache.delete(key);
        invalidated++;
      }
    }

    return invalidated;
  }

  // Cache-aside pattern helper
  async getOrSet<T>(
    layer: string,
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache
    let value = await this.get<T>(layer, key);

    if (value === null) {
      // Cache miss - execute factory function
      value = await factory();

      // Store in cache
      if (value !== null && value !== undefined) {
        await this.set(layer, key, value, ttl);
      }
    }

    return value!;
  }

  // Batch get from cache
  async batchGet<T>(layer: string, keys: string[]): Promise<Map<string, T>> {
    const cache = this.cacheLayers.get(layer) || this.memoryCache;
    const results = new Map<string, T>();

    for (const key of keys) {
      const value = cache.get(key);
      if (value !== undefined) {
        results.set(key, value);
        this.stats.hits++;
      } else {
        this.stats.misses++;
      }
    }

    this.updateHitRate();
    return results;
  }

  // Batch set in cache
  async batchSet<T>(layer: string, entries: Map<string, T>, ttl?: number): Promise<void> {
    const cache = this.cacheLayers.get(layer) || this.memoryCache;
    const options = ttl ? { ttl } : undefined;

    for (const [key, value] of entries) {
      cache.set(key, value, options);
      this.stats.sets++;
    }

    this.stats.size = cache.size;
  }

  // Warm up cache with preloaded data
  async warmUp(layer: string, data: Map<string, any>): Promise<void> {
    await this.batchSet(layer, data);
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Get layer-specific statistics
  getLayerStats(layer: string): any {
    const cache = this.cacheLayers.get(layer);
    if (!cache) return null;

    return {
      size: cache.size,
      maxSize: cache.max,
      calculatedSize: cache.calculatedSize,
      itemCount: cache.size
    };
  }

  // Get all layers statistics
  getAllLayersStats(): Map<string, any> {
    const stats = new Map<string, any>();

    for (const [name, cache] of this.cacheLayers) {
      stats.set(name, {
        size: cache.size,
        maxSize: cache.max,
        calculatedSize: cache.calculatedSize
      });
    }

    return stats;
  }

  private updateHitRate() {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
      size: 0,
      maxSize: this.memoryCache.max
    };
  }

  // Cache key helpers for common entities
  static keys = {
    trip: (id: number) => `trip:${id}`,
    tripBySlug: (slug: string) => `trip:slug:${slug}`,
    tripList: (status?: string) => `trips:list:${status || 'all'}`,
    event: (id: number) => `event:${id}`,
    eventsByCruise: (cruiseId: number) => `events:cruise:${cruiseId}`,
    talent: (id: number) => `talent:${id}`,
    talentByCruise: (cruiseId: number) => `talent:cruise:${cruiseId}`,
    location: (id: number) => `location:${id}`,
    locationList: () => 'locations:list',
    party: (id: number) => `party:${id}`,
    itinerary: (cruiseId: number) => `itinerary:cruise:${cruiseId}`,
    user: (id: string) => `user:${id}`,
    session: (token: string) => `session:${token}`,
    query: (sql: string, params: any[]) => crypto.createHash('md5')
      .update(`${sql}:${JSON.stringify(params)}`)
      .digest('hex')
  };
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Cache decorators for methods
export function Cacheable(layer: string, ttl?: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = CacheManager.getInstance();
      const key = cache['generateKey'](propertyKey, ...args);

      return cache.getOrSet(
        layer,
        key,
        () => originalMethod.apply(this, args),
        ttl
      );
    };

    return descriptor;
  };
}

export function CacheInvalidate(layer: string, keyPattern?: RegExp) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      const cache = CacheManager.getInstance();

      if (keyPattern) {
        await cache.invalidatePattern(layer, keyPattern);
      } else {
        await cache.clearLayer(layer);
      }

      return result;
    };

    return descriptor;
  };
}