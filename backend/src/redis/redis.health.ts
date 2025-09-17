import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { RedisService } from './redis.service';

/**
 * Health indicator for Redis
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private redisService: RedisService) {
    super();
  }

  /**
   * Check Redis health
   */
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const client = this.redisService.getClient();

      // Ping Redis
      const startTime = Date.now();
      const pong = await client.ping();
      const responseTime = Date.now() - startTime;

      if (pong !== 'PONG') {
        throw new HealthCheckError('Redis ping failed', {
          redis: {
            status: 'down',
            message: 'Unexpected ping response',
          },
        });
      }

      // Get Redis stats
      const stats = await this.redisService.getStats();

      return this.getStatus(key, true, {
        status: 'up',
        responseTime: `${responseTime}ms`,
        ...stats,
      });
    } catch (error) {
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false, {
          status: 'down',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }

  /**
   * Check cache health
   */
  async checkCache(key: string): Promise<HealthIndicatorResult> {
    try {
      const client = this.redisService.getClient();
      const testKey = 'health:check:cache';
      const testValue = Date.now().toString();

      // Test set
      await client.set(testKey, testValue, 'EX', 10);

      // Test get
      const retrieved = await client.get(testKey);

      if (retrieved !== testValue) {
        throw new HealthCheckError('Cache test failed', {
          cache: {
            status: 'down',
            message: 'Cache read/write test failed',
          },
        });
      }

      // Clean up
      await client.del(testKey);

      return this.getStatus(key, true, {
        status: 'healthy',
        test: 'passed',
      });
    } catch (error) {
      throw new HealthCheckError(
        'Cache health check failed',
        this.getStatus(key, false, {
          status: 'down',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }

  /**
   * Check queue health
   */
  async checkQueues(key: string): Promise<HealthIndicatorResult> {
    try {
      const client = this.redisService.getClient();

      // Check for Bull queue keys
      const queueKeys = await client.keys('bull:*');
      const queueCount = queueKeys.length;

      // Get queue metrics
      const metrics: any = {};

      for (const queueKey of queueKeys.slice(0, 5)) {
        // Limit to first 5 queues
        const queueName = queueKey.split(':')[1];
        if (queueName) {
          const waiting = await client.llen(`bull:${queueName}:wait`);
          const active = await client.llen(`bull:${queueName}:active`);
          const completed = await client.zcard(`bull:${queueName}:completed`);
          const failed = await client.zcard(`bull:${queueName}:failed`);

          metrics[queueName] = {
            waiting,
            active,
            completed,
            failed,
          };
        }
      }

      return this.getStatus(key, true, {
        status: 'healthy',
        queueCount,
        queues: metrics,
      });
    } catch (error) {
      throw new HealthCheckError(
        'Queue health check failed',
        this.getStatus(key, false, {
          status: 'down',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }

  /**
   * Check memory usage
   */
  async checkMemory(key: string): Promise<HealthIndicatorResult> {
    try {
      const client = this.redisService.getClient();
      const info = await client.info('memory');

      // Parse memory info
      const usedMemoryMatch = info.match(/used_memory:(\d+)/);
      const maxMemoryMatch = info.match(/maxmemory:(\d+)/);
      const usedMemoryRssMatch = info.match(/used_memory_rss:(\d+)/);
      const usedMemoryPeakMatch = info.match(/used_memory_peak:(\d+)/);

      const usedMemory = usedMemoryMatch ? parseInt(usedMemoryMatch[1]!) : 0;
      const maxMemory = maxMemoryMatch ? parseInt(maxMemoryMatch[1]!) : 0;
      const usedMemoryRss = usedMemoryRssMatch
        ? parseInt(usedMemoryRssMatch[1]!)
        : 0;
      const usedMemoryPeak = usedMemoryPeakMatch
        ? parseInt(usedMemoryPeakMatch[1]!)
        : 0;

      // Calculate memory usage percentage
      const memoryUsagePercent =
        maxMemory > 0 ? ((usedMemory / maxMemory) * 100).toFixed(2) : 'N/A';

      // Determine health based on memory usage
      const isHealthy = maxMemory === 0 || usedMemory / maxMemory < 0.9;

      return this.getStatus(key, isHealthy, {
        status: isHealthy ? 'healthy' : 'warning',
        memory: {
          used: this.formatBytes(usedMemory),
          max: maxMemory > 0 ? this.formatBytes(maxMemory) : 'unlimited',
          rss: this.formatBytes(usedMemoryRss),
          peak: this.formatBytes(usedMemoryPeak),
          usagePercent: memoryUsagePercent,
        },
      });
    } catch (error) {
      throw new HealthCheckError(
        'Memory health check failed',
        this.getStatus(key, false, {
          status: 'down',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }

  /**
   * Check replication
   */
  async checkReplication(key: string): Promise<HealthIndicatorResult> {
    try {
      const client = this.redisService.getClient();
      const info = await client.info('replication');

      // Parse replication info
      const roleMatch = info.match(/role:(\w+)/);
      const connectedSlavesMatch = info.match(/connected_slaves:(\d+)/);

      const role = roleMatch ? roleMatch[1] : 'unknown';
      const connectedSlaves = connectedSlavesMatch
        ? parseInt(connectedSlavesMatch[1]!)
        : 0;

      // Parse slave info
      const slaves = [];
      for (let i = 0; i < connectedSlaves; i++) {
        const slaveRegex = new RegExp(
          `slave${i}:ip=([^,]+),port=(\\d+),state=([^,]+)`,
        );
        const slaveMatch = info.match(slaveRegex);
        if (slaveMatch) {
          slaves.push({
            ip: slaveMatch[1],
            port: slaveMatch[2],
            state: slaveMatch[3],
          });
        }
      }

      return this.getStatus(key, true, {
        status: 'healthy',
        replication: {
          role,
          connectedSlaves,
          slaves,
        },
      });
    } catch (error) {
      throw new HealthCheckError(
        'Replication health check failed',
        this.getStatus(key, false, {
          status: 'down',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
