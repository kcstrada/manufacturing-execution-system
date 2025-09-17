import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import {
  CustomerOrder,
  CustomerOrderLine,
  CustomerOrderStatus,
} from '../../../entities/customer-order.entity';
import {
  ProductionOrder,
  ProductionOrderStatus,
} from '../../../entities/production-order.entity';
import {
  WorkOrder,
  WorkOrderStatus,
} from '../../../entities/work-order.entity';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
} from '../../../entities/task.entity';
import { Routing } from '../../../entities/routing.entity';
import {
  ProductionStep,
  StepType,
} from '../../../entities/production-step.entity';

export interface TaskGenerationOptions {
  priority?: TaskPriority;
  assignToWorkCenter?: boolean;
  autoSchedule?: boolean;
  includeQualityChecks?: boolean;
  includeSetupTasks?: boolean;
}

export interface ConversionResult {
  productionOrders: ProductionOrder[];
  workOrders: WorkOrder[];
  tasks: Task[];
  warnings: string[];
}

@Injectable()
export class OrderToTaskConverterService {
  private readonly logger = new Logger(OrderToTaskConverterService.name);

  constructor(
    @InjectRepository(CustomerOrder)
    private readonly orderRepo: Repository<CustomerOrder>,
    @InjectRepository(ProductionOrder)
    private readonly productionOrderRepo: Repository<ProductionOrder>,
    private readonly clsService: ClsService,
  ) {}

