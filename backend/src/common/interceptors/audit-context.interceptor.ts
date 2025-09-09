import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { REQUEST_CONTEXT, USER_ID, TENANT_ID } from '../constants';
import { AsyncLocalStorage } from 'async_hooks';

// Create async local storage for request context
const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

/**
 * Interceptor to set audit context for each request
 * This ensures audit fields are automatically populated
 */
@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Create context map
    const contextMap = new Map<string, any>();
    contextMap.set(USER_ID, user?.id || user?.sub);
    contextMap.set(TENANT_ID, user?.tenantId || request.headers['x-tenant-id']);
    contextMap.set('username', user?.username || user?.email);
    contextMap.set('roles', user?.roles || []);
    contextMap.set('timestamp', new Date());
    contextMap.set('ipAddress', request.ip);
    contextMap.set('userAgent', request.headers['user-agent']);
    contextMap.set('requestId', request.id);

    // Set global context for TypeORM subscriber
    const auditContext = {
      userId: contextMap.get(USER_ID),
      tenantId: contextMap.get(TENANT_ID),
      username: contextMap.get('username'),
      roles: contextMap.get('roles'),
    };

    (global as any)[REQUEST_CONTEXT] = auditContext;

    // Run the request handler with the context
    return asyncLocalStorage.run(contextMap, () => {
      return next.handle().pipe(
        tap({
          complete: () => {
            // Clean up global context after request completes
            delete (global as any)[REQUEST_CONTEXT];
          },
          error: () => {
            // Clean up global context on error
            delete (global as any)[REQUEST_CONTEXT];
          },
        }),
      );
    });
  }
}

/**
 * Helper function to get current audit context
 */
export function getCurrentAuditContext(): Map<string, any> | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Helper function to get current user ID
 */
export function getCurrentUserId(): string | undefined {
  const store = asyncLocalStorage.getStore();
  return store?.get(USER_ID);
}

/**
 * Helper function to get current tenant ID
 */
export function getCurrentTenantId(): string | undefined {
  const store = asyncLocalStorage.getStore();
  return store?.get(TENANT_ID);
}