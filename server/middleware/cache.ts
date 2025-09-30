/**
 * Response Caching Middleware
 * Provides in-memory caching for GET requests with TTL support and size limits
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../logging/logger';
import { MetricsCollector } from '../monitoring/metrics';

/**
 * Cache entry structure
 */
interface CacheEntry {
  data: Buffer;
  headers: Record<string, string | string[]>;
  statusCode: number;
  timestamp: number;
  ttl: number;
  hits: number;
  size: number;
}

/**
 * Cache configuration options
 */
export interface CacheOptions {
  /** Time-to-live in seconds (default: 300 = 5 minutes) */
  ttl?: number;
  /** Key prefix for namespace separation */
  keyPrefix?: string;
  /** Maximum cache size in bytes (default: 100MB) */
  maxSize?: number;
  /** Maximum number of entries (default: 1000) */
  maxEntries?: number;
  /** Whether to cache authenticated requests (default: false) */
  cacheAuthenticated?: boolean;
  /** Custom key generator function */
  keyGenerator?: (req: Request) => string;
  /** Headers to exclude from cache */
  excludeHeaders?: string[];
  /** Whether to respect Cache-Control headers */
  respectCacheControl?: boolean;
}

/**
 * LRU Cache implementation with size limits
 */
class LRUCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private maxEntries: number;
  private currentSize: number;
  private metrics: MetricsCollector;

  constructor(maxSize: number = 100 * 1024 * 1024, maxEntries: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.maxEntries = maxEntries;
    this.currentSize = 0;
    this.metrics = new MetricsCollector();
  }

  /**
   * Get a cache entry
   */
  get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      this.metrics.increment('cache_misses');
      return undefined;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.delete(key);
      this.metrics.increment('cache_expired');
      return undefined;
    }

    // Update hit count and move to front (LRU)
    entry.hits++;
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.metrics.increment('cache_hits');
    return entry;
  }

  /**
   * Set a cache entry
   */
  set(key: string, entry: CacheEntry): void {
    // If key exists, remove old size
    const existing = this.cache.get(key);
    if (existing) {
      this.currentSize -= existing.size;
      this.cache.delete(key);
    }

    // Check if we need to evict entries
    while (this.cache.size >= this.maxEntries || this.currentSize + entry.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (!firstKey) break;
      this.delete(firstKey);
      this.metrics.increment('cache_evictions');
    }

    // Add new entry
    this.cache.set(key, entry);
    this.currentSize += entry.size;
    this.metrics.gauge('cache_size_bytes', this.currentSize);
    this.metrics.gauge('cache_entries', this.cache.size);
  }

  /**
   * Delete a cache entry
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.currentSize -= entry.size;
      this.metrics.gauge('cache_size_bytes', this.currentSize);
      this.metrics.gauge('cache_entries', this.cache.size);
      return this.cache.delete(key);
    }
    return false;
  }

  /**
   * Clear cache entries matching a pattern
   */
  clearPattern(pattern?: string): number {
    if (!pattern) {
      const size = this.cache.size;
      this.cache.clear();
      this.currentSize = 0;
      this.metrics.gauge('cache_size_bytes', 0);
      this.metrics.gauge('cache_entries', 0);
      return size;
    }

    const regex = new RegExp(pattern);
    let cleared = 0;
    const keysToDelete: string[] = [];

    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.delete(key);
      cleared++;
    }

    return cleared;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    entries: number;
    sizeBytes: number;
    maxSizeBytes: number;
    maxEntries: number;
    hitRate: number;
    totalHits: number;
    oldestEntry?: { key: string; age: number };
    newestEntry?: { key: string; age: number };
  } {
    const now = Date.now();
    let totalHits = 0;
    let oldestEntry: { key: string; age: number } | undefined;
    let newestEntry: { key: string; age: number } | undefined;

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      totalHits += entry.hits;
      const age = now - entry.timestamp;

      if (!oldestEntry || age > oldestEntry.age) {
        oldestEntry = { key, age };
      }
      if (!newestEntry || age < newestEntry.age) {
        newestEntry = { key, age };
      }
    }

    // Get counter values from metrics - using the getMetrics method
    const metricsData = this.metrics.getMetrics();
    const hits = metricsData.counters?.cache_hits?.value || 0;
    const misses = metricsData.counters?.cache_misses?.value || 0;
    const total = hits + misses;
    const hitRate = total > 0 ? hits / total : 0;

    return {
      entries: this.cache.size,
      sizeBytes: this.currentSize,
      maxSizeBytes: this.maxSize,
      maxEntries: this.maxEntries,
      hitRate,
      totalHits,
      oldestEntry,
      newestEntry
    };
  }
}

