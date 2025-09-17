import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { QUEUE_NAMES, JOB_NAMES } from '../constants/queue-names';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor(QUEUE_NAMES.ORDERS)
export class OrderProcessor {
  private readonly logger = new Logger(OrderProcessor.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  @Process(JOB_NAMES.PROCESS_ORDER)
  async processOrder(job: Job) {
    this.logger.log(`Processing order job ${job.id}`);
    const { orderId, action, data } = job.data;

    try {
      // Simulate order processing logic
      await this.simulateProcessing(1000);

      // Process based on action
      switch (action) {
        case 'validate':
          await this.validateOrder(orderId, data);
          break;
        case 'allocate_inventory':
          await this.allocateInventory(orderId, data);
          break;
        case 'schedule_production':
          await this.scheduleProduction(orderId, data);
          break;
        case 'calculate_delivery':
          await this.calculateDeliveryDate(orderId, data);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Emit event for order processed
      this.eventEmitter.emit('order.processed', {
        orderId,
        action,
        jobId: job.id,
        timestamp: new Date(),
      });

      return {
        success: true,
        orderId,
        action,
        processedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to process order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  @Process(JOB_NAMES.UPDATE_ORDER_STATUS)
  async updateOrderStatus(job: Job) {
    this.logger.log(`Updating order status - Job ${job.id}`);
    const { orderId, newStatus, previousStatus, reason } = job.data;

    try {
      await this.simulateProcessing(500);

      // Here you would update the order status in the database
      // For now, we'll just log and emit an event
      this.logger.log(
        `Order ${orderId} status changed from ${previousStatus} to ${newStatus}`,
      );

      // Emit status change event
      this.eventEmitter.emit('order.status.changed', {
        orderId,
        previousStatus,
        newStatus,
        reason,
        timestamp: new Date(),
      });

      // Trigger notifications based on status
      if (newStatus === 'completed') {
        await this.triggerOrderCompletionNotifications(orderId);
      } else if (newStatus === 'delayed') {
        await this.triggerDelayNotifications(orderId, reason);
      }

      return {
        success: true,
        orderId,
        newStatus,
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to update order status: ${error.message}`);
      throw error;
    }
  }

  @Process(JOB_NAMES.CALCULATE_ORDER_METRICS)
  async calculateOrderMetrics(job: Job) {
    this.logger.log(`Calculating order metrics - Job ${job.id}`);
    const { orderId, metrics } = job.data;

    try {
      await this.simulateProcessing(2000);

      const calculatedMetrics = {
        leadTime: this.calculateLeadTime(metrics),
        cycleTime: this.calculateCycleTime(metrics),
        throughput: this.calculateThroughput(metrics),
        efficiency: this.calculateEfficiency(metrics),
        onTimeDeliveryRate: this.calculateOTD(metrics),
      };

      this.logger.log(
        `Metrics calculated for order ${orderId}:`,
        calculatedMetrics,
      );

      return {
        success: true,
        orderId,
        metrics: calculatedMetrics,
        calculatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to calculate metrics: ${error.message}`);
      throw error;
    }
  }

  @Process(JOB_NAMES.CHECK_ORDER_DELAYS)
  async checkOrderDelays(job: Job) {
    this.logger.log(`Checking for order delays - Job ${job.id}`);
    const { orderIds, threshold } = job.data;

    try {
      const delayedOrders = [];

      for (const orderId of orderIds) {
        await this.simulateProcessing(100);

        // Simulate delay check logic
        const isDelayed = Math.random() > 0.7; // 30% chance of delay

        if (isDelayed) {
          const delayDays = Math.floor(Math.random() * 5) + 1;
          delayedOrders.push({
            orderId,
            delayDays,
            reason: this.getRandomDelayReason(),
          });

          // Emit delay event
          this.eventEmitter.emit('order.delayed', {
            orderId,
            delayDays,
            timestamp: new Date(),
          });
        }
      }

      this.logger.log(
        `Found ${delayedOrders.length} delayed orders out of ${orderIds.length}`,
      );

      return {
        success: true,
        totalChecked: orderIds.length,
        delayedOrders,
        checkedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to check order delays: ${error.message}`);
      throw error;
    }
  }

  // Event handlers
  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(
      `Processing job ${job.id} of type ${job.name} with data:`,
      job.data,
    );
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: any) {
    this.logger.debug(`Job ${job.id} completed with result:`, result);
  }

  @OnQueueFailed()
  onError(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`);
  }

  // Helper methods
  private async simulateProcessing(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async validateOrder(orderId: string, data: any): Promise<void> {
    this.logger.log(`Validating order ${orderId}`);
    // Validation logic here
  }

  private async allocateInventory(orderId: string, data: any): Promise<void> {
    this.logger.log(`Allocating inventory for order ${orderId}`);
    // Inventory allocation logic here
  }

  private async scheduleProduction(orderId: string, data: any): Promise<void> {
    this.logger.log(`Scheduling production for order ${orderId}`);
    // Production scheduling logic here
  }

  private async calculateDeliveryDate(
    orderId: string,
    data: any,
  ): Promise<void> {
    this.logger.log(`Calculating delivery date for order ${orderId}`);
    // Delivery calculation logic here
  }

  private async triggerOrderCompletionNotifications(
    orderId: string,
  ): Promise<void> {
    this.eventEmitter.emit('notification.send', {
      type: 'order_completed',
      orderId,
      timestamp: new Date(),
    });
  }

  private async triggerDelayNotifications(
    orderId: string,
    reason: string,
  ): Promise<void> {
    this.eventEmitter.emit('notification.send', {
      type: 'order_delayed',
      orderId,
      reason,
      timestamp: new Date(),
    });
  }

  private calculateLeadTime(metrics: any): number {
    return Math.floor(Math.random() * 10) + 5; // Simulated
  }

  private calculateCycleTime(metrics: any): number {
    return Math.floor(Math.random() * 5) + 2; // Simulated
  }

  private calculateThroughput(metrics: any): number {
    return Math.floor(Math.random() * 100) + 50; // Simulated
  }

  private calculateEfficiency(metrics: any): number {
    return Math.random() * 30 + 70; // 70-100% efficiency
  }

  private calculateOTD(metrics: any): number {
    return Math.random() * 15 + 85; // 85-100% OTD rate
  }

  private getRandomDelayReason(): string {
    const reasons = [
      'Material shortage',
      'Equipment breakdown',
      'Quality issue',
      'Capacity constraint',
      'Supplier delay',
      'Weather impact',
    ];
    return reasons[Math.floor(Math.random() * reasons.length)] || 'Unknown';
  }
}
