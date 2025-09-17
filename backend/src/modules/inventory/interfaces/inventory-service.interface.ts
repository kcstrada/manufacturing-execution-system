import { Inventory } from '../../../entities/inventory.entity';
import { InventoryTransaction } from '../../../entities/inventory-transaction.entity';
import {
  CreateInventoryDto,
  CreateInventoryTransactionDto,
  AdjustInventoryDto,
  TransferInventoryDto,
} from '../dto/create-inventory.dto';
import {
  UpdateInventoryDto,
  UpdateInventoryQuantitiesDto,
  UpdateInventoryStatusDto,
  ReserveInventoryDto,
  ReleaseInventoryDto,
} from '../dto/update-inventory.dto';
import {
  InventoryQueryDto,
  InventoryTransactionQueryDto,
  InventoryValuationQueryDto,
} from '../dto/inventory-query.dto';

/**
 * Inventory service interface
 */
export interface IInventoryService {
  // CRUD Operations
  create(createInventoryDto: CreateInventoryDto): Promise<Inventory>;
  findAll(
    query: InventoryQueryDto,
  ): Promise<{ data: Inventory[]; total: number }>;
  findOne(id: string): Promise<Inventory>;
  update(
    id: string,
    updateInventoryDto: UpdateInventoryDto,
  ): Promise<Inventory>;
  remove(id: string): Promise<void>;

  // Stock Tracking Methods
  findByProduct(productId: string): Promise<Inventory[]>;
  findByWarehouse(warehouseCode: string): Promise<Inventory[]>;
  findByLocation(
    warehouseCode: string,
    locationCode: string,
  ): Promise<Inventory[]>;
  findByLotNumber(lotNumber: string): Promise<Inventory[]>;
  findByStatus(status: string): Promise<Inventory[]>;

  // Quantity Management
  getAvailableQuantity(
    productId: string,
    warehouseCode?: string,
  ): Promise<number>;
  getTotalQuantity(productId: string, warehouseCode?: string): Promise<number>;
  updateQuantities(
    id: string,
    quantities: UpdateInventoryQuantitiesDto,
  ): Promise<Inventory>;

  // Reservation Management
  reserveInventory(
    productId: string,
    warehouseCode: string,
    locationCode: string,
    reserveDto: ReserveInventoryDto,
  ): Promise<Inventory>;

  releaseInventory(
    productId: string,
    warehouseCode: string,
    locationCode: string,
    releaseDto: ReleaseInventoryDto,
  ): Promise<Inventory>;

  // Stock Adjustments
  adjustInventory(
    productId: string,
    warehouseCode: string,
    locationCode: string,
    adjustDto: AdjustInventoryDto,
  ): Promise<InventoryTransaction>;

  // Stock Transfers
  transferInventory(transferDto: TransferInventoryDto): Promise<{
    sourceTransaction: InventoryTransaction;
    destinationTransaction: InventoryTransaction;
  }>;

  // Status Management
  updateStatus(
    id: string,
    statusDto: UpdateInventoryStatusDto,
  ): Promise<Inventory>;

  // Expiration Management
  findExpiredItems(): Promise<Inventory[]>;
  findExpiringItems(daysAhead: number): Promise<Inventory[]>;

  // Stock Analysis
  findLowStockItems(threshold: number): Promise<Inventory[]>;
  getInventoryValuation(query?: InventoryValuationQueryDto): Promise<
    {
      productId?: string;
      warehouseCode?: string;
      locationCode?: string;
      totalValue: number;
      totalQuantity: number;
    }[]
  >;

  // Transaction Management
  createTransaction(
    transactionDto: CreateInventoryTransactionDto,
  ): Promise<InventoryTransaction>;
  findTransactions(query: InventoryTransactionQueryDto): Promise<{
    data: InventoryTransaction[];
    total: number;
  }>;
  getTransactionHistory(
    productId: string,
    warehouseCode?: string,
    days?: number,
  ): Promise<InventoryTransaction[]>;

  // Cycle Counting
  performCycleCount(
    productId: string,
    warehouseCode: string,
    locationCode: string,
    actualQuantity: number,
    notes?: string,
  ): Promise<{
    inventory: Inventory;
    transaction: InventoryTransaction;
  }>;

  // Stock Receipt
  receiveStock(
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
  }>;

  // Stock Issue
  issueStock(
    productId: string,
    warehouseCode: string,
    locationCode: string,
    quantity: number,
    referenceType?: string,
    referenceId?: string,
  ): Promise<{
    inventory: Inventory;
    transaction: InventoryTransaction;
  }>;

  // Bulk Operations
  bulkUpdateStatus(
    inventoryIds: string[],
    statusDto: UpdateInventoryStatusDto,
  ): Promise<Inventory[]>;

  bulkAdjust(
    adjustments: Array<{
      productId: string;
      warehouseCode: string;
      locationCode: string;
      adjustment: AdjustInventoryDto;
    }>,
  ): Promise<InventoryTransaction[]>;

  // Stock Availability Check
  checkStockAvailability(
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
  }>;
}
