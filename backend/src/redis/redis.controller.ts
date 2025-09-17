import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RedisService } from './redis.service';
import { CacheService } from './cache.service';
import { JobQueueService } from './job-queue.service';

/**
 * Controller for Redis operations (for testing/demo purposes)
 */
@ApiTags('Redis')
@Controller('api/redis')
export class RedisController {
  constructor(
    private redisService: RedisService,
    private cacheService: CacheService,
    private jobQueueService: JobQueueService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Check Redis health' })
  @ApiResponse({ status: 200, description: 'Redis health status' })
  async health() {
    const isHealthy = this.redisService.isHealthy();
    const stats = await this.redisService.getStats();
    return {
      healthy: isHealthy,
      stats,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get Redis statistics' })
  @ApiResponse({ status: 200, description: 'Redis statistics' })
  async getStats() {
    return this.redisService.getStats();
  }

  @Get('cache/:key')
  @ApiOperation({ summary: 'Get cached value' })
  @ApiResponse({ status: 200, description: 'Cached value' })
  async getCached(@Param('key') key: string) {
    const value = await this.cacheService.get(key);
    return {
      key,
      value,
      found: value !== undefined,
    };
  }

  @Post('cache/:key')
  @ApiOperation({ summary: 'Set cached value' })
  @ApiResponse({ status: 201, description: 'Value cached' })
  async setCached(
    @Param('key') key: string,
    @Body() body: { value: any; ttl?: number },
  ) {
    await this.cacheService.set(key, body.value, body.ttl);
    return {
      key,
      value: body.value,
      ttl: body.ttl,
      message: 'Value cached successfully',
    };
  }

  @Delete('cache/:key')
  @ApiOperation({ summary: 'Delete cached value' })
  @ApiResponse({ status: 200, description: 'Cache deleted' })
  async deleteCached(@Param('key') key: string) {
    await this.cacheService.delete(key);
    return {
      key,
      message: 'Cache deleted successfully',
    };
  }

  @Post('cache/reset')
  @ApiOperation({ summary: 'Reset all cache' })
  @ApiResponse({ status: 200, description: 'Cache reset' })
  async resetCache() {
    await this.cacheService.reset();
    return {
      message: 'Cache reset successfully',
    };
  }

  @Get('queues/stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({ status: 200, description: 'Queue statistics' })
  async getQueueStats() {
    return this.jobQueueService.getAllQueueStats();
  }

  @Post('queues/:queue/job')
  @ApiOperation({ summary: 'Add a job to queue' })
  @ApiResponse({ status: 201, description: 'Job added' })
  async addJob(
    @Param('queue') queueName: string,
    @Body() body: { name: string; data: any; delay?: number },
  ) {
    const job = await this.jobQueueService.addJob(
      queueName,
      body.name,
      body.data,
      body.delay ? { delay: body.delay } : undefined,
    );
    return {
      queue: queueName,
      jobId: job.id,
      message: 'Job added successfully',
    };
  }

  @Get('demo/cached-time')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Demo cached endpoint (caches for 10 seconds)' })
  @ApiResponse({ status: 200, description: 'Current time (cached)' })
  async getCachedTime() {
    return {
      time: new Date().toISOString(),
      message: 'This response is cached for 10 seconds',
    };
  }

  @Get('demo/uncached-time')
  @ApiOperation({ summary: 'Demo uncached endpoint' })
  @ApiResponse({ status: 200, description: 'Current time (not cached)' })
  async getUncachedTime() {
    return {
      time: new Date().toISOString(),
      message: 'This response is not cached',
    };
  }
}
