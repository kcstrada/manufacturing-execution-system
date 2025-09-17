import { Controller, Get, Post, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard, Public, Roles } from 'nest-keycloak-connect';
import { CurrentUser } from './decorators/current-user.decorator';
import { CurrentTenant } from './decorators/tenant.decorator';
import { RequirePermissions } from './decorators/permissions.decorator';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { CheckPermission } from '../permissions/decorators/check-permission.decorator';

/**
 * Demo controller showing various authentication and authorization patterns
 */
@ApiTags('Auth Demo')
@Controller('auth-demo')
export class AuthDemoController {
  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Public endpoint - no auth required' })
  publicEndpoint() {
    return {
      message: 'This is a public endpoint',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('authenticated')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Requires authentication only' })
  authenticatedEndpoint(@CurrentUser() user: any) {
    return {
      message: 'You are authenticated',
      user: user.username,
      email: user.email,
    };
  }

  @Get('admin-only')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles({ roles: ['admin'] })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Requires admin role' })
  adminOnlyEndpoint(@CurrentUser() user: any) {
    return {
      message: 'Admin access granted',
      user: user.username,
    };
  }

  @Get('multi-role')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles({ roles: ['admin', 'executive'] })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Requires admin OR executive role' })
  multiRoleEndpoint(@CurrentUser() user: any) {
    return {
      message: 'Admin or Executive access granted',
      user: user.username,
    };
  }

  @Get('tenant-info')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current tenant information' })
  tenantInfo(@CurrentTenant() tenant: string, @CurrentUser() user: any) {
    return {
      tenant,
      user: user.username,
      message: `User ${user.username} belongs to tenant: ${tenant}`,
    };
  }

  @Get('order/:id')
  @UseGuards(AuthGuard, PermissionsGuard)
  @CheckPermission({
    relation: 'viewer',
    objectType: 'order',
    objectIdParam: 'id',
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'View order - requires viewer permission on specific order',
  })
  viewOrder(@Param('id') orderId: string, @CurrentUser() user: any) {
    return {
      message: `User ${user.username} can view order ${orderId}`,
      orderId,
    };
  }

  @Post('order/:id/edit')
  @UseGuards(AuthGuard, PermissionsGuard)
  @CheckPermission({
    relation: 'editor',
    objectType: 'order',
    objectIdParam: 'id',
  })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Edit order - requires editor permission on specific order',
  })
  editOrder(@Param('id') orderId: string, @CurrentUser() user: any) {
    return {
      message: `User ${user.username} can edit order ${orderId}`,
      orderId,
    };
  }

  @Get('permission-check')
  @UseGuards(AuthGuard, PermissionsGuard)
  @RequirePermissions({ resource: 'organization', action: 'viewer' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check organization viewer permission' })
  checkPermission(@CurrentUser() user: any) {
    return {
      message: 'Permission check passed',
      user: user.username,
    };
  }

  @Get('combined-check')
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles({ roles: ['executive', 'admin'] })
  @RequirePermissions({ resource: 'organization', action: 'editor' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Combined role and permission check' })
  combinedCheck(@CurrentUser() user: any) {
    return {
      message: 'Both role and permission checks passed',
      user: user.username,
    };
  }
}
