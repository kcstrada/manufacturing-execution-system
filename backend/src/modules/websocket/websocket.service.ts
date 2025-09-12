import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ManufacturingWebSocketGateway } from './websocket.gateway';
import {
  WebSocketEvent,
  NotificationPayload,
  NotificationType,
  NotificationSeverity,
  BroadcastOptions,
} from './interfaces/websocket.interface';

@Injectable()
export class WebSocketService implements OnModuleInit {
  private readonly logger = new Logger(WebSocketService.name);

  constructor(
    private readonly gateway: ManufacturingWebSocketGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    this.logger.log('WebSocket Service initialized and listening for events');
  }

  // Order Events
  @OnEvent('order.created')
  handleOrderCreated(payload: any) {
    const { order, tenantId } = payload;
    this.gateway.broadcastToTenant(tenantId, WebSocketEvent.ORDER_CREATED, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      totalAmount: order.totalAmount,
      status: order.status,
    });

    // Notify sales team
    this.gateway.broadcastToRole('sales', tenantId, WebSocketEvent.SYSTEM_NOTIFICATION, {
      type: NotificationType.ORDER,
      title: 'New Order Created',
      message: `Order ${order.orderNumber} has been created`,
      severity: NotificationSeverity.MEDIUM,
      data: { orderId: order.id },
    });
  }

  @OnEvent('order.status.changed')
  handleOrderStatusChanged(payload: any) {
    const { order, previousStatus, newStatus, tenantId } = payload;
    this.gateway.broadcastToTenant(tenantId, WebSocketEvent.ORDER_STATUS_CHANGED, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      previousStatus,
      newStatus,
      changedAt: new Date(),
    });

    // Notify relevant parties based on status
    if (newStatus === 'in_production') {
      this.gateway.broadcastToRole('production', tenantId, WebSocketEvent.PRODUCTION_STARTED, {
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
    } else if (newStatus === 'completed') {
      this.gateway.broadcastToUser(
        order.salesRepId,
        WebSocketEvent.ORDER_COMPLETED,
        {
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
        tenantId,
      );
    }
  }

  // Task Events
  @OnEvent('task.created')
  handleTaskCreated(payload: any) {
    const { task, tenantId } = payload;
    this.gateway.broadcastToTenant(tenantId, WebSocketEvent.TASK_CREATED, {
      taskId: task.id,
      taskNumber: task.taskNumber,
      name: task.name,
      workOrderId: task.workOrderId,
      status: task.status,
    });
  }

  @OnEvent('task.assigned')
  handleTaskAssigned(payload: any) {
    const { task, workerId, tenantId } = payload;
    
    // Notify the assigned worker
    this.gateway.broadcastToUser(workerId, WebSocketEvent.TASK_ASSIGNED, {
      taskId: task.id,
      taskNumber: task.taskNumber,
      name: task.name,
      priority: task.priority,
      dueDate: task.dueDate,
    }, tenantId);

    // Update task list for supervisors
    this.gateway.broadcastToRole('supervisor', tenantId, WebSocketEvent.TASK_UPDATED, {
      taskId: task.id,
      assignedTo: workerId,
    });
  }

  @OnEvent('task.completed')
  handleTaskCompleted(payload: any) {
    const { task, completedBy, tenantId } = payload;
    this.gateway.broadcastToTenant(tenantId, WebSocketEvent.TASK_COMPLETED, {
      taskId: task.id,
      taskNumber: task.taskNumber,
      completedBy,
      completedAt: new Date(),
    });

    // Check if this completes a work order
    if (task.workOrder?.allTasksCompleted) {
      this.eventEmitter.emit('workorder.completed', {
        workOrder: task.workOrder,
        tenantId,
      });
    }
  }

  // Inventory Events
  @OnEvent('inventory.low_stock')
  handleLowStock(payload: any) {
    const { product, currentStock, minStock, tenantId } = payload;
    
    const notification: NotificationPayload = {
      type: NotificationType.INVENTORY,
      title: 'Low Stock Alert',
      message: `${product.name} stock is low (${currentStock}/${minStock})`,
      severity: NotificationSeverity.HIGH,
      data: {
        productId: product.id,
        currentStock,
        minStock,
      },
      actions: [
        {
          label: 'Create Purchase Order',
          action: 'create_purchase_order',
          data: { productId: product.id },
        },
      ],
    };

    // Notify inventory managers
    this.gateway.broadcastToRole('inventory_manager', tenantId, WebSocketEvent.INVENTORY_LOW_STOCK, {
      productId: product.id,
      productName: product.name,
      currentStock,
      minStock,
    });

    // Send notification
    this.gateway.broadcastToRole('inventory_manager', tenantId, WebSocketEvent.SYSTEM_NOTIFICATION, notification);
  }

  @OnEvent('inventory.stock_received')
  handleStockReceived(payload: any) {
    const { product, quantity, location, tenantId } = payload;
    this.gateway.broadcastToTenant(tenantId, WebSocketEvent.INVENTORY_RECEIVED, {
      productId: product.id,
      productName: product.name,
      quantity,
      location,
      receivedAt: new Date(),
    });
  }

  // Production Events
  @OnEvent('production.started')
  handleProductionStarted(payload: any) {
    const { workOrder, workCenter, tenantId } = payload;
    
    // Broadcast to work center
    this.gateway.broadcastToWorkCenter(
      workCenter.id,
      tenantId,
      WebSocketEvent.PRODUCTION_STARTED,
      {
        workOrderId: workOrder.id,
        workOrderNumber: workOrder.number,
        productName: workOrder.product.name,
        quantity: workOrder.quantity,
      },
    );
  }

  @OnEvent('production.delay')
  handleProductionDelay(payload: any) {
    const { workOrder, reason, estimatedDelay, tenantId } = payload;
    
    const notification: NotificationPayload = {
      type: NotificationType.WARNING,
      title: 'Production Delay',
      message: `Work order ${workOrder.number} is delayed by ${estimatedDelay} hours`,
      severity: NotificationSeverity.HIGH,
      data: {
        workOrderId: workOrder.id,
        reason,
        estimatedDelay,
      },
    };

    // Notify supervisors and managers
    this.gateway.broadcastToRole('supervisor', tenantId, WebSocketEvent.PRODUCTION_DELAYED, {
      workOrderId: workOrder.id,
      workOrderNumber: workOrder.number,
      reason,
      estimatedDelay,
    });

    this.gateway.broadcastToRole('production_manager', tenantId, WebSocketEvent.SYSTEM_NOTIFICATION, notification);
  }

  // Quality Events
  @OnEvent('quality.inspection.failed')
  handleQualityInspectionFailed(payload: any) {
    const { inspection, product, defects, tenantId } = payload;
    
    const notification: NotificationPayload = {
      type: NotificationType.QUALITY,
      title: 'Quality Inspection Failed',
      message: `Product ${product.name} failed quality inspection`,
      severity: NotificationSeverity.HIGH,
      data: {
        inspectionId: inspection.id,
        productId: product.id,
        defects,
      },
      actions: [
        {
          label: 'Create NCR',
          action: 'create_ncr',
          data: { inspectionId: inspection.id },
        },
        {
          label: 'View Details',
          action: 'view_inspection',
          data: { inspectionId: inspection.id },
        },
      ],
    };

    // Notify quality team
    this.gateway.broadcastToRole('quality_manager', tenantId, WebSocketEvent.QUALITY_ALERT, {
      inspectionId: inspection.id,
      productId: product.id,
      result: 'failed',
      defects,
    });

    this.gateway.broadcastToRole('quality_manager', tenantId, WebSocketEvent.SYSTEM_NOTIFICATION, notification);
  }

  @OnEvent('quality.ncr.created')
  handleNCRCreated(payload: any) {
    const { ncr, assignedTo, tenantId } = payload;
    
    // Notify assigned person
    if (assignedTo) {
      this.gateway.broadcastToUser(assignedTo, WebSocketEvent.QUALITY_NCR_CREATED, {
        ncrId: ncr.id,
        ncrNumber: ncr.reportNumber,
        title: ncr.title,
        severity: ncr.severity,
        targetCloseDate: ncr.targetCloseDate,
      }, tenantId);
    }

    // Notify quality team
    this.gateway.broadcastToRole('quality_manager', tenantId, WebSocketEvent.QUALITY_NCR_CREATED, {
      ncrId: ncr.id,
      ncrNumber: ncr.reportNumber,
      severity: ncr.severity,
    });
  }

  // Equipment Events
  @OnEvent('equipment.breakdown')
  handleEquipmentBreakdown(payload: any) {
    const { equipment, workCenter, severity, tenantId } = payload;
    
    const notification: NotificationPayload = {
      type: NotificationType.ERROR,
      title: 'Equipment Breakdown',
      message: `${equipment.name} has broken down`,
      severity: severity === 'critical' ? NotificationSeverity.CRITICAL : NotificationSeverity.HIGH,
      data: {
        equipmentId: equipment.id,
        workCenterId: workCenter.id,
      },
      actions: [
        {
          label: 'Create Maintenance Request',
          action: 'create_maintenance',
          data: { equipmentId: equipment.id },
        },
      ],
    };

    // Broadcast to work center
    this.gateway.broadcastToWorkCenter(
      workCenter.id,
      tenantId,
      WebSocketEvent.EQUIPMENT_BREAKDOWN,
      {
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        severity,
      },
    );

    // Notify maintenance team
    this.gateway.broadcastToRole('maintenance', tenantId, WebSocketEvent.EQUIPMENT_ALERT, notification);
  }

  @OnEvent('equipment.maintenance.due')
  handleMaintenanceDue(payload: any) {
    const { equipment, maintenance, dueDate, tenantId } = payload;
    
    this.gateway.broadcastToRole('maintenance', tenantId, WebSocketEvent.EQUIPMENT_MAINTENANCE_DUE, {
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      maintenanceType: maintenance.type,
      dueDate,
    });
  }

  // Worker Events
  @OnEvent('worker.clocked_in')
  handleWorkerClockedIn(payload: any) {
    const { worker, workCenter, tenantId } = payload;
    
    // Notify supervisors in the work center
    if (workCenter) {
      this.gateway.broadcastToWorkCenter(
        workCenter.id,
        tenantId,
        WebSocketEvent.WORKER_CLOCKED_IN,
        {
          workerId: worker.id,
          workerName: `${worker.firstName} ${worker.lastName}`,
          clockedInAt: new Date(),
        },
      );
    }
  }

  @OnEvent('worker.clocked_out')
  handleWorkerClockedOut(payload: any) {
    const { worker, hoursWorked, tenantId } = payload;
    
    // Update dashboard metrics
    this.gateway.broadcastToRole('supervisor', tenantId, WebSocketEvent.WORKER_CLOCKED_OUT, {
      workerId: worker.id,
      workerName: `${worker.firstName} ${worker.lastName}`,
      clockedOutAt: new Date(),
      hoursWorked,
    });
  }

  // Metrics Events
  @OnEvent('metrics.update')
  handleMetricsUpdate(payload: any) {
    const { type, metrics, tenantId } = payload;
    
    // Broadcast to dashboards
    this.gateway.broadcastToRole('admin', tenantId, WebSocketEvent.METRICS_UPDATE, {
      type,
      metrics,
      timestamp: new Date(),
    });

    this.gateway.broadcastToRole('executive', tenantId, WebSocketEvent.KPI_UPDATE, {
      type,
      metrics,
      timestamp: new Date(),
    });
  }

  @OnEvent('dashboard.alert')
  handleDashboardAlert(payload: any) {
    const { alert, targetRoles, tenantId } = payload;
    
    const notification: NotificationPayload = {
      type: NotificationType.WARNING,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      data: alert.data,
    };

    // Send to specific roles
    for (const role of targetRoles) {
      this.gateway.broadcastToRole(role, tenantId, WebSocketEvent.SYSTEM_ALERT, notification);
    }
  }

  // Public methods for other services to use

  public sendNotificationToUser(
    userId: string,
    tenantId: string,
    notification: NotificationPayload,
  ) {
    this.gateway.sendNotification(userId, tenantId, notification);
  }

  public broadcastToTenant(
    tenantId: string,
    event: WebSocketEvent,
    data: any,
  ) {
    this.gateway.broadcastToTenant(tenantId, event, data);
  }

  public broadcastToRole(
    role: string,
    tenantId: string,
    event: WebSocketEvent,
    data: any,
  ) {
    this.gateway.broadcastToRole(role, tenantId, event, data);
  }

  public broadcast(
    event: WebSocketEvent,
    data: any,
    options: BroadcastOptions,
  ) {
    this.gateway.broadcast(event, data, options);
  }

  public getConnectedClients() {
    return this.gateway.getConnectedClients();
  }

  public getClientsByTenant(tenantId: string) {
    return this.gateway.getClientsByTenant(tenantId);
  }
}