import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  /**
   * Get the data source instance
   */
  getDataSource(): DataSource {
    return this.dataSource;
  }

  /**
   * Check if database is connected
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      this.logger.error('Database connection check failed', error);
      return false;
    }
  }

  /**
   * Get database version
   */
  async getDatabaseVersion(): Promise<string> {
    try {
      const result = await this.dataSource.query('SELECT version()');
      return result[0]?.version || 'Unknown';
    } catch (error) {
      this.logger.error('Failed to get database version', error);
      return 'Unknown';
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<any> {
    try {
      const [dbSize, tableCount, connectionCount] = await Promise.all([
        this.dataSource.query(`
          SELECT pg_database_size(current_database()) as size
        `),
        this.dataSource.query(`
          SELECT COUNT(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `),
        this.dataSource.query(`
          SELECT COUNT(*) as count 
          FROM pg_stat_activity 
          WHERE datname = current_database()
        `),
      ]);

      return {
        size: parseInt(dbSize[0]?.size || 0),
        sizeFormatted: this.formatBytes(parseInt(dbSize[0]?.size || 0)),
        tableCount: parseInt(tableCount[0]?.count || 0),
        connectionCount: parseInt(connectionCount[0]?.count || 0),
        maxConnections: this.dataSource.options.extra?.max || 20,
      };
    } catch (error) {
      this.logger.error('Failed to get database stats', error);
      return null;
    }
  }

  /**
   * Create a query runner for transactions
   */
  createQueryRunner(): QueryRunner {
    return this.dataSource.createQueryRunner();
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(work: (queryRunner: QueryRunner) => Promise<T>): Promise<T> {
    const queryRunner = this.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await work(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Run raw SQL query
   */
  async query(sql: string, parameters?: any[]): Promise<any> {
    return this.dataSource.query(sql, parameters);
  }

  /**
   * Clean up orphaned records
   */
  async cleanupOrphanedRecords(): Promise<void> {
    this.logger.log('Starting cleanup of orphaned records');
    
    try {
      // Add cleanup queries here based on your schema
      // Example: Delete soft-deleted records older than 30 days
      await this.dataSource.query(`
        DELETE FROM tasks 
        WHERE is_deleted = true 
        AND deleted_at < NOW() - INTERVAL '30 days'
      `);

      this.logger.log('Cleanup completed successfully');
    } catch (error) {
      this.logger.error('Cleanup failed', error);
    }
  }

  /**
   * Optimize database (VACUUM and ANALYZE)
   */
  async optimizeDatabase(): Promise<void> {
    this.logger.log('Starting database optimization');
    
    try {
      // Run VACUUM to reclaim storage
      await this.dataSource.query('VACUUM ANALYZE');
      
      // Update statistics
      await this.dataSource.query('ANALYZE');
      
      this.logger.log('Database optimization completed');
    } catch (error) {
      this.logger.error('Database optimization failed', error);
    }
  }

  /**
   * Run initialization tasks
   */
  async runInitializationTasks(): Promise<void> {
    this.logger.log('Running database initialization tasks');

    try {
      // Create extensions if needed
      await this.createRequiredExtensions();
      
      // Create custom functions if needed
      await this.createCustomFunctions();
      
      this.logger.log('Initialization tasks completed');
    } catch (error) {
      this.logger.error('Initialization tasks failed', error);
    }
  }

  /**
   * Create required PostgreSQL extensions
   */
  private async createRequiredExtensions(): Promise<void> {
    const extensions = ['uuid-ossp', 'pg_trgm', 'btree_gin'];
    
    for (const ext of extensions) {
      try {
        await this.dataSource.query(`CREATE EXTENSION IF NOT EXISTS "${ext}"`);
        this.logger.debug(`Extension ${ext} created or already exists`);
      } catch (error) {
        this.logger.warn(`Failed to create extension ${ext}:`, (error as any).message);
      }
    }
  }

  /**
   * Create custom database functions
   */
  private async createCustomFunctions(): Promise<void> {
    // Example: Create a function to update updated_at timestamp
    try {
      await this.dataSource.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);
      this.logger.debug('Custom functions created');
    } catch (error) {
      this.logger.warn('Failed to create custom functions:', (error as any).message);
    }
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}