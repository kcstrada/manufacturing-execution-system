import { SetMetadata } from '@nestjs/common';
import { PermissionCheck, PERMISSION_KEY } from '../permissions.guard';

export const CheckPermission = (check: PermissionCheck) =>
  SetMetadata(PERMISSION_KEY, check);
