import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { RequestWithTenant } from '../tenant.middleware';

/**
 * Decorator to specify allowed tenants for a route
 */
export const AllowedTenants = (...tenants: string[]) =>
  SetMetadata('allowedTenants', tenants);

/**
 * Decorator to mark a route as requiring tenant context
 */
export const RequireTenant = () => SetMetadata('requireTenant', true);

/**
 * Parameter decorator to get current tenant ID
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithTenant>();
    return request.tenantId || 'default';
  },
);

/**
 * Parameter decorator to get full tenant context
 */
export const TenantContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithTenant>();
    return request.tenant || { id: 'default', name: 'Default Tenant' };
  },
);

/**
 * Decorator to mark an endpoint as cross-tenant (admin only)
 */
export const CrossTenant = () => SetMetadata('crossTenant', true);

/**
 * Decorator to specify tenant isolation strategy
 */
export enum TenantIsolationStrategy {
  DATABASE = 'database', // Separate database per tenant
  SCHEMA = 'schema', // Separate schema per tenant
  ROW = 'row', // Row-level isolation (shared tables)
}

export const TenantIsolation = (strategy: TenantIsolationStrategy) =>
  SetMetadata('tenantIsolationStrategy', strategy);
