import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { RedisService } from './redis.service';
import { RedisHealthIndicator } from './redis.health';
import { CacheService } from './cache.service';
import { JobQueueService } from './job-queue.service';
import { RedisController } from './redis.controller';

/**
 * Global Redis module providing caching and queue capabilities
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    // Cache Manager configuration
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore as any,
        host: configService.get('REDIS_HOST', 'localhost'),
        port: configService.get('REDIS_PORT', 6379),
        password: configService.get('REDIS_PASSWORD'),
        db: configService.get('REDIS_CACHE_DB', 0),
        ttl: configService.get('CACHE_TTL', 300), // 5 minutes default
        max: configService.get('CACHE_MAX_ITEMS', 100),
        refreshThreshold: configService.get('CACHE_REFRESH_THRESHOLD', 60),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [RedisController],
  providers: [
    RedisService,
    RedisHealthIndicator,
    CacheService,
    JobQueueService,
  ],
  exports: [
    RedisService,
    RedisHealthIndicator,
    CacheService,
    JobQueueService,
    CacheModule,
  ],
})
export class RedisModule {}
