import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export interface PermissionRequirement {
  resource: string;
  action: string;
}

/**
 * Decorator to specify required permissions for a route
 * @param permissions Array of required permissions
 * @example
 * @RequirePermissions({ resource: 'order', action: 'read' })
 */
export const RequirePermissions = (...permissions: PermissionRequirement[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
