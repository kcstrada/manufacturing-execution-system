import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerOrder, CustomerOrderStatus } from '../../../entities/customer-order.entity';
import { OrderToTaskConverterService } from '../services/order-to-task-converter.service';
import { TaskPriority } from '../../../entities/task.entity';

export interface OrderStateChangedEvent {
  orderId: string;
  orderNumber: string;
  previousState: CustomerOrderStatus;
  currentState: CustomerOrderStatus;
  userId: string;
  timestamp: Date;
}

@Injectable()
export class OrderWorkflowListener {
  private readonly logger = new Logger(OrderWorkflowListener.name);

  constructor(
    @InjectRepository(CustomerOrder)
    private readonly orderRepo: Repository<CustomerOrder>,
    private readonly orderToTaskConverter: OrderToTaskConverterService,
  ) {
    // orderRepo will be used in future implementations
    this.orderRepo;
  }

  @OnEvent('order.state.changed')
  async handleOrderStateChanged(event: OrderStateChangedEvent): Promise<void> {
    this.logger.log(
      `Order ${event.orderNumber} state changed from ${event.previousState} to ${event.currentState}`,
    );

    // Handle specific state transitions
    switch (event.currentState) {
      case CustomerOrderStatus.CONFIRMED:
        await this.handleOrderConfirmed(event);
        break;
      case CustomerOrderStatus.IN_PRODUCTION:
        await this.handleProductionStarted(event);
        break;
      case CustomerOrderStatus.QUALITY_CONTROL:
        await this.handleQualityControlStarted(event);
        break;
      case CustomerOrderStatus.QC_PASSED:
        await this.handleQualityControlPassed(event);
        break;
      case CustomerOrderStatus.QC_FAILED:
        await this.handleQualityControlFailed(event);
        break;
      case CustomerOrderStatus.SHIPPED:
        await this.handleOrderShipped(event);
        break;
      case CustomerOrderStatus.DELIVERED:
        await this.handleOrderDelivered(event);
        break;
      case CustomerOrderStatus.CANCELLED:
        await this.handleOrderCancelled(event);
        break;
      case CustomerOrderStatus.ON_HOLD:
        await this.handleOrderOnHold(event);
        break;
    }
  }

  private async handleOrderConfirmed(event: OrderStateChangedEvent): Promise<void> {
    this.logger.log(`Processing confirmed order ${event.orderNumber}`);
    
    // Automatically generate production tasks for confirmed orders
    try {
      const result = await this.orderToTaskConverter.convertOrderToTasks(
        event.orderId,
        {
          priority: TaskPriority.NORMAL,
          assignToWorkCenter: true,
          autoSchedule: true,
          includeQualityChecks: true,
          includeSetupTasks: true,
        }
      );
      
      this.logger.log(
        `Generated ${result.productionOrders.length} production orders, ` +
        `${result.workOrders.length} work orders, and ${result.tasks.length} tasks ` +
        `for order ${event.orderNumber}`
      );
      
      if (result.warnings.length > 0) {
        this.logger.warn(`Warnings during task generation: ${result.warnings.join(', ')}`);
      }
    } catch (error) {
      this.logger.error(`Failed to generate tasks for order ${event.orderNumber}: ${error}`);
      // Don't throw - we don't want to interrupt the workflow
    }
    
    // TODO: Send confirmation email to customer
    // TODO: Reserve inventory
  }

  private async handleProductionStarted(event: OrderStateChangedEvent): Promise<void> {
    this.logger.log(`Production started for order ${event.orderNumber}`);
    // TODO: Notify production team
    // TODO: Update production schedule
    // TODO: Allocate resources
  }

  private async handleQualityControlStarted(event: OrderStateChangedEvent): Promise<void> {
    this.logger.log(`Quality control started for order ${event.orderNumber}`);
    // TODO: Notify QC team
    // TODO: Create QC checklist
    // TODO: Schedule inspections
  }

  private async handleQualityControlPassed(event: OrderStateChangedEvent): Promise<void> {
    this.logger.log(`Quality control passed for order ${event.orderNumber}`);
    // TODO: Update quality metrics
    // TODO: Prepare for shipping
    // TODO: Generate quality certificate
  }

  private async handleQualityControlFailed(event: OrderStateChangedEvent): Promise<void> {
    this.logger.warn(`Quality control failed for order ${event.orderNumber}`);
    // TODO: Notify production manager
    // TODO: Create rework order
    // TODO: Log quality issues
    // TODO: Update metrics
  }

  private async handleOrderShipped(event: OrderStateChangedEvent): Promise<void> {
    this.logger.log(`Order ${event.orderNumber} has been shipped`);
    // TODO: Send shipping notification to customer
    // TODO: Update inventory
    // TODO: Generate invoice
    // TODO: Send tracking information
  }

  private async handleOrderDelivered(event: OrderStateChangedEvent): Promise<void> {
    this.logger.log(`Order ${event.orderNumber} has been delivered`);
    // TODO: Send delivery confirmation
    // TODO: Request feedback
    // TODO: Close order
    // TODO: Update customer metrics
  }

  private async handleOrderCancelled(event: OrderStateChangedEvent): Promise<void> {
    this.logger.log(`Order ${event.orderNumber} has been cancelled`);
    // TODO: Release inventory reservations
    // TODO: Cancel production orders
    // TODO: Send cancellation notification
    // TODO: Process refund if applicable
  }

  private async handleOrderOnHold(event: OrderStateChangedEvent): Promise<void> {
    this.logger.log(`Order ${event.orderNumber} has been put on hold`);
    // TODO: Pause production
    // TODO: Notify relevant teams
    // TODO: Log hold reason
  }

  @OnEvent('order.production.complete')
  async handleProductionComplete(payload: { orderId: string; orderNumber: string }): Promise<void> {
    this.logger.log(`Production complete for order ${payload.orderNumber}`);
    // This event can trigger automatic transition to QC
  }

  @OnEvent('order.qc.complete')
  async handleQCComplete(payload: { 
    orderId: string; 
    orderNumber: string; 
    passed: boolean;
    issues?: string[];
  }): Promise<void> {
    if (payload.passed) {
      this.logger.log(`QC passed for order ${payload.orderNumber}`);
    } else {
      this.logger.warn(`QC failed for order ${payload.orderNumber}: ${payload.issues?.join(', ')}`);
    }
  }

  @OnEvent('order.payment.received')
  async handlePaymentReceived(payload: { orderId: string; amount: number }): Promise<void> {
    this.logger.log(`Payment received for order ${payload.orderId}: $${payload.amount}`);
    // This can trigger automatic confirmation
  }

  @OnEvent('order.inventory.allocated')
  async handleInventoryAllocated(payload: { orderId: string; success: boolean }): Promise<void> {
    if (payload.success) {
      this.logger.log(`Inventory allocated for order ${payload.orderId}`);
    } else {
      this.logger.warn(`Failed to allocate inventory for order ${payload.orderId}`);
    }
  }
}