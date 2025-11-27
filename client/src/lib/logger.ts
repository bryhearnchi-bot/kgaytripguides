/**
 * Client-side Logger Service
 * Provides structured logging with environment-aware output
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LoggerConfig {
  /** Minimum log level to output */
  minLevel: LogLevel;
  /** Whether to include timestamps */
  timestamps: boolean;
  /** Whether to output in production */
  enableInProduction: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isDevelopment = import.meta.env.DEV;

const defaultConfig: LoggerConfig = {
  minLevel: isDevelopment ? 'debug' : 'warn',
  timestamps: true,
  enableInProduction: true, // Only warn and error in production
};

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enableInProduction && !isDevelopment) {
      return false;
    }
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = this.config.timestamps ? `[${new Date().toISOString()}]` : '';
    const levelTag = `[${level.toUpperCase()}]`;
    return `${timestamp}${levelTag} ${message}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext | Error): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message);

    // Handle Error objects specially
    if (context instanceof Error) {
      const consoleFn =
        level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      consoleFn(formattedMessage, { message: context.message, stack: context.stack });
      return;
    }

    switch (level) {
      case 'debug':
        if (context) {
          console.debug(formattedMessage, context);
        } else {
          console.debug(formattedMessage);
        }
        break;
      case 'info':
        if (context) {
          console.info(formattedMessage, context);
        } else {
          console.info(formattedMessage);
        }
        break;
      case 'warn':
        if (context) {
          console.warn(formattedMessage, context);
        } else {
          console.warn(formattedMessage);
        }
        break;
      case 'error':
        if (context) {
          console.error(formattedMessage, context);
        } else {
          console.error(formattedMessage);
        }
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | LogContext): void {
    this.log('error', message, error);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for custom instances
export { Logger };
export type { LogLevel, LogContext, LoggerConfig };
