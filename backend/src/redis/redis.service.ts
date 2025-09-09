import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Service for direct Redis operations
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;
  private pubClient!: Redis;
  private subClient!: Redis;
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Initialize Redis connections
   */
  private async connect() {
    try {
      const redisConfig = {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD'),
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
      };

      // Main client for general operations
      this.client = new Redis(redisConfig);
      
      // Pub/Sub clients
      this.pubClient = new Redis(redisConfig);
      this.subClient = new Redis(redisConfig);

      // Set up event handlers
      this.setupEventHandlers(this.client, 'main');
      this.setupEventHandlers(this.pubClient, 'publisher');
      this.setupEventHandlers(this.subClient, 'subscriber');

      // Wait for connections
      await Promise.all([
        this.client.ping(),
        this.pubClient.ping(),
        this.subClient.ping(),
      ]);

      this.isConnected = true;
      this.logger.log('Redis connections established successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error);
      throw error;
    }
  }

  /**
   * Set up event handlers for Redis clients
   */
  private setupEventHandlers(client: Redis, name: string) {
    client.on('connect', () => {
      this.logger.log(`Redis ${name} client connected`);
    });

    client.on('ready', () => {
      this.logger.log(`Redis ${name} client ready`);
    });

    client.on('error', (error) => {
      this.logger.error(`Redis ${name} client error:`, error);
    });

    client.on('close', () => {
      this.logger.warn(`Redis ${name} client connection closed`);
    });

    client.on('reconnecting', (delay: number) => {
      this.logger.log(`Redis ${name} client reconnecting in ${delay}ms`);
    });
  }

  /**
   * Disconnect all Redis clients
   */
  private async disconnect() {
    try {
      await Promise.all([
        this.client?.quit(),
        this.pubClient?.quit(),
        this.subClient?.quit(),
      ]);
      this.isConnected = false;
      this.logger.log('Redis connections closed');
    } catch (error) {
      this.logger.error('Error disconnecting from Redis', error);
    }
  }

  /**
   * Get the main Redis client
   */
  getClient(): Redis {
    if (!this.isConnected) {
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  /**
   * Get the publisher client
   */
  getPubClient(): Redis {
    if (!this.isConnected) {
      throw new Error('Redis publisher client is not connected');
    }
    return this.pubClient;
  }

  /**
   * Get the subscriber client
   */
  getSubClient(): Redis {
    if (!this.isConnected) {
      throw new Error('Redis subscriber client is not connected');
    }
    return this.subClient;
  }

  /**
   * Check if Redis is connected
   */
  isHealthy(): boolean {
    return this.isConnected && this.client?.status === 'ready';
  }

  /**
   * Get Redis statistics
   */
  async getStats() {
    if (!this.isConnected) {
      return null;
    }

    try {
      const info = await this.client.info();
      const dbSize = await this.client.dbsize();
      
      // Parse memory usage from info
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const uptimeMatch = info.match(/uptime_in_seconds:(.+)/);
      const connectedClientsMatch = info.match(/connected_clients:(.+)/);
      
      return {
        dbSize,
        memory: memoryMatch ? memoryMatch[1]!.trim() : 'unknown',
        uptime: uptimeMatch ? parseInt(uptimeMatch[1]!.trim()) : 0,
        connectedClients: connectedClientsMatch ? parseInt(connectedClientsMatch[1]!.trim()) : 0,
        status: this.client.status,
      };
    } catch (error) {
      this.logger.error('Failed to get Redis stats', error);
      return null;
    }
  }

  /**
   * Execute a Redis command
   */
  async execute<T = any>(command: string, ...args: any[]): Promise<T> {
    if (!this.isConnected) {
      throw new Error('Redis is not connected');
    }
    return this.client.call(command, ...args) as T;
  }

  /**
   * Flush all databases (use with caution!)
   */
  async flushAll(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Redis is not connected');
    }
    await this.client.flushall();
    this.logger.warn('All Redis databases have been flushed');
  }

  /**
   * Flush current database
   */
  async flushDb(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Redis is not connected');
    }
    await this.client.flushdb();
    this.logger.warn('Current Redis database has been flushed');
  }
}