  /**
   * Convert a customer order to production orders, work orders, and tasks
   */
  async convertOrderToTasks(
    orderId: string,
    options: TaskGenerationOptions = {},
    entityManager?: EntityManager,
  ): Promise<ConversionResult> {
    const manager = entityManager || this.orderRepo.manager;
    const tenantId = this.clsService.get('tenantId');

    const result: ConversionResult = {
      productionOrders: [],
      workOrders: [],
      tasks: [],
      warnings: [],
    };

    // Fetch the order with its lines
    const order = await manager.findOne(CustomerOrder, {
      where: { id: orderId, tenantId },
      relations: ['orderLines', 'orderLines.product'],
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.status !== CustomerOrderStatus.CONFIRMED) {
      result.warnings.push(
        `Order ${order.orderNumber} is not in CONFIRMED status`,
      );
    }

    // Process each order line
    for (const orderLine of order.orderLines) {
      try {
        const lineResult = await this.processOrderLine(
          order,
          orderLine,
          options,
          manager,
        );

        result.productionOrders.push(...lineResult.productionOrders);
        result.workOrders.push(...lineResult.workOrders);
        result.tasks.push(...lineResult.tasks);
        result.warnings.push(...lineResult.warnings);
      } catch (error) {
        this.logger.error(
          `Error processing order line ${orderLine.id}: ${error}`,
        );
        result.warnings.push(
          `Failed to process line item ${orderLine.lineNumber}: ${error}`,
        );
      }
    }

    return result;
  }

  /**
   * Process a single order line and generate production orders, work orders, and tasks
   */
  private async processOrderLine(
    order: CustomerOrder,
    orderLine: CustomerOrderLine,
    options: TaskGenerationOptions,
    manager: EntityManager,
  ): Promise<ConversionResult> {
    const tenantId = this.clsService.get('tenantId');
    const result: ConversionResult = {
      productionOrders: [],
      workOrders: [],
      tasks: [],
      warnings: [],
    };

    // Get the product's active routing
    const routing = await this.getActiveRouting(orderLine.productId, manager);
    if (!routing) {
      result.warnings.push(
        `No active routing found for product ${orderLine.product?.name || orderLine.productId}`,
      );
      return result;
    }

    // Create production order
    const productionOrder = await this.createProductionOrder(
      order,
      orderLine,
      options.priority || TaskPriority.NORMAL,
      manager,
    );
    result.productionOrders.push(productionOrder);

    // Get routing steps
    const routingSteps = await manager.find(ProductionStep, {
      where: { routingId: routing.id, tenantId },
      order: { sequenceNumber: 'ASC' },
      relations: ['workCenter'],
    });

    if (routingSteps.length === 0) {
      result.warnings.push(
        `No production steps found for routing ${routing.name}`,
      );
      return result;
    }

    // Create work orders and tasks for each routing step
    for (const step of routingSteps) {
      const workOrder = await this.createWorkOrder(
        productionOrder,
        step,
        orderLine.quantity,
        manager,
      );
      result.workOrders.push(workOrder);

      // Create tasks for this work order
      const tasks = await this.createTasksFromStep(
        workOrder,
        step,
        orderLine.quantity,
        options,
        manager,
      );
      result.tasks.push(...tasks);
    }

    // Link task dependencies based on step sequence
    await this.linkTaskDependencies(result.tasks, routingSteps, manager);

    return result;
  }

  /**
   * Get the active routing for a product
   */
  private async getActiveRouting(
    productId: string,
    manager: EntityManager,
  ): Promise<Routing | null> {
    const tenantId = this.clsService.get('tenantId');

    return await manager.findOne(Routing, {
      where: {
        productId,
        status: 'active' as any,
        tenantId,
      },
      order: { effectiveDate: 'DESC' },
    });
  }

  /**
   * Create a production order from an order line
   */
  private async createProductionOrder(
    order: CustomerOrder,
    orderLine: CustomerOrderLine,
    priority: TaskPriority,
    manager: EntityManager,
  ): Promise<ProductionOrder> {
    const tenantId = this.clsService.get('tenantId');
    const userId = this.clsService.get('userId');

    const productionOrder = manager.create(ProductionOrder, {
      tenantId,
      orderNumber: `PO-${order.orderNumber}-${orderLine.lineNumber}`,
      quantityOrdered: orderLine.quantity,
      quantityProduced: 0,
      quantityScrapped: 0,
      status: ProductionOrderStatus.PLANNED,
      priority: this.mapPriorityToNumber(priority),
      productId: orderLine.productId,
      unitOfMeasureId:
        orderLine.product?.unitOfMeasureId ||
        '00000000-0000-0000-0000-000000000000', // Default UUID
      customerOrderId: order.id,
      plannedStartDate: order.requiredDate || new Date(),
      plannedEndDate: this.calculatePlannedEndDate(
        order.requiredDate || new Date(),
        7,
      ), // Default 7 days
      createdBy: userId,
      notes: `Generated from order ${order.orderNumber}`,
    });

    return await manager.save(productionOrder);
  }

  /**
   * Create a work order from a production step
   */
  private async createWorkOrder(
    productionOrder: ProductionOrder,
    step: ProductionStep,
    quantity: number,
    manager: EntityManager,
  ): Promise<WorkOrder> {
    const tenantId = this.clsService.get('tenantId');

    const workOrder = manager.create(WorkOrder, {
      tenantId,
      workOrderNumber: `WO-${productionOrder.orderNumber}-${step.sequenceNumber}`,
      sequence: step.sequenceNumber,
      operationDescription: step.description || step.name,
      quantityOrdered: quantity,
      quantityCompleted: 0,
      quantityRejected: 0,
      setupTimeMinutes: step.setupTime,
      runTimePerUnitMinutes: step.runTime,
      status: WorkOrderStatus.PENDING,
      productionOrderId: productionOrder.id,
      workCenterId: step.workCenterId!,
      productId: productionOrder.productId,
      scheduledStartDate: this.calculateStepStartDate(
        productionOrder.plannedStartDate!,
        step.sequenceNumber,
      ),
      scheduledEndDate: this.calculateStepEndDate(
        productionOrder.plannedStartDate!,
        step.sequenceNumber,
        quantity,
        step,
      ),
      notes: step.notes,
    });

    return await manager.save(workOrder);
  }

  /**
   * Create tasks from a production step
   */
  private async createTasksFromStep(
    workOrder: WorkOrder,
    step: ProductionStep,
    quantity: number,
    options: TaskGenerationOptions,
    manager: EntityManager,
  ): Promise<Task[]> {
    const tenantId = this.clsService.get('tenantId');
    const tasks: Task[] = [];
    let sequenceNumber = 1;

    // Create setup task if needed
    if (options.includeSetupTasks && step.setupTime > 0) {
      const setupTask = manager.create(Task, {
        taskNumber: `TSK-${workOrder.workOrderNumber}-${sequenceNumber++}`,
        name: `Setup: ${step.name}`,
        description: `Setup for ${step.description || step.name}`,
        type: TaskType.SETUP,
        status: TaskStatus.PENDING,
        priority: options.priority || TaskPriority.NORMAL,
        sequenceNumber: sequenceNumber - 1,
        estimatedHours: step.setupTime / 60,
        actualHours: 0,
        targetQuantity: 0,
        completedQuantity: 0,
        rejectedQuantity: 0,
        progressPercentage: 0,
        instructions: step.instructions,
        requiredSkills: step.requiredSkills,
        requiredTools: step.requiredTools,
        requiresSignOff: step.requiresApproval,
        workOrderId: workOrder.id,
        workCenterId: step.workCenterId,
        productId: workOrder.productId,
        scheduledStartDate: workOrder.scheduledStartDate,
        dueDate: workOrder.scheduledEndDate,
      } as any);
      setupTask.tenantId = tenantId;
      tasks.push(await manager.save(setupTask));
    }

    // Create main production task
    const productionTask = manager.create(Task, {
      taskNumber: `TSK-${workOrder.workOrderNumber}-${sequenceNumber++}`,
      name: step.name,
      description: step.description,
      type: this.mapStepTypeToTaskType(step.type),
      status: TaskStatus.PENDING,
      priority: options.priority || TaskPriority.NORMAL,
      sequenceNumber: sequenceNumber - 1,
      estimatedHours: (step.runTime * quantity) / 60,
      actualHours: 0,
      targetQuantity: quantity,
      completedQuantity: 0,
      rejectedQuantity: 0,
      progressPercentage: 0,
      instructions: step.instructions,
      requiredSkills: step.requiredSkills,
      requiredTools: step.requiredTools,
      checklistItems: this.createChecklistFromQualityChecks(step.qualityChecks),
      requiresSignOff: step.requiresApproval,
      workOrderId: workOrder.id,
      workCenterId: step.workCenterId,
      productId: workOrder.productId,
      scheduledStartDate: this.addMinutesToDate(
        workOrder.scheduledStartDate!,
        step.setupTime,
      ),
      dueDate: workOrder.scheduledEndDate,
    } as any);
    productionTask.tenantId = tenantId;
    tasks.push(await manager.save(productionTask));

    // Create quality check task if needed
    if (
      options.includeQualityChecks &&
      step.qualityChecks &&
      step.qualityChecks.length > 0
    ) {
      const qcTask = manager.create(Task, {
        taskNumber: `TSK-${workOrder.workOrderNumber}-${sequenceNumber++}`,
        name: `QC: ${step.name}`,
        description: `Quality check for ${step.description || step.name}`,
        type: TaskType.QUALITY_CHECK,
        status: TaskStatus.PENDING,
        priority: options.priority || TaskPriority.NORMAL,
        sequenceNumber: sequenceNumber - 1,
        estimatedHours: 0.5, // Default 30 minutes for QC
        actualHours: 0,
        targetQuantity: quantity,
        completedQuantity: 0,
        rejectedQuantity: 0,
        progressPercentage: 0,
        instructions: {
          qualityChecks: step.qualityChecks.map(
            (qc) => `${qc.parameter}: ${qc.method} (${qc.acceptance})`,
          ),
        },
        checklistItems: this.createChecklistFromQualityChecks(
          step.qualityChecks,
        ),
        requiresSignOff: true,
        workOrderId: workOrder.id,
        workCenterId: step.workCenterId,
        productId: workOrder.productId,
        scheduledStartDate: this.addMinutesToDate(
          workOrder.scheduledEndDate!,
          -30,
        ), // 30 min before end
        dueDate: workOrder.scheduledEndDate,
      } as any);
      qcTask.tenantId = tenantId;
      tasks.push(await manager.save(qcTask));
    }

    return tasks;
  }

  /**
   * Link task dependencies based on production step sequence
   */
  private async linkTaskDependencies(
    tasks: Task[],
    _steps: ProductionStep[],
    manager: EntityManager,
  ): Promise<void> {
    // Sort tasks by work order and sequence number
    const sortedTasks = tasks.sort((a, b) => {
      if (a.workOrderId !== b.workOrderId) {
        return a.workOrderId.localeCompare(b.workOrderId);
      }
      return a.sequenceNumber - b.sequenceNumber;
    });

    // Link sequential dependencies within same work order
    for (let i = 1; i < sortedTasks.length; i++) {
      const currentTask = sortedTasks[i];
      const previousTask = sortedTasks[i - 1];

      if (
        currentTask &&
        previousTask &&
        currentTask.workOrderId === previousTask.workOrderId
      ) {
        currentTask.dependencies = [previousTask];
        await manager.save(currentTask);
      }
    }

    // Link dependencies between work orders based on step sequence
    const workOrderGroups = this.groupTasksByWorkOrder(sortedTasks);
    const workOrderIds = Object.keys(workOrderGroups);

    for (let i = 1; i < workOrderIds.length; i++) {
      const currentWorkOrderId = workOrderIds[i];
      const previousWorkOrderId = workOrderIds[i - 1];

      if (currentWorkOrderId && previousWorkOrderId) {
        const currentWorkOrderTasks = workOrderGroups[currentWorkOrderId];
        const previousWorkOrderTasks = workOrderGroups[previousWorkOrderId];

        if (
          currentWorkOrderTasks &&
          previousWorkOrderTasks &&
          currentWorkOrderTasks.length > 0 &&
          previousWorkOrderTasks.length > 0
        ) {
          const firstCurrentTask = currentWorkOrderTasks[0];
          const lastPreviousTask =
            previousWorkOrderTasks[previousWorkOrderTasks.length - 1];

          if (firstCurrentTask && lastPreviousTask) {
            firstCurrentTask.dependencies = [
              ...(firstCurrentTask.dependencies || []),
              lastPreviousTask,
            ];
            await manager.save(firstCurrentTask);
          }
        }
      }
    }
  }

  /**
   * Helper methods
   */
  private mapPriorityToNumber(priority: TaskPriority): number {
    const priorityMap = {
      [TaskPriority.LOW]: 1,
      [TaskPriority.NORMAL]: 2,
      [TaskPriority.HIGH]: 3,
      [TaskPriority.URGENT]: 4,
      [TaskPriority.CRITICAL]: 5,
    };
    return priorityMap[priority] || 2;
  }

  private mapStepTypeToTaskType(stepType: StepType): TaskType {
    const typeMap = {
      [StepType.SETUP]: TaskType.SETUP,
      [StepType.OPERATION]: TaskType.PRODUCTION,
      [StepType.INSPECTION]: TaskType.INSPECTION,
      [StepType.MOVE]: TaskType.PRODUCTION,
      [StepType.WAIT]: TaskType.PRODUCTION,
      [StepType.OUTSOURCE]: TaskType.PRODUCTION,
    };
    return typeMap[stepType] || TaskType.PRODUCTION;
  }

  private createChecklistFromQualityChecks(
    qualityChecks?: any[],
  ): Task['checklistItems'] {
    if (!qualityChecks || qualityChecks.length === 0) {
      return undefined;
    }

    return qualityChecks.map((qc, index) => ({
      id: `qc-${index + 1}`,
      description: `${qc.parameter}: ${qc.method} (${qc.acceptance})`,
      completed: false,
    }));
  }

  private calculatePlannedEndDate(startDate: Date, daysToAdd: number): Date {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + daysToAdd);
    return endDate;
  }

