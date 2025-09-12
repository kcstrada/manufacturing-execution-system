import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { RequireRoles as Roles } from '../../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { NotificationService } from '../services/notification.service';
import { InAppNotificationService } from '../services/in-app-notification.service';
import { Notification } from '../entities/notification.entity';
import {
  NotificationPayload,
  NotificationFilter,
  NotificationStats,
} from '../types/notification.types';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly inAppService: InAppNotificationService,
  ) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Send a notification' })
  @ApiResponse({ status: 201, description: 'Notification sent successfully' })
  async send(@Body() payload: NotificationPayload, @CurrentUser() user: any) {
    // Ensure tenant isolation
    payload.tenantId = user.tenantId;
    return await this.notificationService.send(payload);
  }

  @Get()
  @ApiOperation({ summary: 'Get notifications for current user' })
  @ApiResponse({ status: 200, description: 'Returns list of notifications' })
  async getMyNotifications(
    @CurrentUser() user: any,
    @Query() filter: NotificationFilter,
  ): Promise<Notification[]> {
    return await this.notificationService.getNotifications({
      ...filter,
      tenantId: user.tenantId,
      userId: user.id,
    });
  }

  @Get('all')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get all notifications for tenant' })
  @ApiResponse({ status: 200, description: 'Returns list of all notifications' })
  async getAllNotifications(
    @CurrentUser() user: any,
    @Query() filter: NotificationFilter,
  ): Promise<Notification[]> {
    return await this.notificationService.getNotifications({
      ...filter,
      tenantId: user.tenantId,
    });
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread in-app notifications' })
  @ApiResponse({ status: 200, description: 'Returns unread notifications' })
  async getUnreadNotifications(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
  ): Promise<Notification[]> {
    return await this.inAppService.getUnreadNotifications(
      user.id,
      user.tenantId,
      limit || 20,
    );
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Returns unread count' })
  async getUnreadCount(@CurrentUser() user: any): Promise<{ count: number }> {
    const count = await this.inAppService.getUnreadCount(user.id, user.tenantId);
    return { count };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({ status: 200, description: 'Returns notification stats' })
  async getStats(@CurrentUser() user: any): Promise<NotificationStats> {
    return await this.notificationService.getStats(user.tenantId, user.id);
  }

  @Get('stats/all')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get all notification statistics for tenant' })
  @ApiResponse({ status: 200, description: 'Returns all notification stats' })
  async getAllStats(@CurrentUser() user: any): Promise<NotificationStats> {
    return await this.notificationService.getStats(user.tenantId);
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 204, description: 'Notification marked as read' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    await this.notificationService.markAsRead(id, user.id);
  }

  @Put(':id/acknowledge')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Acknowledge notification' })
  @ApiResponse({ status: 204, description: 'Notification acknowledged' })
  async acknowledge(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    await this.notificationService.markAsAcknowledged(id, user.id);
  }

  @Put('read/all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 204, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser() user: any): Promise<void> {
    await this.inAppService.markAllAsRead(user.id, user.tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiResponse({ status: 204, description: 'Notification deleted' })
  async deleteNotification(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<void> {
    await this.inAppService.deleteNotification(id, user.id);
  }

  @Post('retry-failed')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Retry failed notifications' })
  @ApiResponse({ status: 204, description: 'Failed notifications retried' })
  async retryFailed(@CurrentUser() user: any): Promise<void> {
    await this.notificationService.retryFailed(user.tenantId);
  }

  @Post('cleanup-expired')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clean up expired notifications' })
  @ApiResponse({ status: 204, description: 'Expired notifications cleaned up' })
  async cleanupExpired(@CurrentUser() user: any): Promise<void> {
    await this.notificationService.cleanupExpired(user.tenantId);
  }

  @Post('cleanup-old')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Clean up old notifications' })
  @ApiResponse({ status: 200, description: 'Returns number of deleted notifications' })
  async cleanupOld(
    @CurrentUser() user: any,
    @Query('days') days?: number,
  ): Promise<{ deleted: number }> {
    const deleted = await this.inAppService.clearOldNotifications(
      user.tenantId,
      days || 30,
    );
    return { deleted };
  }
}