import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DatabaseHealthIndicator } from '../database/database.health';
import { RedisHealthIndicator } from '../redis/redis.health';
import { CustomHealthIndicator } from './custom-health.indicator';
import { SystemHealthIndicator } from './system-health.indicator';
import { DependencyHealthIndicator } from './dependency-health.indicator';

/**
 * Health check controller
 * All health endpoints skip rate limiting for monitoring purposes
 */
@ApiTags('health')
@Controller('health')
@SkipThrottle() // Health checks should not be rate limited
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private database: DatabaseHealthIndicator,
    private redis: RedisHealthIndicator,
    private custom: CustomHealthIndicator,
    private system: SystemHealthIndicator,
    private dependency: DependencyHealthIndicator,
  ) {}

  /**
   * Basic health check (for load balancers)
   */
  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Liveness probe (is the service alive?)
   */
  @Get('live')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  @ApiResponse({ status: 503, description: 'Service is not alive' })
  checkLive() {
    return this.health.check([() => this.custom.isAlive('service')]);
  }

  /**
   * Readiness probe (is the service ready to accept traffic?)
   */
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  checkReady() {
    return this.health.check([
      () => this.database.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
      () => this.custom.isReady('service'),
    ]);
  }

  /**
   * Startup probe (has the service started successfully?)
   */
  @Get('startup')
  @HealthCheck()
  @ApiOperation({ summary: 'Startup probe' })
  @ApiResponse({ status: 200, description: 'Service has started' })
  @ApiResponse({ status: 503, description: 'Service is still starting' })
  checkStartup() {
    return this.health.check([() => this.custom.hasStarted('service')]);
  }

  /**
   * Comprehensive health check
   */
  @Get('full')
  @HealthCheck()
  @ApiOperation({ summary: 'Comprehensive health check' })
  @ApiResponse({ status: 200, description: 'All checks passed' })
  @ApiResponse({ status: 503, description: 'Some checks failed' })
  checkFull() {
    return this.health.check([
      // Database checks
      () => this.database.isHealthy('database'),
      () => this.database.checkPerformance('database-performance'),

      // Redis checks
      () => this.redis.isHealthy('redis'),
      () => this.redis.checkCache('redis-cache'),
      () => this.redis.checkQueues('redis-queues'),

      // System checks
      () => this.memory.checkHeap('memory-heap', 200 * 1024 * 1024), // 200MB
      () => this.memory.checkRSS('memory-rss', 500 * 1024 * 1024), // 500MB
      () =>
        this.disk.checkStorage('disk-storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),

      // CPU and system
      () => this.system.checkCPU('cpu'),
      () => this.system.checkUptime('uptime'),
      () => this.system.checkFileDescriptors('file-descriptors'),

      // Custom checks
      () => this.custom.isHealthy('application'),
    ]);
  }

  /**
   * Database health check
   */
  @Get('database')
  @HealthCheck()
  @ApiOperation({ summary: 'Database health check' })
  @ApiResponse({ status: 200, description: 'Database is healthy' })
  @ApiResponse({ status: 503, description: 'Database is unhealthy' })
  checkDatabase() {
    return this.health.check([
      () => this.database.isHealthy('database'),
      () => this.database.checkPerformance('database-performance'),
      () => this.database.checkReplication('database-replication'),
    ]);
  }

  /**
   * Redis health check
   */
  @Get('redis')
  @HealthCheck()
  @ApiOperation({ summary: 'Redis health check' })
  @ApiResponse({ status: 200, description: 'Redis is healthy' })
  @ApiResponse({ status: 503, description: 'Redis is unhealthy' })
  checkRedis() {
    return this.health.check([
      () => this.redis.isHealthy('redis'),
      () => this.redis.checkCache('redis-cache'),
      () => this.redis.checkQueues('redis-queues'),
      () => this.redis.checkMemory('redis-memory'),
      () => this.redis.checkReplication('redis-replication'),
    ]);
  }

  /**
   * External dependencies health check
   */
  @Get('dependencies')
  @HealthCheck()
  @ApiOperation({ summary: 'External dependencies health check' })
  @ApiResponse({ status: 200, description: 'Dependencies are healthy' })
  @ApiResponse({ status: 503, description: 'Some dependencies are unhealthy' })
  async checkDependencies() {
    const checks = [];

    // Keycloak check
    if (process.env.KEYCLOAK_URL) {
      checks.push(() =>
        this.http.pingCheck(
          'keycloak',
          `${process.env.KEYCLOAK_URL}/health/ready`,
        ),
      );
    }

    // OpenFGA check
    if (process.env.FGA_API_URL) {
      checks.push(() => this.dependency.checkOpenFGA('openfga'));
    }

    // Add other external service checks
    checks.push(() =>
      this.dependency.checkExternalServices('external-services'),
    );

    return this.health.check(checks);
  }

  /**
   * System health check
   */
  @Get('system')
  @HealthCheck()
  @ApiOperation({ summary: 'System health check' })
  @ApiResponse({ status: 200, description: 'System is healthy' })
  @ApiResponse({ status: 503, description: 'System is unhealthy' })
  checkSystem() {
    return this.health.check([
      () => this.memory.checkHeap('memory-heap', 200 * 1024 * 1024),
      () => this.memory.checkRSS('memory-rss', 500 * 1024 * 1024),
      () =>
        this.disk.checkStorage('disk-storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
      () => this.system.checkCPU('cpu'),
      () => this.system.checkUptime('uptime'),
      () => this.system.checkFileDescriptors('file-descriptors'),
      () => this.system.checkLoadAverage('load-average'),
    ]);
  }

  /**
   * Custom application health check
   */
  @Get('application')
  @HealthCheck()
  @ApiOperation({ summary: 'Application health check' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  @ApiResponse({ status: 503, description: 'Application is unhealthy' })
  checkApplication() {
    return this.health.check([
      () => this.custom.isHealthy('application'),
      () => this.custom.checkFeatures('features'),
      () => this.custom.checkConfiguration('configuration'),
      () => this.custom.checkBusinessLogic('business-logic'),
    ]);
  }
}
