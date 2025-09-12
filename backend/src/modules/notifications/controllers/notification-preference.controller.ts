import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { NotificationPreferenceService } from '../services/notification-preference.service';
import { NotificationPreference } from '../entities/notification-preference.entity';
import { NotificationType, NotificationChannel } from '../types/notification.types';

@ApiTags('Notification Preferences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notification-preferences')
export class NotificationPreferenceController {
  constructor(
    private readonly preferenceService: NotificationPreferenceService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({ status: 200, description: 'Returns user preferences' })
  async getPreferences(@CurrentUser() user: any): Promise<NotificationPreference[]> {
    return await this.preferenceService.getUserPreferences(user.id, user.tenantId);
  }

  @Put()
  @ApiOperation({ summary: 'Update notification preference' })
  @ApiResponse({ status: 200, description: 'Preference updated successfully' })
  async updatePreference(
    @CurrentUser() user: any,
    @Body() body: {
      type: NotificationType;
      channel: NotificationChannel;
      enabled: boolean;
      settings?: any;
    },
  ): Promise<NotificationPreference> {
    return await this.preferenceService.createOrUpdatePreference(
      user.id,
      user.tenantId,
      body.type,
      body.channel,
      body.enabled,
      body.settings,
    );
  }

  @Put('bulk')
  @ApiOperation({ summary: 'Bulk update notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  async bulkUpdatePreferences(
    @CurrentUser() user: any,
    @Body() preferences: Array<{
      type: NotificationType;
      channel: NotificationChannel;
      enabled: boolean;
      settings?: any;
    }>,
  ): Promise<NotificationPreference[]> {
    return await this.preferenceService.bulkUpdatePreferences(
      user.id,
      user.tenantId,
      preferences,
    );
  }

  @Post('defaults')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Set default notification preferences' })
  @ApiResponse({ status: 204, description: 'Default preferences set' })
  async setDefaults(@CurrentUser() user: any): Promise<void> {
    await this.preferenceService.setDefaultPreferences(user.id, user.tenantId);
  }

  @Put('disable-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disable all notifications' })
  @ApiResponse({ status: 204, description: 'All notifications disabled' })
  async disableAll(@CurrentUser() user: any): Promise<void> {
    await this.preferenceService.disableAllNotifications(user.id, user.tenantId);
  }

  @Put('enable-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Enable all notifications' })
  @ApiResponse({ status: 204, description: 'All notifications enabled' })
  async enableAll(@CurrentUser() user: any): Promise<void> {
    await this.preferenceService.enableAllNotifications(user.id, user.tenantId);
  }

  @Put('channel/:channel/settings')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update channel-specific settings' })
  @ApiResponse({ status: 204, description: 'Channel settings updated' })
  async updateChannelSettings(
    @CurrentUser() user: any,
    @Param('channel') channel: NotificationChannel,
    @Body() settings: any,
  ): Promise<void> {
    await this.preferenceService.updateChannelSettings(
      user.id,
      user.tenantId,
      channel,
      settings,
    );
  }

  @Get('quiet-hours')
  @ApiOperation({ summary: 'Get quiet hours settings' })
  @ApiResponse({ status: 200, description: 'Returns quiet hours settings' })
  async getQuietHours(@CurrentUser() user: any): Promise<any> {
    return await this.preferenceService.getQuietHoursSettings(user.id, user.tenantId);
  }

  @Get('quiet-hours/active')
  @ApiOperation({ summary: 'Check if currently in quiet hours' })
  @ApiResponse({ status: 200, description: 'Returns quiet hours status' })
  async isInQuietHours(@CurrentUser() user: any): Promise<{ active: boolean }> {
    const active = await this.preferenceService.isInQuietHours(user.id, user.tenantId);
    return { active };
  }

  @Post('unsubscribe-token/:channel')
  @ApiOperation({ summary: 'Generate unsubscribe token' })
  @ApiResponse({ status: 200, description: 'Returns unsubscribe token' })
  async generateUnsubscribeToken(
    @CurrentUser() user: any,
    @Param('channel') channel: 'email' | 'sms',
  ): Promise<{ token: string }> {
    const token = await this.preferenceService.generateUnsubscribeToken(user.id, channel);
    return { token };
  }

  @Post('unsubscribe/:token')
  @ApiOperation({ summary: 'Unsubscribe using token' })
  @ApiResponse({ status: 200, description: 'Unsubscribed successfully' })
  async unsubscribe(@Param('token') token: string): Promise<{ success: boolean }> {
    const success = await this.preferenceService.unsubscribeByToken(token);
    return { success };
  }
}