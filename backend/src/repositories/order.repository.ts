import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  CustomerOrder,
  CustomerOrderLine,
} from '../entities/customer-order.entity';
import { TenantAwareRepository } from '../common/repositories/tenant-aware.repository';
import { ClsService } from 'nestjs-cls';
import { OrderQueryDto } from '../modules/order/dto/order-query.dto';

@Injectable()
export class OrderRepository extends TenantAwareRepository<CustomerOrder> {
  constructor(
    @InjectRepository(CustomerOrder)
    protected readonly orderRepo: Repository<CustomerOrder>,
    protected override readonly clsService: ClsService,
  ) {
    super(orderRepo, 'CustomerOrder', clsService);
  }

  /**
   * Find order by order number
   */
  async findByOrderNumber(orderNumber: string): Promise<CustomerOrder | null> {
    const tenantId = this.getTenantId();
    return this.repository.findOne({
      where: {
        tenantId,
        orderNumber,
        isActive: true,
      },
      relations: ['customer', 'orderLines', 'orderLines.product'],
    });
  }

  /**
   * Find orders by customer
   */
  async findByCustomer(customerId: string): Promise<CustomerOrder[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: {
        tenantId,
        customerId,
        isActive: true,
      },
      relations: ['orderLines', 'orderLines.product'],
      order: {
        orderDate: 'DESC',
      },
    });
  }

  /**
   * Find order with all relations
   */
  async findOneWithRelations(id: string): Promise<CustomerOrder | null> {
    const tenantId = this.getTenantId();
    return this.repository.findOne({
      where: {
        id,
        tenantId,
        isActive: true,
      },
      relations: [
        'customer',
        'salesRep',
        'createdByUser',
        'orderLines',
        'orderLines.product',
        'productionOrders',
      ],
    });
  }

  /**
   * Find all orders with filters and pagination
   */
  async findWithFilters(query: OrderQueryDto): Promise<{
    data: CustomerOrder[];
    total: number;
  }> {
    const qb = this.createQueryBuilderWithFilters(query);

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    qb.skip(offset).take(limit);

    // Apply sorting
    const sortBy = query.sortBy || 'orderDate';
    const sortOrder = query.sortOrder || 'DESC';
    qb.orderBy(`order.${sortBy}`, sortOrder);

    const [data, total] = await qb.getManyAndCount();

    return { data, total };
  }

  /**
   * Create query builder with filters
   */
  private createQueryBuilderWithFilters(
    query: OrderQueryDto,
  ): SelectQueryBuilder<CustomerOrder> {
    const tenantId = this.getTenantId();
    const qb = this.repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.orderLines', 'orderLines')
      .leftJoinAndSelect('orderLines.product', 'product')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.isActive = :isActive', { isActive: true });

    // Apply filters
    if (query.customerId) {
      qb.andWhere('order.customerId = :customerId', {
        customerId: query.customerId,
      });
    }

    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    if (query.priority) {
      qb.andWhere('order.priority = :priority', { priority: query.priority });
    }

    if (query.salesRepId) {
      qb.andWhere('order.salesRepId = :salesRepId', {
        salesRepId: query.salesRepId,
      });
    }

    if (query.orderNumber) {
      qb.andWhere('order.orderNumber ILIKE :orderNumber', {
        orderNumber: `%${query.orderNumber}%`,
      });
    }

    if (query.customerPONumber) {
      qb.andWhere('order.customerPONumber ILIKE :customerPONumber', {
        customerPONumber: `%${query.customerPONumber}%`,
      });
    }

    // Date range filters
    if (query.orderDateFrom) {
      qb.andWhere('order.orderDate >= :orderDateFrom', {
        orderDateFrom: query.orderDateFrom,
      });
    }

    if (query.orderDateTo) {
      qb.andWhere('order.orderDate <= :orderDateTo', {
        orderDateTo: query.orderDateTo,
      });
    }

    if (query.requiredDateFrom) {
      qb.andWhere('order.requiredDate >= :requiredDateFrom', {
        requiredDateFrom: query.requiredDateFrom,
      });
    }

    if (query.requiredDateTo) {
      qb.andWhere('order.requiredDate <= :requiredDateTo', {
        requiredDateTo: query.requiredDateTo,
      });
    }

    return qb;
  }

  /**
   * Get order statistics
   */
  async getOrderStats(customerId?: string): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    const tenantId = this.getTenantId();
    let qb = this.repository
      .createQueryBuilder('order')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.isActive = :isActive', { isActive: true });

    if (customerId) {
      qb = qb.andWhere('order.customerId = :customerId', { customerId });
    }

    const stats = await qb
      .select('COUNT(*)', 'totalOrders')
      .addSelect(
        "COUNT(CASE WHEN order.status IN ('draft', 'confirmed', 'in_production') THEN 1 END)",
        'pendingOrders',
      )
      .addSelect(
        "COUNT(CASE WHEN order.status IN ('shipped', 'delivered') THEN 1 END)",
        'completedOrders',
      )
      .addSelect('COALESCE(SUM(order.totalAmount), 0)', 'totalRevenue')
      .addSelect('COALESCE(AVG(order.totalAmount), 0)', 'averageOrderValue')
      .getRawOne();

    return {
      totalOrders: parseInt(stats.totalOrders) || 0,
      pendingOrders: parseInt(stats.pendingOrders) || 0,
      completedOrders: parseInt(stats.completedOrders) || 0,
      totalRevenue: parseFloat(stats.totalRevenue) || 0,
      averageOrderValue: parseFloat(stats.averageOrderValue) || 0,
    };
  }

  /**
   * Get orders requiring attention
   */
  async getOrdersRequiringAttention(): Promise<CustomerOrder[]> {
    const tenantId = this.getTenantId();
    const today = new Date();

    return this.repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.orderLines', 'orderLines')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.isActive = :isActive', { isActive: true })
      .andWhere('order.status IN (:...statuses)', {
        statuses: ['confirmed', 'in_production'],
      })
      .andWhere('order.requiredDate <= :date', {
        date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      })
      .orderBy('order.requiredDate', 'ASC')
      .addOrderBy('order.priority', 'DESC')
      .getMany();
  }
}

@Injectable()
export class OrderLineRepository extends TenantAwareRepository<CustomerOrderLine> {
  constructor(
    @InjectRepository(CustomerOrderLine)
    protected readonly orderLineRepo: Repository<CustomerOrderLine>,
    protected override readonly clsService: ClsService,
  ) {
    super(orderLineRepo, 'CustomerOrderLine', clsService);
  }

  /**
   * Find order lines by order ID
   */
  async findByOrderId(orderId: string): Promise<CustomerOrderLine[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: {
        tenantId,
        customerOrderId: orderId,
        isActive: true,
      },
      relations: ['product'],
      order: {
        lineNumber: 'ASC',
      },
    });
  }

  /**
   * Find order lines by product
   */
  async findByProduct(productId: string): Promise<CustomerOrderLine[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: {
        tenantId,
        productId,
        isActive: true,
      },
      relations: ['customerOrder', 'product'],
    });
  }
}
