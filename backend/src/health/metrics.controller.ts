import { Controller, Get, Post, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { HealthService } from './health.service';

/**
 * Controller for application metrics
 */
@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(
    private metricsService: MetricsService,
    private healthService: HealthService,
  ) {}

  /**
   * Get all metrics in JSON format
   */
  @Get()
  @ApiOperation({ summary: 'Get all metrics' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  getMetrics() {
    return this.metricsService.getAllMetrics();
  }

  /**
   * Get metrics in Prometheus format
   */
  @Get('prometheus')
  @Header('Content-Type', 'text/plain')
  @ApiOperation({ summary: 'Get metrics in Prometheus format' })
  @ApiResponse({ status: 200, description: 'Prometheus metrics' })
  getPrometheusMetrics(): string {
    return this.metricsService.getPrometheusMetrics();
  }

  /**
   * Get application info
   */
  @Get('info')
  @ApiOperation({ summary: 'Get application information' })
  @ApiResponse({ status: 200, description: 'Application info' })
  getInfo() {
    return {
      name: 'Manufacturing Execution System',
      version: this.healthService.getVersion(),
      environment: this.healthService.getEnvironment(),
      uptime: this.healthService.getUptime(),
      startTime: new Date(Date.now() - this.healthService.getUptime()).toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };
  }

  /**
   * Get system information
   */
  @Get('system')
  @ApiOperation({ summary: 'Get system information' })
  @ApiResponse({ status: 200, description: 'System information' })
  getSystemInfo() {
    return this.healthService.getSystemInfo();
  }

  /**
   * Get health summary
   */
  @Get('health-summary')
  @ApiOperation({ summary: 'Get health summary' })
  @ApiResponse({ status: 200, description: 'Health summary' })
  getHealthSummary() {
    return this.healthService.getHealthSummary();
  }

  /**
   * Reset metrics (for testing/debugging)
   */
  @Post('reset')
  @ApiOperation({ summary: 'Reset all metrics' })
  @ApiResponse({ status: 200, description: 'Metrics reset successfully' })
  resetMetrics() {
    this.metricsService.resetMetrics();
    return {
      message: 'Metrics reset successfully',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Simulate metric recording (for testing)
   */
  @Post('simulate')
  @ApiOperation({ summary: 'Simulate metric recording' })
  @ApiResponse({ status: 200, description: 'Metrics simulated' })
  simulateMetrics() {
    // Simulate HTTP requests
    this.metricsService.incrementCounter('http_requests_total', 10);
    this.metricsService.incrementCounter('http_requests_success', 8);
    this.metricsService.incrementCounter('http_requests_error', 2);
    
    // Simulate database queries
    this.metricsService.incrementCounter('database_queries_total', 15);
    this.metricsService.setGauge('active_connections', 5);
    
    // Simulate cache operations
    this.metricsService.incrementCounter('cache_hits', 25);
    this.metricsService.incrementCounter('cache_misses', 5);
    
    // Simulate request durations
    for (let i = 0; i < 20; i++) {
      this.metricsService.recordHistogram(
        'http_request_duration',
        Math.random() * 1000, // Random duration between 0-1000ms
      );
    }
    
    // Simulate query durations
    for (let i = 0; i < 15; i++) {
      this.metricsService.recordHistogram(
        'database_query_duration',
        Math.random() * 100, // Random duration between 0-100ms
      );
    }
    
    // Simulate queue size
    this.metricsService.setGauge('queue_size', Math.floor(Math.random() * 50));
    
    return {
      message: 'Metrics simulated successfully',
      timestamp: new Date().toISOString(),
    };
  }
}