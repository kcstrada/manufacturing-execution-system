import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

/**
 * Service for cache operations
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache hit for key: ${key}`);
      } else {
        this.logger.debug(`Cache miss for key: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache set for key: ${key}, TTL: ${ttl || 'default'}`);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    try {
      // cache-manager v7 doesn't have reset method, we need to use the store's reset if available
      const store = (this.cacheManager as any).store;
      if (store && typeof store.reset === 'function') {
        await store.reset();
      } else if (store && typeof store.flushall === 'function') {
        await store.flushall();
      } else {
        this.logger.warn('Cache reset not supported by current store');
      }
      this.logger.warn('Cache has been reset');
    } catch (error) {
      this.logger.error('Error resetting cache:', error);
    }
  }

  /**
   * Get or set cache with a factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // If not in cache, execute factory and cache the result
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      // Note: This requires access to the underlying Redis client
      // Implementation depends on the cache store being used
      this.logger.debug(`Invalidating cache pattern: ${pattern}`);
      // For now, we'll log a warning that pattern invalidation needs Redis client access
      this.logger.warn(
        'Pattern invalidation requires direct Redis client access',
      );
    } catch (error) {
      this.logger.error(`Error invalidating pattern ${pattern}:`, error);
    }
  }

  /**
   * Wrap a function with caching
   */
  wrap<T>(
    keyPrefix: string,
    fn: (...args: any[]) => Promise<T>,
    ttl?: number,
  ): (...args: any[]) => Promise<T> {
    return async (...args: any[]): Promise<T> => {
      const key = `${keyPrefix}:${JSON.stringify(args)}`;
      return this.getOrSet(key, () => fn(...args), ttl);
    };
  }

  /**
   * Create cache key with tenant isolation
   */
  createTenantKey(tenantId: string, key: string): string {
    return `tenant:${tenantId}:${key}`;
  }

  /**
   * Get with tenant isolation
   */
  async getTenant<T>(tenantId: string, key: string): Promise<T | undefined> {
    const tenantKey = this.createTenantKey(tenantId, key);
    return this.get<T>(tenantKey);
  }

  /**
   * Set with tenant isolation
   */
  async setTenant<T>(
    tenantId: string,
    key: string,
    value: T,
    ttl?: number,
  ): Promise<void> {
    const tenantKey = this.createTenantKey(tenantId, key);
    return this.set(tenantKey, value, ttl);
  }

  /**
   * Delete with tenant isolation
   */
  async deleteTenant(tenantId: string, key: string): Promise<void> {
    const tenantKey = this.createTenantKey(tenantId, key);
    return this.delete(tenantKey);
  }

  /**
   * Batch get multiple keys
   */
  async mget<T>(keys: string[]): Promise<(T | undefined)[]> {
    try {
      const promises = keys.map((key) => this.get<T>(key));
      return Promise.all(promises);
    } catch (error) {
      this.logger.error('Error in batch get:', error);
      return keys.map(() => undefined);
    }
  }

  /**
   * Batch set multiple key-value pairs
   */
  async mset<T>(
    items: Array<{ key: string; value: T; ttl?: number }>,
  ): Promise<void> {
    try {
      const promises = items.map((item) =>
        this.set(item.key, item.value, item.ttl),
      );
      await Promise.all(promises);
    } catch (error) {
      this.logger.error('Error in batch set:', error);
    }
  }
}
