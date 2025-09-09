import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../../redis/cache.service';

export const CACHE_KEY = 'cache-key';
export const CACHE_TTL = 'cache-ttl';

/**
 * Decorator to enable caching for an endpoint
 */
export const Cacheable = (options?: { key?: string; ttl?: number }) => {
  return (target: any, _propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(CACHE_KEY, options?.key, descriptor.value);
      Reflect.defineMetadata(CACHE_TTL, options?.ttl, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(CACHE_KEY, options?.key, target);
    Reflect.defineMetadata(CACHE_TTL, options?.ttl, target);
    return target;
  };
};

/**
 * Interceptor that implements caching for GET requests
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);
  private readonly defaultTTL = 60; // 60 seconds default

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: CacheService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    
    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Check if caching is enabled for this endpoint
    const cacheKey = this.getCacheKey(context, request);
    if (!cacheKey) {
      return next.handle();
    }

    // Check if response is cached
    try {
      const cachedData = await this.cacheService.get(cacheKey);
      if (cachedData) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        
        // Add cache headers
        const response = context.switchToHttp().getResponse();
        response.setHeader('X-Cache', 'HIT');
        response.setHeader('X-Cache-Key', cacheKey);
        
        return of(cachedData);
      }
    } catch (error) {
      this.logger.warn(`Cache error for key ${cacheKey}:`, error);
    }

    // Get TTL from metadata
    const ttl = this.reflector.get<number>(CACHE_TTL, context.getHandler()) || this.defaultTTL;

    // Execute handler and cache result
    return next.handle().pipe(
      tap(async (data) => {
        try {
          await this.cacheService.set(cacheKey, data, ttl);
          
          // Add cache headers
          const response = context.switchToHttp().getResponse();
          response.setHeader('X-Cache', 'MISS');
          response.setHeader('X-Cache-Key', cacheKey);
          response.setHeader('Cache-Control', `private, max-age=${ttl}`);
          
          this.logger.debug(`Cached response for key: ${cacheKey}, TTL: ${ttl}s`);
        } catch (error) {
          this.logger.warn(`Failed to cache response for key ${cacheKey}:`, error);
        }
      }),
    );
  }

  /**
   * Generate cache key for the request
   */
  private getCacheKey(context: ExecutionContext, request: any): string | null {
    // Check if caching is explicitly disabled
    const skipCache = request.headers['x-skip-cache'] === 'true';
    if (skipCache) {
      return null;
    }

    // Get custom cache key from metadata
    const customKey = this.reflector.get<string>(CACHE_KEY, context.getHandler());
    if (customKey) {
      return this.buildCacheKey(customKey, request);
    }

    // Check if endpoint has caching enabled
    const hasCacheMetadata = this.reflector.get<number>(CACHE_TTL, context.getHandler());
    if (!hasCacheMetadata) {
      return null;
    }

    // Generate default cache key
    return this.buildCacheKey(null, request);
  }

  /**
   * Build cache key with tenant and user context
   */
  private buildCacheKey(customKey: string | null, request: any): string {
    const parts = [];
    
    // Add tenant context
    if (request.tenant?.id) {
      parts.push(`tenant:${request.tenant.id}`);
    }
    
    // Add user context for personalized caching
    if (request.user?.id && !customKey?.includes('public')) {
      parts.push(`user:${request.user.id}`);
    }
    
    // Add custom key or URL
    if (customKey) {
      parts.push(customKey);
    } else {
      parts.push(`url:${request.url}`);
    }
    
    // Add query parameters
    const queryString = JSON.stringify(request.query);
    if (queryString !== '{}') {
      parts.push(`query:${queryString}`);
    }
    
    return parts.join(':');
  }
}