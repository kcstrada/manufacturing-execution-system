import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../services/notification.service';
import {
  NotificationType,
  NotificationChannel,
  NotificationPriority,
  NotificationPayload,
} from '../types/notification.types';

@Injectable()
export class NotificationEventListener {
  private readonly logger = new Logger(NotificationEventListener.name);

  constructor(private readonly notificationService: NotificationService) {}

  // Order Events
  @OnEvent('order.created')
  async handleOrderCreated(payload: any): Promise<void> {
    try {
      const notification: NotificationPayload = {
        tenantId: payload.tenantId,
        roles: ['ADMIN', 'MANAGER', 'PRODUCTION_MANAGER'],
        type: NotificationType.ORDER_CREATED,
        channel: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        priority: NotificationPriority.HIGH,
        title: `New Order #${payload.orderNumber}`,
        message: `A new order has been created for ${payload.customerName}`,
        data: payload,
        metadata: {
          entityType: 'order',
          entityId: payload.orderId,
          actionUrl: `/orders/${payload.orderId}`,
          category: 'orders',
        },
      };

      await this.notificationService.send(notification);
    } catch (error) {
      this.logger.error(`Failed to send order created notification: ${(error as Error).message}`);
    }
  }

  @OnEvent('order.completed')
  async handleOrderCompleted(payload: any): Promise<void> {
    try {
      const notification: NotificationPayload = {
        tenantId: payload.tenantId,
        roles: ['ADMIN', 'MANAGER', 'SALES'],
        type: NotificationType.ORDER_COMPLETED,
        channel: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        priority: NotificationPriority.MEDIUM,
        title: `Order #${payload.orderNumber} Completed`,
        message: `Order for ${payload.customerName} has been completed successfully`,
        data: payload,
        metadata: {
          entityType: 'order',
          entityId: payload.orderId,
          actionUrl: `/orders/${payload.orderId}`,
          category: 'orders',
        },
      };

      await this.notificationService.send(notification);
    } catch (error) {
      this.logger.error(`Failed to send order completed notification: ${(error as Error).message}`);
    }
  }

  @OnEvent('order.delayed')
  async handleOrderDelayed(payload: any): Promise<void> {
    try {
      const notification: NotificationPayload = {
        tenantId: payload.tenantId,
        roles: ['ADMIN', 'MANAGER', 'PRODUCTION_MANAGER'],
        type: NotificationType.ORDER_DELAYED,
        channel: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        priority: NotificationPriority.HIGH,
        title: `Order #${payload.orderNumber} Delayed`,
        message: `Order is delayed. New expected completion: ${payload.newDate}`,
        data: payload,
        metadata: {
          entityType: 'order',
          entityId: payload.orderId,
          actionUrl: `/orders/${payload.orderId}`,
          category: 'orders',
        },
      };

      await this.notificationService.send(notification);
    } catch (error) {
      this.logger.error(`Failed to send order delayed notification: ${(error as Error).message}`);
    }
  }

  // Inventory Events
  @OnEvent('inventory.low_stock')
  async handleLowStock(payload: any): Promise<void> {
    try {
      const notification: NotificationPayload = {
        tenantId: payload.tenantId,
        roles: ['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER'],
        type: NotificationType.INVENTORY_LOW_STOCK,
        channel: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        priority: NotificationPriority.HIGH,
        title: `Low Stock Alert: ${payload.productName}`,
        message: `Product ${payload.productName} (SKU: ${payload.sku}) is running low. Current: ${payload.currentQuantity}, Reorder: ${payload.reorderLevel}`,
        data: payload,
        metadata: {
          entityType: 'inventory',
          entityId: payload.inventoryId,
          actionUrl: `/inventory/${payload.inventoryId}`,
          category: 'inventory',
        },
        actions: [
          {
            label: 'Create Purchase Order',
            action: 'create_po',
            style: 'primary',
            data: { productId: payload.productId },
          },
          {
            label: 'View Inventory',
            action: 'view_inventory',
            style: 'secondary',
          },
        ],
      };

      await this.notificationService.send(notification);
    } catch (error) {
      this.logger.error(`Failed to send low stock notification: ${(error as Error).message}`);
    }
  }

  @OnEvent('inventory.out_of_stock')
  async handleOutOfStock(payload: any): Promise<void> {
    try {
      const notification: NotificationPayload = {
        tenantId: payload.tenantId,
        roles: ['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_MANAGER', 'PRODUCTION_MANAGER'],
        type: NotificationType.INVENTORY_OUT_OF_STOCK,
        channel: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        priority: NotificationPriority.CRITICAL,
        title: `Out of Stock: ${payload.productName}`,
        message: `Product ${payload.productName} (SKU: ${payload.sku}) is now out of stock`,
        data: payload,
        metadata: {
          entityType: 'inventory',
          entityId: payload.inventoryId,
          actionUrl: `/inventory/${payload.inventoryId}`,
          category: 'inventory',
        },
        actions: [
          {
            label: 'Create Urgent PO',
            action: 'create_urgent_po',
            style: 'danger',
            data: { productId: payload.productId },
          },
        ],
      };

      await this.notificationService.send(notification);
    } catch (error) {
      this.logger.error(`Failed to send out of stock notification: ${(error as Error).message}`);
    }
  }

