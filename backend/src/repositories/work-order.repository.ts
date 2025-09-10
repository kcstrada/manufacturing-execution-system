import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, In } from 'typeorm';
import { WorkOrder, WorkOrderStatus } from '../entities/work-order.entity';
import { TenantAwareRepository } from '../common/repositories/tenant-aware.repository';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class WorkOrderRepository extends TenantAwareRepository<WorkOrder> {
  constructor(
    @InjectRepository(WorkOrder)
    workOrderRepository: Repository<WorkOrder>,
    protected override readonly clsService: ClsService,
  ) {
    super(workOrderRepository, 'WorkOrder', clsService);
  }

  async findByWorkOrderNumber(workOrderNumber: string): Promise<WorkOrder | null> {
    const tenantId = this.getTenantId();
    return this.repository.findOne({
      where: { workOrderNumber, tenantId },
      relations: ['productionOrder', 'workCenter', 'product', 'assignedTo'],
    });
  }

  async findByStatus(status: WorkOrderStatus): Promise<WorkOrder[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { status, tenantId },
      relations: ['productionOrder', 'workCenter', 'product'],
      order: { scheduledStartDate: 'ASC' },
    });
  }

  async findByWorkCenter(workCenterId: string): Promise<WorkOrder[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { workCenterId, tenantId },
      relations: ['productionOrder', 'product'],
      order: { sequence: 'ASC' },
    });
  }

  async findByProductionOrder(productionOrderId: string): Promise<WorkOrder[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { productionOrderId, tenantId },
      relations: ['workCenter', 'product'],
      order: { sequence: 'ASC' },
    });
  }

  async findScheduledInDateRange(startDate: Date, endDate: Date): Promise<WorkOrder[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: {
        scheduledStartDate: Between(startDate, endDate),
        tenantId,
      },
      relations: ['productionOrder', 'workCenter', 'product'],
      order: { scheduledStartDate: 'ASC' },
    });
  }

  async findOverdue(): Promise<WorkOrder[]> {
    const tenantId = this.getTenantId();
    const now = new Date();
    return this.repository.find({
      where: {
        scheduledEndDate: LessThan(now),
        status: In([
          WorkOrderStatus.PENDING,
          WorkOrderStatus.SCHEDULED,
          WorkOrderStatus.RELEASED,
          WorkOrderStatus.IN_PROGRESS,
        ]),
        tenantId,
      },
      relations: ['productionOrder', 'workCenter', 'product'],
      order: { scheduledEndDate: 'ASC' },
    });
  }

  async updateProgress(
    workOrderId: string,
    quantityCompleted: number,
    quantityRejected: number,
  ): Promise<WorkOrder> {
    const tenantId = this.getTenantId();
    await this.repository.update(
      { id: workOrderId, tenantId },
      { quantityCompleted, quantityRejected },
    );
    const updated = await this.repository.findOne({
      where: { id: workOrderId, tenantId },
    });
    if (!updated) {
      throw new Error('WorkOrder not found');
    }
    return updated;
  }

  async startWorkOrder(workOrderId: string, userId: string): Promise<WorkOrder> {
    const tenantId = this.getTenantId();
    await this.repository.update(
      { id: workOrderId, tenantId },
      {
        status: WorkOrderStatus.IN_PROGRESS,
        actualStartDate: new Date(),
        assignedToId: userId,
      },
    );
    const updated = await this.repository.findOne({
      where: { id: workOrderId, tenantId },
    });
    if (!updated) {
      throw new Error('WorkOrder not found');
    }
    return updated;
  }

  async completeWorkOrder(
    workOrderId: string,
    completedById: string,
    quantityCompleted: number,
    quantityRejected: number,
  ): Promise<WorkOrder> {
    const tenantId = this.getTenantId();
    await this.repository.update(
      { id: workOrderId, tenantId },
      {
        status: WorkOrderStatus.COMPLETED,
        actualEndDate: new Date(),
        completedById,
        quantityCompleted,
        quantityRejected,
      },
    );
    const updated = await this.repository.findOne({
      where: { id: workOrderId, tenantId },
    });
    if (!updated) {
      throw new Error('WorkOrder not found');
    }
    return updated;
  }

  async findByAssignedUser(userId: string): Promise<WorkOrder[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { assignedToId: userId, tenantId },
      relations: ['productionOrder', 'workCenter', 'product'],
      order: { scheduledStartDate: 'ASC' },
    });
  }

  async calculateCompletionPercentage(workOrderId: string): Promise<number> {
    const workOrder = await this.repository.findOne({
      where: { id: workOrderId, tenantId: this.getTenantId() },
    });
    if (!workOrder) return 0;
    
    const total = workOrder.quantityOrdered;
    const completed = workOrder.quantityCompleted;
    
    return total > 0 ? (completed / total) * 100 : 0;
  }
}