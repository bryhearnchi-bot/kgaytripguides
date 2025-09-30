/**
 * Logging Middleware
 * Provides request/response logging and context management
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import crypto from 'crypto';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime: number;
      logger: typeof logger;
    }
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Sanitize sensitive data from logs
 */
function sanitizeData(data: any): any {
  if (!data) return data;

  const sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'api_key',
    'secret',
    'authorization',
    'cookie',
    'credit_card',
    'creditCard',
    'ssn',
    'cvv',
  ];

  if (typeof data === 'object' && !Array.isArray(data)) {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  return data;
}

/**
 * Extract user information from request
 */
function getUserInfo(req: Request): { userId?: string; userRole?: string } {
  const user = (req as any).user;

  if (user) {
    return {
      userId: user.id || user.userId,
      userRole: user.role,
    };
  }

  return {};
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Generate request ID
  req.id = req.headers['x-request-id'] as string || generateRequestId();
  req.startTime = Date.now();

  // Create logger instance with request context
  req.logger = logger.child({
    requestId: req.id,
    ...getUserInfo(req),
  });

  // Set logger context
  logger.setContext({
    requestId: req.id,
    ...getUserInfo(req),
  });

  // Log incoming request
  const requestData = {
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: sanitizeData(req.query),
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    referer: req.get('referer'),
    contentType: req.get('content-type'),
    contentLength: req.get('content-length'),
  };

  // Don't log health check requests at info level
  // In development, only log API requests, not static assets or health checks
  if (req.path === '/healthz' || req.path === '/api/metrics') {
    req.logger.debug('Health check request', requestData);
  } else if (process.env.NODE_ENV === 'development' && (
    req.path.startsWith('/src/') ||
    req.path.startsWith('/@') ||
    req.path.startsWith('/node_modules') ||
    req.path.includes('.js') ||
    req.path.includes('.css') ||
    req.path.includes('.tsx') ||
    req.path.includes('.json')
  )) {
    // Skip logging static assets in development
    req.logger.debug('Static asset request', requestData);
  } else {
    req.logger.info('Incoming request', requestData);
  }

  // Log request body for non-GET requests (sanitized)
  if (req.method !== 'GET' && req.body && Object.keys(req.body).length > 0) {
    req.logger.debug('Request body', {
      body: sanitizeData(req.body),
    });
  }

  // Capture response data
  const originalSend = res.send;
  const originalJson = res.json;
  let responseBody: any;

  res.send = function(data: any): Response {
    responseBody = data;
    return originalSend.call(this, data);
  };

  res.json = function(data: any): Response {
    responseBody = data;
    return originalJson.call(this, data);
  };

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;

    const responseData: Record<string, any> = {
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration,
      contentLength: res.get('content-length'),
      contentType: res.get('content-type'),
    };

    // Include response body for errors in development
    if (process.env.NODE_ENV !== 'production' && res.statusCode >= 400 && responseBody) {
      responseData['responseBody'] = typeof responseBody === 'string'
        ? responseBody.substring(0, 500)
        : sanitizeData(responseBody);
    }

    // Determine log level based on status code
    if (res.statusCode >= 500) {
      req.logger.error('Request failed with server error', responseData);
    } else if (res.statusCode >= 400) {
      req.logger.warn('Request failed with client error', responseData);
    } else if (req.path === '/healthz' || req.path === '/api/metrics') {
      req.logger.debug('Request completed', responseData);
    } else if (process.env.NODE_ENV === 'development' && (
      req.path.startsWith('/src/') ||
      req.path.startsWith('/@') ||
      req.path.startsWith('/node_modules') ||
      req.path.includes('.js') ||
      req.path.includes('.css') ||
      req.path.includes('.tsx') ||
      req.path.includes('.json')
    )) {
      // Skip logging static asset responses in development
      req.logger.debug('Request completed', responseData);
    } else {
      req.logger.info('Request completed', responseData);
    }

    // Log slow requests
    if (duration > 1000) {
      req.logger.warn('Slow request detected', {
        ...responseData,
        threshold: 1000,
      });
    }
  });

  // Clear logger context after response
  res.on('close', () => {
    logger.clearContext();
  });

  next();
}

/**
 * Audit logging middleware for sensitive operations
 */
export function auditLogger(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auditData = {
      action,
      method: req.method,
      path: req.path,
      params: sanitizeData(req.params),
      query: sanitizeData(req.query),
      body: sanitizeData(req.body),
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      ...getUserInfo(req),
    };

    // Log the audit event
    if (req.logger) {
      req.logger.audit(action, auditData);
    } else {
      logger.audit(action, auditData);
    }

    // Track response
    const originalJson = res.json;
    res.json = function(data: any): Response {
      const auditResponse = {
        ...auditData,
        statusCode: res.statusCode,
        success: res.statusCode < 400,
        response: process.env.NODE_ENV === 'production' ? undefined : sanitizeData(data),
      };

      if (req.logger) {
        req.logger.audit(`${action}_COMPLETE`, auditResponse);
      } else {
        logger.audit(`${action}_COMPLETE`, auditResponse);
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Performance logging middleware
 */
export function performanceLogger(operation: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();
      const endCpu = process.cpuUsage(startCpu);

      const performanceData = {
        operation,
        duration,
        memory: {
          heapUsedDelta: endMemory.heapUsed - startMemory.heapUsed,
          externalDelta: endMemory.external - startMemory.external,
        },
        cpu: {
          user: endCpu.user / 1000, // Convert to ms
          system: endCpu.system / 1000,
        },
        statusCode: res.statusCode,
      };

      if (req.logger) {
        req.logger.performance(operation, duration, performanceData);
      } else {
        logger.performance(operation, duration, performanceData);
      }
    });

    next();
  };
}

/**
 * Database query logging
 */
export function queryLogger(query: string, params?: any[], startTime?: number) {
  const duration = startTime ? Date.now() - startTime : 0;

  logger.query(query, duration, {
    params: process.env.NODE_ENV === 'production' ? undefined : params,
    paramCount: params?.length,
  });
}

/**
 * Error logging middleware
 */
export function errorLogger(err: Error, req: Request, res: Response, next: NextFunction) {
  const errorData = {
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: sanitizeData(req.query),
    body: sanitizeData(req.body),
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    ...getUserInfo(req),
  };

  // Log the error with context
  if (req.logger) {
    req.logger.error('Request error occurred', err, errorData);
  } else {
    logger.error('Request error occurred', err, errorData);
  }

  next(err);
}

/**
 * Security event logging
 */
export function securityLogger(event: string, metadata?: Record<string, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const securityData = {
      event,
      method: req.method,
      path: req.path,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
      ...getUserInfo(req),
      ...metadata,
    };

    if (req.logger) {
      req.logger.security(event, securityData);
    } else {
      logger.security(event, securityData);
    }

    next();
  };
}

export default {
  requestLogger,
  auditLogger,
  performanceLogger,
  queryLogger,
  errorLogger,
  securityLogger,
};