/**
 * Performance Metrics Collection
 * Provides detailed performance metrics and monitoring
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../logging/logger';
import { EventEmitter } from 'events';

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

interface Histogram {
  count: number;
  sum: number;
  buckets: Map<number, number>;
  min: number;
  max: number;
}

interface Counter {
  value: number;
  labels: Map<string, number>;
}

interface Gauge {
  value: number;
  timestamp: number;
}

/**
 * Metrics Collector
 * Collects and aggregates application metrics
 */
export class MetricsCollector extends EventEmitter {
  private static instance: MetricsCollector;
  private counters: Map<string, Counter> = new Map();
  private gauges: Map<string, Gauge> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private customMetrics: Metric[] = [];
  private readonly maxMetricsSize = 10000;

  constructor() {
    super();
    if (MetricsCollector.instance) {
      return MetricsCollector.instance;
    }
    MetricsCollector.instance = this;

    // Start periodic cleanup
    this.startCleanup();
  }

  /**
   * Increment a counter metric
   */
  increment(name: string, value: number = 1, labels?: Record<string, string>) {
    const counter = this.counters.get(name) || { value: 0, labels: new Map() };

    counter.value += value;

    // Handle labeled metrics
    if (labels) {
      const labelKey = JSON.stringify(labels);
      const currentValue = counter.labels.get(labelKey) || 0;
      counter.labels.set(labelKey, currentValue + value);
    }

    this.counters.set(name, counter);
    this.emit('metric', { type: 'counter', name, value, labels });
  }

  /**
   * Set a gauge metric
   */
  gauge(name: string, value: number) {
    this.gauges.set(name, {
      value,
      timestamp: Date.now(),
    });
    this.emit('metric', { type: 'gauge', name, value });
  }

  /**
   * Record a histogram metric
   */
  histogram(name: string, value: number, buckets?: number[]) {
    const histogram = this.histograms.get(name) || {
      count: 0,
      sum: 0,
      buckets: new Map(),
      min: Infinity,
      max: -Infinity,
    };

    histogram.count++;
    histogram.sum += value;
    histogram.min = Math.min(histogram.min, value);
    histogram.max = Math.max(histogram.max, value);

    // Update buckets
    const defaultBuckets = buckets || [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
    for (const bucket of defaultBuckets) {
      if (value <= bucket) {
        const currentCount = histogram.buckets.get(bucket) || 0;
        histogram.buckets.set(bucket, currentCount + 1);
      }
    }

    this.histograms.set(name, histogram);
    this.emit('metric', { type: 'histogram', name, value });
  }

  /**
   * Record a custom metric
   */
  record(name: string, value: number, labels?: Record<string, string>) {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      labels,
    };

    this.customMetrics.push(metric);

    // Trim old metrics
    if (this.customMetrics.length > this.maxMetricsSize) {
      this.customMetrics = this.customMetrics.slice(-this.maxMetricsSize);
    }

    this.emit('metric', { type: 'custom', ...metric });
  }

  /**
   * Get all metrics
   */
  getMetrics(): Record<string, any> {
    const metrics: Record<string, any> = {
      counters: {},
      gauges: {},
      histograms: {},
      custom: this.customMetrics.slice(-100), // Last 100 custom metrics
    };

    // Convert counters
    this.counters.forEach((counter, name) => {
      metrics.counters[name] = {
        value: counter.value,
        labels: counter.labels.size > 0 ? Object.fromEntries(counter.labels) : undefined,
      };
    });

    // Convert gauges
    this.gauges.forEach((gauge, name) => {
      metrics.gauges[name] = gauge;
    });

    // Convert histograms
    this.histograms.forEach((histogram, name) => {
      const percentiles = this.calculatePercentiles(histogram);
      metrics.histograms[name] = {
        count: histogram.count,
        sum: histogram.sum,
        average: histogram.count > 0 ? histogram.sum / histogram.count : 0,
        min: histogram.min === Infinity ? 0 : histogram.min,
        max: histogram.max === -Infinity ? 0 : histogram.max,
        percentiles,
        buckets: Object.fromEntries(histogram.buckets),
      };
    });

    return metrics;
  }

  /**
   * Get metrics in Prometheus format
   */
  getPrometheusMetrics(): string {
    const lines: string[] = [];

    // Counters
    this.counters.forEach((counter, name) => {
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${name} ${counter.value}`);

      counter.labels.forEach((value, labelStr) => {
        const labels = JSON.parse(labelStr);
        const labelPairs = Object.entries(labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');
        lines.push(`${name}{${labelPairs}} ${value}`);
      });
    });

    // Gauges
    this.gauges.forEach((gauge, name) => {
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name} ${gauge.value}`);
    });

    // Histograms
    this.histograms.forEach((histogram, name) => {
      lines.push(`# TYPE ${name} histogram`);

      histogram.buckets.forEach((count, bucket) => {
        lines.push(`${name}_bucket{le="${bucket}"} ${count}`);
      });

      lines.push(`${name}_bucket{le="+Inf"} ${histogram.count}`);
      lines.push(`${name}_sum ${histogram.sum}`);
      lines.push(`${name}_count ${histogram.count}`);
    });

