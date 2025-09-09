import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Filter for handling HTTP exceptions
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Build error response
    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'] as string,
    };

    // Handle different response formats
    if (typeof exceptionResponse === 'string') {
      errorResponse.message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      // Merge exception response with error response
      Object.assign(errorResponse, exceptionResponse);
      
      // Ensure message is always present
      if (!errorResponse.message) {
        errorResponse.message = exception.message || 'An error occurred';
      }
      
      // Format validation errors
      if (Array.isArray(errorResponse.message)) {
        errorResponse.errors = errorResponse.message;
        errorResponse.message = 'Validation failed';
      }
    }

    // Add error type
    errorResponse.error = errorResponse.error || exception.name;

    // Log the error
    this.logError(exception, request, errorResponse);

    // Send response
    response.status(status).json(errorResponse);
  }

  /**
   * Log error based on severity
   */
  private logError(
    exception: HttpException,
    request: Request,
    errorResponse: any,
  ): void {
    const context = {
      url: request.url,
      method: request.method,
      statusCode: exception.getStatus(),
      requestId: request.headers['x-request-id'],
      userId: (request as any).user?.id,
      tenantId: (request as any).tenant?.id,
      ip: request.ip,
      userAgent: request.get('user-agent'),
    };

    const status = exception.getStatus();
    const message = `${exception.name}: ${errorResponse.message}`;

    if (status >= 500) {
      this.logger.error(message, exception.stack, context);
    } else if (status >= 400) {
      this.logger.warn(message, context);
    } else {
      this.logger.log(message, context);
    }
  }
}