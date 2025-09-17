import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';
import {
  CustomerOrder,
  CustomerOrderStatus,
} from '../../../entities/customer-order.entity';
import { OrderStateTransition } from '../../../entities/order-state-transition.entity';
import {
  IOrderStateMachine,
  StateTransition,
  StateMachineContext,
  TransitionResult,
  WorkflowEvent,
  StateMachineConfig,
} from '../interfaces/state-machine.interface';

@Injectable()
export class OrderStateMachineService implements IOrderStateMachine {
  private readonly logger = new Logger(OrderStateMachineService.name);
  private readonly config: StateMachineConfig;

  constructor(
    @InjectRepository(OrderStateTransition)
    private readonly transitionRepo: Repository<OrderStateTransition>,
    private readonly eventEmitter: EventEmitter2,
    private readonly clsService: ClsService,
  ) {
    this.config = this.initializeStateMachine();
  }

  /**
   * Initialize the state machine configuration
   */
  private initializeStateMachine(): StateMachineConfig {
    const transitions: StateTransition[] = [
      // Draft to Pending/Confirmed
      {
        from: CustomerOrderStatus.DRAFT,
        to: CustomerOrderStatus.PENDING,
        event: WorkflowEvent.CONFIRM,
        guard: (order) => this.canConfirmOrder(order),
      },
      {
        from: CustomerOrderStatus.DRAFT,
        to: CustomerOrderStatus.CANCELLED,
        event: WorkflowEvent.CANCEL,
      },

      // Pending to Confirmed
      {
        from: CustomerOrderStatus.PENDING,
        to: CustomerOrderStatus.CONFIRMED,
        event: WorkflowEvent.CONFIRM,
        guard: (order) => this.hasValidPayment(order),
      },
      {
        from: CustomerOrderStatus.PENDING,
        to: CustomerOrderStatus.CANCELLED,
        event: WorkflowEvent.CANCEL,
      },
      {
        from: CustomerOrderStatus.PENDING,
        to: CustomerOrderStatus.ON_HOLD,
        event: WorkflowEvent.HOLD,
      },

      // Confirmed to In Production
      {
        from: CustomerOrderStatus.CONFIRMED,
        to: CustomerOrderStatus.IN_PRODUCTION,
        event: WorkflowEvent.START_PRODUCTION,
        guard: (order) => this.hasProductionCapacity(order),
        action: (order) => this.createProductionOrders(order),
      },
      {
        from: CustomerOrderStatus.CONFIRMED,
        to: CustomerOrderStatus.ON_HOLD,
        event: WorkflowEvent.HOLD,
      },
      {
        from: CustomerOrderStatus.CONFIRMED,
        to: CustomerOrderStatus.CANCELLED,
        event: WorkflowEvent.CANCEL,
      },

      // In Production to Quality Control
      {
        from: CustomerOrderStatus.IN_PRODUCTION,
        to: CustomerOrderStatus.QUALITY_CONTROL,
        event: WorkflowEvent.COMPLETE_PRODUCTION,
        guard: (order) => this.isProductionComplete(order),
      },
      {
        from: CustomerOrderStatus.IN_PRODUCTION,
        to: CustomerOrderStatus.ON_HOLD,
        event: WorkflowEvent.HOLD,
      },

      // Quality Control transitions
      {
        from: CustomerOrderStatus.QUALITY_CONTROL,
        to: CustomerOrderStatus.QC_PASSED,
        event: WorkflowEvent.PASS_QC,
        guard: (order) => this.passedQualityChecks(order),
      },
      {
        from: CustomerOrderStatus.QUALITY_CONTROL,
        to: CustomerOrderStatus.QC_FAILED,
        event: WorkflowEvent.FAIL_QC,
        action: (order) => this.handleQCFailure(order),
      },

      // QC Failed back to In Production (rework)
      {
        from: CustomerOrderStatus.QC_FAILED,
        to: CustomerOrderStatus.IN_PRODUCTION,
        event: WorkflowEvent.START_PRODUCTION,
        action: (order) => this.createReworkOrders(order),
      },
      {
        from: CustomerOrderStatus.QC_FAILED,
        to: CustomerOrderStatus.CANCELLED,
        event: WorkflowEvent.CANCEL,
      },

      // QC Passed to Shipped
      {
        from: CustomerOrderStatus.QC_PASSED,
        to: CustomerOrderStatus.SHIPPED,
        event: WorkflowEvent.SHIP,
        guard: (order) => this.canShipOrder(order),
        action: (order) => this.updateShippingInfo(order),
      },
      {
        from: CustomerOrderStatus.QC_PASSED,
        to: CustomerOrderStatus.PARTIALLY_SHIPPED,
        event: WorkflowEvent.SHIP,
        guard: (order) => this.canPartiallyShip(order),
      },

      // Partially Shipped to Shipped
      {
        from: CustomerOrderStatus.PARTIALLY_SHIPPED,
        to: CustomerOrderStatus.SHIPPED,
        event: WorkflowEvent.SHIP,
        guard: (order) => this.allItemsShipped(order),
      },

      // Shipped to Delivered
      {
        from: CustomerOrderStatus.SHIPPED,
        to: CustomerOrderStatus.DELIVERED,
        event: WorkflowEvent.DELIVER,
        action: (order) => this.completeDelivery(order),
      },

      // On Hold transitions
      {
        from: CustomerOrderStatus.ON_HOLD,
        to: CustomerOrderStatus.CONFIRMED,
        event: WorkflowEvent.RELEASE,
        guard: (order) => this.canReleaseHold(order),
      },
      {
        from: CustomerOrderStatus.ON_HOLD,
        to: CustomerOrderStatus.IN_PRODUCTION,
        event: WorkflowEvent.RELEASE,
        guard: (order) => this.wasInProduction(order),
      },
      {
        from: CustomerOrderStatus.ON_HOLD,
        to: CustomerOrderStatus.CANCELLED,
        event: WorkflowEvent.CANCEL,
      },
    ];

    return {
      initialState: CustomerOrderStatus.DRAFT,
      states: Object.values(CustomerOrderStatus),
      transitions,
      onStateChange: async (context, result) => {
        await this.recordTransition(context, result);
        this.emitStateChangeEvent(context, result);
      },
    };
  }

