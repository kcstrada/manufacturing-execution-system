import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

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
    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request.headers['x-request-id'] as string,
      error: 'Validation Error',
    };

    // Process validation errors
    if (exceptionResponse.message) {
      if (Array.isArray(exceptionResponse.message)) {
        // Parse validation messages
        errorResponse.message = 'Validation failed';
        errorResponse.errors = this.formatValidationErrors(exceptionResponse.message);
      } else {
        errorResponse.message = exceptionResponse.message;
      }
    } else {
      errorResponse.message = 'Validation failed';
    }

    // Log validation error
    this.logger.warn(`Validation failed for ${request.method} ${request.url}`, {
      errors: errorResponse.errors,
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
  private formatValidationErrors(messages: string[]): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    messages.forEach((message) => {
      // Try to parse field name from validation message
      // Format: "field.nested should not be empty"
      const match = message.match(/^([a-zA-Z0-9_.]+)\s+(.+)$/);
      
      if (match) {
        const [, field, error] = match;
        if (field && !errors[field]) {
          errors[field] = [];
        }
        if (field && error) {
          errors[field]?.push(error);
        }
      } else {
        // If no field can be parsed, use 'general' as key
        if (!errors.general) {
          errors.general = [];
        }
        errors.general.push(message);
      }
    });

    return errors;
  }
}