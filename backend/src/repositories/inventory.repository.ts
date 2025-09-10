import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Inventory, InventoryStatus } from '../entities/inventory.entity';
import { TenantAwareRepository } from '../common/repositories/tenant-aware.repository';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class InventoryRepository extends TenantAwareRepository<Inventory> {
  constructor(
    @InjectRepository(Inventory)
    inventoryRepository: Repository<Inventory>,
    protected override readonly clsService: ClsService,
  ) {
    super(inventoryRepository, 'Inventory', clsService);
  }

  async findByProduct(productId: string): Promise<Inventory[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { productId, tenantId },
      relations: ['product'],
      order: { locationCode: 'ASC' },
    });
  }

  async findByWarehouse(warehouseCode: string): Promise<Inventory[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { warehouseCode, tenantId },
      relations: ['product'],
      order: { locationCode: 'ASC' },
    });
  }

  async findByLocation(warehouseCode: string, locationCode: string): Promise<Inventory[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { warehouseCode, locationCode, tenantId },
      relations: ['product'],
    });
  }

  async findByLotNumber(lotNumber: string): Promise<Inventory[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { lotNumber, tenantId },
      relations: ['product'],
    });
  }

  async findByStatus(status: InventoryStatus): Promise<Inventory[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { status, tenantId },
      relations: ['product'],
    });
  }

  async findExpiredItems(): Promise<Inventory[]> {
    const tenantId = this.getTenantId();
    const today = new Date();
    return this.repository.find({
      where: {
        expirationDate: LessThan(today),
        tenantId,
      },
      relations: ['product'],
      order: { expirationDate: 'ASC' },
    });
  }

  async findExpiringItems(daysAhead: number): Promise<Inventory[]> {
    const tenantId = this.getTenantId();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    
    return this.repository.find({
      where: {
        expirationDate: LessThan(futureDate),
        tenantId,
      },
      relations: ['product'],
      order: { expirationDate: 'ASC' },
    });
  }

  async getAvailableQuantity(productId: string): Promise<number> {
    const tenantId = this.getTenantId();
    const items = await this.repository.find({
      where: {
        productId,
        status: InventoryStatus.AVAILABLE,
        tenantId,
      },
    });
    
    return items.reduce((sum, item) => sum + Number(item.quantityAvailable), 0);
  }

  async getTotalQuantity(productId: string): Promise<number> {
    const tenantId = this.getTenantId();
    const items = await this.repository.find({
      where: { productId, tenantId },
    });
    
    return items.reduce((sum, item) => sum + Number(item.quantityOnHand), 0);
  }

  async reserveQuantity(
    productId: string,
    warehouseCode: string,
    locationCode: string,
    quantity: number,
  ): Promise<Inventory | null> {
    const tenantId = this.getTenantId();
    const inventory = await this.repository.findOne({
      where: {
        productId,
        warehouseCode,
        locationCode,
        status: InventoryStatus.AVAILABLE,
        tenantId,
      },
    });

    if (!inventory || inventory.quantityAvailable < quantity) {
      return null;
    }

    inventory.quantityAvailable -= quantity;
    inventory.quantityReserved += quantity;
    
    return this.repository.save(inventory);
  }

  async updateQuantities(
    inventoryId: string,
    quantityOnHand: number,
    quantityAvailable: number,
    quantityReserved: number,
  ): Promise<Inventory> {
    const tenantId = this.getTenantId();
    await this.repository.update(
      { id: inventoryId, tenantId },
      { quantityOnHand, quantityAvailable, quantityReserved },
    );
    const updated = await this.repository.findOne({
      where: { id: inventoryId, tenantId },
    });
    if (!updated) {
      throw new Error('Inventory not found');
    }
    return updated;
  }

  async findLowStockItems(threshold: number): Promise<Inventory[]> {
    const tenantId = this.getTenantId();
    return this.repository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.tenantId = :tenantId', { tenantId })
      .andWhere('inventory.quantityOnHand < :threshold', { threshold })
      .orderBy('inventory.quantityOnHand', 'ASC')
      .getMany();
  }

  async getInventoryValuation(): Promise<{ productId: string; totalValue: number }[]> {
    const tenantId = this.getTenantId();
    const result = await this.repository
      .createQueryBuilder('inventory')
      .select('inventory.productId', 'productId')
      .addSelect('SUM(inventory.quantityOnHand * inventory.unitCost)', 'totalValue')
      .where('inventory.tenantId = :tenantId', { tenantId })
      .andWhere('inventory.unitCost IS NOT NULL')
      .groupBy('inventory.productId')
      .getRawMany();
    
    return result;
  }
}