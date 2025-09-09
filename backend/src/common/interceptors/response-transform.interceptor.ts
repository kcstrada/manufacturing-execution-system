import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
  duration?: number;
  meta?: any;
}

/**
 * Interceptor that transforms all responses to a consistent format
 */
@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  private readonly logger = new Logger(ResponseTransformInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();
    const requestId = request.headers['x-request-id'] as string;

    return next.handle().pipe(
      map((data) => {
        const duration = Date.now() - startTime;
        
        // Skip transformation for certain endpoints
        if (this.shouldSkipTransformation(request.url)) {
          return data;
        }

        // Handle paginated responses
        if (this.isPaginatedResponse(data)) {
          return this.transformPaginatedResponse(
            data,
            request,
            requestId,
            duration,
          );
        }

        // Standard response transformation
        const transformedResponse: ApiResponse<T> = {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          path: request.url,
          method: request.method,
          requestId,
          duration,
        };

        // Add response headers
        response.setHeader('X-Response-Time', `${duration}ms`);
        response.setHeader('X-Request-Id', requestId || 'unknown');

        // Log successful response
        this.logger.log(
          `${request.method} ${request.url} - ${response.statusCode} - ${duration}ms`,
        );

        return transformedResponse;
      }),
    );
  }

  /**
   * Check if response should skip transformation
   */
  private shouldSkipTransformation(url: string): boolean {
    // Skip transformation for health checks, metrics, and Swagger
    const skipPaths = [
      '/health',
      '/metrics',
      '/api/docs',
      '/api/docs-json',
      '/favicon.ico',
    ];
    
    return skipPaths.some(path => url.includes(path));
  }

  /**
   * Check if response is paginated
   */
  private isPaginatedResponse(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      'items' in data &&
      'meta' in data &&
      Array.isArray(data.items)
    );
  }

  /**
   * Transform paginated response
   */
  private transformPaginatedResponse(
    data: any,
    request: Request,
    requestId: string,
    duration: number,
  ): any {
    return {
      success: true,
      data: data.items,
      meta: {
        ...data.meta,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        requestId,
        duration,
      },
    };
  }
}