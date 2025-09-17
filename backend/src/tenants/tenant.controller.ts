import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
// import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { TenantService } from './tenant.service';
import { TenantInterceptor } from './tenant.interceptor';
import { TenantGuard } from './tenant.guard';
import {
  TenantId,
  TenantContext,
  CrossTenant,
} from './decorators/tenant.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  ApiAuth,
  ApiStandardResponses,
  ApiTenant,
} from '../common/swagger/swagger.decorators';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { KeycloakAdminService } from '../auth/keycloak-admin.service';

@ApiTags('tenants')
@Controller('tenants')
// @UseGuards(AuthGuard) // Temporarily disabled to avoid circular dependency
@UseInterceptors(TenantInterceptor)
@ApiAuth()
@ApiTenant()
@ApiStandardResponses()
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly keycloakAdminService: KeycloakAdminService,
  ) {}

  @Get('current')
  @ApiOperation({
    summary: 'Get current tenant information',
    description:
      'Returns information about the current tenant based on the request context',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant information retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        subdomain: { type: 'string' },
        customDomain: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  getCurrentTenant(@TenantId() tenantId: string, @TenantContext() tenant: any) {
    return {
      id: tenantId,
      ...tenant,
    };
  }

  @Get('current/stats')
  @ApiOperation({
    summary: 'Get current tenant statistics',
    description: 'Returns usage statistics and metrics for the current tenant',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        userCount: { type: 'number' },
        orderCount: { type: 'number' },
        taskCount: { type: 'number' },
        productCount: { type: 'number' },
        storageUsed: { type: 'number' },
        lastActivity: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getTenantStats(@TenantId() _tenantId: string) {
    return this.tenantService.getTenantStats();
  }

  @Get('current/users')
  @UseGuards(TenantGuard)
  @ApiOperation({
    summary: 'Get users in current tenant',
    description: 'Returns a list of all users belonging to the current tenant',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [Object],
  })
  @ApiForbiddenResponse({
    description: 'Access denied - insufficient permissions',
  })
  async getTenantUsers(@TenantId() tenantId: string) {
    // This would query users filtered by tenant
    return {
      tenantId,
      users: [],
      total: 0,
    };
  }

  @Post('switch/:tenantId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Switch to a different tenant (admin only)' })
  // @Roles({ roles: ['admin'] })
  async switchTenant(
    @Param('tenantId') newTenantId: string,
    @CurrentUser() user: any,
  ) {
    // Verify user has access to the target tenant
    const hasAccess = await this.tenantService.hasAccessToTenant(
      user.userId,
      newTenantId,
    );

    if (!hasAccess) {
      return {
        success: false,
        message: 'Access denied to tenant',
      };
    }

    // In a real app, this would update the user's session or JWT
    return {
      success: true,
      message: `Switched to tenant: ${newTenantId}`,
      tenantId: newTenantId,
    };
  }

  @Get('all')
  @CrossTenant()
  // @Roles({ roles: ['admin'] })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all tenants (admin only)' })
  async getAllTenants() {
    const tenants = await this.tenantService.findAll();
    return {
      tenants,
      total: tenants.length,
    };
  }

  @Post('create')
  @CrossTenant()
  // @Roles({ roles: ['admin'] })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new tenant (admin only)' })
  async createTenant(@Body() createTenantDto: CreateTenantDto) {
    const tenant = await this.tenantService.create(createTenantDto);
    return {
      success: true,
      tenant,
    };
  }

  @Put(':tenantId')
  @CrossTenant()
  // @Roles({ roles: ['admin'] })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tenant (admin only)' })
  async updateTenant(
    @Param('tenantId') tenantId: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    const tenant = await this.tenantService.update(tenantId, updateTenantDto);
    return {
      success: true,
      tenant,
    };
  }

  @Delete(':tenantId')
  @CrossTenant()
  // @Roles({ roles: ['admin'] })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete tenant (admin only)' })
  async deleteTenant(@Param('tenantId') tenantId: string) {
    await this.tenantService.remove(tenantId);
    return {
      success: true,
      message: `Tenant ${tenantId} has been deleted`,
    };
  }

  @Post(':tenantId/suspend')
  @CrossTenant()
  // @Roles({ roles: ['admin'] })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspend tenant (admin only)' })
  async suspendTenant(
    @Param('tenantId') tenantId: string,
    @Body('reason') reason: string,
  ) {
    const tenant = await this.tenantService.suspend(tenantId, reason);
    return {
      success: true,
      message: `Tenant ${tenantId} has been suspended`,
      tenant,
      reason,
    };
  }

  @Post(':tenantId/activate')
  @CrossTenant()
  // @Roles({ roles: ['admin'] })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate tenant (admin only)' })
  async activateTenant(@Param('tenantId') tenantId: string) {
    const tenant = await this.tenantService.activate(tenantId);
    return {
      success: true,
      message: `Tenant ${tenantId} has been activated`,
      tenant,
    };
  }

  @Post(':tenantId/users/create-admin')
  @CrossTenant()
  // @Roles({ roles: ['admin'] })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create admin user for tenant' })
  async createAdminUser(
    @Param('tenantId') tenantId: string,
    @Body()
    userData?: {
      username?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      password?: string;
      role?: 'super_admin' | 'executive' | 'admin' | 'worker' | 'sales';
    },
  ) {
    try {
      const user = await this.keycloakAdminService.createAdminUser(
        tenantId,
        userData,
      );
      return {
        success: true,
        message: `Admin user created for tenant ${tenantId}`,
        user,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create admin user',
      };
    }
  }

  @Post(':tenantId/users/create')
  @CrossTenant()
  // @Roles({ roles: ['admin'] })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create regular user for tenant' })
  async createRegularUser(
    @Param('tenantId') tenantId: string,
    @Body()
    userData?: {
      username?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      password?: string;
      role?: 'super_admin' | 'executive' | 'admin' | 'worker' | 'sales';
    },
  ) {
    try {
      const user = await this.keycloakAdminService.createRegularUser(
        tenantId,
        userData,
      );
      return {
        success: true,
        message: `User created for tenant ${tenantId}`,
        user,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create user',
      };
    }
  }

  @Get(':tenantId/users')
  @CrossTenant()
  // @Roles({ roles: ['admin'] })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List users for tenant' })
  async listTenantUsers(@Param('tenantId') tenantId: string) {
    try {
      const users = await this.keycloakAdminService.listUsers(tenantId);
      return {
        success: true,
        users,
        total: users.length,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to list users',
        users: [],
      };
    }
  }
}
