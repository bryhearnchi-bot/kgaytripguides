import { Request, Response, NextFunction } from 'express';

// Performance metrics interface
interface PerformanceMetrics {
  timestamp: number;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
  errorMessage?: string;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

// In-memory metrics store (in production, use Redis or database)
class MetricsStore {
  private metrics: PerformanceMetrics[] = [];
  private readonly maxSize = 10000;

  add(metric: PerformanceMetrics) {
    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxSize) {
      this.metrics.shift();
    }
  }

  getMetrics(limit: number = 100): PerformanceMetrics[] {
    return this.metrics.slice(-limit);
  }

  getAverageResponseTime(path?: string, timeWindow?: number): number {
    const now = Date.now();
    const windowStart = timeWindow ? now - timeWindow : 0;

    const filteredMetrics = this.metrics.filter(m =>
      m.timestamp > windowStart &&
      (!path || m.path === path)
    );

    if (filteredMetrics.length === 0) return 0;

    const totalTime = filteredMetrics.reduce((sum, m) => sum + m.responseTime, 0);
    return totalTime / filteredMetrics.length;
  }

  getErrorRate(timeWindow: number = 3600000): number { // Default: 1 hour
    const now = Date.now();
    const windowStart = now - timeWindow;

    const recentMetrics = this.metrics.filter(m => m.timestamp > windowStart);
    if (recentMetrics.length === 0) return 0;

    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
    return (errorCount / recentMetrics.length) * 100;
  }

  getTopEndpoints(limit: number = 10): Array<{path: string; count: number; avgResponseTime: number}> {
    const endpointMap = new Map<string, {count: number; totalTime: number}>();

    this.metrics.forEach(m => {
      const existing = endpointMap.get(m.path) || {count: 0, totalTime: 0};
      endpointMap.set(m.path, {
        count: existing.count + 1,
        totalTime: existing.totalTime + m.responseTime
      });
    });

    return Array.from(endpointMap.entries())
      .map(([path, data]) => ({
        path,
        count: data.count,
        avgResponseTime: data.totalTime / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  clear() {
    this.metrics = [];
  }
}

const metricsStore = new MetricsStore();

// Performance monitoring middleware
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startCpuUsage = process.cpuUsage();

  // Capture original end function
  const originalEnd = res.end;

  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const endCpuUsage = process.cpuUsage(startCpuUsage);

    // Create performance metric
    const metric: PerformanceMetrics = {
      timestamp: endTime,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: (req as any).userId, // If authentication is implemented
      memoryUsage: process.memoryUsage(),
      cpuUsage: endCpuUsage
    };

    // Add error message for error responses
    if (res.statusCode >= 400) {
      metric.errorMessage = res.getHeader('X-Error-Message') as string || 'Unknown error';
    }

    // Store metric
    metricsStore.add(metric);

    // Log critical errors
    if (res.statusCode >= 500) {
      console.error(`[CRITICAL] ${req.method} ${req.path} - ${res.statusCode} - ${responseTime}ms`, metric);
    }

    // Call original end function
    return originalEnd.call(this, chunk, encoding, cb);
  };

  next();
};

// Health check endpoint with metrics
export const healthCheck = (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  const avgResponseTime = metricsStore.getAverageResponseTime(undefined, 300000); // Last 5 minutes
  const errorRate = metricsStore.getErrorRate(300000); // Last 5 minutes

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)} minutes`,
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
    },
    performance: {
      avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      errorRate: `${errorRate.toFixed(2)}%`
    },
    environment: process.env.NODE_ENV || 'development'
  };

  // Mark as unhealthy if error rate is too high or response time is too slow
  if (errorRate > 10 || avgResponseTime > 5000) {
    health.status = 'degraded';
    res.status(503);
  }

  res.json(health);
};

// Metrics API endpoint
export const getMetrics = (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const path = req.query.path as string;
  const timeWindow = parseInt(req.query.timeWindow as string);

  const metrics = metricsStore.getMetrics(limit);
  const avgResponseTime = metricsStore.getAverageResponseTime(path, timeWindow);
  const errorRate = metricsStore.getErrorRate(timeWindow);
  const topEndpoints = metricsStore.getTopEndpoints();

  res.json({
    metrics,
    summary: {
      avgResponseTime,
      errorRate,
      totalRequests: metrics.length,
      topEndpoints
    }
  });
};

// Application analytics tracking
export class Analytics {
  private events: Array<{
    event: string;
    properties: Record<string, any>;
    timestamp: number;
    userId?: string;
    sessionId?: string;
  }> = [];

  track(event: string, properties: Record<string, any> = {}, userId?: string, sessionId?: string) {
    this.events.push({
      event,
      properties,
      timestamp: Date.now(),
      userId,
      sessionId
    });

    // In production, send to external analytics service
    if (process.env.ANALYTICS_ENDPOINT) {
      this.sendToExternalService({
        event,
        properties,
        timestamp: Date.now(),
        userId,
        sessionId
      });
    }
  }

  private async sendToExternalService(eventData: any) {
    try {
      // Example: Send to Google Analytics, Mixpanel, etc.
      if (process.env.GA_MEASUREMENT_ID) {
        // Google Analytics 4 Measurement Protocol
        const response = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA_MEASUREMENT_ID}&api_secret=${process.env.GA_API_SECRET}`, {
          method: 'POST',
          body: JSON.stringify({
            client_id: eventData.userId || 'anonymous',
            events: [{
              name: eventData.event.replace(/[^a-zA-Z0-9_]/g, '_'),
              parameters: eventData.properties
            }]
          })
        });

        if (!response.ok) {
          console.warn('Failed to send analytics event:', response.status);
        }
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  getEvents(limit: number = 100): any[] {
    return this.events.slice(-limit);
  }

  clear() {
    this.events = [];
  }
}

// Global analytics instance
export const analytics = new Analytics();

// Error tracking
export const errorTracking = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Track error in analytics
  analytics.track('error_occurred', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Set error message header for metrics
  res.setHeader('X-Error-Message', err.message);

  next(err);
};

// System resource monitoring
export const getSystemMetrics = () => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    memory: {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    uptime: process.uptime(),
    loadAverage: require('os').loadavg(),
    freeMemory: require('os').freemem(),
    totalMemory: require('os').totalmem()
  };
};

// Clean up old metrics periodically
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  metricsStore.clear(); // In production, remove only old entries
}, 10 * 60 * 1000); // Clean up every 10 minutes