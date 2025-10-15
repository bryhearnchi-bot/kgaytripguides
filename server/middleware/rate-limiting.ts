import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ApiError } from '../utils/ApiError';
import { rateLimitErrorHandler } from './errorHandler';
import { logger } from '../logging/logger';

// In-memory store for development (should be replaced with Redis in production)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();

// Rate limit configuration
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum number of requests per window
  message?: string; // Custom error message
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  standardHeaders?: boolean; // Send rate limit info in headers
}

// Default configurations for different endpoints
export const rateLimitConfigs = {
  // General API rate limiting
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    message: 'Too many requests from this IP, please try again later.',
  },

  // Strict rate limiting for auth endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.',
  },

  // Image upload rate limiting
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,
    message: 'Too many upload requests, please try again later.',
  },

  // Search rate limiting
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many search requests, please slow down.',
  },

  // Admin operations rate limiting
  admin: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many admin requests, please slow down.',
  },

  // Bulk operations rate limiting
  bulk: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10,
    message: 'Too many bulk operations, please try again later.',
  },
} as const;

// Redis interface (for future implementation)
interface RedisStore {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<void>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<void>;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> | RedisStore;
  private isRedis: boolean;

  constructor(redisStore?: RedisStore) {
    this.store = redisStore || inMemoryStore;
    this.isRedis = !!redisStore;
  }

  async checkRateLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<{
    allowed: boolean;
    count: number;
    resetTime: number;
    remainingRequests: number;
  }> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    if (this.isRedis) {
      return this.checkRateLimitRedis(key, config, now);
    } else {
      return this.checkRateLimitMemory(key, config, now, windowStart);
    }
  }

  private async checkRateLimitMemory(
    key: string,
    config: RateLimitConfig,
    now: number,
    windowStart: number
  ): Promise<{
    allowed: boolean;
    count: number;
    resetTime: number;
    remainingRequests: number;
  }> {
    const store = this.store as Map<string, RateLimitEntry>;
    const entry = store.get(key);

    if (!entry || entry.resetTime <= now) {
      // First request or window expired
      const resetTime = now + config.windowMs;
      store.set(key, { count: 1, resetTime });
      return {
        allowed: true,
        count: 1,
        resetTime,
        remainingRequests: config.maxRequests - 1,
      };
    }

    // Increment counter
    entry.count++;
    store.set(key, entry);

    const allowed = entry.count <= config.maxRequests;
    const remainingRequests = Math.max(0, config.maxRequests - entry.count);

    return {
      allowed,
      count: entry.count,
      resetTime: entry.resetTime,
      remainingRequests,
    };
  }

  private async checkRateLimitRedis(
    key: string,
    config: RateLimitConfig,
    now: number
  ): Promise<{
    allowed: boolean;
    count: number;
    resetTime: number;
    remainingRequests: number;
  }> {
    const store = this.store as RedisStore;
    const countKey = `rate_limit:${key}:count`;
    const resetKey = `rate_limit:${key}:reset`;

    try {
      const [countStr, resetStr] = await Promise.all([store.get(countKey), store.get(resetKey)]);

      const count = countStr ? parseInt(countStr, 10) : 0;
      const resetTime = resetStr ? parseInt(resetStr, 10) : 0;

      if (resetTime <= now) {
        // Window expired, reset
        const newResetTime = now + config.windowMs;
        await Promise.all([
          store.setex(countKey, Math.ceil(config.windowMs / 1000), '1'),
          store.setex(resetKey, Math.ceil(config.windowMs / 1000), newResetTime.toString()),
        ]);

        return {
          allowed: true,
          count: 1,
          resetTime: newResetTime,
          remainingRequests: config.maxRequests - 1,
        };
      }

      // Increment counter
      const newCount = await store.incr(countKey);
      const allowed = newCount <= config.maxRequests;
      const remainingRequests = Math.max(0, config.maxRequests - newCount);

      return {
        allowed,
        count: newCount,
        resetTime,
        remainingRequests,
      };
    } catch (error: unknown) {
      logger.error('Redis rate limit error', error);
      // Fallback to allowing the request if Redis fails
      return {
        allowed: true,
        count: 1,
        resetTime: now + config.windowMs,
        remainingRequests: config.maxRequests - 1,
      };
    }
  }
}

// Global rate limiter instance
let rateLimiter: RateLimiter;

// Initialize rate limiter (can be called with Redis store later)
export function initializeRateLimiter(redisStore?: RedisStore) {
  rateLimiter = new RateLimiter(redisStore);
}

// Initialize with in-memory store by default
initializeRateLimiter();

// Rate limiting middleware factory
export function createRateLimit(configName: keyof typeof rateLimitConfigs | RateLimitConfig) {
  const config: RateLimitConfig =
    typeof configName === 'string' ? rateLimitConfigs[configName] : configName;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Generate key for rate limiting
      const key = config.keyGenerator
        ? config.keyGenerator(req)
        : `${req.ip}:${req.method}:${req.route?.path || req.path}`;

      // Check rate limit
      const result = await rateLimiter.checkRateLimit(key, config);

      // Set rate limit headers
      if (config.standardHeaders !== false) {
        res.set({
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remainingRequests.toString(),
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
          'X-RateLimit-Used': result.count.toString(),
        });
      }

      if (!result.allowed) {
        // Set Retry-After header
        res.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString());

        // Use the standardized rate limit error handler
        return rateLimitErrorHandler(req, res);
      }

      next();
    } catch (error: unknown) {
      logger.error('Rate limiting error', error);
      // Continue on error to avoid blocking requests
      next();
    }
  };
}

// Specific rate limiters for common use cases
export const generalRateLimit = createRateLimit('general');
export const authRateLimit = createRateLimit('auth');
export const uploadRateLimit = createRateLimit('upload');
export const searchRateLimit = createRateLimit('search');
export const adminRateLimit = createRateLimit('admin');
export const bulkRateLimit = createRateLimit('bulk');

// IP-based rate limiting for anonymous users
export const ipRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 500,
  keyGenerator: req => req.ip || 'unknown',
  message: 'Too many requests from this IP address',
});

// User-based rate limiting for authenticated users
export const userRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 2000,
  keyGenerator: req => {
    const user = (req as any).user;
    return user ? `user:${user.id}` : req.ip || 'unknown';
  },
  message: 'Too many requests from this user account',
});

// Sliding window rate limiter for more precise control
export function createSlidingWindowRateLimit(
  config: RateLimitConfig & {
    precision?: number; // Number of sub-windows (default: 10)
  }
) {
  const precision = config.precision || 10;
  const subWindowMs = config.windowMs / precision;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const now = Date.now();
      const key = config.keyGenerator
        ? config.keyGenerator(req)
        : `${req.ip}:${req.method}:${req.route?.path || req.path}`;

      // Implementation would track requests across multiple sub-windows
      // For now, falls back to the regular rate limiter
      const result = await rateLimiter.checkRateLimit(key, config);

      if (config.standardHeaders !== false) {
        res.set({
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': result.remainingRequests.toString(),
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
          'X-RateLimit-Window': 'sliding',
        });
      }

      if (!result.allowed) {
        // Set Retry-After header
        res.set('Retry-After', Math.ceil((result.resetTime - now) / 1000).toString());

        // Use the standardized rate limit error handler
        return rateLimitErrorHandler(req, res);
      }

      next();
    } catch (error: unknown) {
      logger.error('Sliding window rate limiting error', error);
      next();
    }
  };
}

// Export for potential Redis integration
export { RateLimiter };
