import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { createWinstonConfig } from './winston.config';
import { LoggingService } from './logging.service';
import { LoggingController } from './logging.controller';
import { RequestLoggingInterceptor } from './request-logging.interceptor';
import { ErrorLoggingFilter } from './error-logging.filter';

/**
 * Global logging module
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        return createWinstonConfig(isProduction);
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [LoggingController],
  providers: [LoggingService, RequestLoggingInterceptor, ErrorLoggingFilter],
  exports: [
    LoggingService,
    RequestLoggingInterceptor,
    ErrorLoggingFilter,
    WinstonModule,
  ],
})
export class LoggingModule {}
