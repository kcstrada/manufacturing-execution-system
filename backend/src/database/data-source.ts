import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { SnakeNamingStrategy } from './naming.strategy';

// Load environment variables
config({ path: '.env' });
config({ path: '.env.local' });

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'manufacturing_execution_system_db',
  
  // Entity configuration
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  
  // Migration configuration
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  
  // Subscribers
  subscribers: [__dirname + '/../**/*.subscriber{.ts,.js}'],
  
  // Naming strategy
  namingStrategy: new SnakeNamingStrategy(),
  
  // Logging
  logging: isDevelopment,
  logger: isDevelopment ? 'advanced-console' : 'file',
  
  // SSL for production
  ssl: isProduction
    ? {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
      }
    : false,
  
  // Synchronize should be false in production
  synchronize: false,
  
  // Connection pool
  extra: {
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
  },
};

// Create and export the data source
const dataSource = new DataSource(dataSourceOptions);

export default dataSource;