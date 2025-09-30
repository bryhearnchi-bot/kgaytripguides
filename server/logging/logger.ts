/**
 * Winston Logger Configuration
 * Provides structured logging with different transports for development and production
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about our colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      // Don't include stack traces in console output (too verbose)
      const { stack, ...cleanMetadata } = metadata;

      if (Object.keys(cleanMetadata).length > 0) {
        msg += `\n${JSON.stringify(cleanMetadata, null, 2)}`;
      }
    }

    return msg;
  })
);

// Create transports
const transports: winston.transport[] = [];

// Console transport (always active)
if (process.env.NODE_ENV !== 'test') {
  transports.push(
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? format : consoleFormat,
      level: process.env.LOG_LEVEL || 'warn',
    })
  );
}

// File transports for production
if (process.env.NODE_ENV === 'production') {
  const logsDirectory = process.env.LOG_DIR || path.join(process.cwd(), 'logs');

  // Rotate daily logs for all levels
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDirectory, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info',
      format,
    })
  );

  // Separate error logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDirectory, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format,
    })
  );

  // Audit logs for sensitive operations
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDirectory, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '50m',
      maxFiles: '90d',
      format,
      auditFile: path.join(logsDirectory, 'audit-meta.json'),
    })
  );
}

// Create the Winston logger instance
const winstonLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create specialized loggers
export class Logger {
  private static instance: Logger;
  private baseLogger = winstonLogger;
  private requestId?: string;
  private userId?: string;
  private metadata: Record<string, any> = {};

  constructor() {
    if (Logger.instance) {
      return Logger.instance;
    }
    Logger.instance = this;
  }

  /**
   * Set request context for all subsequent logs
   */
  setContext(context: { requestId?: string; userId?: string; [key: string]: any }) {
    this.requestId = context.requestId;
    this.userId = context.userId;
    this.metadata = { ...context };
  }

  /**
   * Clear context
   */
  clearContext() {
    this.requestId = undefined;
    this.userId = undefined;
    this.metadata = {};
  }

  /**
   * Create child logger with additional metadata
   */
  child(metadata: Record<string, any>): Logger {
    const childLogger = new Logger();
    childLogger.metadata = { ...this.metadata, ...metadata };
    childLogger.requestId = this.requestId;
    childLogger.userId = this.userId;
    return childLogger;
  }

  private log(level: string, message: string, metadata?: Record<string, any>) {
    const logData: Record<string, any> = {
      ...this.metadata,
      ...metadata,
      requestId: this.requestId,
      userId: this.userId,
    };

    // Remove undefined values
    Object.keys(logData).forEach(key => {
      if (logData[key] === undefined) {
        delete logData[key];
      }
    });

    this.baseLogger.log(level, message, logData);
  }

  error(message: string, error?: Error | any, metadata?: Record<string, any>) {
    const errorData = error
      ? {
          errorMessage: error.message || error,
          errorStack: error.stack,
          errorName: error.name,
          ...metadata,
        }
      : metadata;

    this.log('error', message, errorData);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log('warn', message, metadata);
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log('info', message, metadata);
  }

  http(message: string, metadata?: Record<string, any>) {
    this.log('http', message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.log('debug', message, metadata);
  }

  /**
   * Audit log for sensitive operations
   */
  audit(action: string, metadata: Record<string, any>) {
    const auditData = {
      action,
      timestamp: new Date().toISOString(),
      userId: this.userId,
      requestId: this.requestId,
      ...metadata,
    };

    // Always log audit events at info level
    this.log('info', `AUDIT: ${action}`, {
      audit: true,
      ...auditData,
    });
  }

  /**
   * Performance log for tracking metrics
   */
  performance(operation: string, duration: number, metadata?: Record<string, any>) {
    this.log('info', `Performance: ${operation}`, {
      performance: true,
      operation,
      duration,
      ...metadata,
    });
  }

  /**
   * Security log for security-related events
   */
  security(event: string, metadata: Record<string, any>) {
    this.log('warn', `SECURITY: ${event}`, {
      security: true,
      event,
      ...metadata,
    });
  }

  /**
   * Database query log
   */
  query(query: string, duration: number, metadata?: Record<string, any>) {
    this.log('debug', 'Database query executed', {
      query: process.env.NODE_ENV === 'production' ? query.substring(0, 100) : query,
      duration,
      ...metadata,
    });
  }
}

// Create singleton instance
const loggerInstance = new Logger();

// Export stream for morgan HTTP logging
export const httpLogStream = {
  write: (message: string) => {
    loggerInstance.http(message.trim());
  },
};

// Handle uncaught exceptions and rejections
if (process.env.NODE_ENV === 'production') {
  process.on('uncaughtException', (error: Error) => {
    loggerInstance.error('Uncaught Exception', error);
    // Give the logger time to write before exiting
    setTimeout(() => process.exit(1), 1000);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    loggerInstance.error('Unhandled Rejection', reason, {
      promise: promise.toString(),
    });
  });
}

// Export as both named and default export
export const logger = loggerInstance;
export default loggerInstance;
