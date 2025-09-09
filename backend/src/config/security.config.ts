import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { HelmetOptions } from 'helmet';

/**
 * CORS configuration
 */
export const getCorsConfig = (origins: string): CorsOptions => {
  // Parse origins from environment variable
  const allowedOrigins = origins.split(',').map(origin => origin.trim());
  
  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if origin is in the allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else if (
        // Allow localhost in development
        process.env.NODE_ENV !== 'production' &&
        (origin.includes('localhost') || origin.includes('127.0.0.1'))
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Request-Id',
      'X-Tenant-Id',
      'X-API-Key',
    ],
    exposedHeaders: [
      'X-Request-Id',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-Response-Time',
    ],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
};

/**
 * Helmet configuration for security headers
 */
export const getHelmetConfig = (): HelmetOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    // Content Security Policy
    contentSecurityPolicy: isProduction
      ? {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'none'"],
            manifestSrc: ["'self'"],
          },
        }
      : false, // Disable CSP in development for easier debugging
    
    // DNS Prefetch Control
    dnsPrefetchControl: {
      allow: false,
    },
    
    // Expect-CT is deprecated, removing it
    
    // Frameguard - Prevent clickjacking
    frameguard: {
      action: 'deny',
    },
    
    // Hide Powered-By header
    hidePoweredBy: true,
    
    // HSTS - HTTP Strict Transport Security
    hsts: isProduction
      ? {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        }
      : false, // Disable in development
    
    // IE No Open
    ieNoOpen: true,
    
    // No Sniff - Prevent MIME type sniffing
    noSniff: true,
    
    // Origin Agent Cluster
    originAgentCluster: true,
    
    // Permitted Cross-Domain Policies
    permittedCrossDomainPolicies: false,
    
    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    
    // XSS Filter
    xssFilter: true,
  };
};

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  skipIf?: (request: any) => boolean;
}

export const getRateLimitConfig = (): Record<string, RateLimitConfig> => ({
  // Global rate limit
  global: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many requests from this IP, please try again later.',
  },
  
  // Strict rate limit for auth endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    message: 'Too many authentication attempts, please try again later.',
  },
  
  // Rate limit for API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'API rate limit exceeded, please slow down.',
  },
  
  // Rate limit for file uploads
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    message: 'Too many file uploads, please try again later.',
  },
  
  // Rate limit for reports/exports
  export: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 exports per minute
    message: 'Too many export requests, please try again later.',
  },
});