// Singleton cache instance
const cacheStore = new LRUCache();
const metrics = new MetricsCollector();

/**
 * Generate cache key from request
 */
function generateCacheKey(req: Request, prefix?: string, customGenerator?: (req: Request) => string): string {
  if (customGenerator) {
    return customGenerator(req);
  }

  // Create a hash of the URL, query params, and relevant headers
  const components = [
    req.method,
    req.originalUrl || req.url,
    req.get('Accept') || '',
    req.get('Accept-Language') || '',
    req.get('Accept-Encoding') || ''
  ];

  // Add user ID if authenticated and caching per user
  const userId = (req as any).user?.id;
  if (userId) {
    components.push(`user:${userId}`);
  }

  const hash = crypto
    .createHash('md5')
    .update(components.join('|'))
    .digest('hex');

  return prefix ? `${prefix}:${hash}` : hash;
}

/**
 * Parse Cache-Control header
 */
function parseCacheControl(header?: string): {
  noStore?: boolean;
  noCache?: boolean;
  maxAge?: number;
  private?: boolean;
} {
  if (!header) return {};

  const result: any = {};
  const parts = header.toLowerCase().split(',');

  for (const part of parts) {
    const [key, value] = part.trim().split('=');
    if (key === 'max-age' && value) {
      result.maxAge = parseInt(value, 10);
    } else if (key === 'no-store') {
      result.noStore = true;
    } else if (key === 'no-cache') {
      result.noCache = true;
    } else if (key === 'private') {
      result.private = true;
    }
  }

  return result;
}

/**
 * Response caching middleware
 */
export function cacheMiddleware(options: CacheOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  const {
    ttl = 300, // 5 minutes default
    keyPrefix,
    maxSize,
    maxEntries,
    cacheAuthenticated = false,
    keyGenerator,
    excludeHeaders = ['set-cookie', 'authorization'],
    respectCacheControl = true
  } = options;

  // Update cache settings if provided
  if (maxSize || maxEntries) {
    // Note: In a production system, we'd want to reinitialize the cache
    // For now, we'll just log a warning
    logger.warn('Cache size settings can only be configured at initialization');
  }

  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for authenticated requests if not allowed
    if (!cacheAuthenticated && (req as any).user) {
      logger.debug('Skipping cache for authenticated request', { url: req.url });
      return next();
    }

    // Check Cache-Control headers
    if (respectCacheControl) {
      const cacheControl = parseCacheControl(req.get('Cache-Control'));
      if (cacheControl.noStore || cacheControl.noCache) {
        logger.debug('Skipping cache due to Cache-Control header', {
          url: req.url,
          cacheControl: req.get('Cache-Control')
        });
        return next();
      }
    }

    const key = generateCacheKey(req, keyPrefix, keyGenerator);
    const startTime = Date.now();

    // Try to get from cache
    const cached = cacheStore.get(key);
    if (cached) {
      logger.debug('Cache hit', {
        key,
        url: req.url,
        hits: cached.hits,
        age: Date.now() - cached.timestamp
      });

      // Set response headers
      res.set(cached.headers);
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Hits', cached.hits.toString());
      res.status(cached.statusCode);

      metrics.histogram('cache_response_time_ms', Date.now() - startTime);
      return res.end(cached.data);
    }

    logger.debug('Cache miss', { key, url: req.url });

    // Store original methods
    const originalWrite = res.write;
    const originalEnd = res.end;
    const originalSend = res.send;
    const originalJson = res.json;

    const chunks: Buffer[] = [];
    let responseSize = 0;

    // Override write method
    res.write = function(this: Response, chunk: any, encodingOrCb?: any, cb?: any): any {
      if (chunk) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        chunks.push(buf);
        responseSize += buf.length;
      }
      if (typeof encodingOrCb === 'function') {
        return (originalWrite as any).call(this, chunk, encodingOrCb);
      }
      return (originalWrite as any).call(this, chunk, encodingOrCb, cb);
    } as any;

    // Override end method
    res.end = (function(this: Response, chunk?: any, encodingOrCb?: any, cb?: any): any {
      if (chunk) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        chunks.push(buf);
        responseSize += buf.length;
      }

      const buffer = Buffer.concat(chunks);

      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const headers: Record<string, string | string[]> = {};

        // Copy headers except excluded ones
        const responseHeaders = res.getHeaders();
        for (const [key, value] of Object.entries(responseHeaders)) {
          if (!excludeHeaders.includes(key.toLowerCase()) && value !== undefined) {
            // Convert number headers to strings
            if (typeof value === 'number') {
              headers[key] = value.toString();
            } else {
              headers[key] = value;
            }
          }
        }

        // Determine TTL from Cache-Control if present
        let cacheTtl = ttl;
        if (respectCacheControl) {
          const cacheControl = parseCacheControl(res.get('Cache-Control'));
          if (cacheControl.maxAge) {
            cacheTtl = cacheControl.maxAge;
          }
        }

        const entry: CacheEntry = {
          data: buffer,
          headers,
          statusCode: res.statusCode,
          timestamp: Date.now(),
          ttl: cacheTtl,
          hits: 0,
          size: responseSize
        };

        cacheStore.set(key, entry);

        logger.debug('Response cached', {
          key,
          url: req.url,
          ttl: cacheTtl,
          size: responseSize
        });
      }

      res.set('X-Cache', 'MISS');
      metrics.histogram('cache_response_time_ms', Date.now() - startTime);

      // Call originalEnd with proper arguments
      if (typeof encodingOrCb === 'function') {
        return (originalEnd as any).call(this, chunk, encodingOrCb);
      } else if (typeof cb === 'function') {
        return (originalEnd as any).call(this, chunk, encodingOrCb, cb);
      }
      return (originalEnd as any).call(this, chunk);
    }) as any;

    // Override send method
    res.send = function(data: any): any {
      if (data) {
        const chunk = Buffer.isBuffer(data) ? data : Buffer.from(data);
        chunks.push(chunk);
        responseSize += chunk.length;
      }
      return originalSend.call(res, data);
    };

    // Override json method
    res.json = function(data: any): any {
      const json = JSON.stringify(data);
      const chunk = Buffer.from(json);
      chunks.push(chunk);
      responseSize += chunk.length;
      return originalJson.call(res, data);
    };

    next();
  };
}