  private calculateStepStartDate(baseDate: Date, sequenceNumber: number): Date {
    const startDate = new Date(baseDate);
    startDate.setHours(startDate.getHours() + (sequenceNumber - 1) * 8); // 8 hours per step as default
    return startDate;
  }

  private calculateStepEndDate(
    baseDate: Date,
    sequenceNumber: number,
    quantity: number,
    step: ProductionStep,
  ): Date {
    const startDate = this.calculateStepStartDate(baseDate, sequenceNumber);
    const totalMinutes = step.setupTime + step.runTime * quantity;
    return this.addMinutesToDate(startDate, totalMinutes);
  }

  private addMinutesToDate(date: Date, minutes: number): Date {
    const newDate = new Date(date);
    newDate.setMinutes(newDate.getMinutes() + minutes);
    return newDate;
  }

  private groupTasksByWorkOrder(tasks: Task[]): Record<string, Task[]> {
    const groups: Record<string, Task[]> = {};

    for (const task of tasks) {
      const workOrderId = task.workOrderId;
      if (!groups[workOrderId]) {
        groups[workOrderId] = [];
      }
      groups[workOrderId].push(task);
    }

    return groups;
  }

  /**
   * Generate tasks for a specific production order
   */
  async generateTasksForProductionOrder(
    productionOrderId: string,
    options: TaskGenerationOptions = {},
    entityManager?: EntityManager,
  ): Promise<ConversionResult> {
    const manager = entityManager || this.productionOrderRepo.manager;
    const tenantId = this.clsService.get('tenantId');

    const result: ConversionResult = {
      productionOrders: [],
      workOrders: [],
      tasks: [],
      warnings: [],
    };

    const productionOrder = await manager.findOne(ProductionOrder, {
      where: { id: productionOrderId, tenantId },
      relations: ['product', 'workOrders'],
    });

    if (!productionOrder) {
      throw new Error(`Production order ${productionOrderId} not found`);
    }

    // Check if work orders already exist
    if (productionOrder.workOrders && productionOrder.workOrders.length > 0) {
      result.warnings.push(
        `Production order ${productionOrder.orderNumber} already has work orders`,
      );
      return result;
    }

    // Get the product's active routing
    const routing = await this.getActiveRouting(
      productionOrder.productId,
      manager,
    );
    if (!routing) {
      result.warnings.push(
        `No active routing found for product ${productionOrder.product?.name || productionOrder.productId}`,
      );
      return result;
    }

    // Get routing steps
    const routingSteps = await manager.find(ProductionStep, {
      where: { routingId: routing.id, tenantId },
      order: { sequenceNumber: 'ASC' },
      relations: ['workCenter'],
    });

    if (routingSteps.length === 0) {
      result.warnings.push(
        `No production steps found for routing ${routing.name}`,
      );
      return result;
    }

    // Create work orders and tasks for each routing step
    for (const step of routingSteps) {
      const workOrder = await this.createWorkOrder(
        productionOrder,
        step,
        productionOrder.quantityOrdered,
        manager,
      );
      result.workOrders.push(workOrder);

      // Create tasks for this work order
      const tasks = await this.createTasksFromStep(
        workOrder,
        step,
        productionOrder.quantityOrdered,
        options,
        manager,
      );
      result.tasks.push(...tasks);
    }

    // Link task dependencies
    await this.linkTaskDependencies(result.tasks, routingSteps, manager);

    return result;
  }
}