    return lines.join('\n');
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.customMetrics = [];
  }

  /**
   * Calculate percentiles from histogram
   */
  private calculatePercentiles(histogram: Histogram): Record<string, number> {
    if (histogram.count === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0 };
    }

    // Simple approximation using buckets
    const sortedBuckets = Array.from(histogram.buckets.entries()).sort((a, b) => a[0] - b[0]);

    const getPercentile = (p: number): number => {
      const targetCount = Math.ceil(histogram.count * p);
      let cumulative = 0;

      for (const [bucket, count] of sortedBuckets) {
        cumulative += count;
        if (cumulative >= targetCount) {
          return bucket;
        }
      }

      return histogram.max;
    };

    return {
      p50: getPercentile(0.5),
      p90: getPercentile(0.9),
      p95: getPercentile(0.95),
      p99: getPercentile(0.99),
    };
  }

  /**
   * Start periodic cleanup of old metrics
   */
  private startCleanup() {
    setInterval(() => {
      const oneHourAgo = Date.now() - 3600000;

      // Clean old custom metrics
      this.customMetrics = this.customMetrics.filter(m => m.timestamp > oneHourAgo);

      // Clean old gauge timestamps
      this.gauges.forEach((gauge, name) => {
        if (gauge.timestamp < oneHourAgo) {
          this.gauges.delete(name);
        }
      });
    }, 600000); // Clean every 10 minutes
  }
}

// Global metrics collector instance
export const metrics = new MetricsCollector();

/**
 * Middleware to collect HTTP metrics
 */
export function httpMetrics(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Increment request counter
  metrics.increment('http_requests_total', 1, {
    method: req.method,
    path: req.route?.path || req.path,
  });

  // Track active requests
  metrics.gauge('http_requests_active', (metrics as any).activeRequests = ((metrics as any).activeRequests || 0) + 1);

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();

    // Record response time histogram
    metrics.histogram('http_request_duration_ms', duration);

    // Record response by status code
    metrics.increment('http_responses_total', 1, {
      method: req.method,
      path: req.route?.path || req.path,
      status: String(res.statusCode),
    });

    // Track memory delta
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    if (memoryDelta > 0) {
      metrics.histogram('http_request_memory_bytes', memoryDelta);
    }

    // Decrease active requests
    metrics.gauge('http_requests_active', (metrics as any).activeRequests = Math.max(0, ((metrics as any).activeRequests || 1) - 1));

    // Log slow requests
    if (duration > 1000) {
      logger.performance('slow_http_request', duration, {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
      });
    }
  });

  next();
}

/**
 * Database query metrics
 */
export function recordQueryMetrics(query: string, duration: number, success: boolean) {
  // Extract query type (SELECT, INSERT, UPDATE, DELETE, etc.)
  const queryType = query.trim().split(/\s+/)[0]?.toUpperCase() || 'UNKNOWN';

  metrics.increment('database_queries_total', 1, {
    type: queryType,
    success: String(success),
  });

  metrics.histogram('database_query_duration_ms', duration);

  if (!success) {
    metrics.increment('database_errors_total', 1, { type: queryType });
  }
}

/**
 * Cache metrics
 */
export function recordCacheMetrics(operation: 'hit' | 'miss' | 'set' | 'delete', key: string) {
  metrics.increment('cache_operations_total', 1, { operation });

  if (operation === 'hit') {
    metrics.increment('cache_hits_total', 1);
  } else if (operation === 'miss') {
    metrics.increment('cache_misses_total', 1);
  }
}

/**
 * Business metrics
 */
export function recordBusinessMetric(name: string, value: number, labels?: Record<string, string>) {
  metrics.record(`business_${name}`, value, labels);
}

/**
 * System metrics collection
 */
export function collectSystemMetrics() {
  const memUsage = process.memoryUsage();

  // Memory metrics
  metrics.gauge('nodejs_heap_size_total_bytes', memUsage.heapTotal);
  metrics.gauge('nodejs_heap_size_used_bytes', memUsage.heapUsed);
  metrics.gauge('nodejs_external_memory_bytes', memUsage.external);
  metrics.gauge('nodejs_rss_bytes', memUsage.rss);

  // CPU metrics
  const cpuUsage = process.cpuUsage();
  metrics.gauge('nodejs_cpu_user_seconds_total', cpuUsage.user / 1000000);
  metrics.gauge('nodejs_cpu_system_seconds_total', cpuUsage.system / 1000000);

  // Event loop lag (approximate)
  const start = Date.now();
  setImmediate(() => {
    const lag = Date.now() - start;
    metrics.histogram('nodejs_eventloop_lag_ms', lag);
  });

  // Uptime
  metrics.gauge('nodejs_process_uptime_seconds', process.uptime());
}

// Collect system metrics periodically
setInterval(() => {
  collectSystemMetrics();
}, 10000); // Every 10 seconds

/**
 * Metrics endpoint handler
 */
export function metricsHandler(req: Request, res: Response) {
  const format = req.query.format as string;

  if (format === 'prometheus') {
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics.getPrometheusMetrics());
  } else {
    res.json(metrics.getMetrics());
  }
}

export default {
  metrics,
  httpMetrics,
  recordQueryMetrics,
  recordCacheMetrics,
  recordBusinessMetric,
  collectSystemMetrics,
  metricsHandler,
};