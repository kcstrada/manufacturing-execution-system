import {
  Controller,
  Post,
  Get,
  Body,
  HttpStatus,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WebSocketService } from './websocket.service';
import { BroadcastDto, NotificationDto } from './dto/websocket.dto';
import { WebSocketEvent } from './interfaces/websocket.interface';

@ApiTags('WebSocket')
@Controller('websocket')
@ApiBearerAuth()
export class WebSocketController {
  constructor(private readonly webSocketService: WebSocketService) {}

  @Get('clients')
  @ApiOperation({ summary: 'Get connected WebSocket clients' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of connected clients',
  })
  getConnectedClients() {
    return this.webSocketService.getConnectedClients();
  }

  @Get('clients/tenant/:tenantId')
  @ApiOperation({ summary: 'Get connected clients by tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of connected clients for specific tenant',
  })
  getClientsByTenant(@Param('tenantId') tenantId: string) {
    return this.webSocketService.getClientsByTenant(tenantId);
  }

  @Post('broadcast')
  @ApiOperation({ summary: 'Broadcast message to WebSocket clients' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Message broadcasted successfully',
  })
  broadcast(
    @Body() broadcastDto: BroadcastDto,
    @CurrentUser() user: any,
  ) {
    this.webSocketService.broadcast(
      broadcastDto.event,
      broadcastDto.data,
      {
        rooms: broadcastDto.rooms,
        roles: broadcastDto.roles,
        userIds: broadcastDto.userIds,
        excludeUserIds: broadcastDto.excludeUserIds,
        tenantId: user.tenantId,
      },
    );

    return {
      success: true,
      message: 'Broadcast sent successfully',
      timestamp: new Date(),
    };
  }

  @Post('notify/:userId')
  @ApiOperation({ summary: 'Send notification to specific user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification sent successfully',
  })
  sendNotification(
    @Param('userId') userId: string,
    @Body() notificationDto: NotificationDto,
    @CurrentUser() user: any,
  ) {
    this.webSocketService.sendNotificationToUser(
      userId,
      user.tenantId,
      {
        type: notificationDto.type,
        title: notificationDto.title,
        message: notificationDto.message,
        severity: notificationDto.severity,
        data: notificationDto.data,
        actions: notificationDto.actions,
      },
    );

    return {
      success: true,
      message: 'Notification sent successfully',
      timestamp: new Date(),
    };
  }

  @Post('notify/role/:role')
  @ApiOperation({ summary: 'Send notification to all users with specific role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification sent to role successfully',
  })
  sendNotificationToRole(
    @Param('role') role: string,
    @Body() notificationDto: NotificationDto,
    @CurrentUser() user: any,
  ) {
    this.webSocketService.broadcastToRole(
      role,
      user.tenantId,
      WebSocketEvent.SYSTEM_NOTIFICATION,
      {
        type: notificationDto.type,
        title: notificationDto.title,
        message: notificationDto.message,
        severity: notificationDto.severity,
        data: notificationDto.data,
        actions: notificationDto.actions,
      },
    );

    return {
      success: true,
      message: `Notification sent to role ${role} successfully`,
      timestamp: new Date(),
    };
  }

  @Post('notify/tenant')
  @ApiOperation({ summary: 'Send notification to all users in tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification sent to tenant successfully',
  })
  sendNotificationToTenant(
    @Body() notificationDto: NotificationDto,
    @CurrentUser() user: any,
  ) {
    this.webSocketService.broadcastToTenant(
      user.tenantId,
      WebSocketEvent.SYSTEM_NOTIFICATION,
      {
        type: notificationDto.type,
        title: notificationDto.title,
        message: notificationDto.message,
        severity: notificationDto.severity,
        data: notificationDto.data,
        actions: notificationDto.actions,
      },
    );

    return {
      success: true,
      message: 'Notification sent to all tenant users successfully',
      timestamp: new Date(),
    };
  }

  @Post('test/connection')
  @ApiOperation({ summary: 'Test WebSocket connection' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Connection test successful',
  })
  testConnection(@CurrentUser() user: any) {
    // Send a test message to the current user
    this.webSocketService.sendNotificationToUser(
      user.sub,
      user.tenantId,
      {
        type: 'info' as any,
        title: 'WebSocket Test',
        message: 'This is a test message from the WebSocket server',
        severity: 'low' as any,
        data: {
          timestamp: new Date(),
          userId: user.sub,
        },
      },
    );

    return {
      success: true,
      message: 'Test message sent. Check your WebSocket connection for the message.',
      timestamp: new Date(),
    };
  }
}