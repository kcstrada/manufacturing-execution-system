import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { QUEUE_NAMES, JOB_NAMES } from '../constants/queue-names';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor(QUEUE_NAMES.NOTIFICATIONS)
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  @Process(JOB_NAMES.SEND_EMAIL)
  async sendEmail(job: Job) {
    this.logger.log(`Sending email - Job ${job.id}`);
    const { to, subject, body, template, data } = job.data;

    try {
      // Simulate email sending
      await this.simulateProcessing(1000);

      this.logger.log(`Email sent to ${to}: ${subject}`);

      return {
        success: true,
        to,
        subject,
        sentAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }

  @Process(JOB_NAMES.SEND_PUSH_NOTIFICATION)
  async sendPushNotification(job: Job) {
    this.logger.log(`Sending push notification - Job ${job.id}`);
    const { userId, title, message, data } = job.data;

    try {
      await this.simulateProcessing(500);

      // Emit WebSocket notification
      this.eventEmitter.emit('notification.push', {
        userId,
        title,
        message,
        data,
        timestamp: new Date(),
      });

      return {
        success: true,
        userId,
        title,
        sentAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`);
      throw error;
    }
  }

  @Process(JOB_NAMES.BROADCAST_NOTIFICATION)
  async broadcastNotification(job: Job) {
    this.logger.log(`Broadcasting notification - Job ${job.id}`);
    const { tenantId, roles, title, message, severity } = job.data;

    try {
      await this.simulateProcessing(1000);

      // Emit broadcast event
      this.eventEmitter.emit('notification.broadcast', {
        tenantId,
        roles,
        title,
        message,
        severity,
        timestamp: new Date(),
      });

      return {
        success: true,
        tenantId,
        roles,
        broadcastAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to broadcast notification: ${error.message}`);
      throw error;
    }
  }

  private async simulateProcessing(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