  /**
   * Check if a transition is allowed
   */
  async canTransition(
    order: CustomerOrder,
    event: WorkflowEvent,
  ): Promise<boolean> {
    const transition = this.findTransition(order.status, event);

    if (!transition) {
      return false;
    }

    if (transition.guard) {
      return await transition.guard(order);
    }

    return true;
  }

  /**
   * Execute a state transition
   */
  async transition(
    order: CustomerOrder,
    event: WorkflowEvent,
    context?: Partial<StateMachineContext>,
  ): Promise<TransitionResult> {
    const previousState = order.status;
    const transition = this.findTransition(order.status, event);

    if (!transition) {
      return {
        success: false,
        previousState,
        currentState: order.status,
        message: `No transition available from ${order.status} with event ${event}`,
        timestamp: new Date(),
      };
    }

    // Check guard condition
    if (transition.guard) {
      const canProceed = await transition.guard(order);
      if (!canProceed) {
        return {
          success: false,
          previousState,
          currentState: order.status,
          message: `Guard condition failed for transition from ${order.status} to ${transition.to}`,
          timestamp: new Date(),
        };
      }
    }

    // Execute transition
    order.status = transition.to;

    // Execute action if defined
    if (transition.action) {
      await transition.action(order);
    }

    const result: TransitionResult = {
      success: true,
      previousState,
      currentState: transition.to,
      message: `Successfully transitioned from ${previousState} to ${transition.to}`,
      timestamp: new Date(),
    };

    // Execute onStateChange callback
    if (this.config.onStateChange) {
      const fullContext: StateMachineContext = {
        order,
        userId: context?.userId || this.clsService.get('userId'),
        reason: context?.reason,
        metadata: context?.metadata,
      };
      await this.config.onStateChange(fullContext, result);
    }

    this.logger.log(
      `Order ${order.orderNumber} transitioned from ${previousState} to ${transition.to} via event ${event}`,
    );

    return result;
  }

  /**
   * Get available transitions for current state
   */
  getAvailableTransitions(order: CustomerOrder): StateTransition[] {
    return this.config.transitions.filter(
      (transition) => transition.from === order.status,
    );
  }

  /**
   * Get available events for current state
   */
  getAvailableEvents(order: CustomerOrder): WorkflowEvent[] {
    const transitions = this.getAvailableTransitions(order);
    return [...new Set(transitions.map((t) => t.event as WorkflowEvent))];
  }