  // Production Events
  @OnEvent('production.started')
  async handleProductionStarted(payload: any): Promise<void> {
    try {
      const notification: NotificationPayload = {
        tenantId: payload.tenantId,
        userId: payload.assignedTo,
        type: NotificationType.PRODUCTION_STARTED,
        channel: NotificationChannel.IN_APP,
        priority: NotificationPriority.MEDIUM,
        title: `Production Started: ${payload.productName}`,
        message: `Production batch ${payload.batchNumber} has started`,
        data: payload,
        metadata: {
          entityType: 'production',
          entityId: payload.productionId,
          actionUrl: `/production/${payload.productionId}`,
          category: 'production',
        },
      };

      await this.notificationService.send(notification);
    } catch (error) {
      this.logger.error(`Failed to send production started notification: ${(error as Error).message}`);
    }
  }

  @OnEvent('production.error')
  async handleProductionError(payload: any): Promise<void> {
    try {
      const notification: NotificationPayload = {
        tenantId: payload.tenantId,
        roles: ['ADMIN', 'PRODUCTION_MANAGER', 'QUALITY_MANAGER'],
        type: NotificationType.PRODUCTION_ERROR,
        channel: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        priority: NotificationPriority.CRITICAL,
        title: `Production Error: ${payload.errorType}`,
        message: `Error in production batch ${payload.batchNumber}: ${payload.errorMessage}`,
        data: payload,
        metadata: {
          entityType: 'production',
          entityId: payload.productionId,
          actionUrl: `/production/${payload.productionId}`,
          category: 'production',
        },
        actions: [
          {
            label: 'View Details',
            action: 'view_error',
            style: 'primary',
          },
          {
            label: 'Stop Production',
            action: 'stop_production',
            style: 'danger',
            data: { productionId: payload.productionId },
          },
        ],
      };

      await this.notificationService.send(notification);
    } catch (error) {
      this.logger.error(`Failed to send production error notification: ${(error as Error).message}`);
    }
  }

  // Task Events
  @OnEvent('task.assigned')
  async handleTaskAssigned(payload: any): Promise<void> {
    try {
      const notification: NotificationPayload = {
        tenantId: payload.tenantId,
        userId: payload.assignedTo,
        type: NotificationType.TASK_ASSIGNED,
        channel: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        priority: payload.priority === 'high' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
        title: `New Task: ${payload.taskTitle}`,
        message: `You have been assigned a new task: ${payload.taskDescription}`,
        data: payload,
        metadata: {
          entityType: 'task',
          entityId: payload.taskId,
          actionUrl: `/tasks/${payload.taskId}`,
          category: 'tasks',
        },
        actions: [
          {
            label: 'View Task',
            action: 'view_task',
            style: 'primary',
          },
          {
            label: 'Start Task',
            action: 'start_task',
            style: 'secondary',
            data: { taskId: payload.taskId },
          },
        ],
      };

      await this.notificationService.send(notification);
    } catch (error) {
      this.logger.error(`Failed to send task assigned notification: ${(error as Error).message}`);
    }
  }

  @OnEvent('task.overdue')
  async handleTaskOverdue(payload: any): Promise<void> {
    try {
      const notification: NotificationPayload = {
        tenantId: payload.tenantId,
        userId: payload.assignedTo,
        type: NotificationType.TASK_OVERDUE,
        channel: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        priority: NotificationPriority.HIGH,
        title: `Task Overdue: ${payload.taskTitle}`,
        message: `Task "${payload.taskTitle}" is overdue. Due date was ${payload.dueDate}`,
        data: payload,
        metadata: {
          entityType: 'task',
          entityId: payload.taskId,
          actionUrl: `/tasks/${payload.taskId}`,
          category: 'tasks',
        },
      };

      await this.notificationService.send(notification);

      // Also notify managers
      const managerNotification: NotificationPayload = {
        ...notification,
        roles: ['MANAGER', 'ADMIN'],
        message: `Task "${payload.taskTitle}" assigned to ${payload.assigneeName} is overdue`,
      };

      await this.notificationService.send(managerNotification);
    } catch (error) {
      this.logger.error(`Failed to send task overdue notification: ${(error as Error).message}`);
    }
  }

