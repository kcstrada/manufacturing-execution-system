import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';

/**
 * Enhanced logging service with context support
 */
@Injectable()
export class LoggingService implements LoggerService {
  private context?: string;
  private readonly isDevelopment: boolean;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {
    this.isDevelopment = configService.get('NODE_ENV') !== 'production';
  }

  /**
   * Set logging context
   */
  setContext(context: string) {
    this.context = context;
  }

  /**
   * Log message with info level
   */
  log(message: any, context?: string) {
    this.logger.info(this.formatMessage(message), {
      context: context || this.context,
    });
  }

  /**
   * Log error message
   */
  error(message: any, trace?: string, context?: string) {
    const errorObj = message instanceof Error ? message : new Error(message);

    this.logger.error(this.formatMessage(errorObj.message), {
      context: context || this.context,
      stack: trace || errorObj.stack,
      error: {
        name: errorObj.name,
        message: errorObj.message,
        stack: errorObj.stack,
      },
    });
  }

  /**
   * Log warning message
   */
  warn(message: any, context?: string) {
    this.logger.warn(this.formatMessage(message), {
      context: context || this.context,
    });
  }

  /**
   * Log debug message
   */
  debug(message: any, context?: string) {
    if (this.isDevelopment) {
      this.logger.debug(this.formatMessage(message), {
        context: context || this.context,
      });
    }
  }

  /**
   * Log verbose message
   */
  verbose(message: any, context?: string) {
    this.logger.verbose(this.formatMessage(message), {
      context: context || this.context,
    });
  }

  /**
   * Log HTTP request
   */
  http(message: any, meta?: any) {
    this.logger.http(this.formatMessage(message), {
      context: this.context,
      ...meta,
    });
  }

  /**
   * Log with custom level
   */
  logWithLevel(level: string, message: any, meta?: any) {
    this.logger.log(level, this.formatMessage(message), {
      context: this.context,
      ...meta,
    });
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, meta?: any) {
    this.logger.info(`Performance: ${operation}`, {
      context: this.context,
      performance: {
        operation,
        duration,
        unit: 'ms',
      },
      ...meta,
    });
  }

  /**
   * Log audit event
   */
  audit(action: string, userId: string, resource: string, meta?: any) {
    this.logger.info(`Audit: ${action}`, {
      context: 'AUDIT',
      audit: {
        action,
        userId,
        resource,
        timestamp: new Date().toISOString(),
      },
      ...meta,
    });
  }

  /**
   * Log security event
   */
  security(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    meta?: any,
  ) {
    const level =
      severity === 'critical' || severity === 'high' ? 'error' : 'warn';

    this.logger.log(level, `Security: ${event}`, {
      context: 'SECURITY',
      security: {
        event,
        severity,
        timestamp: new Date().toISOString(),
      },
      ...meta,
    });
  }

  /**
   * Log database query
   */
  query(query: string, parameters?: any[], duration?: number) {
    if (
      this.isDevelopment ||
      this.configService.get('LOG_DATABASE_QUERIES') === 'true'
    ) {
      this.logger.debug('Database Query', {
        context: 'DATABASE',
        database: {
          query: this.sanitizeQuery(query),
          parameters: this.sanitizeParameters(parameters),
          duration,
        },
      });
    }
  }

  /**
   * Log cache operation
   */
  cache(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, meta?: any) {
    if (this.configService.get('LOG_CACHE_OPERATIONS') === 'true') {
      this.logger.debug(`Cache ${operation}: ${key}`, {
        context: 'CACHE',
        cache: {
          operation,
          key,
        },
        ...meta,
      });
    }
  }

  /**
   * Log queue event
   */
  queue(queue: string, event: string, jobId?: string, meta?: any) {
    this.logger.info(`Queue ${event}: ${queue}`, {
      context: 'QUEUE',
      queue: {
        name: queue,
        event,
        jobId,
      },
      ...meta,
    });
  }

  /**
   * Log integration event
   */
  integration(service: string, event: string, meta?: any) {
    this.logger.info(`Integration ${service}: ${event}`, {
      context: 'INTEGRATION',
      integration: {
        service,
        event,
        timestamp: new Date().toISOString(),
      },
      ...meta,
    });
  }

  /**
   * Create child logger with context
   */
  child(context: string): LoggingService {
    const childLogger = Object.create(this);
    childLogger.context = context;
    return childLogger;
  }

  /**
   * Format message
   */
  private formatMessage(message: any): string {
    if (typeof message === 'object' && message !== null) {
      return JSON.stringify(message);
    }
    return String(message);
  }

  /**
   * Sanitize SQL query for logging
   */
  private sanitizeQuery(query: string): string {
    // Truncate very long queries
    if (query.length > 1000) {
      return query.substring(0, 1000) + '...';
    }
    return query;
  }

  /**
   * Sanitize parameters for logging
   */
  private sanitizeParameters(parameters?: any[]): any[] | undefined {
    if (!parameters) return undefined;

    return parameters.map((param) => {
      // Hide sensitive data
      if (typeof param === 'string' && param.length > 100) {
        return '[TRUNCATED]';
      }
      if (typeof param === 'object' && param !== null && param.password) {
        return { ...param, password: '[REDACTED]' };
      }
      return param;
    });
  }
}
