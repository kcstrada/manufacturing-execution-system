import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { LoggingService } from './logging.service';

/**
 * Morgan middleware for HTTP access logging
 */
@Injectable()
export class MorganMiddleware implements NestMiddleware {
  private morganMiddleware: any;

  constructor(private readonly loggingService: LoggingService) {
    // Custom token for tenant ID
    morgan.token('tenant-id', (req: Request) => {
      return (req as any).tenantId || '-';
    });

    // Custom token for user ID
    morgan.token('user-id', (req: Request) => {
      return req.user?.['id'] || req.user?.['sub'] || '-';
    });

    // Custom token for request ID
    morgan.token('request-id', (req: Request) => {
      return req.headers['x-request-id'] as string || '-';
    });

    // Custom token for response time in milliseconds
    morgan.token('response-time-ms', (_req: Request, res: Response) => {
      const responseTime = res.getHeader('X-Response-Time');
      return responseTime ? String(responseTime) : '-';
    });

    // Define custom format
    const format = process.env.NODE_ENV === 'production'
      ? ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms :tenant-id :request-id'
      : ':method :url :status :response-time ms - :res[content-length] - :tenant-id - :user-id - :request-id';

    // Create Morgan middleware with custom stream
    this.morganMiddleware = morgan(format, {
      stream: {
        write: (message: string) => {
          // Remove trailing newline
          const trimmedMessage = message.trim();
          
          // Log to Winston
          this.loggingService.http(trimmedMessage, {
            type: 'ACCESS_LOG',
          });
        },
      },
      skip: (req: Request, _res: Response) => {
        // Skip health check endpoints
        if (req.url === '/health' || req.url === '/api/health') {
          return true;
        }
        
        // Skip static assets in development
        if (process.env.NODE_ENV !== 'production') {
          const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'];
          return staticExtensions.some(ext => req.url.endsWith(ext));
        }
        
        return false;
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.morganMiddleware(req, res, next);
  }
}

/**
 * Extended Morgan format for detailed logging
 */
export class ExtendedMorganMiddleware implements NestMiddleware {
  private morganMiddleware: any;

  constructor(private readonly loggingService: LoggingService) {
    // Register additional tokens
    morgan.token('body', (req: Request) => {
      const body = req.body;
      if (!body || Object.keys(body).length === 0) return '-';
      
      // Sanitize sensitive data
      const sanitized = { ...body };
      const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
      
      sensitiveFields.forEach(field => {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      });
      
      return JSON.stringify(sanitized);
    });

    morgan.token('query', (req: Request) => {
      const query = req.query;
      if (!query || Object.keys(query).length === 0) return '-';
      return JSON.stringify(query);
    });

    morgan.token('error', (_req: Request, res: Response) => {
      return (res as any).error || '-';
    });

    // Extended format with body and query
    const format = JSON.stringify({
      timestamp: ':date[iso]',
      method: ':method',
      url: ':url',
      status: ':status',
      responseTime: ':response-time',
      contentLength: ':res[content-length]',
      remoteAddr: ':remote-addr',
      userAgent: ':user-agent',
      referer: ':referrer',
      tenantId: ':tenant-id',
      userId: ':user-id',
      requestId: ':request-id',
      body: ':body',
      query: ':query',
      error: ':error',
    });

    this.morganMiddleware = morgan(format, {
      stream: {
        write: (message: string) => {
          try {
            const logEntry = JSON.parse(message.trim());
            this.loggingService.http('HTTP Request', logEntry);
          } catch (error) {
            this.loggingService.http(message.trim());
          }
        },
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.morganMiddleware(req, res, next);
  }
}