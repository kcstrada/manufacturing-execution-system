import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseHealthIndicator } from '../database/database.health';
import { RedisHealthIndicator } from '../redis/redis.health';
import { CustomHealthIndicator } from './custom-health.indicator';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { SystemHealthIndicator } from './system-health.indicator';
import { DependencyHealthIndicator } from './dependency-health.indicator';

/**
 * Health check and monitoring module
 */
@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController, MetricsController],
  providers: [
    HealthService,
    MetricsService,
    CustomHealthIndicator,
    SystemHealthIndicator,
    DependencyHealthIndicator,
    DatabaseHealthIndicator,
    RedisHealthIndicator,
  ],
  exports: [
    HealthService,
    MetricsService,
    CustomHealthIndicator,
    SystemHealthIndicator,
    DependencyHealthIndicator,
  ],
})
export class HealthModule {}
