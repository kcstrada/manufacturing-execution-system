import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Notification } from '../entities/notification.entity';
import {
  NotificationResult,
  NotificationStatus,
  NotificationChannel,
} from '../types/notification.types';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter?: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const emailConfig = {
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    };

    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      this.logger.warn(
        'SMTP credentials not configured, email service will be disabled',
      );
      return;
    }

    this.transporter = nodemailer.createTransport(emailConfig);

    this.transporter.verify((error) => {
      if (error) {
        this.logger.error(
          `Email transporter verification failed: ${error.message}`,
        );
      } else {
        this.logger.log('Email transporter is ready');
      }
    });
  }

  async send(notification: Notification): Promise<NotificationResult> {
    try {
      if (!this.transporter) {
        throw new Error('Email service not configured');
      }

      // Get user email from preferences or notification data
      const recipientEmail = await this.getRecipientEmail(notification);
      if (!recipientEmail) {
        throw new Error('Recipient email not found');
      }

      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM', 'noreply@mes.com'),
        to: recipientEmail,
        subject: notification.title,
        html: this.formatHtmlEmail(notification),
        text: this.formatTextEmail(notification),
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(
        `Email sent successfully to ${recipientEmail}: ${info.messageId}`,
      );

      return {
        success: true,
        notificationId: notification.id,
        channel: NotificationChannel.EMAIL,
        status: NotificationStatus.DELIVERED,
        deliveredAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to send email: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return {
        success: false,
        notificationId: notification.id,
        channel: NotificationChannel.EMAIL,
        status: NotificationStatus.FAILED,
        error: (error as Error).message,
      };
    }
  }

  private async getRecipientEmail(
    notification: Notification,
  ): Promise<string | null> {
    // First check if email is in notification data
    if (notification.data?.email) {
      return notification.data.email;
    }

    // TODO: Fetch from user service
    // const user = await this.userService.findById(notification.userId);
    // return user?.email;

    return null;
  }

  private formatHtmlEmail(notification: Notification): string {
    const baseUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const logoUrl = notification.metadata?.iconUrl || `${baseUrl}/logo.png`;
    const actionUrl = notification.metadata?.actionUrl;

    let actionsHtml = '';
    if (notification.actions && notification.actions.length > 0) {
      actionsHtml = `
        <div style="margin-top: 30px;">
          ${notification.actions
            .map(
              (action) => `
            <a href="${baseUrl}/notifications/${notification.id}/action/${action.action}" 
               style="display: inline-block; padding: 10px 20px; margin: 5px; 
                      background-color: ${this.getActionColor(action.style)}; 
                      color: white; text-decoration: none; border-radius: 5px;">
              ${action.label}
            </a>
          `,
            )
            .join('')}
        </div>
      `;
    } else if (actionUrl) {
      actionsHtml = `
        <div style="margin-top: 30px;">
          <a href="${actionUrl}" 
             style="display: inline-block; padding: 10px 20px; 
                    background-color: #007bff; color: white; 
                    text-decoration: none; border-radius: 5px;">
            View Details
          </a>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${notification.title}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="${logoUrl}" alt="Logo" style="height: 50px;">
            </div>
            
            <h2 style="color: #212529; margin-bottom: 20px;">${notification.title}</h2>
            
            <div style="background-color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
              ${notification.message.replace(/\n/g, '<br>')}
            </div>
            
            ${actionsHtml}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
              <p>This is an automated message from Manufacturing Execution System</p>
              <p>
                <a href="${baseUrl}/notifications/preferences" style="color: #6c757d;">
                  Manage notification preferences
                </a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private formatTextEmail(notification: Notification): string {
    const baseUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    let actionsText = '';

    if (notification.actions && notification.actions.length > 0) {
      actionsText =
        '\n\nActions:\n' +
        notification.actions
          .map(
            (action) =>
              `- ${action.label}: ${baseUrl}/notifications/${notification.id}/action/${action.action}`,
          )
          .join('\n');
    } else if (notification.metadata?.actionUrl) {
      actionsText = `\n\nView Details: ${notification.metadata.actionUrl}`;
    }

    return `
${notification.title}
${'='.repeat(notification.title.length)}

${notification.message}
${actionsText}

---
This is an automated message from Manufacturing Execution System
Manage notification preferences: ${baseUrl}/notifications/preferences
    `.trim();
  }

  private getActionColor(style?: string): string {
    switch (style) {
      case 'primary':
        return '#007bff';
      case 'secondary':
        return '#6c757d';
      case 'danger':
        return '#dc3545';
      default:
        return '#007bff';
    }
  }

  async sendBatch(
    notifications: Notification[],
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const notification of notifications) {
      const result = await this.send(notification);
      results.push(result);
    }

    return results;
  }

  async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
