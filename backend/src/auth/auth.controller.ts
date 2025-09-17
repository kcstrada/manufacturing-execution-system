import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard, Public, RoleGuard, Roles } from 'nest-keycloak-connect';
import { AuthService } from './auth.service';
import { ApiRateLimit } from '../common/decorators/rate-limit.decorator';

@ApiTags('Authentication')
@Controller('auth')
@ApiRateLimit() // Apply standard API rate limiting to all endpoints
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @UseGuards(AuthGuard)
  getProfile(@Request() req: any) {
    return this.authService.validateUser(req.user);
  }

  @Get('roles')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user roles' })
  @UseGuards(AuthGuard)
  getRoles(@Request() req: any) {
    return {
      roles: this.authService.extractRoles(req.user),
    };
  }

  @Get('admin-only')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin only endpoint' })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles({ roles: ['admin'] })
  adminOnly(@Request() req: any) {
    return {
      message: 'This is an admin only endpoint',
      user: req.user.preferred_username,
    };
  }

  @Get('executive-only')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Executive only endpoint' })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles({ roles: ['executive'] })
  executiveOnly(@Request() req: any) {
    return {
      message: 'This is an executive only endpoint',
      user: req.user.preferred_username,
    };
  }

  @Get('worker-only')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Worker only endpoint' })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles({ roles: ['worker'] })
  workerOnly(@Request() req: any) {
    return {
      message: 'This is a worker only endpoint',
      user: req.user.preferred_username,
      worker_id: req.user.worker_id,
    };
  }

  @Get('health')
  @Public()
  @ApiOperation({ summary: 'Health check endpoint (public)' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
