import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Inventory, InventoryStatus } from '../../entities/inventory.entity';
import {
  InventoryTransaction,
  InventoryTransactionType,
} from '../../entities/inventory-transaction.entity';
import {
  BillOfMaterials,
  BOMComponent,
  BOMStatus,
} from '../../entities/bill-of-materials.entity';
import { Product, ProductType } from '../../entities/product.entity';
import { CustomerOrderLine } from '../../entities/customer-order.entity';

export interface MaterialRequirement {
  productId: string;
  productSku: string;
  productName: string;
  requiredQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  shortageQuantity: number;
  unitOfMeasureId: string;
  components?: MaterialRequirement[];
}

export interface ConsumptionResult {
  success: boolean;
  consumedItems: ConsumedItem[];
  shortages: MaterialShortage[];
  transactions: InventoryTransaction[];
}

export interface ConsumedItem {
  productId: string;
  productSku: string;
  quantity: number;
  fromLocations: LocationConsumption[];
  totalCost: number;
}

export interface LocationConsumption {
  warehouseCode: string;
  locationCode: string;
  lotNumber?: string;
  quantity: number;
  unitCost: number;
}

export interface MaterialShortage {
  productId: string;
  productSku: string;
  productName: string;
  requiredQuantity: number;
  availableQuantity: number;
  shortageQuantity: number;
}

export interface MaterialReservation {
  referenceType: string;
  referenceId: string;
  productId: string;
  quantity: number;
  warehouseCode?: string;
  expiresAt?: Date;
}

