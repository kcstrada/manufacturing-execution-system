import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, PermissionRequirement } from '../decorators/permissions.decorator';
import { PermissionsService } from '../../permissions/permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionRequirement[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check each required permission
    for (const permission of requiredPermissions) {
      const hasPermission = await this.checkPermission(user, permission, request);
      
      if (!hasPermission) {
        throw new ForbiddenException(
          `Missing required permission: ${permission.action} on ${permission.resource}`,
        );
      }
    }

    return true;
  }

  private async checkPermission(
    user: any,
    permission: PermissionRequirement,
    request: any,
  ): Promise<boolean> {
    const userId = `user:${user.sub || user.userId || user.id}`;
    
    // Get resource ID from request params or body
    let resourceId = request.params?.id || request.params?.[`${permission.resource}Id`];
    
    if (!resourceId && request.body) {
      resourceId = request.body.id || request.body[`${permission.resource}Id`];
    }

    // If no specific resource ID, check general permission
    if (!resourceId) {
      // Check if user has general permission in their organization
      const organizationId = user.organizationId || 'default';
      return this.permissionsService.check(
        userId,
        permission.action,
        `organization:${organizationId}`,
      );
    }

    // Check specific resource permission
    const object = `${permission.resource}:${resourceId}`;
    return this.permissionsService.check(userId, permission.action, object);
  }
}