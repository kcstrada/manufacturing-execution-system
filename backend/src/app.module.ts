import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { LoggingModule } from './logging/logging.module';
import { HealthModule } from './health/health.module';
import { RequestLoggingInterceptor } from './logging/request-logging.interceptor';
import { ErrorLoggingFilter } from './logging/error-logging.filter';
import { AuthModule } from './auth/auth.module';
import { PermissionsModule } from './permissions/permissions.module';
import { TenantModule } from './tenants/tenant.module';
import { SeedModule } from './database/seeds/seed.module';
import { OrderModule } from './modules/order/order.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { 
  AllExceptionsFilter,
  HttpExceptionFilter,
  ValidationExceptionFilter 
} from './common/filters';
import {
  ResponseTransformInterceptor,
  TimeoutInterceptor
} from './common/interceptors';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database - Using improved configuration
    DatabaseModule,

    // Redis Module with caching and queue management
    RedisModule,

    // Logging Module with Winston
    LoggingModule,

    // Health Check and Monitoring Module
    HealthModule,

    // Redis Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('RATE_LIMIT_TTL', 60),
          limit: config.get('RATE_LIMIT_MAX', 100),
        },
      ],
    }),

    // Feature Modules
    TenantModule, // Must be first to apply middleware
    AuthModule,
    PermissionsModule,
    OrderModule,
    InventoryModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    
    // Global Interceptors (order matters - executed in registration order)
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
    // Note: CacheInterceptor should be registered per-module or per-controller
    // to avoid caching all endpoints globally
    
    // Global Exception Filters (order matters - executed in reverse registration order)
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ValidationExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ErrorLoggingFilter,
    },
  ],
})
export class AppModule {}