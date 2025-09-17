import { CustomerOrderStatus } from '../../../entities/customer-order.entity';
import { CustomerOrder } from '../../../entities/customer-order.entity';

/**
 * State transition definition
 */
export interface StateTransition {
  from: CustomerOrderStatus;
  to: CustomerOrderStatus;
  event: string;
  guard?: (order: CustomerOrder) => boolean | Promise<boolean>;
  action?: (order: CustomerOrder) => void | Promise<void>;
}

/**
 * State machine context
 */
export interface StateMachineContext {
  order: CustomerOrder;
  userId: string;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * State transition result
 */
export interface TransitionResult {
  success: boolean;
  previousState: CustomerOrderStatus;
  currentState: CustomerOrderStatus;
  message?: string;
  timestamp: Date;
}

/**
 * State machine configuration
 */
export interface StateMachineConfig {
  initialState: CustomerOrderStatus;
  states: CustomerOrderStatus[];
  transitions: StateTransition[];
  onStateChange?: (
    context: StateMachineContext,
    result: TransitionResult,
  ) => void | Promise<void>;
}

/**
 * Workflow event types
 */
export enum WorkflowEvent {
  CONFIRM = 'confirm',
  START_PRODUCTION = 'start_production',
  COMPLETE_PRODUCTION = 'complete_production',
  START_QC = 'start_qc',
  PASS_QC = 'pass_qc',
  FAIL_QC = 'fail_qc',
  SHIP = 'ship',
  DELIVER = 'deliver',
  CANCEL = 'cancel',
  HOLD = 'hold',
  RELEASE = 'release',
}

/**
 * State machine service interface
 */
export interface IOrderStateMachine {
  /**
   * Check if a transition is allowed
   */
  canTransition(
    order: CustomerOrder,
    event: WorkflowEvent,
  ): boolean | Promise<boolean>;

  /**
   * Execute a state transition
   */
  transition(
    order: CustomerOrder,
    event: WorkflowEvent,
    context?: Partial<StateMachineContext>,
  ): Promise<TransitionResult>;

  /**
   * Get available transitions for current state
   */
  getAvailableTransitions(order: CustomerOrder): StateTransition[];

  /**
   * Get available events for current state
   */
  getAvailableEvents(order: CustomerOrder): WorkflowEvent[];

  /**
   * Get transition history for an order
   */
  getTransitionHistory(orderId: string): Promise<TransitionResult[]>;

  /**
   * Validate state consistency
   */
  validateState(order: CustomerOrder): boolean;
}
