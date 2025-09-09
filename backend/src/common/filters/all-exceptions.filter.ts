import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

/**
 * Global exception filter that catches all exceptions
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  private readonly isDevelopment: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isDevelopment = this.configService.get('NODE_ENV') !== 'production';
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code
    const status = this.getStatus(exception);
    
    // Extract error details
    const errorResponse = this.getErrorResponse(exception, status, request);

    // Log the error
    this.logError(exception, request, status);

    // Send response
    response.status(status).json(errorResponse);
  }

  /**
   * Get HTTP status code from exception
   */
  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    
    // Handle specific error types
    if (this.isValidationError(exception)) {
      return HttpStatus.BAD_REQUEST;
    }
    
    if (this.isAuthenticationError(exception)) {
      return HttpStatus.UNAUTHORIZED;
    }
    
    if (this.isAuthorizationError(exception)) {
      return HttpStatus.FORBIDDEN;
    }
    
    if (this.isNotFoundError(exception)) {
      return HttpStatus.NOT_FOUND;
    }
    
    if (this.isConflictError(exception)) {
      return HttpStatus.CONFLICT;
    }
    
    if (this.isTimeoutError(exception)) {
      return HttpStatus.REQUEST_TIMEOUT;
    }
    
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Build error response object
   */
  private getErrorResponse(
    exception: unknown,
    status: number,
    request: Request,
  ): any {
    const timestamp = new Date().toISOString();
    const path = request.url;
    const method = request.method;
    const requestId = request.headers['x-request-id'] as string;

    // Base error response
    const errorResponse: any = {
      statusCode: status,
      timestamp,
      path,
      method,
      requestId,
    };

    // Add error details based on exception type
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      
      if (typeof response === 'object') {
        Object.assign(errorResponse, response);
      } else {
        errorResponse.message = response;
      }
      
      errorResponse.error = exception.name;
    } else if (exception instanceof Error) {
      errorResponse.message = exception.message;
      errorResponse.error = exception.name;
      
      // Include stack trace in development
      if (this.isDevelopment) {
        errorResponse.stack = exception.stack;
      }
    } else {
      errorResponse.message = 'Internal server error';
      errorResponse.error = 'InternalServerError';
    }

    // Add additional context in development
    if (this.isDevelopment) {
      errorResponse.debug = {
        headers: request.headers,
        query: request.query,
        params: request.params,
        ip: request.ip,
        userAgent: request.get('user-agent'),
      };
    }

    return errorResponse;
  }

  /**
   * Log error details
   */
  private logError(exception: unknown, request: Request, status: number): void {
    const message = this.getErrorMessage(exception);
    const context = {
      url: request.url,
      method: request.method,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      requestId: request.headers['x-request-id'],
      userId: (request as any).user?.id,
      tenantId: (request as any).tenant?.id,
      status,
    };

    if (status >= 500) {
      this.logger.error(message, exception instanceof Error ? exception.stack : '', context);
    } else if (status >= 400) {
      this.logger.warn(message, context);
    } else {
      this.logger.log(message, context);
    }
  }

  /**
   * Extract error message from exception
   */
  private getErrorMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object' && 'message' in response) {
        return Array.isArray(response.message)
          ? response.message.join(', ')
          : (response.message as string);
      }
      return exception.message;
    }
    
    if (exception instanceof Error) {
      return exception.message;
    }
    
    return 'Unknown error occurred';
  }

  /**
   * Check if exception is a validation error
   */
  private isValidationError(exception: unknown): boolean {
    return (
      exception instanceof Error &&
      (exception.name === 'ValidationError' ||
        exception.name === 'ValidatorError' ||
        exception.message.includes('validation'))
    );
  }

  /**
   * Check if exception is an authentication error
   */
  private isAuthenticationError(exception: unknown): boolean {
    return (
      exception instanceof Error &&
      (exception.name === 'UnauthorizedException' ||
        exception.name === 'AuthenticationError' ||
        exception.message.toLowerCase().includes('unauthorized') ||
        exception.message.toLowerCase().includes('authentication'))
    );
  }

  /**
   * Check if exception is an authorization error
   */
  private isAuthorizationError(exception: unknown): boolean {
    return (
      exception instanceof Error &&
      (exception.name === 'ForbiddenException' ||
        exception.name === 'AuthorizationError' ||
        exception.message.toLowerCase().includes('forbidden') ||
        exception.message.toLowerCase().includes('permission'))
    );
  }

  /**
   * Check if exception is a not found error
   */
  private isNotFoundError(exception: unknown): boolean {
    return (
      exception instanceof Error &&
      (exception.name === 'NotFoundException' ||
        exception.name === 'EntityNotFoundError' ||
        exception.message.toLowerCase().includes('not found'))
    );
  }

  /**
   * Check if exception is a conflict error
   */
  private isConflictError(exception: unknown): boolean {
    return (
      exception instanceof Error &&
      (exception.name === 'ConflictException' ||
        exception.name === 'ConflictError' ||
        exception.message.toLowerCase().includes('already exists') ||
        exception.message.toLowerCase().includes('duplicate'))
    );
  }

  /**
   * Check if exception is a timeout error
   */
  private isTimeoutError(exception: unknown): boolean {
    return (
      exception instanceof Error &&
      (exception.name === 'TimeoutError' ||
        exception.name === 'RequestTimeoutException' ||
        exception.message.toLowerCase().includes('timeout'))
    );
  }
}