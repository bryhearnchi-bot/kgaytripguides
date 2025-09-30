/**
 * Global error handler middleware for Express
 * Provides centralized error handling and logging
 */

import type { Request, Response, NextFunction } from 'express';
import { ApiError, isApiError, toApiError, ErrorCode } from '../utils/ApiError';
import { logger } from '../logging/logger';
import { metrics } from '../monitoring/metrics';

// Import monitoring if available
let monitor: any;
try {
  monitor = require('../lib/monitoring');
} catch {
  // Monitoring not available
}

interface ErrorLogContext {
  method: string;
  path: string;
  query: any;
  body: any;
  headers: any;
  ip: string;
  userId?: string;
  timestamp: string;
  error: {
    message: string;
    code?: string;
    stack?: string;
    statusCode: number;
  };
}

/**
 * Log error with appropriate context
 */
function logError(error: ApiError, req: Request): void {
  const context: ErrorLogContext = {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      'x-api-version': req.headers['x-api-version'],
    },
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userId: (req as any).user?.id,
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    }
  };

  // Don't log sensitive information in production
  if (process.env.NODE_ENV === 'production') {
    // Sanitize sensitive data
    if (context.body?.password) {
      context.body.password = '[REDACTED]';
    }
    if (context.headers?.authorization) {
      context.headers.authorization = '[REDACTED]';
    }
  } else {
    context.error.stack = error.stack;
  }

  // Get logger instance from request or use global
  const requestLogger = (req as any).logger || logger;

  // Record error metrics
  metrics.increment('errors_total', 1, {
    statusCode: String(error.statusCode),
    code: error.code || 'unknown',
    path: req.path,
  });

  // Log based on severity
  if (!error.isOperationalError()) {
    requestLogger.error('Critical error occurred', error, context);

    // Record critical error metric
    metrics.increment('critical_errors_total', 1, {
      code: error.code || 'unknown',
    });

    // Send to monitoring service if available
    if (monitor?.captureException) {
      monitor.captureException(error, { extra: context });
    }
  } else if (error.statusCode >= 500) {
    requestLogger.error('Server error occurred', error, context);

    // Record server error metric
    metrics.increment('server_errors_total', 1, {
      code: error.code || 'unknown',
    });
  } else if (error.statusCode >= 400) {
    requestLogger.warn('Client error occurred', {
      method: context.method,
      path: context.path,
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      query: context.query,
    });

    // Record client error metric
    metrics.increment('client_errors_total', 1, {
      statusCode: String(error.statusCode),
      code: error.code || 'unknown',
    });
  }
}

/**
 * Send error response to client
 */
function sendErrorResponse(error: ApiError, req: Request, res: Response): void {
  // Ensure we haven't already sent a response
  if (res.headersSent) {
    console.error('Error occurred after response was sent:', error);
    return;
  }

  const isDevelopment = process.env.NODE_ENV === 'development';

  // Build response object
  const response: any = {
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: error.timestamp,
    }
  };

  // Include additional details based on environment
  if (isDevelopment) {
    response.error.details = error.details;
    if (error.stack) {
      response.error.stack = error.stack.split('\n');
    }
    if (error.originalError) {
      response.error.originalError = {
        message: error.originalError.message,
        name: error.originalError.name,
      };
    }
  } else {
    // In production, only include safe details
    if (error.details && typeof error.details === 'object') {
      // Filter out sensitive information
      const safeDetails = { ...error.details };
      delete safeDetails.password;
      delete safeDetails.token;
      delete safeDetails.apiKey;
      if (Object.keys(safeDetails).length > 0) {
        response.error.details = safeDetails;
      }
    }
  }

  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // Send response
  res.status(error.statusCode).json(response);
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Convert to ApiError if needed
  const apiError = isApiError(err) ? err : toApiError(err);

  // Log the error
  logError(apiError, req);

  // Send response
  sendErrorResponse(apiError, req, res);
}

/**
 * Handle 404 errors
 */
export function notFoundHandler(req: Request, res: Response): void {
  const error = ApiError.notFound(`Route ${req.method} ${req.path}`);
  sendErrorResponse(error, req, res);
}

/**
 * Handle async route errors
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      next(error);
    });
  };
}

/**
 * Validation error formatter for express-validator
 */
export function formatValidationErrors(errors: any[]): ApiError {
  const formattedErrors = errors.map((error) => ({
    field: error.path || error.param,
    message: error.msg,
    value: error.value,
  }));

  return ApiError.validationError('Validation failed', {
    errors: formattedErrors,
    count: formattedErrors.length,
  });
}

/**
 * Database error handler
 * Converts database-specific errors to ApiError
 */
export function handleDatabaseError(error: any): ApiError {
  // PostgreSQL error codes
  const pgErrorCodes: Record<string, () => ApiError> = {
    '23505': () => ApiError.conflict('Duplicate entry'),
    '23503': () => ApiError.badRequest('Foreign key constraint violation'),
    '23502': () => ApiError.badRequest('Required field missing'),
    '23514': () => ApiError.badRequest('Check constraint violation'),
    '22P02': () => ApiError.badRequest('Invalid input syntax'),
    '42703': () => ApiError.internal('Column does not exist'),
    '42P01': () => ApiError.internal('Table does not exist'),
  };

  if (error.code && pgErrorCodes[error.code]) {
    const errorHandler = pgErrorCodes[error.code];
    return errorHandler ? errorHandler() : ApiError.databaseError(error.message, error);
  }

  // Generic database error
  return ApiError.databaseError(error.message, error);
}

/**
 * Rate limit error formatter
 */
export function rateLimitErrorHandler(req: Request, res: Response): void {
  const error = new ApiError(429, 'Too many requests from this IP, please try again later', {
    code: ErrorCode.RATE_LIMIT_EXCEEDED,
    details: {
      retryAfter: res.getHeader('Retry-After'),
      limit: res.getHeader('X-RateLimit-Limit'),
    }
  });
  sendErrorResponse(error, req, res);
}