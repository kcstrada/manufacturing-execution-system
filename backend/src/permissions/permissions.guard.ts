import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from './permissions.service';

export interface PermissionCheck {
  relation: string;
  objectType: string;
  objectIdParam?: string; // Request param name containing the object ID
  objectIdBody?: string; // Request body field containing the object ID
}

export const PERMISSION_KEY = 'permission';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissionCheck = this.reflector.getAllAndOverride<PermissionCheck>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permissionCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get object ID from request params or body
    let objectId: string;
    if (permissionCheck.objectIdParam) {
      objectId = request.params[permissionCheck.objectIdParam];
    } else if (permissionCheck.objectIdBody) {
      objectId = request.body[permissionCheck.objectIdBody];
    } else {
      // Default to 'id' param
      objectId = request.params.id;
    }

    if (!objectId) {
      throw new ForbiddenException('Object ID not found in request');
    }

    const userId = `user:${user.sub || user.id}`;
    const object = `${permissionCheck.objectType}:${objectId}`;

    const hasPermission = await this.permissionsService.check(
      userId,
      permissionCheck.relation,
      object,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `User does not have '${permissionCheck.relation}' permission on ${object}`,
      );
    }

    return true;
  }
}
