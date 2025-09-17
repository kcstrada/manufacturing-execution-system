import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  ttl?: number; // Time window in seconds
  limit?: number; // Max number of requests in the time window
  skipIf?: (request: any) => boolean; // Function to skip rate limiting
}

export const RATE_LIMIT_KEY = 'rateLimit';
export const SKIP_RATE_LIMIT_KEY = 'skipRateLimit';

/**
 * Custom rate limit decorator
 * @param options Rate limit options
 */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

/**
 * Skip rate limiting for this endpoint
 */
export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT_KEY, true);

/**
 * Rate limit for authentication endpoints (strict)
 */
export const AuthRateLimit = () =>
  RateLimit({
    ttl: 900, // 15 minutes
    limit: 5, // 5 attempts
  });

/**
 * Rate limit for API endpoints (standard)
 */
export const ApiRateLimit = () =>
  RateLimit({
    ttl: 60, // 1 minute
    limit: 60, // 60 requests
  });

/**
 * Rate limit for file upload endpoints
 */
export const UploadRateLimit = () =>
  RateLimit({
    ttl: 60, // 1 minute
    limit: 10, // 10 uploads
  });

/**
 * Rate limit for export/report endpoints
 */
export const ExportRateLimit = () =>
  RateLimit({
    ttl: 60, // 1 minute
    limit: 5, // 5 exports
  });

/**
 * Rate limit for public endpoints (relaxed)
 */
export const PublicRateLimit = () =>
  RateLimit({
    ttl: 60, // 1 minute
    limit: 100, // 100 requests
  });
