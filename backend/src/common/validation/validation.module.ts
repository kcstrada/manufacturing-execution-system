import { Module, Global } from '@nestjs/common';
import { APP_PIPE, APP_FILTER } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ValidationExceptionFilter } from '../filters/validation-exception.filter';
import { getValidationPipeConfig } from './validation.config';

/**
 * Global validation module
 * Provides validation pipe and exception filter globally
 */
@Global()
@Module({
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () => {
        const isProduction = process.env.NODE_ENV === 'production';
        return new ValidationPipe(getValidationPipeConfig(isProduction));
      },
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
  ],
  exports: [],
})
export class ValidationModule {}
