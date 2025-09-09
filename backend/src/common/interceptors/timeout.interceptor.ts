import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
  Logger,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

export const TIMEOUT_KEY = 'request-timeout';

/**
 * Decorator to set custom timeout for an endpoint
 */
export const Timeout = (ms: number) => {
  return (target: any, _propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(TIMEOUT_KEY, ms, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(TIMEOUT_KEY, ms, target);
    return target;
  };
};

/**
 * Interceptor that adds timeout to requests
 */
@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimeoutInterceptor.name);
  private readonly defaultTimeout = 30000; // 30 seconds default

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Get custom timeout from metadata
    const customTimeout = this.reflector.get<number>(
      TIMEOUT_KEY,
      context.getHandler(),
    );
    
    const timeoutValue = customTimeout || this.getTimeoutByContext(context);
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      timeout(timeoutValue),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          const message = `Request timeout after ${timeoutValue}ms`;
          
          this.logger.warn(message, {
            url: request.url,
            method: request.method,
            timeout: timeoutValue,
            userId: request.user?.id,
            tenantId: request.tenant?.id,
          });

          return throwError(
            () => new RequestTimeoutException({
              message,
              error: 'Request Timeout',
              statusCode: 408,
              path: request.url,
              method: request.method,
              timeout: timeoutValue,
            }),
          );
        }
        return throwError(() => err);
      }),
    );
  }

  /**
   * Get timeout value based on request context
   */
  private getTimeoutByContext(context: ExecutionContext): number {
    const request = context.switchToHttp().getRequest();
    const url = request.url;
    const method = request.method;

    // File upload endpoints - longer timeout
    if (url.includes('/upload') || url.includes('/import')) {
      return 5 * 60 * 1000; // 5 minutes
    }

    // Export/report endpoints - longer timeout
    if (url.includes('/export') || url.includes('/report')) {
      return 2 * 60 * 1000; // 2 minutes
    }

    // Batch operations - longer timeout
    if (url.includes('/batch') || method === 'PATCH') {
      return 60 * 1000; // 1 minute
    }

    // Health checks - short timeout
    if (url.includes('/health')) {
      return 5000; // 5 seconds
    }

    // Default timeout
    return this.defaultTimeout;
  }
}