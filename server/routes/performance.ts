import type { Express } from "express";
import { requireContentEditor, type AuthenticatedRequest } from "../auth";
import { optimizedConnection, getPerformanceMetrics } from "../storage";
import { cacheManager } from "../cache/CacheManager";

export function registerPerformanceRoutes(app: Express) {
  // ============ PERFORMANCE MONITORING ENDPOINTS ============

  // Get performance metrics
  app.get("/api/admin/performance/metrics", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const metrics = await getPerformanceMetrics();

      // Add cache statistics
      const cacheStats = {
        overall: cacheManager.getStats(),
        layers: cacheManager.getAllLayersStats()
      };

      res.json({
        timestamp: new Date().toISOString(),
        ...metrics,
        cache: cacheStats
      });
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      res.status(500).json({ error: 'Failed to fetch performance metrics' });
    }
  });

  // Get database pool statistics
  app.get("/api/admin/performance/pool", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      if (!optimizedConnection) {
        return res.status(503).json({ error: 'Database connection not initialized' });
      }

      const poolStats = await optimizedConnection.getPoolStats();
      res.json({
        timestamp: new Date().toISOString(),
        pool: poolStats
      });
    } catch (error) {
      console.error('Error fetching pool statistics:', error);
      res.status(500).json({ error: 'Failed to fetch pool statistics' });
    }
  });

  // Get cache statistics
  app.get("/api/admin/performance/cache", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const { layer } = req.query;

      if (layer && typeof layer === 'string') {
        const layerStats = cacheManager.getLayerStats(layer);
        if (!layerStats) {
          return res.status(404).json({ error: `Cache layer '${layer}' not found` });
        }
        res.json({
          timestamp: new Date().toISOString(),
          layer,
          stats: layerStats
        });
      } else {
        res.json({
          timestamp: new Date().toISOString(),
          overall: cacheManager.getStats(),
          layers: cacheManager.getAllLayersStats()
        });
      }
    } catch (error) {
      console.error('Error fetching cache statistics:', error);
      res.status(500).json({ error: 'Failed to fetch cache statistics' });
    }
  });

  // Clear cache (specific layer or all)
  app.post("/api/admin/performance/cache/clear", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const { layer } = req.body;

      if (layer && typeof layer === 'string') {
        await cacheManager.clearLayer(layer);
        res.json({
          success: true,
          message: `Cache layer '${layer}' cleared`
        });
      } else {
        await cacheManager.clearAll();
        res.json({
          success: true,
          message: 'All caches cleared'
        });
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  });

  // Warm up caches
  app.post("/api/admin/performance/cache/warmup", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const { layers = ['trips', 'ports', 'talent'] } = req.body;

      // Trigger cache warm-up
      console.log(`🔥 Warming up cache layers: ${layers.join(', ')}`);

      // Import the warmUpCaches function
      const { warmUpCaches } = await import('../storage');
      await warmUpCaches();

      res.json({
        success: true,
        message: `Cache layers warmed up: ${layers.join(', ')}`
      });
    } catch (error) {
      console.error('Error warming up caches:', error);
      res.status(500).json({ error: 'Failed to warm up caches' });
    }
  });

  // Get slow queries
  app.get("/api/admin/performance/slow-queries", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      if (!optimizedConnection) {
        return res.status(503).json({ error: 'Database connection not initialized' });
      }

      const metrics = optimizedConnection.getMetrics();
      const slowQueries = metrics.slowQueries || [];

      res.json({
        timestamp: new Date().toISOString(),
        totalSlowQueries: slowQueries.length,
        threshold: 100, // milliseconds
        queries: slowQueries.slice(-20) // Last 20 slow queries
      });
    } catch (error) {
      console.error('Error fetching slow queries:', error);
      res.status(500).json({ error: 'Failed to fetch slow queries' });
    }
  });

  // Database health check
  app.get("/api/admin/performance/health", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const health: any = {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };

      // Check database connection
      try {
        const start = Date.now();
        if (optimizedConnection) {
          const poolStats = await optimizedConnection.getPoolStats();
          const responseTime = Date.now() - start;

          health.database = {
            status: 'connected',
            responseTime: `${responseTime}ms`,
            connections: poolStats
          };

          if (responseTime > 1000) {
            health.status = 'degraded';
            health.warnings = ['Database response time is slow'];
          }
        }
      } catch (error) {
        health.database = { status: 'error', error: (error as Error).message };
        health.status = 'unhealthy';
      }

      // Check cache health
      const cacheStats = cacheManager.getStats();
      health.cache = {
        hitRate: `${cacheStats.hitRate.toFixed(2)}%`,
        size: cacheStats.size,
        maxSize: cacheStats.maxSize
      };

      if (cacheStats.hitRate < 50 && cacheStats.hits + cacheStats.misses > 100) {
        health.status = health.status === 'healthy' ? 'degraded' : health.status;
        health.warnings = health.warnings || [];
        health.warnings.push('Cache hit rate is low');
      }

      res.json(health);
    } catch (error) {
      console.error('Error checking health:', error);
      res.status(500).json({
        status: 'error',
        error: 'Failed to check health',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Real-time performance dashboard data
  app.get("/api/admin/performance/dashboard", requireContentEditor, async (req: AuthenticatedRequest, res) => {
    try {
      const [metrics, cacheStats, health] = await Promise.all([
        getPerformanceMetrics(),
        Promise.resolve({
          overall: cacheManager.getStats(),
          layers: cacheManager.getAllLayersStats()
        }),
        (async () => {
          if (optimizedConnection) {
            return await optimizedConnection.getPoolStats();
          }
          return null;
        })()
      ]);

      res.json({
        timestamp: new Date().toISOString(),
        database: metrics?.database || {},
        pool: health,
        cache: cacheStats,
        recommendations: generatePerformanceRecommendations(metrics, cacheStats)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  });
}

// Generate performance recommendations based on metrics
function generatePerformanceRecommendations(metrics: any, cacheStats: any): string[] {
  const recommendations: string[] = [];

  // Check cache hit rate
  if (cacheStats.overall.hitRate < 60) {
    recommendations.push('Consider increasing cache TTL or size to improve hit rate');
  }

  // Check for slow queries
  if (metrics?.database?.slowQueries?.length > 10) {
    recommendations.push('Multiple slow queries detected. Consider adding indexes or optimizing queries');
  }

  // Check database metrics
  if (metrics?.database?.averageDuration > 50) {
    recommendations.push('Average query duration is high. Consider query optimization');
  }

  // Check pool utilization
  if (metrics?.pool?.active > metrics?.pool?.total * 0.8) {
    recommendations.push('Database connection pool is highly utilized. Consider increasing pool size');
  }

  // Check cache utilization
  const cacheUtilization = (cacheStats.overall.size / cacheStats.overall.maxSize) * 100;
  if (cacheUtilization > 90) {
    recommendations.push('Cache is near capacity. Consider increasing cache size');
  }

  if (recommendations.length === 0) {
    recommendations.push('Performance metrics are within normal parameters');
  }

  return recommendations;
}