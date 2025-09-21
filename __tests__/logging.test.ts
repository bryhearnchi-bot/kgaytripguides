/**
 * Test Suite for Logging and Monitoring System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Logger, logger } from '../server/logging/logger';
import { MetricsCollector, metrics } from '../server/monitoring/metrics';
import type { Request, Response, NextFunction } from 'express';

// Mock Express request/response
const createMockRequest = (overrides?: Partial<Request>): Request => ({
  method: 'GET',
  path: '/api/test',
  originalUrl: '/api/test',
  query: {},
  params: {},
  body: {},
  headers: {},
  ip: '127.0.0.1',
  get: vi.fn(),
  socket: { remoteAddress: '127.0.0.1' },
  ...overrides,
} as any);

const createMockResponse = (): Response => {
  const res = {
    statusCode: 200,
    statusMessage: 'OK',
    headersSent: false,
    locals: {},
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    get: vi.fn(),
    on: vi.fn(),
    end: vi.fn(),
  } as any;
  return res;
};

const createMockNext = (): NextFunction => vi.fn();

describe('Logger', () => {
  let testLogger: Logger;

  beforeEach(() => {
    testLogger = new Logger();
  });

  afterEach(() => {
    testLogger.clearContext();
  });

  describe('Basic Logging', () => {
    it('should log at different levels', () => {
      const logSpy = vi.spyOn(testLogger['baseLogger'], 'log');

      testLogger.info('Info message');
      testLogger.warn('Warning message');
      testLogger.debug('Debug message');

      expect(logSpy).toHaveBeenCalledWith('info', 'Info message', expect.any(Object));
      expect(logSpy).toHaveBeenCalledWith('warn', 'Warning message', expect.any(Object));
      expect(logSpy).toHaveBeenCalledWith('debug', 'Debug message', expect.any(Object));
    });

    it('should log errors with stack traces', () => {
      const logSpy = vi.spyOn(testLogger['baseLogger'], 'log');
      const error = new Error('Test error');

      testLogger.error('Error occurred', error);

      expect(logSpy).toHaveBeenCalledWith('error', 'Error occurred', expect.objectContaining({
        errorMessage: 'Test error',
        errorStack: expect.any(String),
        errorName: 'Error',
      }));
    });
  });

  describe('Context Management', () => {
    it('should set and clear context', () => {
      const logSpy = vi.spyOn(testLogger['baseLogger'], 'log');

      testLogger.setContext({
        requestId: 'req-123',
        userId: 'user-456',
      });

      testLogger.info('With context');

      expect(logSpy).toHaveBeenCalledWith('info', 'With context', expect.objectContaining({
        requestId: 'req-123',
        userId: 'user-456',
      }));

      testLogger.clearContext();
      testLogger.info('Without context');

      expect(logSpy).toHaveBeenLastCalledWith('info', 'Without context', expect.not.objectContaining({
        requestId: 'req-123',
        userId: 'user-456',
      }));
    });

    it('should create child logger with inherited context', () => {
      const logSpy = vi.spyOn(testLogger['baseLogger'], 'log');

      testLogger.setContext({ requestId: 'parent-req' });
      const childLogger = testLogger.child({ childProp: 'child-value' });

      childLogger.info('Child message');

      expect(logSpy).toHaveBeenCalledWith('info', 'Child message', expect.objectContaining({
        requestId: 'parent-req',
        childProp: 'child-value',
      }));
    });
  });

  describe('Specialized Logging', () => {
    it('should log audit events', () => {
      const logSpy = vi.spyOn(testLogger['baseLogger'], 'log');

      testLogger.audit('USER_LOGIN', {
        email: 'test@example.com',
        ip: '127.0.0.1',
      });

      expect(logSpy).toHaveBeenCalledWith('info', 'AUDIT: USER_LOGIN', expect.objectContaining({
        audit: true,
        action: 'USER_LOGIN',
        email: 'test@example.com',
      }));
    });

    it('should log performance metrics', () => {
      const logSpy = vi.spyOn(testLogger['baseLogger'], 'log');

      testLogger.performance('api_call', 150, {
        endpoint: '/api/users',
      });

      expect(logSpy).toHaveBeenCalledWith('info', 'Performance: api_call', expect.objectContaining({
        performance: true,
        operation: 'api_call',
        duration: 150,
        endpoint: '/api/users',
      }));
    });

    it('should log security events', () => {
      const logSpy = vi.spyOn(testLogger['baseLogger'], 'log');

      testLogger.security('UNAUTHORIZED_ACCESS', {
        path: '/admin',
        ip: '192.168.1.1',
      });

      expect(logSpy).toHaveBeenCalledWith('warn', 'SECURITY: UNAUTHORIZED_ACCESS', expect.objectContaining({
        security: true,
        event: 'UNAUTHORIZED_ACCESS',
        path: '/admin',
      }));
    });
  });
});

describe('Metrics Collector', () => {
  let testMetrics: MetricsCollector;

  beforeEach(() => {
    testMetrics = new MetricsCollector();
    testMetrics.reset();
  });

  describe('Counter Metrics', () => {
    it('should increment counters', () => {
      testMetrics.increment('requests_total');
      testMetrics.increment('requests_total', 2);

      const metrics = testMetrics.getMetrics();
      expect(metrics.counters.requests_total.value).toBe(3);
    });

    it('should handle labeled counters', () => {
      testMetrics.increment('http_requests', 1, { method: 'GET', status: '200' });
      testMetrics.increment('http_requests', 1, { method: 'GET', status: '200' });
      testMetrics.increment('http_requests', 1, { method: 'POST', status: '201' });

      const metrics = testMetrics.getMetrics();
      const labels = metrics.counters.http_requests.labels;

      expect(labels['{"method":"GET","status":"200"}']).toBe(2);
      expect(labels['{"method":"POST","status":"201"}']).toBe(1);
    });
  });

  describe('Gauge Metrics', () => {
    it('should set gauge values', () => {
      testMetrics.gauge('memory_usage', 1024);
      testMetrics.gauge('memory_usage', 2048);

      const metrics = testMetrics.getMetrics();
      expect(metrics.gauges.memory_usage.value).toBe(2048);
    });
  });

  describe('Histogram Metrics', () => {
    it('should record histogram values', () => {
      testMetrics.histogram('response_time', 100);
      testMetrics.histogram('response_time', 200);
      testMetrics.histogram('response_time', 300);

      const metrics = testMetrics.getMetrics();
      const histogram = metrics.histograms.response_time;

      expect(histogram.count).toBe(3);
      expect(histogram.sum).toBe(600);
      expect(histogram.average).toBe(200);
      expect(histogram.min).toBe(100);
      expect(histogram.max).toBe(300);
    });

    it('should calculate percentiles', () => {
      for (let i = 1; i <= 100; i++) {
        testMetrics.histogram('latency', i * 10);
      }

      const metrics = testMetrics.getMetrics();
      const histogram = metrics.histograms.latency;

      expect(histogram.percentiles.p50).toBeGreaterThan(0);
      expect(histogram.percentiles.p90).toBeGreaterThan(histogram.percentiles.p50);
      expect(histogram.percentiles.p99).toBeGreaterThan(histogram.percentiles.p90);
    });
  });

  describe('Custom Metrics', () => {
    it('should record custom metrics', () => {
      testMetrics.record('custom_metric', 42, { service: 'api' });

      const metrics = testMetrics.getMetrics();
      const customMetric = metrics.custom.find(m => m.name === 'custom_metric');

      expect(customMetric).toBeDefined();
      expect(customMetric.value).toBe(42);
      expect(customMetric.labels).toEqual({ service: 'api' });
    });
  });

  describe('Prometheus Format', () => {
    it('should export metrics in Prometheus format', () => {
      testMetrics.increment('requests', 5);
      testMetrics.gauge('temperature', 22.5);
      testMetrics.histogram('duration', 150);

      const prometheusOutput = testMetrics.getPrometheusMetrics();

      expect(prometheusOutput).toContain('# TYPE requests counter');
      expect(prometheusOutput).toContain('requests 5');
      expect(prometheusOutput).toContain('# TYPE temperature gauge');
      expect(prometheusOutput).toContain('temperature 22.5');
      expect(prometheusOutput).toContain('# TYPE duration histogram');
    });
  });
});

describe('Request Logging Middleware', () => {
  it('should log incoming requests', async () => {
    const { requestLogger } = await import('../server/logging/middleware');
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    const logSpy = vi.spyOn(logger, 'info');

    requestLogger(req, res, next);

    expect(req.id).toBeDefined();
    expect(req.logger).toBeDefined();
    expect(logSpy).toHaveBeenCalledWith('Incoming request', expect.objectContaining({
      method: 'GET',
      path: '/api/test',
    }));
    expect(next).toHaveBeenCalled();
  });

  it('should sanitize sensitive data', async () => {
    const { requestLogger } = await import('../server/logging/middleware');
    const req = createMockRequest({
      body: {
        username: 'test',
        password: 'secret123',
        apiKey: 'key-123',
      },
    });
    const res = createMockResponse();
    const next = createMockNext();

    const logSpy = vi.spyOn(logger, 'debug');

    requestLogger(req, res, next);

    // Check that sensitive fields are not logged
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: expect.objectContaining({
          password: 'secret123',
        }),
      })
    );
  });
});

describe('Health Check Endpoints', () => {
  it('should perform database health check', async () => {
    const { checkDatabaseHealth } = await import('../server/monitoring/health');

    // Mock the pool query
    vi.mock('../server/storage', () => ({
      pool: {
        query: vi.fn().mockResolvedValue({
          rows: [{ health_check: 1 }],
        }),
      },
    }));

    const result = await checkDatabaseHealth();

    expect(result.healthy).toBe(true);
    expect(result.duration).toBeDefined();
  });

  it('should check memory health', async () => {
    const { checkMemoryHealth } = await import('../server/monitoring/health');

    const result = checkMemoryHealth();

    expect(result.healthy).toBeDefined();
    expect(result.metadata.process.heapUsed).toBeDefined();
    expect(result.metadata.system.percentage).toBeDefined();
  });

  it('should check CPU health', async () => {
    const { checkCPUHealth } = await import('../server/monitoring/health');

    const result = checkCPUHealth();

    expect(result.healthy).toBeDefined();
    expect(result.metadata.cores).toBeDefined();
    expect(result.metadata.loadAverage).toBeDefined();
  });
});

describe('Error Handling with Logging', () => {
  it('should log errors with appropriate severity', async () => {
    const { errorHandler } = await import('../server/middleware/errorHandler');
    const { ApiError } = await import('../server/utils/ApiError');

    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    const logSpy = vi.spyOn(logger, 'error');

    // Test server error
    const serverError = ApiError.internal('Database connection failed');
    errorHandler(serverError, req, res, next);

    expect(logSpy).toHaveBeenCalledWith(
      'Server error occurred',
      serverError,
      expect.any(Object)
    );

    // Test client error
    const clientError = ApiError.badRequest('Invalid input');
    errorHandler(clientError, req, res, next);

    expect(metrics.getMetrics().counters.client_errors_total).toBeDefined();
  });
});

describe('Performance Monitoring', () => {
  it('should track HTTP request metrics', async () => {
    const { httpMetrics } = await import('../server/monitoring/metrics');

    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    httpMetrics(req, res, next);

    expect(next).toHaveBeenCalled();

    // Simulate response finish
    const finishCallback = res.on.mock.calls.find(call => call[0] === 'finish')?.[1];
    if (finishCallback) {
      finishCallback();
    }

    const currentMetrics = metrics.getMetrics();
    expect(currentMetrics.counters.http_requests_total).toBeDefined();
    expect(currentMetrics.histograms.http_request_duration_ms).toBeDefined();
  });

  it('should record database query metrics', async () => {
    const { recordQueryMetrics } = await import('../server/monitoring/metrics');

    recordQueryMetrics('SELECT * FROM users', 50, true);
    recordQueryMetrics('INSERT INTO logs', 25, true);
    recordQueryMetrics('UPDATE users SET', 100, false);

    const currentMetrics = metrics.getMetrics();
    expect(currentMetrics.counters.database_queries_total).toBeDefined();
    expect(currentMetrics.counters.database_errors_total).toBeDefined();
    expect(currentMetrics.histograms.database_query_duration_ms).toBeDefined();
  });
});