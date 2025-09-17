import { Module, Global, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { getDatabaseConfig } from './database.config';
import { SnakeNamingStrategy } from './naming.strategy';
import { DatabaseService } from './database.service';
import { DatabaseHealthIndicator } from './database.health';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...getDatabaseConfig(configService),
        namingStrategy: new SnakeNamingStrategy(),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [DatabaseService, DatabaseHealthIndicator],
  exports: [DatabaseService, DatabaseHealthIndicator],
})
export class DatabaseModule implements OnModuleInit, OnModuleDestroy {
  constructor(
    private dataSource: DataSource,
    private databaseService: DatabaseService,
  ) {}

  async onModuleInit() {
    // Initialize database connection
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
      console.log('Database connection established');
    }

    // Run any initialization tasks
    await this.databaseService.runInitializationTasks();
  }

  async onModuleDestroy() {
    // Close database connection
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
      console.log('Database connection closed');
    }
  }
}
