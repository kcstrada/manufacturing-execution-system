import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiTooManyRequestsResponse,
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiResponse,
} from '@nestjs/swagger';

/**
 * Common API documentation decorator for standard responses
 */
export function ApiStandardResponses() {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Bad Request - Invalid input data',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: { type: 'string', example: 'Validation failed' },
          error: { type: 'string', example: 'Bad Request' },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Authentication required',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Unauthorized' },
        },
      },
    }),
    ApiForbiddenResponse({
      description: 'Forbidden - Insufficient permissions',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 403 },
          message: { type: 'string', example: 'Forbidden resource' },
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal Server Error',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 500 },
          message: { type: 'string', example: 'Internal server error' },
        },
      },
    }),
  );
}

/**
 * Paginated response decorator
 */
export function ApiPaginatedResponse<TModel extends Type<any>>(
  model: TModel,
  description?: string,
) {
  return applyDecorators(
    ApiOkResponse({
      description: description || `Paginated list of ${model.name}`,
      schema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { $ref: `#/components/schemas/${model.name}` },
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number', example: 100 },
              page: { type: 'number', example: 1 },
              limit: { type: 'number', example: 10 },
              totalPages: { type: 'number', example: 10 },
            },
          },
        },
      },
    }),
  );
}

/**
 * JWT Authentication required decorator
 */
export function ApiAuth(...guards: string[]) {
  if (guards.length === 0) {
    guards = ['JWT-auth'];
  }
  return applyDecorators(
    ApiBearerAuth('JWT-auth'),
    ...guards.map(guard => ApiSecurity(guard)),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
  );
}

/**
 * API Key Authentication required decorator
 */
export function ApiKeyAuth() {
  return applyDecorators(
    ApiSecurity('api-key'),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Invalid or missing API key',
    }),
  );
}

/**
 * File upload decorator
 */
export function ApiFile(
  fieldName = 'file',
  required = true,
  isArray = false,
) {
  return applyDecorators(
    ApiResponse({
      schema: {
        type: 'object',
        required: required ? [fieldName] : [],
        properties: {
          [fieldName]: isArray
            ? {
                type: 'array',
                items: {
                  type: 'string',
                  format: 'binary',
                },
              }
            : {
                type: 'string',
                format: 'binary',
              },
        },
      },
    }),
  );
}

/**
 * Multi-tenant API decorator
 */
export function ApiTenant() {
  return applyDecorators(
    ApiResponse({
      headers: {
        'X-Tenant-Id': {
          description: 'Tenant identifier',
          schema: { type: 'string' },
        },
      },
    }),
  );
}

/**
 * Rate limited endpoint decorator
 */
export function ApiRateLimit(limit: number, ttl: number) {
  return applyDecorators(
    ApiTooManyRequestsResponse({
      description: `Rate limit exceeded. Maximum ${limit} requests per ${ttl} seconds`,
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 429 },
          message: { type: 'string', example: 'Too Many Requests' },
          retryAfter: { type: 'number', example: ttl },
        },
      },
    }),
    ApiResponse({
      headers: {
        'X-RateLimit-Limit': {
          description: 'Request limit per window',
          schema: { type: 'number', example: limit },
        },
        'X-RateLimit-Remaining': {
          description: 'Remaining requests in window',
          schema: { type: 'number' },
        },
        'X-RateLimit-Reset': {
          description: 'Time when the rate limit resets',
          schema: { type: 'string', format: 'date-time' },
        },
      },
    }),
  );
}

/**
 * WebSocket event documentation decorator
 */
export function ApiWebSocketEvent(eventName: string, dataType?: Type<any>) {
  return applyDecorators(
    ApiResponse({
      description: `WebSocket event: ${eventName}`,
      schema: dataType
        ? {
            type: 'object',
            properties: {
              event: { type: 'string', example: eventName },
              data: { $ref: `#/components/schemas/${dataType.name}` },
            },
          }
        : {
            type: 'object',
            properties: {
              event: { type: 'string', example: eventName },
              data: { type: 'object' },
            },
          },
    }),
  );
}