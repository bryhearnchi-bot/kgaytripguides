/**
 * Example usage of the cache middleware
 *
 * This file shows example patterns - not meant to be executed directly.
 * Copy and adapt these patterns in your actual route files.
 */

// @ts-nocheck

import express from 'express';
import { cacheMiddleware, clearCache, getCacheStats, cacheInvalidationEndpoints } from './cache';

const app = express();

// 1. Basic cache usage - cache all GET requests for 5 minutes
app.use(cacheMiddleware({
  ttl: 300, // 5 minutes
  keyPrefix: 'api'
}));

// 2. Cache specific routes with different TTLs
app.get('/api/trips',
  cacheMiddleware({
    ttl: 600, // 10 minutes
    keyPrefix: 'trips'
  }),
  async (req, res) => {
    // Your route handler
    const trips = await fetchTrips();
    res.json(trips);
  }
);

// 3. Cache with custom key generation (e.g., per user)
app.get('/api/user/profile',
  cacheMiddleware({
    ttl: 300,
    keyPrefix: 'user',
    cacheAuthenticated: true, // Cache authenticated requests
    keyGenerator: (req) => {
      const userId = (req as any).user?.id || 'anonymous';
      return `user:${userId}:profile`;
    }
  }),
  async (req, res) => {
    // Your route handler
    const profile = await fetchUserProfile((req as any).user.id);
    res.json(profile);
  }
);

// 4. Skip caching for specific conditions
app.get('/api/realtime-data',
  cacheMiddleware({
    ttl: 10, // Very short cache
    respectCacheControl: true // Respect client's Cache-Control headers
  }),
  (req, res) => {
    // Set Cache-Control header to bypass cache
    res.set('Cache-Control', 'no-cache');
    res.json({ timestamp: Date.now() });
  }
);

// 5. Cache management endpoints
const cacheEndpoints = cacheInvalidationEndpoints();

// Clear all cache
app.post('/api/admin/cache/clear', cacheEndpoints.clearAll);

// Clear by pattern
app.post('/api/admin/cache/clear-pattern', cacheEndpoints.clearPattern);

// Get cache statistics
app.get('/api/admin/cache/stats', cacheEndpoints.stats);

// 6. Programmatic cache management
app.post('/api/trips/:id', async (req, res) => {
  try {
    // Update trip
    await updateTrip(req.params.id, req.body);

    // Clear related cache entries
    clearCache('^trips:.*'); // Clear all trip cache entries
    clearCache(`^api:.*trips/${req.params.id}`); // Clear specific trip cache

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

// 7. Cache warming on startup
async function warmUpCache() {
  const popularUrls = [
    '/api/trips',
    '/api/ports',
    '/api/ships'
  ];

  // Make internal requests to populate cache
  for (const url of popularUrls) {
    try {
      await fetch(`http://localhost:3001${url}`);
    } catch (error) {
      console.error(`Failed to warm cache for ${url}:`, error);
    }
  }
}

// 8. Monitor cache performance
setInterval(() => {
  const stats = getCacheStats();

  if (stats.hitRate < 0.3 && stats.entries > 100) {
    console.warn('Low cache hit rate:', stats.hitRate);
  }

  if (stats.sizeBytes > 90 * 1024 * 1024) { // > 90MB
    console.warn('Cache size approaching limit:', stats.sizeMB, 'MB');
    // Consider clearing old entries
    clearCache('^old-data:.*');
  }
}, 60000); // Check every minute

// 9. Different cache strategies for different environments
const cacheConfig = process.env.NODE_ENV === 'production'
  ? {
      ttl: 600, // 10 minutes in production
      maxSize: 200 * 1024 * 1024, // 200MB
      maxEntries: 2000
    }
  : {
      ttl: 60, // 1 minute in development
      maxSize: 50 * 1024 * 1024, // 50MB
      maxEntries: 500
    };

app.use('/api', cacheMiddleware(cacheConfig));

// 10. Cache with size limits for large responses
app.get('/api/large-dataset',
  cacheMiddleware({
    ttl: 1800, // 30 minutes for large datasets
    keyPrefix: 'large',
    maxSize: 10 * 1024 * 1024 // Don't cache responses > 10MB
  }),
  async (req, res) => {
    const data = await fetchLargeDataset();
    res.json(data);
  }
);

export default app;