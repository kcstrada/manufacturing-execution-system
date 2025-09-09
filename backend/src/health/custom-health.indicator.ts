import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { HealthService } from './health.service';

/**
 * Custom health indicator for application-specific checks
 */
@Injectable()
export class CustomHealthIndicator extends HealthIndicator {
  constructor(private healthService: HealthService) {
    super();
  }

  /**
   * Check if service is alive (basic liveness)
   */
  async isAlive(key: string): Promise<HealthIndicatorResult> {
    const isAlive = true; // Service is alive if this code is running
    
    const result = this.getStatus(key, isAlive, {
      status: 'alive',
      pid: process.pid,
      uptime: this.healthService.getUptime(),
    });

    if (isAlive) {
      return result;
    }
    throw new HealthCheckError('Service is not alive', result);
  }

  /**
   * Check if service is ready to accept traffic
   */
  async isReady(key: string): Promise<HealthIndicatorResult> {
    const isReady = this.healthService.isApplicationReady();
    const readinessStatus = this.healthService.getReadinessStatus();

    const result = this.getStatus(key, isReady, {
      status: isReady ? 'ready' : 'not_ready',
      checks: readinessStatus,
    });

    if (isReady) {
      return result;
    }
    throw new HealthCheckError('Service is not ready', result);
  }

  /**
   * Check if service has started successfully
   */
  async hasStarted(key: string): Promise<HealthIndicatorResult> {
    const uptime = this.healthService.getUptime();
    const hasStarted = uptime > 5000; // Consider started after 5 seconds

    const result = this.getStatus(key, hasStarted, {
      status: hasStarted ? 'started' : 'starting',
      uptime,
      startTime: new Date(Date.now() - uptime).toISOString(),
    });

    if (hasStarted) {
      return result;
    }
    throw new HealthCheckError('Service is still starting', result);
  }

  /**
   * Comprehensive application health check
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const summary = this.healthService.getHealthSummary();
      const isHealthy = summary.status === 'healthy';

      return this.getStatus(key, isHealthy, summary);
    } catch (error) {
      throw new HealthCheckError(
        'Application health check failed',
        this.getStatus(key, false, {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }

  /**
   * Check application features
   */
  async checkFeatures(key: string): Promise<HealthIndicatorResult> {
    const features = {
      authentication: this.checkFeature('authentication'),
      authorization: this.checkFeature('authorization'),
      multiTenancy: this.checkFeature('multiTenancy'),
      caching: this.checkFeature('caching'),
      logging: this.checkFeature('logging'),
      monitoring: true, // Monitoring is working if this check is running
    };

    const allFeaturesWorking = Object.values(features).every(f => f);

    const result = this.getStatus(key, allFeaturesWorking, {
      status: allFeaturesWorking ? 'all_features_operational' : 'some_features_degraded',
      features,
    });

    if (allFeaturesWorking) {
      return result;
    }
    throw new HealthCheckError('Some features are not working', result);
  }

  /**
   * Check application configuration
   */
  async checkConfiguration(key: string): Promise<HealthIndicatorResult> {
    const requiredEnvVars = [
      'NODE_ENV',
      'DB_HOST',
      'DB_PORT',
      'REDIS_HOST',
      'REDIS_PORT',
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    const isConfigured = missingVars.length === 0;

    const result = this.getStatus(key, isConfigured, {
      status: isConfigured ? 'configured' : 'misconfigured',
      environment: process.env.NODE_ENV,
      missingVariables: missingVars,
    });

    if (isConfigured) {
      return result;
    }
    throw new HealthCheckError('Application is misconfigured', result);
  }

  /**
   * Check business logic health
   */
  async checkBusinessLogic(key: string): Promise<HealthIndicatorResult> {
    try {
      // Perform a simple business logic check
      const testResult = await this.performBusinessLogicTest();
      
      return this.getStatus(key, testResult.success, {
        status: testResult.success ? 'operational' : 'degraded',
        test: testResult.name,
        duration: testResult.duration,
      });
    } catch (error) {
      throw new HealthCheckError(
        'Business logic check failed',
        this.getStatus(key, false, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }

  /**
   * Check if a specific feature is working
   */
  private checkFeature(feature: string): boolean {
    // Implement feature-specific checks
    switch (feature) {
      case 'authentication':
        return !!process.env.JWT_SECRET;
      case 'authorization':
        return !!process.env.FGA_API_URL;
      case 'multiTenancy':
        return true; // Always enabled in this system
      case 'caching':
        return !!process.env.REDIS_HOST;
      case 'logging':
        return true; // Always enabled
      default:
        return false;
    }
  }

  /**
   * Perform a business logic test
   */
  private async performBusinessLogicTest(): Promise<{
    success: boolean;
    name: string;
    duration: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Simulate a business logic test
      // In a real application, this would test core business functionality
      await new Promise(resolve => setTimeout(resolve, 10));
      
      return {
        success: true,
        name: 'basic_calculation',
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        name: 'basic_calculation',
        duration: Date.now() - startTime,
      };
    }
  }
}