  /**
   * Get transition history for an order
   */
  async getTransitionHistory(orderId: string): Promise<TransitionResult[]> {
    const tenantId = this.clsService.get('tenantId');
    const transitions = await this.transitionRepo.find({
      where: {
        customerOrderId: orderId,
        tenantId,
      },
      order: {
        transitionedAt: 'ASC',
      },
    });

    return transitions.map((t) => ({
      success: t.success,
      previousState: t.fromState,
      currentState: t.toState,
      message: t.notes || t.errorMessage,
      timestamp: t.transitionedAt,
    }));
  }

  /**
   * Validate state consistency
   */
  validateState(order: CustomerOrder): boolean {
    return this.config.states.includes(order.status);
  }

  /**
   * Find a transition by current state and event
   */
  private findTransition(
    fromState: CustomerOrderStatus,
    event: WorkflowEvent,
  ): StateTransition | undefined {
    return this.config.transitions.find(
      (t) => t.from === fromState && t.event === event,
    );
  }

  /**
   * Record state transition in database
   */
  private async recordTransition(
    context: StateMachineContext,
    result: TransitionResult,
  ): Promise<void> {
    const tenantId = this.clsService.get('tenantId');

    const transition = this.transitionRepo.create({
      tenantId,
      customerOrderId: context.order.id,
      fromState: result.previousState,
      toState: result.currentState,
      event: context.metadata?.event || 'manual',
      reason: context.reason,
      notes: result.message,
      userId: context.userId,
      success: result.success,
      errorMessage: result.success ? undefined : result.message,
      transitionMetadata: context.metadata,
    });

    await this.transitionRepo.save(transition);
  }

  /**
   * Emit state change event
   */
  private emitStateChangeEvent(
    context: StateMachineContext,
    result: TransitionResult,
  ): void {
    this.eventEmitter.emit('order.state.changed', {
      orderId: context.order.id,
      orderNumber: context.order.orderNumber,
      previousState: result.previousState,
      currentState: result.currentState,
      userId: context.userId,
      timestamp: result.timestamp,
    });
  }

  // Guard conditions
  private async canConfirmOrder(order: CustomerOrder): Promise<boolean> {
    return !!(order.orderLines && order.orderLines.length > 0);
  }

  private async hasValidPayment(_order: CustomerOrder): Promise<boolean> {
    // TODO: Implement payment validation logic
    return true;
  }

  private async hasProductionCapacity(_order: CustomerOrder): Promise<boolean> {
    // TODO: Check production capacity
    return true;
  }

  private async isProductionComplete(_order: CustomerOrder): Promise<boolean> {
    // TODO: Check if all production orders are complete
    return true;
  }

  private async passedQualityChecks(_order: CustomerOrder): Promise<boolean> {
    // TODO: Check quality control results
    return true;
  }

  private async canShipOrder(order: CustomerOrder): Promise<boolean> {
    // Check if shipping address is valid
    return !!(
      order.shippingAddress &&
      order.shippingAddress.city &&
      order.shippingAddress.postalCode
    );
  }

  private async canPartiallyShip(_order: CustomerOrder): Promise<boolean> {
    // TODO: Check if partial shipment is allowed
    return false;
  }

  private async allItemsShipped(_order: CustomerOrder): Promise<boolean> {
    // TODO: Check if all order lines are shipped
    return true;
  }

  private async canReleaseHold(_order: CustomerOrder): Promise<boolean> {
    // TODO: Check if hold conditions are resolved
    return true;
  }

  private async wasInProduction(order: CustomerOrder): Promise<boolean> {
    // Check transition history to see if order was in production
    const history = await this.getTransitionHistory(order.id);
    return history.some(
      (h) => h.currentState === CustomerOrderStatus.IN_PRODUCTION,
    );
  }

  // Action methods
  private async createProductionOrders(order: CustomerOrder): Promise<void> {
    // TODO: Create production orders
    this.logger.log(
      `Creating production orders for order ${order.orderNumber}`,
    );
  }

  private async handleQCFailure(order: CustomerOrder): Promise<void> {
    // TODO: Handle QC failure
    this.logger.log(`Handling QC failure for order ${order.orderNumber}`);
  }

  private async createReworkOrders(order: CustomerOrder): Promise<void> {
    // TODO: Create rework orders
    this.logger.log(`Creating rework orders for order ${order.orderNumber}`);
  }

  private async updateShippingInfo(order: CustomerOrder): Promise<void> {
    order.shippedDate = new Date();
    this.logger.log(`Updating shipping info for order ${order.orderNumber}`);
  }

  private async completeDelivery(order: CustomerOrder): Promise<void> {
    // TODO: Complete delivery process
    this.logger.log(`Completing delivery for order ${order.orderNumber}`);
  }
}
