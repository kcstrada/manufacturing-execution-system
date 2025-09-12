import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { NotificationResult, NotificationStatus, NotificationChannel } from '../types/notification.types';

@Injectable()
export class InAppNotificationService {
  private readonly logger = new Logger(InAppNotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async send(notification: Notification): Promise<NotificationResult> {
    try {
      // In-app notifications are immediately available
      notification.status = NotificationStatus.DELIVERED;
      await this.notificationRepository.save(notification);

      // Emit event for real-time delivery via WebSocket
      this.eventEmitter.emit('notification.created', {
        tenantId: notification.tenantId,
        userId: notification.userId,
        notification: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          data: notification.data,
          metadata: notification.metadata,
          actions: notification.actions,
          createdAt: notification.createdAt,
        },
      });

      this.logger.log(`In-app notification delivered to user ${notification.userId}`);

      return {
        success: true,
        notificationId: notification.id,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.DELIVERED,
        deliveredAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to deliver in-app notification: ${(error as Error).message}`, (error as Error).stack);
      return {
        success: false,
        notificationId: notification.id,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.FAILED,
        error: (error as Error).message,
      };
    }
  }

  async getUnreadCount(userId: string, tenantId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: {
        userId,
        tenantId,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.DELIVERED,
      },
    });
  }

  async getUnreadNotifications(userId: string, tenantId: string, limit: number = 20): Promise<Notification[]> {
    return await this.notificationRepository.find({
      where: {
        userId,
        tenantId,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.DELIVERED,
      },
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });
  }

  async markAllAsRead(userId: string, tenantId: string): Promise<void> {
    const notifications = await this.notificationRepository.find({
      where: {
        userId,
        tenantId,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.DELIVERED,
      },
    });

    const now = new Date();
    for (const notification of notifications) {
      notification.status = NotificationStatus.READ;
      notification.readAt = now;
    }

    await this.notificationRepository.save(notifications);

    this.eventEmitter.emit('notifications.all_read', {
      tenantId,
      userId,
      count: notifications.length,
    });
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: {
        id: notificationId,
        userId,
        channel: NotificationChannel.IN_APP,
      },
    });

    if (notification) {
      await this.notificationRepository.remove(notification);
      
      this.eventEmitter.emit('notification.deleted', {
        tenantId: notification.tenantId,
        userId,
        notificationId,
      });
    }
  }

  async clearOldNotifications(tenantId: string, daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('tenantId = :tenantId', { tenantId })
      .andWhere('channel = :channel', { channel: NotificationChannel.IN_APP })
      .andWhere('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('status IN (:...statuses)', { 
        statuses: [NotificationStatus.READ, NotificationStatus.ACKNOWLEDGED] 
      })
      .execute();

    this.logger.log(`Cleared ${result.affected} old in-app notifications for tenant ${tenantId}`);
    return result.affected || 0;
  }
}