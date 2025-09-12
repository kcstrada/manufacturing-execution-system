import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationPreference } from '../entities/notification-preference.entity';
import { NotificationType, NotificationChannel } from '../types/notification.types';

@Injectable()
export class NotificationPreferenceService {
  private readonly logger = new Logger(NotificationPreferenceService.name);

  constructor(
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepository: Repository<NotificationPreference>,
  ) {}

  async getUserPreference(
    userId: string,
    tenantId: string,
    type: NotificationType,
    channel: NotificationChannel,
  ): Promise<NotificationPreference | null> {
    return await this.preferenceRepository.findOne({
      where: {
        userId,
        tenantId,
        type,
        channel,
      },
    });
  }

  async getUserPreferences(
    userId: string,
    tenantId: string,
  ): Promise<NotificationPreference[]> {
    return await this.preferenceRepository.find({
      where: {
        userId,
        tenantId,
      },
      order: {
        type: 'ASC',
        channel: 'ASC',
      },
    });
  }

  async createOrUpdatePreference(
    userId: string,
    tenantId: string,
    type: NotificationType,
    channel: NotificationChannel,
    enabled: boolean,
    settings?: any,
  ): Promise<NotificationPreference> {
    let preference = await this.getUserPreference(userId, tenantId, type, channel);

    if (preference) {
      preference.enabled = enabled;
      if (settings) {
        preference.settings = { ...preference.settings, ...settings };
      }
    } else {
      preference = this.preferenceRepository.create({
        userId,
        tenantId,
        type,
        channel,
        enabled,
        settings,
      });
    }

    return await this.preferenceRepository.save(preference);
  }

  async bulkUpdatePreferences(
    userId: string,
    tenantId: string,
    preferences: Array<{
      type: NotificationType;
      channel: NotificationChannel;
      enabled: boolean;
      settings?: any;
    }>,
  ): Promise<NotificationPreference[]> {
    const updated: NotificationPreference[] = [];

    for (const pref of preferences) {
      const preference = await this.createOrUpdatePreference(
        userId,
        tenantId,
        pref.type,
        pref.channel,
        pref.enabled,
        pref.settings,
      );
      updated.push(preference);
    }

    return updated;
  }

  async setDefaultPreferences(userId: string, tenantId: string): Promise<void> {
    const defaultPreferences = [
      // Order notifications - all channels enabled
      { type: NotificationType.ORDER_CREATED, channel: NotificationChannel.EMAIL, enabled: true },
      { type: NotificationType.ORDER_CREATED, channel: NotificationChannel.IN_APP, enabled: true },
      { type: NotificationType.ORDER_COMPLETED, channel: NotificationChannel.EMAIL, enabled: true },
      { type: NotificationType.ORDER_COMPLETED, channel: NotificationChannel.IN_APP, enabled: true },
      { type: NotificationType.ORDER_CANCELLED, channel: NotificationChannel.EMAIL, enabled: true },
      { type: NotificationType.ORDER_CANCELLED, channel: NotificationChannel.IN_APP, enabled: true },
      { type: NotificationType.ORDER_DELAYED, channel: NotificationChannel.EMAIL, enabled: true },
      { type: NotificationType.ORDER_DELAYED, channel: NotificationChannel.IN_APP, enabled: true },
      
      // Inventory notifications - critical ones via email
      { type: NotificationType.INVENTORY_LOW_STOCK, channel: NotificationChannel.EMAIL, enabled: true },
      { type: NotificationType.INVENTORY_LOW_STOCK, channel: NotificationChannel.IN_APP, enabled: true },
      { type: NotificationType.INVENTORY_OUT_OF_STOCK, channel: NotificationChannel.EMAIL, enabled: true },
      { type: NotificationType.INVENTORY_OUT_OF_STOCK, channel: NotificationChannel.IN_APP, enabled: true },
      { type: NotificationType.INVENTORY_EXPIRED, channel: NotificationChannel.EMAIL, enabled: true },
      { type: NotificationType.INVENTORY_EXPIRED, channel: NotificationChannel.IN_APP, enabled: true },
      
      // Task notifications
      { type: NotificationType.TASK_ASSIGNED, channel: NotificationChannel.EMAIL, enabled: true },
      { type: NotificationType.TASK_ASSIGNED, channel: NotificationChannel.IN_APP, enabled: true },
      { type: NotificationType.TASK_OVERDUE, channel: NotificationChannel.EMAIL, enabled: true },
      { type: NotificationType.TASK_OVERDUE, channel: NotificationChannel.IN_APP, enabled: true },
      
      // Quality notifications - critical
      { type: NotificationType.QUALITY_ALERT, channel: NotificationChannel.EMAIL, enabled: true },
      { type: NotificationType.QUALITY_ALERT, channel: NotificationChannel.IN_APP, enabled: true },
      { type: NotificationType.QUALITY_INSPECTION_FAILED, channel: NotificationChannel.EMAIL, enabled: true },
      { type: NotificationType.QUALITY_INSPECTION_FAILED, channel: NotificationChannel.IN_APP, enabled: true },
      
      // Maintenance notifications
      { type: NotificationType.MAINTENANCE_DUE, channel: NotificationChannel.EMAIL, enabled: true },
      { type: NotificationType.MAINTENANCE_DUE, channel: NotificationChannel.IN_APP, enabled: true },
      { type: NotificationType.EQUIPMENT_BREAKDOWN, channel: NotificationChannel.EMAIL, enabled: true },
      { type: NotificationType.EQUIPMENT_BREAKDOWN, channel: NotificationChannel.IN_APP, enabled: true },
      
      // System notifications - in-app only by default
      { type: NotificationType.SYSTEM_ALERT, channel: NotificationChannel.EMAIL, enabled: false },
      { type: NotificationType.SYSTEM_ALERT, channel: NotificationChannel.IN_APP, enabled: true },
      { type: NotificationType.SYSTEM_UPDATE, channel: NotificationChannel.EMAIL, enabled: false },
      { type: NotificationType.SYSTEM_UPDATE, channel: NotificationChannel.IN_APP, enabled: true },
      { type: NotificationType.SYSTEM_ERROR, channel: NotificationChannel.EMAIL, enabled: true },
      { type: NotificationType.SYSTEM_ERROR, channel: NotificationChannel.IN_APP, enabled: true },
    ];

    for (const pref of defaultPreferences) {
      const existing = await this.getUserPreference(userId, tenantId, pref.type, pref.channel);
      if (!existing) {
        await this.createOrUpdatePreference(
          userId,
          tenantId,
          pref.type,
          pref.channel,
          pref.enabled,
        );
      }
    }

    this.logger.log(`Set default notification preferences for user ${userId}`);
  }