  // Quality Events
  @OnEvent('quality.alert')
  async handleQualityAlert(payload: any): Promise<void> {
    try {
      const notification: NotificationPayload = {
        tenantId: payload.tenantId,
        roles: ['QUALITY_MANAGER', 'PRODUCTION_MANAGER', 'ADMIN'],
        type: NotificationType.QUALITY_ALERT,
        channel: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        priority: payload.severity === 'critical' ? NotificationPriority.CRITICAL : NotificationPriority.HIGH,
        title: `Quality Alert: ${payload.issueType}`,
        message: `Quality issue detected in ${payload.productName} (Batch: ${payload.batchNumber}): ${payload.issueDescription}`,
        data: payload,
        metadata: {
          entityType: 'quality',
          entityId: payload.qualityCheckId,
          actionUrl: `/quality/${payload.qualityCheckId}`,
          category: 'quality',
        },
        actions: [
          {
            label: 'Create NCR',
            action: 'create_ncr',
            style: 'primary',
            data: { qualityCheckId: payload.qualityCheckId },
          },
          {
            label: 'Quarantine Batch',
            action: 'quarantine',
            style: 'danger',
            data: { batchNumber: payload.batchNumber },
          },
        ],
      };

      await this.notificationService.send(notification);
    } catch (error) {
      this.logger.error(`Failed to send quality alert notification: ${(error as Error).message}`);
    }
  }

  @OnEvent('quality.inspection_failed')
  async handleInspectionFailed(payload: any): Promise<void> {
    try {
      const notification: NotificationPayload = {
        tenantId: payload.tenantId,
        roles: ['QUALITY_MANAGER', 'PRODUCTION_MANAGER', 'ADMIN'],
        type: NotificationType.QUALITY_INSPECTION_FAILED,
        channel: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        priority: NotificationPriority.HIGH,
        title: `Inspection Failed: ${payload.productName}`,
        message: `Quality inspection failed for batch ${payload.batchNumber}. ${payload.failureCount} defects found`,
        data: payload,
        metadata: {
          entityType: 'quality',
          entityId: payload.inspectionId,
          actionUrl: `/quality/inspections/${payload.inspectionId}`,
          category: 'quality',
        },
      };

      await this.notificationService.send(notification);
    } catch (error) {
      this.logger.error(`Failed to send inspection failed notification: ${(error as Error).message}`);
    }
  }

  // Maintenance Events
  @OnEvent('maintenance.due')
  async handleMaintenanceDue(payload: any): Promise<void> {
    try {
      const notification: NotificationPayload = {
        tenantId: payload.tenantId,
        roles: ['MAINTENANCE_MANAGER', 'PRODUCTION_MANAGER', 'ADMIN'],
        type: NotificationType.MAINTENANCE_DUE,
        channel: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        priority: NotificationPriority.MEDIUM,
        title: `Maintenance Due: ${payload.equipmentName}`,
        message: `Scheduled maintenance is due for ${payload.equipmentName} on ${payload.dueDate}`,
        data: payload,
        metadata: {
          entityType: 'maintenance',
          entityId: payload.maintenanceId,
          actionUrl: `/maintenance/${payload.maintenanceId}`,
          category: 'maintenance',
        },
        actions: [
          {
            label: 'Schedule Maintenance',
            action: 'schedule',
            style: 'primary',
            data: { equipmentId: payload.equipmentId },
          },
        ],
      };

      await this.notificationService.send(notification);
    } catch (error) {
      this.logger.error(`Failed to send maintenance due notification: ${(error as Error).message}`);
    }
  }

  @OnEvent('equipment.breakdown')
  async handleEquipmentBreakdown(payload: any): Promise<void> {
    try {
      const notification: NotificationPayload = {
        tenantId: payload.tenantId,
        roles: ['MAINTENANCE_MANAGER', 'PRODUCTION_MANAGER', 'ADMIN'],
        type: NotificationType.EQUIPMENT_BREAKDOWN,
        channel: [NotificationChannel.EMAIL, NotificationChannel.IN_APP, NotificationChannel.SMS],
        priority: NotificationPriority.CRITICAL,
        title: `Equipment Breakdown: ${payload.equipmentName}`,
        message: `Critical: ${payload.equipmentName} has broken down. Production line ${payload.productionLine} affected`,
        data: payload,
        metadata: {
          entityType: 'equipment',
          entityId: payload.equipmentId,
          actionUrl: `/equipment/${payload.equipmentId}`,
          category: 'maintenance',
        },
        actions: [
          {
            label: 'Create Work Order',
            action: 'create_work_order',
            style: 'danger',
            data: { equipmentId: payload.equipmentId },
          },
          {
            label: 'View Details',
            action: 'view_details',
            style: 'primary',
          },
        ],
      };

      await this.notificationService.send(notification);
    } catch (error) {
      this.logger.error(`Failed to send equipment breakdown notification: ${(error as Error).message}`);
    }
  }

  // System Events
  @OnEvent('system.error')
  async handleSystemError(payload: any): Promise<void> {
    try {
      const notification: NotificationPayload = {
        tenantId: payload.tenantId,
        roles: ['ADMIN', 'IT_ADMIN'],
        type: NotificationType.SYSTEM_ERROR,
        channel: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        priority: NotificationPriority.CRITICAL,
        title: 'System Error Detected',
        message: `System error: ${payload.errorMessage}. Service: ${payload.service}`,
        data: payload,
        metadata: {
          category: 'system',
        },
      };

      await this.notificationService.send(notification);
    } catch (error) {
      this.logger.error(`Failed to send system error notification: ${(error as Error).message}`);
    }
  }
}