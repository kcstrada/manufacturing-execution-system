import { Module, Global, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantService } from './tenant.service';
import { TenantMiddleware } from './tenant.middleware';
import { TenantInterceptor } from './tenant.interceptor';
import { TenantGuard } from './tenant.guard';
import { TenantController } from './tenant.controller';
import { Tenant } from './entities/tenant.entity';
import { AuthModule } from '../auth/auth.module';

/**
 * Global module for multi-tenant functionality
 * Provides tenant isolation across the application
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant]),
    AuthModule,
  ],
  controllers: [TenantController],
  providers: [
    TenantService,
    TenantInterceptor,
    TenantGuard,
  ],
  exports: [
    TenantService,
    TenantInterceptor,
    TenantGuard,
  ],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant middleware to all routes
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}