  async disableAllNotifications(userId: string, tenantId: string): Promise<void> {
    await this.preferenceRepository.update(
      { userId, tenantId },
      { enabled: false },
    );
  }

  async enableAllNotifications(userId: string, tenantId: string): Promise<void> {
    await this.preferenceRepository.update(
      { userId, tenantId },
      { enabled: true },
    );
  }

  async updateChannelSettings(
    userId: string,
    tenantId: string,
    channel: NotificationChannel,
    settings: any,
  ): Promise<void> {
    const preferences = await this.preferenceRepository.find({
      where: {
        userId,
        tenantId,
        channel,
      },
    });

    for (const preference of preferences) {
      preference.settings = { ...preference.settings, ...settings };
      await this.preferenceRepository.save(preference);
    }
  }

  async generateUnsubscribeToken(
    userId: string,
    channel: 'email' | 'sms',
  ): Promise<string> {
    const token = Buffer.from(`${userId}:${channel}:${Date.now()}`).toString('base64');
    
    // Store token in preferences
    const preferences = await this.preferenceRepository.find({
      where: { userId },
    });

    for (const preference of preferences) {
      if (!preference.unsubscribeTokens) {
        preference.unsubscribeTokens = {};
      }
      preference.unsubscribeTokens[channel] = token;
      await this.preferenceRepository.save(preference);
    }

    return token;
  }

  async unsubscribeByToken(token: string): Promise<boolean> {
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [userId, channel] = decoded.split(':');

      const preferences = await this.preferenceRepository.find({
        where: {
          userId,
          channel: channel as NotificationChannel,
        },
      });

      for (const preference of preferences) {
        if (preference.unsubscribeTokens?.[channel as 'email' | 'sms'] === token) {
          preference.enabled = false;
          await this.preferenceRepository.save(preference);
        }
      }

      this.logger.log(`User ${userId} unsubscribed from ${channel} notifications`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to unsubscribe by token: ${(error as Error).message}`);
      return false;
    }
  }

  async getQuietHoursSettings(
    userId: string,
    tenantId: string,
  ): Promise<{
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  } | null> {
    const preference = await this.preferenceRepository.findOne({
      where: {
        userId,
        tenantId,
      },
    });

    return preference?.settings?.quietHours || null;
  }

  async isInQuietHours(userId: string, tenantId: string): Promise<boolean> {
    const quietHours = await this.getQuietHoursSettings(userId, tenantId);
    
    if (!quietHours || !quietHours.enabled) {
      return false;
    }

    // TODO: Implement timezone-aware quiet hours check
    // This would require a timezone library like moment-timezone
    
    return false;
  }
}