import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { Inventory, InventoryStatus } from '../../entities/inventory.entity';
import {
  InventoryTransaction,
  InventoryTransactionType,
} from '../../entities/inventory-transaction.entity';
import { InventoryRepository } from '../../repositories/inventory.repository';
import { InventoryTransactionRepository } from '../../repositories/inventory-transaction.repository';
import { IInventoryService } from './interfaces/inventory-service.interface';
import {
  CreateInventoryDto,
  CreateInventoryTransactionDto,
  AdjustInventoryDto,
  TransferInventoryDto,
} from './dto/create-inventory.dto';
import {
  UpdateInventoryDto,
  UpdateInventoryQuantitiesDto,
  UpdateInventoryStatusDto,
  ReserveInventoryDto,
  ReleaseInventoryDto,
} from './dto/update-inventory.dto';
import {
  InventoryQueryDto,
  InventoryTransactionQueryDto,
  InventoryValuationQueryDto,
} from './dto/inventory-query.dto';

@Injectable()
export class InventoryService implements IInventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryTransaction)
    private readonly transactionRepository: Repository<InventoryTransaction>,
    private readonly inventoryRepo: InventoryRepository,
    private readonly transactionRepo: InventoryTransactionRepository,
    private readonly dataSource: DataSource,
    private readonly clsService: ClsService,
  ) {}

  private getTenantId(): string {
    const tenantId = this.clsService.get('tenantId');
    if (!tenantId) {
      throw new Error('Tenant ID not found in context');
    }
    return tenantId;
  }

  private getUserId(): string {
    return this.clsService.get('userId') || 'system';
  }

  // CRUD Operations
  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    const tenantId = this.getTenantId();

    const inventory = this.inventoryRepository.create({
      ...createInventoryDto,
      tenantId,
      quantityAvailable:
        createInventoryDto.quantityAvailable ??
        createInventoryDto.quantityOnHand,
      quantityReserved: createInventoryDto.quantityReserved ?? 0,
      quantityInTransit: createInventoryDto.quantityInTransit ?? 0,
      status: createInventoryDto.status ?? InventoryStatus.AVAILABLE,
    });

    const savedInventory = await this.inventoryRepository.save(inventory);

    // Create initial transaction
    await this.createTransaction({
      productId: savedInventory.productId,
      warehouseCode: savedInventory.warehouseCode,
      transactionType: InventoryTransactionType.RECEIPT,
      quantity: savedInventory.quantityOnHand,
      toLocation: savedInventory.locationCode,
      lotNumber: savedInventory.lotNumber,
      unitCost: savedInventory.unitCost,
      notes: 'Initial inventory creation',
    });

    return savedInventory;
  }

  async findAll(
    query: InventoryQueryDto,
  ): Promise<{ data: Inventory[]; total: number }> {
    const tenantId = this.getTenantId();
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      ...filters
    } = query;

    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.tenantId = :tenantId', { tenantId });

    // Apply filters
    if (filters.productId) {
      queryBuilder.andWhere('inventory.productId = :productId', {
        productId: filters.productId,
      });
    }
    if (filters.warehouseCode) {
      queryBuilder.andWhere('inventory.warehouseCode = :warehouseCode', {
        warehouseCode: filters.warehouseCode,
      });
    }
    if (filters.locationCode) {
      queryBuilder.andWhere('inventory.locationCode = :locationCode', {
        locationCode: filters.locationCode,
      });
    }
    if (filters.lotNumber) {
      queryBuilder.andWhere('inventory.lotNumber = :lotNumber', {
        lotNumber: filters.lotNumber,
      });
    }
    if (filters.status) {
      queryBuilder.andWhere('inventory.status = :status', {
        status: filters.status,
      });
    }
    if (filters.minQuantity !== undefined) {
      queryBuilder.andWhere('inventory.quantityOnHand >= :minQuantity', {
        minQuantity: filters.minQuantity,
      });
    }
    if (filters.maxQuantity !== undefined) {
      queryBuilder.andWhere('inventory.quantityOnHand <= :maxQuantity', {
        maxQuantity: filters.maxQuantity,
      });
    }
    if (filters.lowStockThreshold !== undefined) {
      queryBuilder.andWhere('inventory.quantityOnHand < :threshold', {
        threshold: filters.lowStockThreshold,
      });
    }
    if (filters.expiringInDays !== undefined) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + filters.expiringInDays);
      queryBuilder.andWhere('inventory.expirationDate <= :futureDate', {
        futureDate,
      });
    }
    if (!filters.includeExpired) {
      queryBuilder.andWhere(
        '(inventory.expirationDate IS NULL OR inventory.expirationDate > :now)',
        { now: new Date() },
      );
    }

    // Apply sorting and pagination
    queryBuilder
      .orderBy(`inventory.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Inventory> {
    const tenantId = this.getTenantId();
    const inventory = await this.inventoryRepository.findOne({
      where: { id, tenantId },
      relations: ['product'],
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    return inventory;
  }

  async update(
    id: string,
    updateInventoryDto: UpdateInventoryDto,
  ): Promise<Inventory> {
    const inventory = await this.findOne(id);

    Object.assign(inventory, updateInventoryDto);

    return this.inventoryRepository.save(inventory);
  }

  async remove(id: string): Promise<void> {
    const inventory = await this.findOne(id);
    await this.inventoryRepository.remove(inventory);
  }

  // Stock Tracking Methods
  async findByProduct(productId: string): Promise<Inventory[]> {
    return this.inventoryRepo.findByProduct(productId);
  }

  async findByWarehouse(warehouseCode: string): Promise<Inventory[]> {
    return this.inventoryRepo.findByWarehouse(warehouseCode);
  }

  async findByLocation(
    warehouseCode: string,
    locationCode: string,
  ): Promise<Inventory[]> {
    return this.inventoryRepo.findByLocation(warehouseCode, locationCode);
  }

  async findByLotNumber(lotNumber: string): Promise<Inventory[]> {
    return this.inventoryRepo.findByLotNumber(lotNumber);
  }

  async findByStatus(status: string): Promise<Inventory[]> {
    return this.inventoryRepo.findByStatus(status as InventoryStatus);
  }

  // Quantity Management
  async getAvailableQuantity(
    productId: string,
    warehouseCode?: string,
  ): Promise<number> {
    if (warehouseCode) {
      const items = await this.inventoryRepo.findByProduct(productId);
      const warehouseItems = items.filter(
        (item) => item.warehouseCode === warehouseCode,
      );
      return warehouseItems.reduce(
        (sum, item) => sum + Number(item.quantityAvailable),
        0,
      );
    }
    return this.inventoryRepo.getAvailableQuantity(productId);
  }

  async getTotalQuantity(
    productId: string,
    warehouseCode?: string,
  ): Promise<number> {
    if (warehouseCode) {
      const items = await this.inventoryRepo.findByProduct(productId);
      const warehouseItems = items.filter(
        (item) => item.warehouseCode === warehouseCode,
      );
      return warehouseItems.reduce(
        (sum, item) => sum + Number(item.quantityOnHand),
        0,
      );
    }
    return this.inventoryRepo.getTotalQuantity(productId);
  }

  async updateQuantities(
    id: string,
    quantities: UpdateInventoryQuantitiesDto,
  ): Promise<Inventory> {
    const inventory = await this.findOne(id);

    if (quantities.quantityOnHand !== undefined) {
      inventory.quantityOnHand = quantities.quantityOnHand;
    }
    if (quantities.quantityAvailable !== undefined) {
      inventory.quantityAvailable = quantities.quantityAvailable;
    }
    if (quantities.quantityReserved !== undefined) {
      inventory.quantityReserved = quantities.quantityReserved;
    }
    if (quantities.quantityInTransit !== undefined) {
      inventory.quantityInTransit = quantities.quantityInTransit;
    }

    return this.inventoryRepository.save(inventory);
  }

  // Reservation Management
  async reserveInventory(
    productId: string,
    warehouseCode: string,
    locationCode: string,
    reserveDto: ReserveInventoryDto,
  ): Promise<Inventory> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const inventory = await this.inventoryRepo.reserveQuantity(
        productId,
        warehouseCode,
        locationCode,
        reserveDto.quantity,
      );

      if (!inventory) {
        throw new BadRequestException(
          'Insufficient inventory available for reservation',
        );
      }

      // Create reservation transaction
      await this.createTransaction({
        productId,
        warehouseCode,
        transactionType: InventoryTransactionType.RESERVATION,
        quantity: reserveDto.quantity,
        fromLocation: locationCode,
        referenceType: reserveDto.referenceType,
        referenceId: reserveDto.referenceId,
        notes: reserveDto.notes,
      });

      await queryRunner.commitTransaction();
      return inventory;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async releaseInventory(
    productId: string,
    warehouseCode: string,
    locationCode: string,
    releaseDto: ReleaseInventoryDto,
  ): Promise<Inventory> {
    const tenantId = this.getTenantId();
    const inventory = await this.inventoryRepository.findOne({
      where: { productId, warehouseCode, locationCode, tenantId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    if (inventory.quantityReserved < releaseDto.quantity) {
      throw new BadRequestException(
        'Cannot release more than reserved quantity',
      );
    }

    inventory.quantityReserved -= releaseDto.quantity;
    inventory.quantityAvailable += releaseDto.quantity;

    const updatedInventory = await this.inventoryRepository.save(inventory);

    // Create release transaction
    await this.createTransaction({
      productId,
      warehouseCode,
      transactionType: InventoryTransactionType.RELEASE,
      quantity: releaseDto.quantity,
      toLocation: locationCode,
      referenceType: releaseDto.referenceType,
      referenceId: releaseDto.referenceId,
      notes: releaseDto.notes,
    });

    return updatedInventory;
  }

  // Stock Adjustments
  async adjustInventory(
    productId: string,
    warehouseCode: string,
    locationCode: string,
    adjustDto: AdjustInventoryDto,
  ): Promise<InventoryTransaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tenantId = this.getTenantId();
      const inventory = await this.inventoryRepository.findOne({
        where: {
          productId,
          warehouseCode,
          locationCode,
          tenantId,
          ...(adjustDto.lotNumber && { lotNumber: adjustDto.lotNumber }),
        },
      });

      if (!inventory) {
        throw new NotFoundException('Inventory not found');
      }

      const newQuantity =
        Number(inventory.quantityOnHand) + adjustDto.adjustmentQuantity;
      if (newQuantity < 0) {
        throw new BadRequestException(
          'Adjustment would result in negative inventory',
        );
      }

      inventory.quantityOnHand = newQuantity;
      inventory.quantityAvailable =
        newQuantity - Number(inventory.quantityReserved);

      await queryRunner.manager.save(inventory);

      // Create adjustment transaction
      const transaction = await this.createTransaction({
        productId,
        warehouseCode,
        transactionType: InventoryTransactionType.ADJUSTMENT,
        quantity: Math.abs(adjustDto.adjustmentQuantity),
        fromLocation:
          adjustDto.adjustmentQuantity < 0 ? locationCode : undefined,
        toLocation: adjustDto.adjustmentQuantity > 0 ? locationCode : undefined,
        lotNumber: adjustDto.lotNumber,
        notes: `${adjustDto.reason}${adjustDto.notes ? ` - ${adjustDto.notes}` : ''}`,
      });

      await queryRunner.commitTransaction();
      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Stock Transfers
  async transferInventory(transferDto: TransferInventoryDto): Promise<{
    sourceTransaction: InventoryTransaction;
    destinationTransaction: InventoryTransaction;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tenantId = this.getTenantId();

      // Find source inventory
      const sourceInventory = await this.inventoryRepository.findOne({
        where: {
          productId: transferDto.productId,
          warehouseCode: transferDto.fromWarehouseCode,
          locationCode: transferDto.fromLocation || '',
          tenantId,
          ...(transferDto.lotNumber && { lotNumber: transferDto.lotNumber }),
        },
      });

      if (!sourceInventory) {
        throw new NotFoundException('Source inventory not found');
      }

      if (sourceInventory.quantityAvailable < transferDto.quantity) {
        throw new BadRequestException(
          'Insufficient inventory available for transfer',
        );
      }

      // Update source inventory
      sourceInventory.quantityOnHand -= transferDto.quantity;
      sourceInventory.quantityAvailable -= transferDto.quantity;
      await queryRunner.manager.save(sourceInventory);

      // Find or create destination inventory
      let destinationInventory = await this.inventoryRepository.findOne({
        where: {
          productId: transferDto.productId,
          warehouseCode: transferDto.toWarehouseCode,
          locationCode: transferDto.toLocation || '',
          tenantId,
          ...(transferDto.lotNumber && { lotNumber: transferDto.lotNumber }),
        },
      });

      if (destinationInventory) {
        destinationInventory.quantityOnHand += transferDto.quantity;
        destinationInventory.quantityAvailable += transferDto.quantity;
      } else {
        destinationInventory = this.inventoryRepository.create({
          productId: transferDto.productId,
          warehouseCode: transferDto.toWarehouseCode,
          locationCode: transferDto.toLocation || '',
          lotNumber: transferDto.lotNumber,
          quantityOnHand: transferDto.quantity,
          quantityAvailable: transferDto.quantity,
          quantityReserved: 0,
          quantityInTransit: 0,
          status: InventoryStatus.AVAILABLE,
          unitCost: sourceInventory.unitCost,
          tenantId,
        });
      }
      await queryRunner.manager.save(destinationInventory);

      // Create transfer transactions
      const transactionNumber =
        await this.transactionRepo.getNextTransactionNumber();

      const sourceTransaction = await this.createTransaction({
        productId: transferDto.productId,
        warehouseCode: transferDto.fromWarehouseCode,
        transactionType: InventoryTransactionType.TRANSFER,
        quantity: transferDto.quantity,
        fromLocation: transferDto.fromLocation,
        referenceNumber: transactionNumber,
        lotNumber: transferDto.lotNumber,
        notes: `Transfer to ${transferDto.toWarehouseCode}/${transferDto.toLocation || 'default'} ${transferDto.notes || ''}`,
      });

      const destinationTransaction = await this.createTransaction({
        productId: transferDto.productId,
        warehouseCode: transferDto.toWarehouseCode,
        transactionType: InventoryTransactionType.TRANSFER,
        quantity: transferDto.quantity,
        toLocation: transferDto.toLocation,
        referenceNumber: transactionNumber,
        lotNumber: transferDto.lotNumber,
        notes: `Transfer from ${transferDto.fromWarehouseCode}/${transferDto.fromLocation || 'default'} ${transferDto.notes || ''}`,
      });

      await queryRunner.commitTransaction();
      return { sourceTransaction, destinationTransaction };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Status Management
  async updateStatus(
    id: string,
    statusDto: UpdateInventoryStatusDto,
  ): Promise<Inventory> {
    const inventory = await this.findOne(id);

    inventory.status = statusDto.status;

    const updatedInventory = await this.inventoryRepository.save(inventory);

    // Create status change transaction
    await this.createTransaction({
      productId: inventory.productId,
      warehouseCode: inventory.warehouseCode,
      transactionType: InventoryTransactionType.ADJUSTMENT,
      quantity: 0,
      fromLocation: inventory.locationCode,
      notes: `Status changed to ${statusDto.status}. ${statusDto.reason || ''} ${statusDto.notes || ''}`,
    });

    return updatedInventory;
  }

  // Expiration Management
  async findExpiredItems(): Promise<Inventory[]> {
    return this.inventoryRepo.findExpiredItems();
  }

  async findExpiringItems(daysAhead: number): Promise<Inventory[]> {
    return this.inventoryRepo.findExpiringItems(daysAhead);
  }

  // Stock Analysis
  async findLowStockItems(threshold: number): Promise<Inventory[]> {
    return this.inventoryRepo.findLowStockItems(threshold);
  }

  async getInventoryValuation(query?: InventoryValuationQueryDto): Promise<
    {
      productId?: string;
      warehouseCode?: string;
      locationCode?: string;
      totalValue: number;
      totalQuantity: number;
    }[]
  > {
    const tenantId = this.getTenantId();
    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.tenantId = :tenantId', { tenantId })
      .andWhere('inventory.unitCost IS NOT NULL');

    if (query?.productId) {
      queryBuilder.andWhere('inventory.productId = :productId', {
        productId: query.productId,
      });
    }
    if (query?.warehouseCode) {
      queryBuilder.andWhere('inventory.warehouseCode = :warehouseCode', {
        warehouseCode: query.warehouseCode,
      });
    }

    // Apply grouping
    if (query?.groupBy === 'product') {
      queryBuilder
        .select('inventory.productId', 'productId')
        .addSelect('SUM(inventory.quantityOnHand)', 'totalQuantity')
        .addSelect(
          'SUM(inventory.quantityOnHand * inventory.unitCost)',
          'totalValue',
        )
        .groupBy('inventory.productId');
    } else if (query?.groupBy === 'warehouse') {
      queryBuilder
        .select('inventory.warehouseCode', 'warehouseCode')
        .addSelect('SUM(inventory.quantityOnHand)', 'totalQuantity')
        .addSelect(
          'SUM(inventory.quantityOnHand * inventory.unitCost)',
          'totalValue',
        )
        .groupBy('inventory.warehouseCode');
    } else if (query?.groupBy === 'location') {
      queryBuilder
        .select('inventory.warehouseCode', 'warehouseCode')
        .addSelect('inventory.locationCode', 'locationCode')
        .addSelect('SUM(inventory.quantityOnHand)', 'totalQuantity')
        .addSelect(
          'SUM(inventory.quantityOnHand * inventory.unitCost)',
          'totalValue',
        )
        .groupBy('inventory.warehouseCode, inventory.locationCode');
    } else {
      queryBuilder
        .select('inventory.productId', 'productId')
        .addSelect('SUM(inventory.quantityOnHand)', 'totalQuantity')
        .addSelect(
          'SUM(inventory.quantityOnHand * inventory.unitCost)',
          'totalValue',
        )
        .groupBy('inventory.productId');
    }

    const results = await queryBuilder.getRawMany();

    return results.map((r) => ({
      ...(r.productId && { productId: r.productId }),
      ...(r.warehouseCode && { warehouseCode: r.warehouseCode }),
      ...(r.locationCode && { locationCode: r.locationCode }),
      totalQuantity: Number(r.totalQuantity || 0),
      totalValue: Number(r.totalValue || 0),
    }));
  }

  // Transaction Management
  async createTransaction(
    transactionDto: CreateInventoryTransactionDto,
  ): Promise<InventoryTransaction> {
    const tenantId = this.getTenantId();
    const userId = this.getUserId();
    const transactionNumber =
      await this.transactionRepo.getNextTransactionNumber();

    const unitCost = transactionDto.unitCost || 0;
    const totalCost = transactionDto.quantity * unitCost;

    const transaction = this.transactionRepository.create({
      ...transactionDto,
      transactionNumber,
      transactionDate: new Date(),
      unitCost,
      totalCost,
      performedById: userId,
      tenantId,
    });

    return this.transactionRepository.save(transaction);
  }

  async findTransactions(query: InventoryTransactionQueryDto): Promise<{
    data: InventoryTransaction[];
    total: number;
  }> {
    const tenantId = this.getTenantId();
    const { page = 1, limit = 10, ...filters } = query;

    const queryBuilder = this.transactionRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.product', 'product')
      .leftJoinAndSelect('transaction.performedBy', 'performedBy')
      .where('transaction.tenantId = :tenantId', { tenantId });

    // Apply filters
    if (filters.productId) {
      queryBuilder.andWhere('transaction.productId = :productId', {
        productId: filters.productId,
      });
    }
    if (filters.warehouseCode) {
      queryBuilder.andWhere('transaction.warehouseCode = :warehouseCode', {
        warehouseCode: filters.warehouseCode,
      });
    }
    if (filters.transactionType) {
      queryBuilder.andWhere('transaction.transactionType = :transactionType', {
        transactionType: filters.transactionType,
      });
    }
    if (filters.referenceType) {
      queryBuilder.andWhere('transaction.referenceType = :referenceType', {
        referenceType: filters.referenceType,
      });
    }
    if (filters.referenceId) {
      queryBuilder.andWhere('transaction.referenceId = :referenceId', {
        referenceId: filters.referenceId,
      });
    }
    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere(
        'transaction.transactionDate BETWEEN :startDate AND :endDate',
        {
          startDate: filters.startDate,
          endDate: filters.endDate,
        },
      );
    }

    // Apply sorting and pagination
    queryBuilder
      .orderBy('transaction.transactionDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async getTransactionHistory(
    productId: string,
    warehouseCode?: string,
    days?: number,
  ): Promise<InventoryTransaction[]> {
    const startDate = days
      ? new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      : undefined;
    const endDate = new Date();

    if (startDate) {
      return this.transactionRepo.findByDateRange(
        startDate,
        endDate,
        productId,
        warehouseCode,
      );
    }

    if (warehouseCode) {
      const transactions = await this.transactionRepo.findByProduct(productId);
      return transactions.filter((t) => t.warehouseCode === warehouseCode);
    }

    return this.transactionRepo.findByProduct(productId);
  }

  // Cycle Counting
  async performCycleCount(
    productId: string,
    warehouseCode: string,
    locationCode: string,
    actualQuantity: number,
    notes?: string,
  ): Promise<{
    inventory: Inventory;
    transaction: InventoryTransaction;
  }> {
    const tenantId = this.getTenantId();
    const inventory = await this.inventoryRepository.findOne({
      where: { productId, warehouseCode, locationCode, tenantId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    const variance = actualQuantity - Number(inventory.quantityOnHand);

    if (variance !== 0) {
      inventory.quantityOnHand = actualQuantity;
      inventory.quantityAvailable =
        actualQuantity - Number(inventory.quantityReserved);
      await this.inventoryRepository.save(inventory);
    }

    const transaction = await this.createTransaction({
      productId,
      warehouseCode,
      transactionType: InventoryTransactionType.CYCLE_COUNT,
      quantity: Math.abs(variance),
      fromLocation: variance < 0 ? locationCode : undefined,
      toLocation: variance > 0 ? locationCode : undefined,
      notes: `Cycle count: Expected ${inventory.quantityOnHand}, Found ${actualQuantity}, Variance ${variance}. ${notes || ''}`,
    });

    return { inventory, transaction };
  }

  // Stock Receipt
  async receiveStock(
    productId: string,
    warehouseCode: string,
    locationCode: string,
    quantity: number,
    referenceType?: string,
    referenceId?: string,
    lotNumber?: string,
    unitCost?: number,
  ): Promise<{
    inventory: Inventory;
    transaction: InventoryTransaction;
  }> {
    const tenantId = this.getTenantId();

    let inventory = await this.inventoryRepository.findOne({
      where: {
        productId,
        warehouseCode,
        locationCode,
        tenantId,
        ...(lotNumber && { lotNumber }),
      },
    });

    if (inventory) {
      inventory.quantityOnHand += quantity;
      inventory.quantityAvailable += quantity;
      if (unitCost !== undefined) {
        inventory.unitCost = unitCost;
      }
    } else {
      inventory = this.inventoryRepository.create({
        productId,
        warehouseCode,
        locationCode,
        lotNumber,
        quantityOnHand: quantity,
        quantityAvailable: quantity,
        quantityReserved: 0,
        quantityInTransit: 0,
        status: InventoryStatus.AVAILABLE,
        unitCost,
        receivedDate: new Date(),
        tenantId,
      });
    }

    const savedInventory = await this.inventoryRepository.save(inventory);

    const transaction = await this.createTransaction({
      productId,
      warehouseCode,
      transactionType: InventoryTransactionType.RECEIPT,
      quantity,
      toLocation: locationCode,
      lotNumber,
      unitCost,
      referenceType,
      referenceId,
      notes: 'Stock receipt',
    });

    return { inventory: savedInventory, transaction };
  }

  // Stock Issue
  async issueStock(
    productId: string,
    warehouseCode: string,
    locationCode: string,
    quantity: number,
    referenceType?: string,
    referenceId?: string,
  ): Promise<{
    inventory: Inventory;
    transaction: InventoryTransaction;
  }> {
    const tenantId = this.getTenantId();
    const inventory = await this.inventoryRepository.findOne({
      where: { productId, warehouseCode, locationCode, tenantId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    if (inventory.quantityAvailable < quantity) {
      throw new BadRequestException('Insufficient inventory available');
    }

    inventory.quantityOnHand -= quantity;
    inventory.quantityAvailable -= quantity;

    const savedInventory = await this.inventoryRepository.save(inventory);

    const transaction = await this.createTransaction({
      productId,
      warehouseCode,
      transactionType: InventoryTransactionType.ISSUE,
      quantity,
      fromLocation: locationCode,
      referenceType,
      referenceId,
      unitCost: inventory.unitCost,
      notes: 'Stock issue',
    });

    return { inventory: savedInventory, transaction };
  }

  // Bulk Operations
  async bulkUpdateStatus(
    inventoryIds: string[],
    statusDto: UpdateInventoryStatusDto,
  ): Promise<Inventory[]> {
    const tenantId = this.getTenantId();
    const inventories = await this.inventoryRepository.find({
      where: { id: In(inventoryIds), tenantId },
    });

    if (inventories.length !== inventoryIds.length) {
      throw new NotFoundException('Some inventory items not found');
    }

    for (const inventory of inventories) {
      inventory.status = statusDto.status;
    }

    return this.inventoryRepository.save(inventories);
  }

  async bulkAdjust(
    adjustments: Array<{
      productId: string;
      warehouseCode: string;
      locationCode: string;
      adjustment: AdjustInventoryDto;
    }>,
  ): Promise<InventoryTransaction[]> {
    const transactions: InventoryTransaction[] = [];

    for (const {
      productId,
      warehouseCode,
      locationCode,
      adjustment,
    } of adjustments) {
      const transaction = await this.adjustInventory(
        productId,
        warehouseCode,
        locationCode,
        adjustment,
      );
      transactions.push(transaction);
    }

    return transactions;
  }

  // Stock Availability Check
  async checkStockAvailability(
    items: Array<{ productId: string; quantity: number }>,
    warehouseCode?: string,
  ): Promise<{
    available: boolean;
    shortages: Array<{
      productId: string;
      required: number;
      available: number;
      shortage: number;
    }>;
  }> {
    const shortages: Array<{
      productId: string;
      required: number;
      available: number;
      shortage: number;
    }> = [];

    for (const item of items) {
      const available = await this.getAvailableQuantity(
        item.productId,
        warehouseCode,
      );

      if (available < item.quantity) {
        shortages.push({
          productId: item.productId,
          required: item.quantity,
          available,
          shortage: item.quantity - available,
        });
      }
    }

    return {
      available: shortages.length === 0,
      shortages,
    };
  }
}
