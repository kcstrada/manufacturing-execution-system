import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_CONTEXT } from '../constants';

/**
 * Decorator to inject audit context into method parameters
 * Usage: @AuditContext() context: AuditContextData
 */
export const AuditContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return {
      userId: user?.id || user?.sub,
      tenantId: user?.tenantId || request.headers['x-tenant-id'],
      username: user?.username || user?.email,
      roles: user?.roles || [],
      timestamp: new Date(),
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      requestId: request.id,
    };
  },
);

/**
 * Interface for audit context data
 */
export interface AuditContextData {
  userId?: string;
  tenantId?: string;
  username?: string;
  roles?: string[];
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Decorator to automatically set audit context for service methods
 */
export function WithAuditContext() {
  return function (
    _target: any,
    _propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Try to extract context from the first argument if it's a request context
      const context = args.find((arg) => arg?.userId || arg?.tenantId);

      if (context) {
        // Store context globally for the subscriber to access
        (global as any)[REQUEST_CONTEXT] = context;
      }

      try {
        // Call the original method
        const result = await method.apply(this, args);
        return result;
      } finally {
        // Clean up context after method execution
        delete (global as any)[REQUEST_CONTEXT];
      }
    };

    return descriptor;
  };
}
