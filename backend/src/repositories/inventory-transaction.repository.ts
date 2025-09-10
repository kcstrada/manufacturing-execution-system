import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { InventoryTransaction, InventoryTransactionType } from '../entities/inventory-transaction.entity';
import { TenantAwareRepository } from '../common/repositories/tenant-aware.repository';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class InventoryTransactionRepository extends TenantAwareRepository<InventoryTransaction> {
  constructor(
    @InjectRepository(InventoryTransaction)
    transactionRepository: Repository<InventoryTransaction>,
    protected override readonly clsService: ClsService,
  ) {
    super(transactionRepository, 'InventoryTransaction', clsService);
  }

  async findByProduct(productId: string, limit?: number): Promise<InventoryTransaction[]> {
    const tenantId = this.getTenantId();
    const query = this.repository
      .createQueryBuilder('transaction')
      .where('transaction.tenantId = :tenantId', { tenantId })
      .andWhere('transaction.productId = :productId', { productId })
      .leftJoinAndSelect('transaction.product', 'product')
      .leftJoinAndSelect('transaction.performedBy', 'performedBy')
      .orderBy('transaction.transactionDate', 'DESC');

    if (limit) {
      query.limit(limit);
    }

    return query.getMany();
  }

  async findByWarehouse(warehouseCode: string, limit?: number): Promise<InventoryTransaction[]> {
    const tenantId = this.getTenantId();
    const query = this.repository
      .createQueryBuilder('transaction')
      .where('transaction.tenantId = :tenantId', { tenantId })
      .andWhere('transaction.warehouseCode = :warehouseCode', { warehouseCode })
      .leftJoinAndSelect('transaction.product', 'product')
      .leftJoinAndSelect('transaction.performedBy', 'performedBy')
      .orderBy('transaction.transactionDate', 'DESC');

    if (limit) {
      query.limit(limit);
    }

    return query.getMany();
  }

  async findByType(
    transactionType: InventoryTransactionType,
    startDate?: Date,
    endDate?: Date
  ): Promise<InventoryTransaction[]> {
    const tenantId = this.getTenantId();
    const whereClause: any = { transactionType, tenantId };

    if (startDate && endDate) {
      whereClause.transactionDate = Between(startDate, endDate);
    } else if (startDate) {
      whereClause.transactionDate = LessThan(startDate);
    }

    return this.repository.find({
      where: whereClause,
      relations: ['product', 'performedBy'],
      order: { transactionDate: 'DESC' },
    });
  }

  async findByReference(
    referenceType: string,
    referenceId: string
  ): Promise<InventoryTransaction[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { referenceType, referenceId, tenantId },
      relations: ['product', 'performedBy'],
      order: { transactionDate: 'DESC' },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    productId?: string,
    warehouseCode?: string
  ): Promise<InventoryTransaction[]> {
    const tenantId = this.getTenantId();
    const query = this.repository
      .createQueryBuilder('transaction')
      .where('transaction.tenantId = :tenantId', { tenantId })
      .andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .leftJoinAndSelect('transaction.product', 'product')
      .leftJoinAndSelect('transaction.performedBy', 'performedBy');

    if (productId) {
      query.andWhere('transaction.productId = :productId', { productId });
    }

    if (warehouseCode) {
      query.andWhere('transaction.warehouseCode = :warehouseCode', { warehouseCode });
    }

    return query.orderBy('transaction.transactionDate', 'DESC').getMany();
  }

  async getNextTransactionNumber(): Promise<string> {
    const tenantId = this.getTenantId();
    const prefix = 'TRX';
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const lastTransaction = await this.repository
      .createQueryBuilder('transaction')
      .where('transaction.tenantId = :tenantId', { tenantId })
      .andWhere('transaction.transactionNumber LIKE :pattern', {
        pattern: `${prefix}-${year}${month}%`,
      })
      .orderBy('transaction.transactionNumber', 'DESC')
      .getOne();

    if (!lastTransaction) {
      return `${prefix}-${year}${month}001`;
    }

    const lastNumber = parseInt(lastTransaction.transactionNumber.slice(-3));
    const nextNumber = String(lastNumber + 1).padStart(3, '0');
    
    return `${prefix}-${year}${month}${nextNumber}`;
  }

  async calculateTotalCost(
    productId: string,
    transactionType: InventoryTransactionType,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const tenantId = this.getTenantId();
    const query = this.repository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.totalCost)', 'total')
      .where('transaction.tenantId = :tenantId', { tenantId })
      .andWhere('transaction.productId = :productId', { productId })
      .andWhere('transaction.transactionType = :transactionType', { transactionType });

    if (startDate && endDate) {
      query.andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const result = await query.getRawOne();
    return result?.total || 0;
  }

  async getTransactionSummary(
    startDate: Date,
    endDate: Date,
    groupBy: 'product' | 'warehouse' | 'type'
  ): Promise<any[]> {
    const tenantId = this.getTenantId();
    const query = this.repository
      .createQueryBuilder('transaction')
      .where('transaction.tenantId = :tenantId', { tenantId })
      .andWhere('transaction.transactionDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    switch (groupBy) {
      case 'product':
        query
          .select('transaction.productId', 'productId')
          .addSelect('SUM(transaction.quantity)', 'totalQuantity')
          .addSelect('SUM(transaction.totalCost)', 'totalCost')
          .addSelect('COUNT(*)', 'transactionCount')
          .groupBy('transaction.productId');
        break;
      case 'warehouse':
        query
          .select('transaction.warehouseCode', 'warehouseCode')
          .addSelect('SUM(transaction.quantity)', 'totalQuantity')
          .addSelect('SUM(transaction.totalCost)', 'totalCost')
          .addSelect('COUNT(*)', 'transactionCount')
          .groupBy('transaction.warehouseCode');
        break;
      case 'type':
        query
          .select('transaction.transactionType', 'transactionType')
          .addSelect('SUM(transaction.quantity)', 'totalQuantity')
          .addSelect('SUM(transaction.totalCost)', 'totalCost')
          .addSelect('COUNT(*)', 'transactionCount')
          .groupBy('transaction.transactionType');
        break;
    }

    return query.getRawMany();
  }
}