import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not, LessThan } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification } from '../entities/notification.entity';
import { NotificationPreference } from '../entities/notification-preference.entity';
import {
  NotificationPayload,
  NotificationResult,
  NotificationBatchResult,
  NotificationFilter,
  NotificationStats,
  NotificationStatus,
  NotificationChannel,
  NotificationPriority,
} from '../types/notification.types';
import { EmailService } from './email.service';
import { InAppNotificationService } from './in-app-notification.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationPreferenceService } from './notification-preference.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepository: Repository<NotificationPreference>,
    private readonly emailService: EmailService,
    private readonly inAppService: InAppNotificationService,
    private readonly templateService: NotificationTemplateService,
    private readonly preferenceService: NotificationPreferenceService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async send(payload: NotificationPayload): Promise<NotificationBatchResult> {
    try {
      const channels = Array.isArray(payload.channel)
        ? payload.channel
        : payload.channel
          ? [payload.channel]
          : [NotificationChannel.IN_APP];

      const recipients = await this.resolveRecipients(payload);
      const results: NotificationResult[] = [];

      for (const userId of recipients) {
        for (const channel of channels) {
          const preference = await this.preferenceService.getUserPreference(
            userId,
            payload.tenantId,
            payload.type,
            channel,
          );

          if (!preference || !preference.enabled) {
            continue;
          }

          const notification = await this.createNotification({
            ...payload,
            userId,
            channel,
          });

          const result = await this.sendByChannel(notification, channel);
          results.push(result);

          if (result.success) {
            notification.status = NotificationStatus.SENT;
            notification.sentAt = new Date();
          } else {
            notification.status = NotificationStatus.FAILED;
            notification.lastError = result.error;
          }

          await this.notificationRepository.save(notification);
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      return {
        totalCount: results.length,
        successCount,
        failureCount,
        results,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send notification: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  private async resolveRecipients(
    payload: NotificationPayload,
  ): Promise<string[]> {
    const recipients = new Set<string>();

    if (payload.userId) {
      recipients.add(payload.userId);
    }

    if (payload.userIds) {
      payload.userIds.forEach((id) => recipients.add(id));
    }

    if (payload.roles && payload.roles.length > 0) {
      // TODO: Fetch users by roles from user service
      // const users = await this.userService.getUsersByRoles(payload.tenantId, payload.roles);
      // users.forEach(user => recipients.add(user.id));
    }

    return Array.from(recipients);
  }

  private async createNotification(
    payload: NotificationPayload & {
      userId: string;
      channel: NotificationChannel;
    },
  ): Promise<Notification> {
    let title = payload.title;
    let message = payload.message;

    if (payload.templateId) {
      const template = await this.templateService.getTemplate(
        payload.templateId,
      );
      if (template) {
        const rendered = await this.templateService.renderTemplate(
          template,
          payload.templateData || {},
        );
        title = rendered.subject;
        message = rendered.body;
      }
    }

    const notification = this.notificationRepository.create({
      tenantId: payload.tenantId,
      userId: payload.userId,
      type: payload.type,
      channel: payload.channel,
      priority: payload.priority || NotificationPriority.MEDIUM,
      status: NotificationStatus.PENDING,
      title,
      message,
      data: payload.data,
      metadata: payload.metadata,
      templateId: payload.templateId,
      groupId: payload.groupId,
      scheduledFor: payload.scheduledFor,
      expiresAt: payload.expiresAt,
      actions: payload.actions,
      retryCount: 0,
    });

    return await this.notificationRepository.save(notification);
  }

  private async sendByChannel(
    notification: Notification,
    channel: NotificationChannel,
  ): Promise<NotificationResult> {
    try {
      switch (channel) {
        case NotificationChannel.EMAIL:
          return await this.emailService.send(notification);

        case NotificationChannel.IN_APP:
          return await this.inAppService.send(notification);

        case NotificationChannel.SMS:
          // TODO: Implement SMS service
          return {
            success: false,
            channel,
            status: NotificationStatus.FAILED,
            error: 'SMS service not implemented',
          };

        case NotificationChannel.PUSH:
          // TODO: Implement push notification service
          return {
            success: false,
            channel,
            status: NotificationStatus.FAILED,
            error: 'Push notification service not implemented',
          };

        case NotificationChannel.WEBHOOK:
          // TODO: Implement webhook service
          return {
            success: false,
            channel,
            status: NotificationStatus.FAILED,
            error: 'Webhook service not implemented',
          };

        case NotificationChannel.WEBSOCKET:
          // Send via WebSocket using event emitter
          this.eventEmitter.emit('notification.websocket', notification);
          return {
            success: true,
            notificationId: notification.id,
            channel,
            status: NotificationStatus.SENT,
            deliveredAt: new Date(),
          };

        default:
          return {
            success: false,
            channel,
            status: NotificationStatus.FAILED,
            error: `Unsupported channel: ${channel}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        channel,
        status: NotificationStatus.FAILED,
        error: (error as Error).message,
      };
    }
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { status: NotificationStatus.READ, readAt: new Date() },
    );

    this.eventEmitter.emit('notification.read', { notificationId, userId });
  }

  async markAsAcknowledged(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { status: NotificationStatus.ACKNOWLEDGED, acknowledgedAt: new Date() },
    );

    this.eventEmitter.emit('notification.acknowledged', {
      notificationId,
      userId,
    });
  }

  async getNotifications(filter: NotificationFilter): Promise<Notification[]> {
    const query =
      this.notificationRepository.createQueryBuilder('notification');

    if (filter.tenantId) {
      query.andWhere('notification.tenantId = :tenantId', {
        tenantId: filter.tenantId,
      });
    }

    if (filter.userId) {
      query.andWhere('notification.userId = :userId', {
        userId: filter.userId,
      });
    }

    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      query.andWhere('notification.type IN (:...types)', { types });
    }

    if (filter.channel) {
      const channels = Array.isArray(filter.channel)
        ? filter.channel
        : [filter.channel];
      query.andWhere('notification.channel IN (:...channels)', { channels });
    }

    if (filter.status) {
      const statuses = Array.isArray(filter.status)
        ? filter.status
        : [filter.status];
      query.andWhere('notification.status IN (:...statuses)', { statuses });
    }

    if (filter.priority) {
      const priorities = Array.isArray(filter.priority)
        ? filter.priority
        : [filter.priority];
      query.andWhere('notification.priority IN (:...priorities)', {
        priorities,
      });
    }

    if (filter.read !== undefined) {
      if (filter.read) {
        query.andWhere('notification.readAt IS NOT NULL');
      } else {
        query.andWhere('notification.readAt IS NULL');
      }
    }

    if (filter.acknowledged !== undefined) {
      if (filter.acknowledged) {
        query.andWhere('notification.acknowledgedAt IS NOT NULL');
      } else {
        query.andWhere('notification.acknowledgedAt IS NULL');
      }
    }

    if (filter.startDate) {
      query.andWhere('notification.createdAt >= :startDate', {
        startDate: filter.startDate,
      });
    }

    if (filter.endDate) {
      query.andWhere('notification.createdAt <= :endDate', {
        endDate: filter.endDate,
      });
    }

    if (filter.groupId) {
      query.andWhere('notification.groupId = :groupId', {
        groupId: filter.groupId,
      });
    }

    if (filter.search) {
      query.andWhere(
        '(notification.title ILIKE :search OR notification.message ILIKE :search)',
        { search: `%${filter.search}%` },
      );
    }

    query.orderBy('notification.createdAt', 'DESC');

    return await query.getMany();
  }

  async getStats(
    tenantId: string,
    userId?: string,
  ): Promise<NotificationStats> {
    const query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.tenantId = :tenantId', { tenantId });

    if (userId) {
      query.andWhere('notification.userId = :userId', { userId });
    }

    const notifications = await query.getMany();

    const stats: NotificationStats = {
      total: notifications.length,
      pending: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      byType: {},
      byChannel: {},
      byPriority: {},
    };

    for (const notification of notifications) {
      // Status counts
      switch (notification.status) {
        case NotificationStatus.PENDING:
        case NotificationStatus.QUEUED:
          stats.pending++;
          break;
        case NotificationStatus.SENT:
        case NotificationStatus.SENDING:
          stats.sent++;
          break;
        case NotificationStatus.DELIVERED:
          stats.delivered++;
          break;
        case NotificationStatus.READ:
        case NotificationStatus.ACKNOWLEDGED:
          stats.read++;
          break;
        case NotificationStatus.FAILED:
          stats.failed++;
          break;
      }

      // Type counts
      stats.byType[notification.type] =
        (stats.byType[notification.type] || 0) + 1;

      // Channel counts
      stats.byChannel[notification.channel] =
        (stats.byChannel[notification.channel] || 0) + 1;

      // Priority counts
      stats.byPriority[notification.priority] =
        (stats.byPriority[notification.priority] || 0) + 1;
    }

    return stats;
  }

  async retryFailed(tenantId: string): Promise<void> {
    const failedNotifications = await this.notificationRepository.find({
      where: {
        tenantId,
        status: NotificationStatus.FAILED,
        retryCount: LessThan(3),
      },
    });

    for (const notification of failedNotifications) {
      notification.retryCount++;
      notification.status = NotificationStatus.PENDING;
      await this.notificationRepository.save(notification);

      const result = await this.sendByChannel(
        notification,
        notification.channel,
      );

      if (result.success) {
        notification.status = NotificationStatus.SENT;
        notification.sentAt = new Date();
      } else {
        notification.status = NotificationStatus.FAILED;
        notification.lastError = result.error;
      }

      await this.notificationRepository.save(notification);
    }
  }

  async cleanupExpired(tenantId: string): Promise<void> {
    const expiredNotifications = await this.notificationRepository.find({
      where: {
        tenantId,
        expiresAt: LessThan(new Date()),
        status: In([NotificationStatus.PENDING, NotificationStatus.QUEUED]),
      },
    });

    for (const notification of expiredNotifications) {
      notification.status = NotificationStatus.EXPIRED;
      await this.notificationRepository.save(notification);
    }
  }
}
