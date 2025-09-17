import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

/**
 * Health indicator for external dependencies
 */
@Injectable()
export class DependencyHealthIndicator extends HealthIndicator {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    super();
  }

  /**
   * Check OpenFGA health
   */
  async checkOpenFGA(key: string): Promise<HealthIndicatorResult> {
    const fgaUrl = this.configService.get('FGA_API_URL');

    if (!fgaUrl) {
      return this.getStatus(key, true, {
        status: 'not_configured',
        message: 'OpenFGA is not configured',
      });
    }

    try {
      const startTime = Date.now();
      const response = await firstValueFrom(
        this.httpService.get(`${fgaUrl}/health`, {
          timeout: 5000,
        }),
      );
      const responseTime = Date.now() - startTime;

      const isHealthy = response.status === 200;

      const result = this.getStatus(key, isHealthy, {
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime: `${responseTime}ms`,
        url: fgaUrl,
      });

      if (isHealthy) {
        return result;
      }
      throw new HealthCheckError('OpenFGA is unhealthy', result);
    } catch (error) {
      throw new HealthCheckError(
        'OpenFGA health check failed',
        this.getStatus(key, false, {
          status: 'unreachable',
          url: fgaUrl,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }

  /**
   * Check Keycloak health
   */
  async checkKeycloak(key: string): Promise<HealthIndicatorResult> {
    const keycloakUrl = this.configService.get('KEYCLOAK_URL');

    if (!keycloakUrl) {
      return this.getStatus(key, true, {
        status: 'not_configured',
        message: 'Keycloak is not configured',
      });
    }

    try {
      const startTime = Date.now();
      const response = await firstValueFrom(
        this.httpService.get(`${keycloakUrl}/health/ready`, {
          timeout: 5000,
        }),
      );
      const responseTime = Date.now() - startTime;

      const isHealthy = response.status === 200;

      const result = this.getStatus(key, isHealthy, {
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime: `${responseTime}ms`,
        url: keycloakUrl,
      });

      if (isHealthy) {
        return result;
      }
      throw new HealthCheckError('Keycloak is unhealthy', result);
    } catch (error) {
      throw new HealthCheckError(
        'Keycloak health check failed',
        this.getStatus(key, false, {
          status: 'unreachable',
          url: keycloakUrl,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }

  /**
   * Check all external services
   */
  async checkExternalServices(key: string): Promise<HealthIndicatorResult> {
    const services = [];
    const results: Record<string, any> = {};

    // Check Keycloak
    if (this.configService.get('KEYCLOAK_URL')) {
      services.push({
        name: 'keycloak',
        check: () => this.checkKeycloak('keycloak'),
      });
    }

    // Check OpenFGA
    if (this.configService.get('FGA_API_URL')) {
      services.push({
        name: 'openfga',
        check: () => this.checkOpenFGA('openfga'),
      });
    }

    // Check other external services as needed
    // Add more service checks here

    // Execute all checks
    for (const service of services) {
      try {
        const result = await service.check();
        results[service.name] = {
          status: 'healthy',
          details: result,
        };
      } catch (error) {
        results[service.name] = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Determine overall health
    const allHealthy = Object.values(results).every(
      (result: any) => result.status === 'healthy',
    );

    const result = this.getStatus(key, allHealthy, {
      status: allHealthy ? 'all_healthy' : 'some_unhealthy',
      services: results,
      checkedCount: services.length,
    });

    if (allHealthy || services.length === 0) {
      return result;
    }
    throw new HealthCheckError('Some external services are unhealthy', result);
  }

  /**
   * Check if an HTTP endpoint is reachable
   */
  async checkHttpEndpoint(
    key: string,
    url: string,
    expectedStatus = 200,
  ): Promise<HealthIndicatorResult> {
    try {
      const startTime = Date.now();
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 5000,
        }),
      );
      const responseTime = Date.now() - startTime;

      const isHealthy = response.status === expectedStatus;

      const result = this.getStatus(key, isHealthy, {
        status: isHealthy ? 'reachable' : 'unreachable',
        url,
        statusCode: response.status,
        expectedStatus,
        responseTime: `${responseTime}ms`,
      });

      if (isHealthy) {
        return result;
      }
      throw new HealthCheckError(`Endpoint returned unexpected status`, result);
    } catch (error) {
      throw new HealthCheckError(
        `HTTP endpoint check failed`,
        this.getStatus(key, false, {
          status: 'unreachable',
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }

  /**
   * Check API rate limits
   */
  async checkRateLimits(key: string): Promise<HealthIndicatorResult> {
    // This would check rate limit headers from external APIs
    // Implementation depends on specific APIs being used

    return this.getStatus(key, true, {
      status: 'within_limits',
      message: 'Rate limits check not implemented',
    });
  }

  /**
   * Check third-party API quotas
   */
  async checkApiQuotas(key: string): Promise<HealthIndicatorResult> {
    // This would check API usage quotas
    // Implementation depends on specific APIs being used

    return this.getStatus(key, true, {
      status: 'within_quota',
      message: 'API quota check not implemented',
    });
  }
}
