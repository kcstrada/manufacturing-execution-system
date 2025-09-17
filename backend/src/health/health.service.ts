import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service for managing health check data
 */
@Injectable()
export class HealthService {
  private startTime: Date;
  private isReady: boolean = false;
  private readinessChecks: Map<string, boolean> = new Map();

  constructor(private configService: ConfigService) {
    this.startTime = new Date();
    this.initializeReadinessChecks();
  }

  /**
   * Initialize readiness checks
   */
  private initializeReadinessChecks() {
    // Mark services that need to be ready
    this.readinessChecks.set('database', false);
    this.readinessChecks.set('redis', false);
    this.readinessChecks.set('configuration', true); // Config is ready immediately

    // Simulate gradual readiness
    setTimeout(() => this.markReady('database'), 2000);
    setTimeout(() => this.markReady('redis'), 1500);
  }

  /**
   * Mark a service as ready
   */
  markReady(service: string) {
    this.readinessChecks.set(service, true);
    this.checkOverallReadiness();
  }

  /**
   * Mark a service as not ready
   */
  markNotReady(service: string) {
    this.readinessChecks.set(service, false);
    this.isReady = false;
  }

  /**
   * Check if all required services are ready
   */
  private checkOverallReadiness() {
    this.isReady = Array.from(this.readinessChecks.values()).every(
      (ready) => ready,
    );
  }

  /**
   * Get application uptime
   */
  getUptime(): number {
    return Date.now() - this.startTime.getTime();
  }

  /**
   * Get application version
   */
  getVersion(): string {
    return process.env.npm_package_version || '1.0.0';
  }

  /**
   * Get application environment
   */
  getEnvironment(): string {
    return this.configService.get('NODE_ENV', 'development');
  }

  /**
   * Check if application is ready
   */
  isApplicationReady(): boolean {
    return this.isReady;
  }

  /**
   * Get readiness status
   */
  getReadinessStatus(): Record<string, boolean> {
    return Object.fromEntries(this.readinessChecks);
  }

  /**
   * Get health summary
   */
  getHealthSummary() {
    return {
      status: this.isReady ? 'healthy' : 'degraded',
      version: this.getVersion(),
      environment: this.getEnvironment(),
      uptime: this.getUptime(),
      uptimeHuman: this.formatUptime(this.getUptime()),
      startTime: this.startTime.toISOString(),
      readiness: this.getReadinessStatus(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Format uptime in human-readable format
   */
  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes % 60}m`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  /**
   * Get system information
   */
  getSystemInfo() {
    return {
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      process: {
        pid: process.pid,
        ppid: process.ppid,
        execPath: process.execPath,
        cwd: process.cwd(),
      },
      memory: {
        rss: process.memoryUsage().rss,
        heapTotal: process.memoryUsage().heapTotal,
        heapUsed: process.memoryUsage().heapUsed,
        external: process.memoryUsage().external,
        arrayBuffers: process.memoryUsage().arrayBuffers,
      },
      cpu: process.cpuUsage(),
    };
  }
}
