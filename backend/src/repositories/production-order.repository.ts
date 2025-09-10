import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ProductionOrder, ProductionOrderStatus } from '../entities/production-order.entity';
import { TenantAwareRepository } from '../common/repositories/tenant-aware.repository';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class ProductionOrderRepository extends TenantAwareRepository<ProductionOrder> {
  constructor(
    @InjectRepository(ProductionOrder)
    productionOrderRepository: Repository<ProductionOrder>,
    protected override readonly clsService: ClsService,
  ) {
    super(productionOrderRepository, 'ProductionOrder', clsService);
  }

  async findByOrderNumber(orderNumber: string): Promise<ProductionOrder | null> {
    const tenantId = this.getTenantId();
    return this.repository.findOne({
      where: { orderNumber, tenantId },
      relations: ['product', 'unitOfMeasure', 'workOrders'],
    });
  }

  async findByStatus(status: ProductionOrderStatus): Promise<ProductionOrder[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { status, tenantId },
      relations: ['product', 'unitOfMeasure'],
      order: { priority: 'DESC', plannedStartDate: 'ASC' },
    });
  }

  async findByProduct(productId: string): Promise<ProductionOrder[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { productId, tenantId },
      relations: ['unitOfMeasure', 'workOrders'],
      order: { plannedStartDate: 'DESC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<ProductionOrder[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: {
        plannedStartDate: Between(startDate, endDate),
        tenantId,
      },
      relations: ['product', 'unitOfMeasure'],
      order: { plannedStartDate: 'ASC' },
    });
  }

  async findHighPriority(minPriority: number = 8): Promise<ProductionOrder[]> {
    const tenantId = this.getTenantId();
    return this.repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.product', 'product')
      .leftJoinAndSelect('order.unitOfMeasure', 'uom')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.priority >= :minPriority', { minPriority })
      .andWhere('order.status NOT IN (:...statuses)', {
        statuses: [ProductionOrderStatus.COMPLETED, ProductionOrderStatus.CANCELLED],
      })
      .orderBy('order.priority', 'DESC')
      .addOrderBy('order.plannedStartDate', 'ASC')
      .getMany();
  }

  async updateProgress(
    orderId: string,
    quantityProduced: number,
    quantityScrapped: number,
  ): Promise<ProductionOrder> {
    const tenantId = this.getTenantId();
    await this.repository.update(
      { id: orderId, tenantId },
      { quantityProduced, quantityScrapped },
    );
    const updated = await this.repository.findOne({
      where: { id: orderId, tenantId },
    });
    if (!updated) {
      throw new Error('ProductionOrder not found');
    }
    return updated;
  }

  async startProduction(orderId: string): Promise<ProductionOrder> {
    const tenantId = this.getTenantId();
    await this.repository.update(
      { id: orderId, tenantId },
      {
        status: ProductionOrderStatus.IN_PROGRESS,
        actualStartDate: new Date(),
      },
    );
    const updated = await this.repository.findOne({
      where: { id: orderId, tenantId },
    });
    if (!updated) {
      throw new Error('ProductionOrder not found');
    }
    return updated;
  }

  async completeProduction(
    orderId: string,
    quantityProduced: number,
    quantityScrapped: number,
  ): Promise<ProductionOrder> {
    const tenantId = this.getTenantId();
    await this.repository.update(
      { id: orderId, tenantId },
      {
        status: ProductionOrderStatus.COMPLETED,
        actualEndDate: new Date(),
        quantityProduced,
        quantityScrapped,
      },
    );
    const updated = await this.repository.findOne({
      where: { id: orderId, tenantId },
    });
    if (!updated) {
      throw new Error('ProductionOrder not found');
    }
    return updated;
  }

  async calculateCompletionPercentage(orderId: string): Promise<number> {
    const order = await this.repository.findOne({
      where: { id: orderId, tenantId: this.getTenantId() },
    });
    if (!order) return 0;
    
    const total = order.quantityOrdered;
    const produced = order.quantityProduced;
    
    return total > 0 ? (produced / total) * 100 : 0;
  }

  async findByCustomerOrder(customerOrderId: string): Promise<ProductionOrder[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { customerOrderId, tenantId },
      relations: ['product', 'unitOfMeasure'],
      order: { priority: 'DESC' },
    });
  }
}