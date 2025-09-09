import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(@InjectDataSource() private dataSource: DataSource) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check if database is initialized
      if (!this.dataSource.isInitialized) {
        throw new HealthCheckError('Database not initialized', {
          database: {
            status: 'down',
            message: 'Database connection not initialized',
          },
        });
      }

      // Execute a simple query to check connection
      const startTime = Date.now();
      await this.dataSource.query('SELECT 1');
      const responseTime = Date.now() - startTime;

      // Get additional database metrics
      const [dbInfo, connectionInfo] = await Promise.all([
        this.dataSource.query(`
          SELECT 
            current_database() as database,
            pg_database_size(current_database()) as size,
            version() as version
        `),
        this.dataSource.query(`
          SELECT 
            COUNT(*) as active_connections,
            max_connections
          FROM pg_stat_activity, pg_settings
          WHERE pg_settings.name = 'max_connections'
          GROUP BY max_connections
        `),
      ]);

      const result = this.getStatus(key, true, {
        status: 'up',
        responseTime: `${responseTime}ms`,
        database: dbInfo[0]?.database,
        size: this.formatBytes(parseInt(dbInfo[0]?.size || 0)),
        version: this.extractVersion(dbInfo[0]?.version),
        connections: {
          active: parseInt(connectionInfo[0]?.active_connections || 0),
          max: parseInt(connectionInfo[0]?.max_connections || 100),
        },
      });

      return result;
    } catch (error) {
      throw new HealthCheckError(
        'Database health check failed',
        this.getStatus(key, false, {
          status: 'down',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }

  /**
   * Check database performance metrics
   */
  async checkPerformance(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check slow queries
      const slowQueries = await this.dataSource.query(`
        SELECT 
          COUNT(*) as count
        FROM pg_stat_activity
        WHERE state != 'idle'
        AND query_start < now() - interval '1 minute'
      `);

      // Check cache hit ratio
      const cacheStats = await this.dataSource.query(`
        SELECT 
          sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) as cache_hit_ratio
        FROM pg_statio_user_tables
      `);

      // Check table bloat (simplified)
      const bloatInfo = await this.dataSource.query(`
        SELECT 
          COUNT(*) as tables_with_bloat
        FROM pg_stat_user_tables
        WHERE n_dead_tup > n_live_tup * 0.2
        AND n_live_tup > 1000
      `);

      const cacheHitRatio = parseFloat(cacheStats[0]?.cache_hit_ratio || 0) * 100;
      const slowQueryCount = parseInt(slowQueries[0]?.count || 0);
      const bloatedTables = parseInt(bloatInfo[0]?.tables_with_bloat || 0);

      // Determine health based on metrics
      const isHealthy = cacheHitRatio > 90 && slowQueryCount < 5 && bloatedTables < 3;

      return this.getStatus(key, isHealthy, {
        status: isHealthy ? 'healthy' : 'degraded',
        metrics: {
          cacheHitRatio: `${cacheHitRatio.toFixed(2)}%`,
          slowQueries: slowQueryCount,
          bloatedTables: bloatedTables,
        },
        recommendations: this.getRecommendations(cacheHitRatio, slowQueryCount, bloatedTables),
      });
    } catch (error) {
      throw new HealthCheckError(
        'Performance check failed',
        this.getStatus(key, false, {
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }

  /**
   * Check replication status (if configured)
   */
  async checkReplication(key: string): Promise<HealthIndicatorResult> {
    try {
      const replicationInfo = await this.dataSource.query(`
        SELECT 
          client_addr,
          state,
          sync_state,
          replay_lag
        FROM pg_stat_replication
      `);

      if (replicationInfo.length === 0) {
        return this.getStatus(key, true, {
          status: 'not_configured',
          message: 'No replication configured',
        });
      }

      const hasIssues = replicationInfo.some(
        (replica: any) => replica.state !== 'streaming' || replica.replay_lag > 1000,
      );

      return this.getStatus(key, !hasIssues, {
        status: hasIssues ? 'degraded' : 'healthy',
        replicas: replicationInfo.map((replica: any) => ({
          address: replica.client_addr,
          state: replica.state,
          syncState: replica.sync_state,
          lag: replica.replay_lag ? `${replica.replay_lag}ms` : '0ms',
        })),
      });
    } catch (error) {
      return this.getStatus(key, true, {
        status: 'not_available',
        message: 'Replication status not available',
      });
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

  /**
   * Extract version number from PostgreSQL version string
   */
  private extractVersion(versionString: string): string {
    const match = versionString?.match(/PostgreSQL (\d+\.\d+)/);
    return match ? match[1]! : 'Unknown';
  }

  /**
   * Get performance recommendations
   */
  private getRecommendations(
    cacheHitRatio: number,
    slowQueries: number,
    bloatedTables: number,
  ): string[] {
    const recommendations: string[] = [];

    if (cacheHitRatio < 90) {
      recommendations.push('Consider increasing shared_buffers or adding more RAM');
    }
    if (slowQueries > 5) {
      recommendations.push('Review and optimize slow queries');
    }
    if (bloatedTables > 3) {
      recommendations.push('Run VACUUM on bloated tables');
    }

    return recommendations;
  }
}