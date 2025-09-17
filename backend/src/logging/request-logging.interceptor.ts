import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggingService } from './logging.service';
import { Request, Response } from 'express';

/**
 * Interceptor for logging HTTP requests and responses
 */
@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Generate request ID if not present
    const requestId =
      (request.headers['x-request-id'] as string) || this.generateRequestId();

    // Add request ID to response headers
    response.setHeader('X-Request-Id', requestId);

    // Extract request metadata
    const requestMeta = {
      requestId,
      method: request.method,
      url: request.url,
      path: request.path,
      ip: request.ip || request.connection.remoteAddress,
      userAgent: request.headers['user-agent'],
      referer: request.headers['referer'],
      contentType: request.headers['content-type'],
      contentLength: request.headers['content-length'],
      tenantId: (request as any).tenantId,
      userId: (request.user as any)?.id || (request.user as any)?.sub,
    };

    // Log incoming request
    this.loggingService.http(`Incoming ${request.method} ${request.path}`, {
      type: 'REQUEST',
      ...requestMeta,
      body: this.sanitizeBody(request.body),
      query: request.query,
      params: request.params,
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          // Log successful response
          this.loggingService.http(
            `Outgoing ${request.method} ${request.path} ${statusCode}`,
            {
              type: 'RESPONSE',
              ...requestMeta,
              statusCode,
              duration,
              responseSize: this.getResponseSize(data),
            },
          );

          // Log performance metrics for slow requests
          if (duration > 1000) {
            this.loggingService.performance(
              `${request.method} ${request.path}`,
              duration,
              {
                slow: true,
                threshold: 1000,
              },
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Log error response
          this.loggingService.error(
            `Failed ${request.method} ${request.path} ${statusCode}`,
            error.stack,
            'REQUEST_ERROR',
          );

          // Additional error metadata
          this.loggingService.http(
            `Error ${request.method} ${request.path} ${statusCode}`,
            {
              type: 'ERROR_RESPONSE',
              ...requestMeta,
              statusCode,
              duration,
              error: {
                message: error.message,
                name: error.name,
                code: error.code,
              },
            },
          );
        },
      }),
    );
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize request body for logging
   */
  private sanitizeBody(body: any): any {
    if (!body) return undefined;

    // Clone the body to avoid modifying the original
    const sanitized = { ...body };

    // List of sensitive fields to redact
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'apiSecret',
      'accessToken',
      'refreshToken',
      'creditCard',
      'ssn',
      'pin',
    ];

    // Recursively sanitize object
    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;

      for (const key in obj) {
        const lowerKey = key.toLowerCase();

        // Check if field is sensitive
        if (
          sensitiveFields.some((field) =>
            lowerKey.includes(field.toLowerCase()),
          )
        ) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          obj[key] = sanitizeObject(obj[key]);
        } else if (typeof obj[key] === 'string' && obj[key].length > 1000) {
          // Truncate very long strings
          obj[key] = obj[key].substring(0, 1000) + '...[TRUNCATED]';
        }
      }

      return obj;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Calculate response size
   */
  private getResponseSize(data: any): number {
    if (!data) return 0;

    try {
      const jsonString = JSON.stringify(data);
      return Buffer.byteLength(jsonString, 'utf8');
    } catch {
      return -1; // Unable to calculate
    }
  }
}
