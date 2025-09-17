import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get('NODE_ENV') === 'production';
  const isDevelopment = configService.get('NODE_ENV') === 'development';

  return {
    type: 'postgres',

    // Connection settings
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USER', 'postgres'),
    password: configService.get('DB_PASSWORD', 'postgres'),
    database: configService.get('DB_NAME', 'manufacturing_execution_system_db'),

    // SSL configuration for production
    ssl: isProduction
      ? {
          rejectUnauthorized: configService.get(
            'DB_SSL_REJECT_UNAUTHORIZED',
            true,
          ),
          ca: configService.get('DB_SSL_CA'),
        }
      : false,

    // Connection pool settings
    extra: {
      max: configService.get('DB_POOL_MAX', 20), // Maximum number of clients in the pool
      min: configService.get('DB_POOL_MIN', 2), // Minimum number of clients in the pool
      idleTimeoutMillis: configService.get('DB_IDLE_TIMEOUT', 30000),
      connectionTimeoutMillis: configService.get('DB_CONNECTION_TIMEOUT', 2000),
      statement_timeout: configService.get('DB_STATEMENT_TIMEOUT', 30000),
      query_timeout: configService.get('DB_QUERY_TIMEOUT', 30000),

      // Performance optimizations
      poolSize: configService.get('DB_POOL_SIZE', 10),
      connectionLimit: configService.get('DB_CONNECTION_LIMIT', 10),
      queueLimit: configService.get('DB_QUEUE_LIMIT', 0),

      // PostgreSQL specific optimizations
      application_name: 'mes_backend',
      max_prepared_transactions: 0,
    },

    // Entity settings
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    autoLoadEntities: true,

    // Migrations settings
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    migrationsTableName: 'migrations',
    migrationsRun: isProduction, // Auto-run migrations in production

    // Subscribers
    subscribers: [__dirname + '/../**/*.subscriber{.ts,.js}'],

    // Development settings
    synchronize: isDevelopment && configService.get('DB_SYNCHRONIZE', false),
    dropSchema: false, // Never drop schema automatically

    // Logging configuration
    logging: configService.get('DB_LOGGING', isDevelopment),
    logger: isDevelopment ? 'advanced-console' : 'file',
    maxQueryExecutionTime: configService.get(
      'DB_MAX_QUERY_EXECUTION_TIME',
      1000,
    ), // Log slow queries

    // Cache configuration
    cache: isProduction
      ? {
          type: 'redis',
          options: {
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
            password: configService.get('REDIS_PASSWORD'),
          },
          duration: configService.get('DB_CACHE_DURATION', 60000), // 1 minute default
        }
      : false,

    // Naming strategy
    namingStrategy: undefined, // Will use custom naming strategy

    // Other options
    retryAttempts: configService.get('DB_RETRY_ATTEMPTS', 10),
    retryDelay: configService.get('DB_RETRY_DELAY', 3000),
    verboseRetryLog: isDevelopment,
  };
};
