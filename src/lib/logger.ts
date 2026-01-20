/**
 * Structured Logging Utility
 *
 * Provides consistent logging across the app with automatic Sentry integration.
 * Replaces scattered console.log statements with structured, filterable logs.
 */

import { captureException, captureMessage } from './sentry';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private enabled = __DEV__;
  private prefix = '[Blend]';

  /**
   * Debug-level logs (only in development)
   * Use for detailed debugging information
   */
  debug(message: string, context?: LogContext) {
    if (!this.enabled) return;
    console.log(`${this.prefix} [DEBUG]`, message, context || '');
  }

  /**
   * Info-level logs (always shown)
   * Use for general information
   */
  info(message: string, context?: LogContext) {
    console.log(`${this.prefix} [INFO]`, message, context || '');
  }

  /**
   * Warning-level logs (always shown)
   * Use for recoverable issues
   */
  warn(message: string, context?: LogContext) {
    console.warn(`${this.prefix} [WARN]`, message, context || '');

    // Send to Sentry in production
    if (!__DEV__) {
      captureMessage(`[WARN] ${message}`, 'warning');
    }
  }

  /**
   * Error-level logs (always shown + sent to Sentry)
   * Use for errors and exceptions
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    console.error(`${this.prefix} [ERROR]`, message, error, context || '');

    // Always send errors to Sentry in production
    if (!__DEV__) {
      if (error instanceof Error) {
        captureException(error, { message, ...context });
      } else {
        captureMessage(`[ERROR] ${message}`, 'error');
      }
    }
  }

  /**
   * Feature-specific logger
   * Creates a scoped logger for a specific feature/module
   */
  scope(feature: string): ScopedLogger {
    return new ScopedLogger(feature, this);
  }
}

/**
 * Scoped logger for specific features
 * Automatically adds feature name to all logs
 */
class ScopedLogger {
  constructor(
    private feature: string,
    private parent: Logger
  ) {}

  debug(message: string, context?: LogContext) {
    this.parent.debug(`[${this.feature}] ${message}`, context);
  }

  info(message: string, context?: LogContext) {
    this.parent.info(`[${this.feature}] ${message}`, context);
  }

  warn(message: string, context?: LogContext) {
    this.parent.warn(`[${this.feature}] ${message}`, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    this.parent.error(`[${this.feature}] ${message}`, error, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export scoped loggers for common features
export const authLogger = logger.scope('Auth');
export const matchingLogger = logger.scope('Matching');
export const messagingLogger = logger.scope('Messaging');
export const eventsLogger = logger.scope('Events');
export const profileLogger = logger.scope('Profile');
export const photosLogger = logger.scope('Photos');
export const trustLogger = logger.scope('Trust');
export const gamesLogger = logger.scope('Games');
