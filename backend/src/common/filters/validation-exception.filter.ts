import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';

interface ValidationErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  method: string;
  requestId?: string;
  validationErrors?: Record<string, string[]>;
  details?: any;
}

/**
 * Filter for handling validation exceptions
 */
@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    // Build validation error response
    const errorResponse: ValidationErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'] as string,
      error: 'Validation Error',
      message: 'Validation failed',
    };

    // Process validation errors
    if (exceptionResponse.message) {
      if (Array.isArray(exceptionResponse.message)) {
        // Parse validation messages
        errorResponse.validationErrors = this.formatValidationErrors(
          exceptionResponse.message,
        );
        errorResponse.message = this.generateSummaryMessage(
          errorResponse.validationErrors,
        );
      } else {
        errorResponse.message = exceptionResponse.message;
      }
    }

    // Add details in development mode
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = {
        body: request.body,
        query: request.query,
        params: request.params,
        headers: this.sanitizeHeaders(request.headers),
      };
    }

    // Log validation error
    this.logger.warn(`Validation failed for ${request.method} ${request.url}`, {
      errors: errorResponse.validationErrors,
      body: request.body,
      query: request.query,
      params: request.params,
      userId: (request as any).user?.id,
      tenantId: (request as any).tenant?.id,
    });

    // Send response
    response.status(status).json(errorResponse);
  }

  /**
   * Format validation errors into a structured format
   */
  private formatValidationErrors(errors: any[]): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};

    for (const error of errors) {
      if (typeof error === 'string') {
        // Simple string error
        const match = error.match(/^([a-zA-Z0-9_.]+)\s+(.+)$/);

        if (match) {
          const [, field, message] = match;
          if (field) {
            if (!formatted[field]) {
              formatted[field] = [];
            }
            if (message) {
              formatted[field].push(message);
            }
          }
        } else {
          if (!formatted.general) {
            formatted.general = [];
          }
          formatted.general.push(error);
        }
      } else if (error.constraints) {
        // Validation error object
        const property = error.property;
        const messages = Object.values(error.constraints).filter(
          (msg): msg is string => typeof msg === 'string',
        );

        if (!formatted[property]) {
          formatted[property] = [];
        }
        formatted[property].push(...messages);

        // Handle nested validation errors
        if (error.children && error.children.length > 0) {
          const nestedErrors = this.formatNestedValidationErrors(
            error.children,
            property,
          );
          Object.assign(formatted, nestedErrors);
        }
      }
    }

    return formatted;
  }

  /**
   * Format nested validation errors
   */
  private formatNestedValidationErrors(
    errors: ValidationError[],
    parentProperty: string,
  ): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};

    for (const error of errors) {
      const property = `${parentProperty}.${error.property}`;

      if (error.constraints) {
        const messages = Object.values(error.constraints);

        if (!formatted[property]) {
          formatted[property] = [];
        }
        formatted[property].push(...messages);
      }

      // Recursively handle deeper nested errors
      if (error.children && error.children.length > 0) {
        const nestedErrors = this.formatNestedValidationErrors(
          error.children,
          property,
        );
        Object.assign(formatted, nestedErrors);
      }
    }

    return formatted;
  }

  /**
   * Generate a summary message from validation errors
   */
  private generateSummaryMessage(errors: Record<string, string[]>): string {
    const errorCount = Object.keys(errors).length;
    const totalErrors = Object.values(errors).reduce(
      (sum, arr) => sum + arr.length,
      0,
    );

    if (errorCount === 1) {
      const field = Object.keys(errors)[0];
      if (field) {
        const messages = errors[field];
        if (messages && messages.length > 0) {
          return `Validation failed for ${field}: ${messages[0]}`;
        }
      }
    }

    return `Validation failed with ${totalErrors} error(s) in ${errorCount} field(s)`;
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
