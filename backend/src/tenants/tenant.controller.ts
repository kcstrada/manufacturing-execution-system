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
  ApiForbiddenResponse 
} from '@nestjs/swagger';
// import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { TenantService } from './tenant.service';
import { TenantInterceptor } from './tenant.interceptor';
import { TenantGuard } from './tenant.guard';
import { TenantId, TenantContext, CrossTenant } from './decorators/tenant.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiAuth, ApiStandardResponses, ApiTenant } from '../common/swagger/swagger.decorators';

@ApiTags('tenants')
@Controller('tenants')
// @UseGuards(AuthGuard) // Temporarily disabled to avoid circular dependency
@UseInterceptors(TenantInterceptor)
@ApiAuth()
@ApiTenant()
@ApiStandardResponses()
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('current')
  @ApiOperation({ 
    summary: 'Get current tenant information',
    description: 'Returns information about the current tenant based on the request context'
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
      }
    }
  })
  getCurrentTenant(
    @TenantId() tenantId: string,
    @TenantContext() tenant: any,
  ) {
    return {
      id: tenantId,
      ...tenant,
    };
  }

  @Get('current/stats')
  @ApiOperation({ 
    summary: 'Get current tenant statistics',
    description: 'Returns usage statistics and metrics for the current tenant'
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
      }
    }
  })
  async getTenantStats(@TenantId() _tenantId: string) {
    return this.tenantService.getTenantStats();
  }

  @Get('current/users')
  @UseGuards(TenantGuard)
  @ApiOperation({ 
    summary: 'Get users in current tenant',
    description: 'Returns a list of all users belonging to the current tenant'
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [Object]
  })
  @ApiForbiddenResponse({
    description: 'Access denied - insufficient permissions'
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
    // This would return all tenants from database
    return {
      tenants: [
        {
          id: 'default',
          name: 'Default Tenant',
          status: 'active',
        },
        {
          id: 'tenant-acme',
          name: 'ACME Corporation',
          status: 'active',
        },
      ],
      total: 2,
    };
  }

  @Post('create')
  @CrossTenant()
  // @Roles({ roles: ['admin'] })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new tenant (admin only)' })
  async createTenant(@Body() createTenantDto: any) {
    // This would create a new tenant
    return {
      success: true,
      tenant: {
        id: 'new-tenant-id',
        ...createTenantDto,
      },
    };
  }

  @Put(':tenantId')
  @CrossTenant()
  // @Roles({ roles: ['admin'] })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tenant (admin only)' })
  async updateTenant(
    @Param('tenantId') tenantId: string,
    @Body() updateTenantDto: any,
  ) {
    // This would update the tenant
    return {
      success: true,
      tenant: {
        id: tenantId,
        ...updateTenantDto,
      },
    };
  }

  @Delete(':tenantId')
  @CrossTenant()
  // @Roles({ roles: ['admin'] })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete tenant (admin only)' })
  async deleteTenant(@Param('tenantId') tenantId: string) {
    // This would soft-delete the tenant
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
    // This would suspend the tenant
    return {
      success: true,
      message: `Tenant ${tenantId} has been suspended`,
      reason,
    };
  }

  @Post(':tenantId/activate')
  @CrossTenant()
  // @Roles({ roles: ['admin'] })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate tenant (admin only)' })
  async activateTenant(@Param('tenantId') tenantId: string) {
    // This would activate the tenant
    return {
      success: true,
      message: `Tenant ${tenantId} has been activated`,
    };
  }
}