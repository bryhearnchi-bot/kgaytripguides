/**
 * Custom API Error class for standardized error handling
 * Provides consistent error responses across the application
 */

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  CONNECTION_ERROR = 'CONNECTION_ERROR',

  // Business logic errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',

  // External service errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  EMAIL_SERVICE_ERROR = 'EMAIL_SERVICE_ERROR',
  STORAGE_SERVICE_ERROR = 'STORAGE_SERVICE_ERROR',

  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}

export interface ApiErrorOptions {
  code?: ErrorCode;
  details?: Record<string, unknown> | string;
  isOperational?: boolean;
  originalError?: Error;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown> | string;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly originalError?: Error;

  constructor(statusCode: number, message: string, options: ApiErrorOptions = {}) {
    super(message);

    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = options.code || this.inferErrorCode(statusCode);
    this.details = options.details;
    this.isOperational = options.isOperational !== undefined ? options.isOperational : true;
    this.timestamp = new Date().toISOString();
    this.originalError = options.originalError;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  private inferErrorCode(statusCode: number): ErrorCode {
    const codeMap: Record<number, ErrorCode> = {
      400: ErrorCode.INVALID_INPUT,
      401: ErrorCode.UNAUTHORIZED,
      403: ErrorCode.FORBIDDEN,
      404: ErrorCode.NOT_FOUND,
      409: ErrorCode.CONFLICT,
      422: ErrorCode.VALIDATION_ERROR,
      429: ErrorCode.RATE_LIMIT_EXCEEDED,
      500: ErrorCode.INTERNAL_SERVER_ERROR,
      503: ErrorCode.SERVICE_UNAVAILABLE,
    };

    return codeMap[statusCode] || ErrorCode.INTERNAL_SERVER_ERROR;
  }

  /**
   * Factory methods for common error types
   */

  static badRequest(message: string, details?: Record<string, unknown> | string): ApiError {
    return new ApiError(400, message, {
      code: ErrorCode.INVALID_INPUT,
      details,
    });
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, message, {
      code: ErrorCode.UNAUTHORIZED,
    });
  }

  static forbidden(message = 'Access denied'): ApiError {
    return new ApiError(403, message, {
      code: ErrorCode.FORBIDDEN,
    });
  }

  static notFound(resource = 'Resource'): ApiError {
    return new ApiError(404, `${resource} not found`, {
      code: ErrorCode.NOT_FOUND,
    });
  }

  static conflict(message: string, details?: Record<string, unknown> | string): ApiError {
    return new ApiError(409, message, {
      code: ErrorCode.CONFLICT,
      details,
    });
  }

  static validationError(message: string, details?: Record<string, unknown> | string): ApiError {
    return new ApiError(422, message, {
      code: ErrorCode.VALIDATION_ERROR,
      details,
    });
  }

  static rateLimitExceeded(message = 'Too many requests'): ApiError {
    return new ApiError(429, message, {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
    });
  }

  static internal(message = 'Internal server error', originalError?: Error): ApiError {
    return new ApiError(500, message, {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      isOperational: false,
      originalError,
    });
  }

  static databaseError(message = 'Database operation failed', originalError?: Error): ApiError {
    return new ApiError(500, message, {
      code: ErrorCode.DATABASE_ERROR,
      isOperational: false,
      originalError,
    });
  }

  static externalServiceError(service: string, originalError?: Error): ApiError {
    return new ApiError(502, `External service error: ${service}`, {
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      originalError,
    });
  }

  static businessRuleViolation(
    message: string,
    details?: Record<string, unknown> | string
  ): ApiError {
    return new ApiError(422, message, {
      code: ErrorCode.BUSINESS_RULE_VIOLATION,
      details,
    });
  }

  static serviceUnavailable(message: string, details?: Record<string, unknown> | string): ApiError {
    return new ApiError(503, message, {
      code: ErrorCode.SERVICE_UNAVAILABLE,
      details: typeof details === 'string' ? { message: details } : details,
    });
  }

  /**
   * Convert to a JSON response object
   */
  toJSON() {
    const response: {
      error: {
        message: string;
        code: ErrorCode;
        statusCode: number;
        timestamp: string;
        details?: Record<string, unknown> | string;
        stack?: string[];
      };
    } = {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
      },
    };

    // Include details only if present
    if (this.details) {
      response.error.details = this.details;
    }

    // In development, include stack trace
    if (process.env.NODE_ENV === 'development' && this.stack) {
      response.error.stack = this.stack.split('\n');
    }

    return response;
  }

  /**
   * Check if error is operational (expected) vs programming error
   */
  isOperationalError(): boolean {
    return this.isOperational;
  }
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Convert unknown errors to ApiError
 */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // Handle common error types
    if (error.message.includes('duplicate key')) {
      return ApiError.conflict('Resource already exists', { originalError: error.message });
    }
    if (error.message.includes('foreign key')) {
      return ApiError.badRequest('Invalid reference', { originalError: error.message });
    }
    if (error.message.includes('connection') || error.message.includes('ECONNREFUSED')) {
      return ApiError.databaseError('Database connection error', error);
    }

    // Generic error conversion
    return ApiError.internal(error.message, error);
  }

  // Handle non-Error objects
  if (typeof error === 'string') {
    return ApiError.internal(error);
  }

  return ApiError.internal('An unknown error occurred');
}
