import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { StockAlert } from '../../../entities/stock-alert.entity';
import { StockLevelAlert } from '../services/stock-alert.service';

export interface StockAlertEvent {
  alert: StockAlert;
  product: StockLevelAlert;
}

export interface NotificationPayload {
  type: 'email' | 'webhook' | 'dashboard';
  recipient?: string;
  data: {
    alert: StockAlert;
    product: StockLevelAlert;
  };
}

@Injectable()
export class StockAlertListener {
  private readonly logger = new Logger(StockAlertListener.name);

  constructor(
    @InjectQueue('notifications') private notificationQueue: Queue,
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  /**
   * Handle new stock alert creation
   */
  @OnEvent('stock.alert.created')
  async handleAlertCreated(event: StockAlertEvent) {
    this.logger.log(
      `Processing new stock alert for product: ${event.product.sku}`,
    );

    try {
      // Send dashboard notification
      await this.sendDashboardNotification(event);

      // Send email notification for critical alerts
      if (
        event.alert.severity === 'critical' ||
        event.alert.severity === 'high'
      ) {
        await this.sendEmailNotification(event);
      }

      // Send webhook notification if configured
      await this.sendWebhookNotification(event);

      this.logger.log(`Notifications dispatched for alert: ${event.alert.id}`);
    } catch (error) {
      this.logger.error('Error processing stock alert', error);
    }
  }

  /**
   * Handle stock alert acknowledgement
   */
  @OnEvent('stock.alert.acknowledged')
  async handleAlertAcknowledged(event: StockAlertEvent) {
    this.logger.log(`Stock alert acknowledged: ${event.alert.id}`);

    // Update dashboard notifications
    await this.notificationQueue.add('update-notification', {
      type: 'alert-acknowledged',
      alertId: event.alert.id,
      acknowledgedBy: event.alert.acknowledgedBy,
      acknowledgedAt: event.alert.acknowledgedAt,
    });
  }

  /**
   * Handle stock alert resolution
   */
  @OnEvent('stock.alert.resolved')
  async handleAlertResolved(event: StockAlertEvent) {
    this.logger.log(`Stock alert resolved: ${event.alert.id}`);

    // Update dashboard notifications
    await this.notificationQueue.add('update-notification', {
      type: 'alert-resolved',
      alertId: event.alert.id,
      resolvedBy: event.alert.resolvedBy,
      resolvedAt: event.alert.resolvedAt,
      resolution: event.alert.resolution,
    });
  }

  /**
   * Send dashboard notification
   */
  private async sendDashboardNotification(event: StockAlertEvent) {
    await this.notificationQueue.add('dashboard-notification', {
      type: 'stock-alert',
      severity: event.alert.severity,
      title: `Stock Alert: ${event.product.productName}`,
      message: event.alert.message,
      data: {
        alertId: event.alert.id,
        productId: event.product.productId,
        sku: event.product.sku,
        currentStock: event.product.currentStock,
        minStockLevel: event.product.minStockLevel,
        warehouseCode: event.product.warehouseCode,
      },
      createdAt: new Date(),
    });
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(event: StockAlertEvent) {
    const emailData = {
      template: 'stock-alert',
      to: await this.getAlertRecipients(event.alert.severity),
      subject: `${event.alert.severity.toUpperCase()}: Low Stock Alert - ${event.product.productName}`,
      data: {
        productName: event.product.productName,
        sku: event.product.sku,
        currentStock: event.product.currentStock,
        minStockLevel: event.product.minStockLevel,
        reorderPoint: event.product.reorderPoint,
        reorderQuantity: event.product.reorderQuantity,
        severity: event.alert.severity,
        message: event.alert.message,
        warehouseCode: event.product.warehouseCode || 'All Warehouses',
        alertedAt: event.alert.alertedAt,
      },
    };

    await this.emailQueue.add('send-email', emailData, {
      priority: event.alert.severity === 'critical' ? 1 : 2,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    this.logger.log(
      `Email notification queued for ${emailData.to.length} recipients`,
    );
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(event: StockAlertEvent) {
    // Check if webhook is configured (would typically come from config)
    const webhookUrl = process.env.STOCK_ALERT_WEBHOOK_URL;

    if (!webhookUrl) {
      return;
    }

    await this.notificationQueue.add(
      'webhook-notification',
      {
        url: webhookUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Alert-Type': 'stock-alert',
          'X-Alert-Severity': event.alert.severity,
        },
        data: {
          alertId: event.alert.id,
          severity: event.alert.severity,
          product: {
            id: event.product.productId,
            name: event.product.productName,
            sku: event.product.sku,
          },
          stock: {
            current: event.product.currentStock,
            minimum: event.product.minStockLevel,
            reorderPoint: event.product.reorderPoint,
            reorderQuantity: event.product.reorderQuantity,
          },
          warehouse: event.product.warehouseCode,
          message: event.alert.message,
          timestamp: event.alert.alertedAt,
        },
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    this.logger.log('Webhook notification queued');
  }

  /**
   * Get alert recipients based on severity
   */
  private async getAlertRecipients(severity: string): Promise<string[]> {
    // In a real application, this would fetch from database based on roles/preferences
    const recipients: string[] = [];

    // Always notify inventory managers
    recipients.push(
      process.env.INVENTORY_MANAGER_EMAIL || 'inventory@example.com',
    );

    // Add warehouse managers for critical/high alerts
    if (severity === 'critical' || severity === 'high') {
      recipients.push(
        process.env.WAREHOUSE_MANAGER_EMAIL || 'warehouse@example.com',
      );
    }

    // Add executives for critical alerts
    if (severity === 'critical') {
      recipients.push(process.env.EXECUTIVE_EMAIL || 'executive@example.com');
    }

    return recipients;
  }
}
