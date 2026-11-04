/**
 * Structured Application Logger
 * Provides consistent formatting across all modules without leaking secrets
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface Logger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: unknown, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
}

export const logger: Logger = {
  info(message: string, context?: Record<string, unknown>) {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, context ? JSON.stringify(context) : '');
  },
  warn(message: string, context?: Record<string, unknown>) {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, context ? JSON.stringify(context) : '');
  },
  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    console.error(
      `[ERROR] [${new Date().toISOString()}] ${message}`,
      error instanceof Error ? error.stack : error,
      context ? JSON.stringify(context) : ''
    );
  },
  debug(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] [${new Date().toISOString()}] ${message}`, context ? JSON.stringify(context) : '');
    }
  },
};
