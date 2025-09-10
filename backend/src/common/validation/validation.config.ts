import { ValidationPipeOptions } from '@nestjs/common';

/**
 * Global validation pipe configuration
 */
export const validationPipeConfig: ValidationPipeOptions = {
  // Automatically transform payloads to DTO instances
  transform: true,
  
  // Enable implicit type conversion
  transformOptions: {
    enableImplicitConversion: true,
    enableCircularCheck: true,
  },
  
  // Strip properties that are not in the DTO
  whitelist: true,
  
  // Throw error if non-whitelisted properties are present
  forbidNonWhitelisted: true,
  
  // Throw error if unknown values are present
  forbidUnknownValues: true,
  
  // Disable detailed error messages in production
  disableErrorMessages: process.env.NODE_ENV === 'production',
  
  // Validate nested objects
  validateCustomDecorators: true,
  
  // Always validate, even if skipMissingProperties is true
  always: true,
  
  // Strict validation groups
  strictGroups: true,
  
  // Dismiss default messages
  dismissDefaultMessages: false,
  
  // Validation error options
  validationError: {
    target: false,
    value: process.env.NODE_ENV !== 'production',
  },
  
  // Stop at first error for each property
  stopAtFirstError: false,
  
  // Skip missing properties (undefined values)
  skipMissingProperties: false,
  
  // Skip null values
  skipNullProperties: false,
  
  // Skip undefined values
  skipUndefinedProperties: false,
  
  // Enable debug mode in development
  enableDebugMessages: process.env.NODE_ENV === 'development',
  
  // Groups to validate
  groups: [],
};

/**
 * Validation constants
 */
export const VALIDATION_CONSTANTS = {
  // String lengths
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 0,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_CODE_LENGTH: 2,
  MAX_CODE_LENGTH: 50,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  
  // Numeric ranges
  MIN_QUANTITY: 0,
  MAX_QUANTITY: 999999,
  MIN_PRICE: 0,
  MAX_PRICE: 9999999.99,
  MIN_PERCENTAGE: 0,
  MAX_PERCENTAGE: 100,
  
  // Date ranges
  MIN_DATE_OFFSET_DAYS: -365,
  MAX_DATE_OFFSET_DAYS: 365,
  
  // Array sizes
  MIN_ARRAY_SIZE: 0,
  MAX_ARRAY_SIZE: 1000,
  MAX_BATCH_SIZE: 100,
  
  // File sizes
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  
  // Regex patterns
  PATTERNS: {
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    PHONE: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
    ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
    ALPHANUMERIC_WITH_SPACE: /^[a-zA-Z0-9\s]+$/,
    SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    SKU: /^[A-Z0-9-]+$/,
    LOT_NUMBER: /^[A-Z0-9-]+$/,
    SERIAL_NUMBER: /^[A-Z0-9-]+$/,
    BARCODE: /^[0-9]+$/,
    COLOR_HEX: /^#[0-9A-F]{6}$/i,
  },
  
  // Error messages
  MESSAGES: {
    REQUIRED: '$property is required',
    STRING: '$property must be a string',
    NUMBER: '$property must be a number',
    BOOLEAN: '$property must be a boolean',
    DATE: '$property must be a valid date',
    ARRAY: '$property must be an array',
    OBJECT: '$property must be an object',
    EMAIL: '$property must be a valid email',
    PHONE: '$property must be a valid phone number',
    URL: '$property must be a valid URL',
    UUID: '$property must be a valid UUID',
    MIN_LENGTH: '$property must be at least $constraint1 characters',
    MAX_LENGTH: '$property must not exceed $constraint1 characters',
    MIN_VALUE: '$property must be at least $constraint1',
    MAX_VALUE: '$property must not exceed $constraint1',
    MIN_DATE: '$property must be after $constraint1',
    MAX_DATE: '$property must be before $constraint1',
    UNIQUE: '$property must be unique',
    EXISTS: '$property does not exist',
    INVALID_FORMAT: '$property has invalid format',
    CUSTOM: '$property validation failed',
  },
  
  // Allowed mime types
  ALLOWED_MIME_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    SPREADSHEET: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    CSV: ['text/csv', 'application/csv'],
    JSON: ['application/json'],
    XML: ['application/xml', 'text/xml'],
  },
  
  // Allowed file extensions
  ALLOWED_EXTENSIONS: {
    IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    DOCUMENT: ['.pdf', '.doc', '.docx'],
    SPREADSHEET: ['.xls', '.xlsx'],
    CSV: ['.csv'],
    JSON: ['.json'],
    XML: ['.xml'],
  },
};

/**
 * Get validation pipe configuration for specific environment
 */
export function getValidationPipeConfig(isProduction: boolean): ValidationPipeOptions {
  return {
    ...validationPipeConfig,
    disableErrorMessages: isProduction,
    enableDebugMessages: !isProduction,
    validationError: {
      target: false,
      value: !isProduction,
    },
  };
}