@Injectable()
export class MaterialConsumptionService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryTransaction)
    private transactionRepository: Repository<InventoryTransaction>,
    @InjectRepository(BillOfMaterials)
    private bomRepository: Repository<BillOfMaterials>,
    @InjectRepository(BOMComponent)
    private bomComponentRepository: Repository<BOMComponent>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  /**
   * Calculate material requirements for a production order or customer order line
   */
  async calculateMaterialRequirements(
    productId: string,
    quantity: number,
    tenantId: string,
    includeSubComponents: boolean = true,
  ): Promise<MaterialRequirement> {
    // Get the product
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
      relations: ['unitOfMeasure'],
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    // Get the active BOM for the product
    const bom = await this.bomRepository.findOne({
      where: {
        productId,
        tenantId,
        status: BOMStatus.ACTIVE,
        isActive: true,
      },
      order: { effectiveDate: 'DESC' },
    });

    const requirement: MaterialRequirement = {
      productId: product.id,
      productSku: product.sku,
      productName: product.name,
      requiredQuantity: quantity,
      availableQuantity: 0,
      reservedQuantity: 0,
      shortageQuantity: 0,
      unitOfMeasureId: product.unitOfMeasureId,
      components: [],
    };

    // If this is a raw material or no BOM exists, just check inventory
    if (product.type === ProductType.RAW_MATERIAL || !bom) {
      const availability = await this.checkMaterialAvailability(
        productId,
        quantity,
        tenantId,
      );
      requirement.availableQuantity = availability.availableQuantity;
      requirement.reservedQuantity = availability.reservedQuantity;
      requirement.shortageQuantity = Math.max(
        0,
        quantity - availability.availableQuantity,
      );
      return requirement;
    }

    // Calculate requirements for BOM components
    if (includeSubComponents && bom) {
      const bomComponents = await this.bomComponentRepository.find({
        where: { billOfMaterialsId: bom.id, tenantId },
        relations: ['component', 'unitOfMeasure'],
      });

      for (const component of bomComponents) {
        // Calculate required quantity including scrap
        const scrapMultiplier = 1 + component.scrapPercentage / 100;
        const componentRequiredQty =
          (component.quantity * quantity * scrapMultiplier) /
          (bom.yieldQuantity || 1);

        // Recursively calculate sub-component requirements
        const componentRequirement = await this.calculateMaterialRequirements(
          component.componentId,
          componentRequiredQty,
          tenantId,
          includeSubComponents,
        );

        requirement.components?.push(componentRequirement);
      }
    }

    // Calculate totals
    const availability = await this.checkMaterialAvailability(
      productId,
      quantity,
      tenantId,
    );
    requirement.availableQuantity = availability.availableQuantity;
    requirement.reservedQuantity = availability.reservedQuantity;
    requirement.shortageQuantity = Math.max(
      0,
      quantity - availability.availableQuantity,
    );

    return requirement;
  }

  /**
   * Check material availability in inventory
   */
  async checkMaterialAvailability(
    productId: string,
    _requiredQuantity: number,
    tenantId: string,
    warehouseCode?: string,
  ): Promise<{
    availableQuantity: number;
    reservedQuantity: number;
    onHandQuantity: number;
  }> {
    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.tenantId = :tenantId', { tenantId })
      .andWhere('inventory.productId = :productId', { productId })
      .andWhere('inventory.status = :status', {
        status: InventoryStatus.AVAILABLE,
      });

    if (warehouseCode) {
      query.andWhere('inventory.warehouseCode = :warehouseCode', {
        warehouseCode,
      });
    }

    const inventoryItems = await query.getMany();

    const totals = inventoryItems.reduce(
      (acc, item) => ({
        availableQuantity:
          acc.availableQuantity + Number(item.quantityAvailable),
        reservedQuantity: acc.reservedQuantity + Number(item.quantityReserved),
        onHandQuantity: acc.onHandQuantity + Number(item.quantityOnHand),
      }),
      { availableQuantity: 0, reservedQuantity: 0, onHandQuantity: 0 },
    );

    return totals;
  }

  /**
   * Consume materials from inventory for production
   */
  async consumeMaterials(
    requirements: MaterialRequirement[],
    referenceType: string,
    referenceId: string,
    tenantId: string,
    notes?: string,
  ): Promise<ConsumptionResult> {
    return this.dataSource.transaction(async (entityManager) => {
      const result: ConsumptionResult = {
        success: true,
        consumedItems: [],
        shortages: [],
        transactions: [],
      };

      for (const requirement of requirements) {
        // Check for shortages
        if (requirement.shortageQuantity > 0) {
          result.shortages.push({
            productId: requirement.productId,
            productSku: requirement.productSku,
            productName: requirement.productName,
            requiredQuantity: requirement.requiredQuantity,
            availableQuantity: requirement.availableQuantity,
            shortageQuantity: requirement.shortageQuantity,
          });
          result.success = false;
          continue;
        }

        // Consume the material
        const consumption = await this.consumeFromInventory(
          requirement.productId,
          requirement.requiredQuantity,
          referenceType,
          referenceId,
          tenantId,
          notes,
          entityManager,
        );

        result.consumedItems.push(consumption.consumedItem);
        result.transactions.push(...consumption.transactions);

        // Recursively consume components
        if (requirement.components && requirement.components.length > 0) {
          const componentResult = await this.consumeMaterials(
            requirement.components,
            referenceType,
            referenceId,
            tenantId,
            notes,
          );

          result.consumedItems.push(...componentResult.consumedItems);
          result.shortages.push(...componentResult.shortages);
          result.transactions.push(...componentResult.transactions);

          if (!componentResult.success) {
            result.success = false;
          }
        }
      }

      if (!result.success) {
        throw new BadRequestException(
          'Insufficient materials available',
          JSON.stringify(result.shortages),
        );
      }

      return result;
    });
  }

  /**
   * Consume material from inventory using FIFO
   */
  private async consumeFromInventory(
    productId: string,
    quantity: number,
    referenceType: string,
    referenceId: string,
    tenantId: string,
    notes?: string,
    entityManager?: EntityManager,
  ): Promise<{
    consumedItem: ConsumedItem;
    transactions: InventoryTransaction[];
  }> {
    const em = entityManager || this.inventoryRepository.manager;

    // Get available inventory items (FIFO - oldest first)
    const inventoryItems = await em.find(Inventory, {
      where: {
        productId,
        tenantId,
        status: InventoryStatus.AVAILABLE,
      },
      order: {
        receivedDate: 'ASC',
        createdAt: 'ASC',
      },
    });

    const consumedItem: ConsumedItem = {
      productId,
      productSku: '',
      quantity: 0,
      fromLocations: [],
      totalCost: 0,
    };

    const transactions: InventoryTransaction[] = [];
    let remainingQuantity = quantity;

    for (const item of inventoryItems) {
      if (remainingQuantity <= 0) break;

      const availableQty = Number(item.quantityAvailable);
      const consumeQty = Math.min(availableQty, remainingQuantity);

      if (consumeQty > 0) {
        // Update inventory quantities
        item.quantityAvailable = Number(item.quantityAvailable) - consumeQty;
        item.quantityOnHand = Number(item.quantityOnHand) - consumeQty;
        await em.save(Inventory, item);

        // Create transaction record
        const transaction = em.create(InventoryTransaction, {
          tenantId,
          transactionNumber: `CONS-${Date.now()}`,
          transactionType: InventoryTransactionType.ISSUE,
          transactionDate: new Date(),
          productId,
          warehouseCode: item.warehouseCode,
          fromLocation: item.locationCode,
          quantity: consumeQty,
          unitCost: Number(item.unitCost || 0),
          totalCost: consumeQty * Number(item.unitCost || 0),
          lotNumber: item.lotNumber,
          serialNumber: item.serialNumber,
          referenceType,
          referenceId,
          notes,
        });

        const savedTransaction = await em.save(
          InventoryTransaction,
          transaction,
        );
        transactions.push(savedTransaction);

        // Track consumption details
        consumedItem.quantity += consumeQty;
        consumedItem.totalCost += consumeQty * Number(item.unitCost || 0);
        consumedItem.fromLocations.push({
          warehouseCode: item.warehouseCode,
          locationCode: item.locationCode,
          lotNumber: item.lotNumber,
          quantity: consumeQty,
          unitCost: Number(item.unitCost || 0),
        });

        remainingQuantity -= consumeQty;
      }
    }

    if (remainingQuantity > 0) {
      throw new BadRequestException(
        `Insufficient inventory for product ${productId}. Required: ${quantity}, Available: ${quantity - remainingQuantity}`,
      );
    }

    // Get product SKU for the result
    const product = await em.findOne(Product, {
      where: { id: productId, tenantId },
    });
    if (product) {
      consumedItem.productSku = product.sku;
    }

    return { consumedItem, transactions };
  }

  /**
   * Reserve materials for future consumption
   */
  async reserveMaterials(
    reservations: MaterialReservation[],
    tenantId: string,
  ): Promise<void> {
    return this.dataSource.transaction(async (entityManager) => {
      for (const reservation of reservations) {
        const query = entityManager
          .createQueryBuilder(Inventory, 'inventory')
          .where('inventory.tenantId = :tenantId', { tenantId })
          .andWhere('inventory.productId = :productId', {
            productId: reservation.productId,
          })
          .andWhere('inventory.status = :status', {
            status: InventoryStatus.AVAILABLE,
          })
          .andWhere('inventory.quantityAvailable >= :quantity', {
            quantity: reservation.quantity,
          });

        if (reservation.warehouseCode) {
          query.andWhere('inventory.warehouseCode = :warehouseCode', {
            warehouseCode: reservation.warehouseCode,
          });
        }

        const inventoryItem = await query.getOne();

        if (!inventoryItem) {
          throw new BadRequestException(
            `Insufficient inventory to reserve ${reservation.quantity} units of product ${reservation.productId}`,
          );
        }

        // Update inventory quantities
        inventoryItem.quantityAvailable =
          Number(inventoryItem.quantityAvailable) - reservation.quantity;
        inventoryItem.quantityReserved =
          Number(inventoryItem.quantityReserved) + reservation.quantity;

        await entityManager.save(Inventory, inventoryItem);

        // Create reservation transaction
        const transaction = entityManager.create(InventoryTransaction, {
          tenantId,
          transactionNumber: `RES-${Date.now()}`,
          transactionType: InventoryTransactionType.RESERVATION,
          transactionDate: new Date(),
          productId: reservation.productId,
          warehouseCode: inventoryItem.warehouseCode,
          fromLocation: inventoryItem.locationCode,
          quantity: reservation.quantity,
          referenceType: reservation.referenceType,
          referenceId: reservation.referenceId,
          notes: `Reserved for ${reservation.referenceType} ${reservation.referenceId}`,
        });

        await entityManager.save(InventoryTransaction, transaction);
      }
    });
  }

  /**
   * Release reserved materials
   */
  async releaseMaterials(
    referenceType: string,
    referenceId: string,
    tenantId: string,
  ): Promise<void> {
    return this.dataSource.transaction(async (entityManager) => {
      // Find all reservation transactions for this reference
      const reservations = await entityManager.find(InventoryTransaction, {
        where: {
          referenceType,
          referenceId,
          tenantId,
          transactionType: InventoryTransactionType.RESERVATION,
        },
      });

      for (const reservation of reservations) {
        // Find the inventory item
        const inventoryItem = await entityManager.findOne(Inventory, {
          where: {
            productId: reservation.productId,
            warehouseCode: reservation.warehouseCode,
            locationCode: reservation.fromLocation!,
            tenantId,
          },
        });

        if (inventoryItem) {
          // Release the reservation
          inventoryItem.quantityAvailable =
            Number(inventoryItem.quantityAvailable) +
            Number(reservation.quantity);
          inventoryItem.quantityReserved =
            Number(inventoryItem.quantityReserved) -
            Number(reservation.quantity);

          await entityManager.save(Inventory, inventoryItem);

          // Create release transaction
          const transaction = entityManager.create(InventoryTransaction, {
            tenantId,
            transactionNumber: `REL-${Date.now()}`,
            transactionType: InventoryTransactionType.RELEASE,
            transactionDate: new Date(),
            productId: reservation.productId,
            warehouseCode: reservation.warehouseCode,
            toLocation: reservation.fromLocation,
            quantity: reservation.quantity,
            referenceType,
            referenceId,
            notes: `Released reservation for ${referenceType} ${referenceId}`,
          });

          await entityManager.save(InventoryTransaction, transaction);
        }
      }
    });
  }

  /**
   * Calculate material consumption for a customer order line
   */
  async calculateOrderLineMaterialRequirements(
    orderLineId: string,
    tenantId: string,
  ): Promise<MaterialRequirement[]> {
    // Get the order line
    const orderLine = await this.dataSource
      .getRepository(CustomerOrderLine)
      .findOne({
        where: { id: orderLineId, tenantId },
        relations: ['product'],
      });

    if (!orderLine) {
      throw new NotFoundException(`Order line ${orderLineId} not found`);
    }

    const requirement = await this.calculateMaterialRequirements(
      orderLine.productId,
      Number(orderLine.quantity),
      tenantId,
      true,
    );

    return [requirement];
  }

  /**
   * Get consumption history for a product
   */
  async getConsumptionHistory(
    productId: string,
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<InventoryTransaction[]> {
    const query = this.transactionRepository
      .createQueryBuilder('transaction')
      .where('transaction.tenantId = :tenantId', { tenantId })
      .andWhere('transaction.productId = :productId', { productId })
      .andWhere('transaction.transactionType = :type', {
        type: InventoryTransactionType.ISSUE,
      });

    if (startDate) {
      query.andWhere('transaction.transactionDate >= :startDate', {
        startDate,
      });
    }

    if (endDate) {
      query.andWhere('transaction.transactionDate <= :endDate', { endDate });
    }

    return query.orderBy('transaction.transactionDate', 'DESC').getMany();
  }

  /**
   * Calculate average consumption rate
   */
  async calculateConsumptionRate(
    productId: string,
    tenantId: string,
    days: number = 30,
  ): Promise<{
    averageDailyConsumption: number;
    totalConsumption: number;
    transactionCount: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await this.getConsumptionHistory(
      productId,
      tenantId,
      startDate,
      new Date(),
    );

    const totalConsumption = transactions.reduce(
      (sum, t) => sum + Number(t.quantity),
      0,
    );

    return {
      averageDailyConsumption: totalConsumption / days,
      totalConsumption,
      transactionCount: transactions.length,
    };
  }
}
