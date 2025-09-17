import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggingService } from './logging.service';

/**
 * Global exception filter for logging errors
 */
@Catch()
@Injectable()
export class ErrorLoggingFilter implements ExceptionFilter {
  constructor(private readonly loggingService: LoggingService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Determine error details
    const errorResponse = this.getErrorResponse(exception);
    const status = this.getHttpStatus(exception);
    const isClientError = status >= 400 && status < 500;
    const isServerError = status >= 500;

    // Extract request context
    const requestContext = {
      method: request.method,
      url: request.url,
      path: request.path,
      ip: request.ip || request.connection.remoteAddress,
      userAgent: request.headers['user-agent'],
      requestId: request.headers['x-request-id'] as string,
      tenantId: (request as any).tenantId,
      userId: (request.user as any)?.id || (request.user as any)?.sub,
    };

    // Log based on error type
    if (isServerError) {
      // Log server errors with full stack trace
      this.loggingService.error(
        `Server Error: ${errorResponse.message}`,
        exception instanceof Error ? exception.stack : undefined,
        'HTTP_ERROR',
      );

      // Log additional context
      this.loggingService.error(
        'Server Error Details',
        undefined,
        'HTTP_ERROR',
      );
      this.loggingService.logWithLevel('error', 'Error Context', {
        ...requestContext,
        status,
        error: errorResponse,
        stack: exception instanceof Error ? exception.stack : undefined,
      });

      // Log to security if it's a potential security issue
      if (this.isSecurityError(exception)) {
        this.loggingService.security(
          `Security Error: ${errorResponse.message}`,
          'high',
          requestContext,
        );
      }
    } else if (isClientError) {
      // Log client errors at warn level
      this.loggingService.warn(
        `Client Error: ${errorResponse.message}`,
        'HTTP_ERROR',
      );

      // Log validation errors with details
      if (status === HttpStatus.BAD_REQUEST && errorResponse.errors) {
        this.loggingService.debug('Validation Error Details', 'VALIDATION');
        this.loggingService.logWithLevel('debug', 'Validation Errors', {
          ...requestContext,
          errors: errorResponse.errors,
        });
      }

      // Log authentication/authorization failures
      if (
        status === HttpStatus.UNAUTHORIZED ||
        status === HttpStatus.FORBIDDEN
      ) {
        this.loggingService.security(
          `Auth Failed: ${errorResponse.message}`,
          'medium',
          requestContext,
        );
      }
    } else {
      // Log other errors
      this.loggingService.log(`Error: ${errorResponse.message}`, 'HTTP_ERROR');
    }

    // Send error response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: requestContext.requestId,
      ...errorResponse,
    });
  }

  /**
   * Extract error response details
   */
  private getErrorResponse(exception: unknown): any {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'object') {
        return response;
      }
      return { message: response };
    }

    if (exception instanceof Error) {
      // Database errors
      if (this.isDatabaseError(exception)) {
        return {
          message: 'Database operation failed',
          error: 'Database Error',
          details:
            process.env.NODE_ENV === 'development'
              ? exception.message
              : undefined,
        };
      }

      // Validation errors
      if (this.isValidationError(exception)) {
        return {
          message: 'Validation failed',
          error: 'Validation Error',
          errors: (exception as any).errors || [],
        };
      }

      // Generic error
      return {
        message: exception.message || 'An error occurred',
        error: exception.name || 'Error',
      };
    }

    // Unknown error
    return {
      message: 'An unexpected error occurred',
      error: 'Unknown Error',
    };
  }

  /**
   * Get HTTP status code from exception
   */
  private getHttpStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    // Database errors
    if (exception instanceof Error) {
      if (this.isDatabaseError(exception)) {
        // Unique constraint violation
        if (
          exception.message.includes('duplicate key') ||
          exception.message.includes('UNIQUE constraint')
        ) {
          return HttpStatus.CONFLICT;
        }
        // Foreign key violation
        if (
          exception.message.includes('foreign key') ||
          exception.message.includes('FOREIGN KEY constraint')
        ) {
          return HttpStatus.BAD_REQUEST;
        }
        // Not found
        if (
          exception.message.includes('not found') ||
          exception.message.includes('does not exist')
        ) {
          return HttpStatus.NOT_FOUND;
        }
        // Connection error
        if (
          exception.message.includes('connect') ||
          exception.message.includes('ECONNREFUSED')
        ) {
          return HttpStatus.SERVICE_UNAVAILABLE;
        }
      }

      // Validation errors
      if (this.isValidationError(exception)) {
        return HttpStatus.BAD_REQUEST;
      }

      // JWT errors
      if (
        exception.name === 'JsonWebTokenError' ||
        exception.name === 'TokenExpiredError'
      ) {
        return HttpStatus.UNAUTHORIZED;
      }
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Check if error is database-related
   */
  private isDatabaseError(error: Error): boolean {
    const dbErrorPatterns = [
      'QueryFailedError',
      'EntityNotFoundError',
      'CannotCreateEntityIdMapError',
      'DuplicateError',
      'ER_',
      'SQLITE_',
      'PG::',
      'duplicate key',
      'foreign key',
      'constraint',
      'relation',
      'column',
      'table',
    ];

    return dbErrorPatterns.some(
      (pattern) =>
        error.name.includes(pattern) || error.message.includes(pattern),
    );
  }

  /**
   * Check if error is validation-related
   */
  private isValidationError(error: Error): boolean {
    const validationErrorNames = [
      'ValidationError',
      'ValidatorError',
      'CastError',
      'BadRequestException',
    ];

    return (
      validationErrorNames.includes(error.name) ||
      !!(error as any).errors ||
      !!(error as any).validationErrors
    );
  }

  /**
   * Check if error is security-related
   */
  private isSecurityError(exception: unknown): boolean {
    if (!(exception instanceof Error)) return false;

    const securityPatterns = [
      'injection',
      'xss',
      'csrf',
      'unauthorized',
      'forbidden',
      'authentication',
      'authorization',
      'permission',
      'access denied',
      'invalid token',
      'expired token',
    ];

    const message = exception.message.toLowerCase();
    return securityPatterns.some((pattern) => message.includes(pattern));
  }
}
