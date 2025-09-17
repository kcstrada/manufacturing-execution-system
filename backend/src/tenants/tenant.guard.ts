import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithTenant } from './tenant.middleware';

export const ALLOWED_TENANTS_KEY = 'allowedTenants';
export const REQUIRE_TENANT_KEY = 'requireTenant';

/**
 * Guard to enforce tenant-based access control
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();

    // Check if tenant is required for this route
    const requireTenant = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_TENANT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requireTenant && !request.tenantId) {
      throw new ForbiddenException('Tenant context is required');
    }

    // Check if specific tenants are allowed
    const allowedTenants = this.reflector.getAllAndOverride<string[]>(
      ALLOWED_TENANTS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (allowedTenants && allowedTenants.length > 0) {
      if (!request.tenantId || !allowedTenants.includes(request.tenantId)) {
        throw new ForbiddenException(
          `Access denied for tenant: ${request.tenantId}`,
        );
      }
    }

    // Validate user has access to the tenant
    if (request.user && request.tenantId) {
      const userTenantId =
        (request.user as any).tenant_id || (request.user as any).tenantId;

      // Admin users can access any tenant
      const isAdmin =
        (request.user as any).roles?.includes('admin') ||
        (request.user as any).realm_access?.roles?.includes('admin');

      if (!isAdmin && userTenantId && userTenantId !== request.tenantId) {
        throw new ForbiddenException(
          `User does not have access to tenant: ${request.tenantId}`,
        );
      }
    }

    return true;
  }
}
