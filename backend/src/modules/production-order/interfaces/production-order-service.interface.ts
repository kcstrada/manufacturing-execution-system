import {
  ITenantAwareService,
  IWorkflowService,
} from '../../../common/interfaces/base-service.interface';
import { ProductionOrder } from '../../../entities/production-order.entity';
import { WorkOrder } from '../../../entities/work-order.entity';
import {
  ProductionOrderProgressDto,
  ReleaseProductionOrderDto,
} from '../dto/create-production-order.dto';

/**
 * Production Order service interface
 */
export interface IProductionOrderService
  extends ITenantAwareService<ProductionOrder>,
    IWorkflowService<ProductionOrder> {
  /**
   * Create production order from customer order
   */
  createFromCustomerOrder(customerOrderId: string): Promise<ProductionOrder>;

  /**
   * Release production order for execution
   */
  release(
    orderId: string,
    options?: ReleaseProductionOrderDto,
  ): Promise<ProductionOrder>;

  /**
   * Generate work orders from production order
   */
  generateWorkOrders(orderId: string): Promise<WorkOrder[]>;

  /**
   * Update production progress
   */
  updateProgress(
    orderId: string,
    progress: ProductionOrderProgressDto,
  ): Promise<ProductionOrder>;

  /**
   * Complete production order
   */
  complete(orderId: string): Promise<ProductionOrder>;

  /**
   * Cancel production order
   */
  cancel(orderId: string, reason: string): Promise<ProductionOrder>;

  /**
   * Put production order on hold
   */
  hold(orderId: string, reason: string): Promise<ProductionOrder>;

  /**
   * Resume production order from hold
   */
  resume(orderId: string): Promise<ProductionOrder>;

  /**
   * Check material availability
   */
  checkMaterialAvailability(orderId: string): Promise<{
    available: boolean;
    shortages: Array<{
      productId: string;
      required: number;
      available: number;
    }>;
  }>;

  /**
   * Check production capacity
   */
  checkCapacity(orderId: string): Promise<{
    available: boolean;
    conflicts: Array<{
      workCenterId: string;
      date: Date;
      availableHours: number;
      requiredHours: number;
    }>;
  }>;

  /**
   * Schedule production order
   */
  schedule(
    orderId: string,
    startDate?: Date,
  ): Promise<{
    scheduledStartDate: Date;
    scheduledEndDate: Date;
    workOrders: Array<{
      id: string;
      scheduledStartDate: Date;
      scheduledEndDate: Date;
    }>;
  }>;

  /**
   * Get production order timeline
   */
  getTimeline(orderId: string): Promise<{
    plannedStart: Date;
    plannedEnd: Date;
    actualStart?: Date;
    actualEnd?: Date;
    milestones: Array<{
      name: string;
      plannedDate: Date;
      actualDate?: Date;
      status: string;
    }>;
  }>;

  /**
   * Calculate production cost
   */
  calculateCost(orderId: string): Promise<{
    materialCost: number;
    laborCost: number;
    overheadCost: number;
    totalCost: number;
    costPerUnit: number;
  }>;

  /**
   * Get production order performance metrics
   */
  getPerformanceMetrics(orderId: string): Promise<{
    efficiency: number;
    qualityRate: number;
    onTimeDelivery: boolean;
    actualVsPlannedHours: number;
    scrapRate: number;
  }>;

  /**
   * Split production order
   */
  split(orderId: string, quantities: number[]): Promise<ProductionOrder[]>;

  /**
   * Merge production orders
   */
  merge(orderIds: string[]): Promise<ProductionOrder>;

  /**
   * Get active production orders
   */
  getActive(): Promise<ProductionOrder[]>;

  /**
   * Get production orders by status
   */
  getByStatus(status: string): Promise<ProductionOrder[]>;

  /**
   * Get production orders by date range
   */
  getByDateRange(startDate: Date, endDate: Date): Promise<ProductionOrder[]>;
}