/**
 * Clear cache entries
 * @param pattern - Optional regex pattern to match keys
 * @returns Number of entries cleared
 */
export function clearCache(pattern?: string): number {
  const cleared = cacheStore.clearPattern(pattern);
  logger.info('Cache cleared', { pattern, entriesCleared: cleared });
  return cleared;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  entries: number;
  sizeBytes: number;
  sizeMB: number;
  maxSizeBytes: number;
  maxEntries: number;
  hitRate: number;
  totalHits: number;
  oldestEntry?: { key: string; ageSeconds: number };
  newestEntry?: { key: string; ageSeconds: number };
} {
  const stats = cacheStore.getStats();

  // Convert ages to seconds
  if (stats.oldestEntry) {
    stats.oldestEntry.age = Math.floor(stats.oldestEntry.age / 1000);
  }
  if (stats.newestEntry) {
    stats.newestEntry.age = Math.floor(stats.newestEntry.age / 1000);
  }

  return {
    ...stats,
    sizeMB: stats.sizeBytes / (1024 * 1024),
    oldestEntry: stats.oldestEntry ? {
      key: stats.oldestEntry.key,
      ageSeconds: stats.oldestEntry.age
    } : undefined,
    newestEntry: stats.newestEntry ? {
      key: stats.newestEntry.key,
      ageSeconds: stats.newestEntry.age
    } : undefined
  };
}

/**
 * Express middleware for cache invalidation endpoints
 */
export function cacheInvalidationEndpoints() {
  return {
    /**
     * Clear all cache entries
     */
    clearAll: (_req: Request, res: Response) => {
      const cleared = clearCache();
      res.json({
        success: true,
        message: `Cleared ${cleared} cache entries`
      });
    },

    /**
     * Clear cache by pattern
     */
    clearPattern: (req: Request, res: Response) => {
      const { pattern } = req.body;
      if (!pattern) {
        res.status(400).json({
          success: false,
          error: 'Pattern is required'
        });
        return;
      }

      try {
        const cleared = clearCache(pattern);
        res.json({
          success: true,
          message: `Cleared ${cleared} cache entries matching pattern: ${pattern}`
        });
      } catch (error) {
        logger.error('Failed to clear cache by pattern', { pattern, error });
        res.status(500).json({
          success: false,
          error: 'Invalid regex pattern'
        });
      }
    },

    /**
     * Get cache statistics
     */
    stats: (_req: Request, res: Response) => {
      const stats = getCacheStats();
      res.json({
        success: true,
        stats
      });
    }
  };
}

/**
 * Preload cache warming utility
 */
export async function warmCache(urls: string[], options: CacheOptions = {}): Promise<void> {
  logger.info('Starting cache warming', { urlCount: urls.length });

  for (const url of urls) {
    try {
      // This would typically make an internal request to warm the cache
      // For now, we'll just log the intent
      logger.debug('Cache warming URL', { url });
    } catch (error) {
      logger.error('Failed to warm cache for URL', { url, error });
    }
  }

  logger.info('Cache warming complete', { urlCount: urls.length });
}

// Export cache instance for testing
export const _cacheStore = cacheStore;