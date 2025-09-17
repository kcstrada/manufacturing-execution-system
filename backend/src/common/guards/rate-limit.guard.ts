import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerOptions } from '@nestjs/throttler';
import {
  RATE_LIMIT_KEY,
  SKIP_RATE_LIMIT_KEY,
  RateLimitOptions,
} from '../decorators/rate-limit.decorator';

/**
 * Custom rate limiting guard that extends ThrottlerGuard
 */
@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  constructor(
    @Inject('THROTTLER_OPTIONS') options: ThrottlerOptions[],
    @Inject('THROTTLER_STORAGE') storageService: any,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  /**
   * Check if the request should be throttled
   */
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Check if rate limiting should be skipped
    const skipRateLimit = this.reflector.getAllAndOverride<boolean>(
      SKIP_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipRateLimit) {
      return true;
    }

    // Get custom rate limit options
    const rateLimitOptions = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Check if custom skip function returns true
    if (rateLimitOptions?.skipIf && rateLimitOptions.skipIf(request)) {
      return true;
    }

    // Apply custom rate limit if specified
    if (rateLimitOptions) {
      const { ttl, limit } = rateLimitOptions;

      // Override the default throttler options for this request
      if (ttl && limit) {
        // Create new options array instead of modifying readonly property
        const customOptions = [{ ttl, limit }];
        // Use the custom options for this request
        Object.defineProperty(this, 'options', {
          value: customOptions,
          writable: true,
          configurable: true,
        });
      }
    }

    try {
      const canProceed = await super.canActivate(context);

      // Add rate limit headers to response
      this.addRateLimitHeaders(response, rateLimitOptions);

      return canProceed;
    } catch (error) {
      // Add rate limit headers even on error
      this.addRateLimitHeaders(response, rateLimitOptions);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests',
          error: 'Rate limit exceeded',
          retryAfter: rateLimitOptions?.ttl || 60,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Get the tracker key for rate limiting
   */
  protected override async getTracker(
    req: Record<string, any>,
  ): Promise<string> {
    // Use a combination of IP, user ID, and tenant ID for tracking
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userId = req.user?.id || req.user?.sub || 'anonymous';
    const tenantId = req.tenant?.id || req.headers['x-tenant-id'] || 'default';

    return Promise.resolve(`${ip}:${userId}:${tenantId}`);
  }

  /**
   * Add rate limit headers to the response
   */
  private addRateLimitHeaders(response: any, options?: RateLimitOptions): void {
    const optionsArray = this.options as any[];
    const limit = options?.limit || optionsArray?.[0]?.limit || 100;
    const ttl = options?.ttl || optionsArray?.[0]?.ttl || 60;

    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-TTL', ttl);
    response.setHeader(
      'X-RateLimit-Reset',
      new Date(Date.now() + ttl * 1000).toISOString(),
    );
  }
}

/**
 * IP-based rate limiting guard
 */
@Injectable()
export class IpRateLimitGuard extends RateLimitGuard {
  protected override async getTracker(
    req: Record<string, any>,
  ): Promise<string> {
    return Promise.resolve(
      req.ip || req.connection?.remoteAddress || 'unknown',
    );
  }
}

/**
 * User-based rate limiting guard
 */
@Injectable()
export class UserRateLimitGuard extends RateLimitGuard {
  protected override async getTracker(
    req: Record<string, any>,
  ): Promise<string> {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      // Fall back to IP-based tracking for unauthenticated requests
      return Promise.resolve(
        req.ip || req.connection?.remoteAddress || 'unknown',
      );
    }
    return Promise.resolve(`user:${userId}`);
  }
}

/**
 * Tenant-based rate limiting guard
 */
@Injectable()
export class TenantRateLimitGuard extends RateLimitGuard {
  protected override async getTracker(
    req: Record<string, any>,
  ): Promise<string> {
    const tenantId = req.tenant?.id || req.headers['x-tenant-id'];
    if (!tenantId) {
      // Fall back to IP-based tracking if no tenant
      return Promise.resolve(
        req.ip || req.connection?.remoteAddress || 'unknown',
      );
    }
    return Promise.resolve(`tenant:${tenantId}`);
  }
}
