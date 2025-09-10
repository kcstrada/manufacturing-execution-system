import { ITenantAwareService } from '../../../common/interfaces/base-service.interface';
import { Inventory } from '../../../entities/inventory.entity';
import { InventoryTransaction } from '../../../entities/inventory-transaction.entity';
import {
  AdjustInventoryDto,
  TransferInventoryDto,
} from '../dto/create-inventory.dto';

/**
 * Inventory service interface
 */
export interface IInventoryService extends ITenantAwareService<Inventory> {
  /**
   * Get current stock level for a product
   */
  getStockLevel(productId: string, warehouseId?: string): Promise<number>;

  /**
   * Get available stock (not reserved)
   */
  getAvailableStock(productId: string, warehouseId?: string): Promise<number>;

  /**
   * Reserve inventory for an order
   */
  reserveStock(
    productId: string,
    quantity: number,
    orderId: string,
    warehouseId?: string,
  ): Promise<InventoryTransaction>;

  /**
   * Release reserved inventory
   */
  releaseReservation(reservationId: string): Promise<void>;

  /**
   * Consume inventory for production
   */
  consumeStock(
    productId: string,
    quantity: number,
    workOrderId: string,
    warehouseId?: string,
  ): Promise<InventoryTransaction>;

  /**
   * Receive inventory from purchase order
   */
  receiveStock(
    productId: string,
    quantity: number,
    purchaseOrderId: string,
    warehouseId: string,
    lotNumber?: string,
  ): Promise<InventoryTransaction>;

  /**
   * Adjust inventory (for corrections, damage, etc.)
   */
  adjustInventory(
    productId: string,
    adjustment: AdjustInventoryDto,
    warehouseId?: string,
  ): Promise<InventoryTransaction>;

  /**
   * Transfer inventory between warehouses
   */
  transferInventory(
    transfer: TransferInventoryDto,
  ): Promise<InventoryTransaction>;

  /**
   * Get inventory by lot number
   */
  findByLotNumber(lotNumber: string): Promise<Inventory[]>;

  /**
   * Get expiring inventory
   */
  getExpiringInventory(daysAhead: number): Promise<Inventory[]>;

  /**
   * Get inventory valuation
   */
  getValuation(warehouseId?: string): Promise<{
    totalValue: number;
    itemCount: number;
    items: Array<{
      productId: string;
      quantity: number;
      value: number;
    }>;
  }>;

  /**
   * Perform cycle count
   */
  cycleCount(
    productId: string,
    countedQuantity: number,
    warehouseId: string,
  ): Promise<{
    variance: number;
    adjusted: boolean;
    transaction?: InventoryTransaction;
  }>;

  /**
   * Get inventory transactions history
   */
  getTransactionHistory(
    productId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<InventoryTransaction[]>;

  /**
   * Check if sufficient stock is available
   */
  checkStockAvailability(
    items: Array<{ productId: string; quantity: number }>,
    warehouseId?: string,
  ): Promise<{
    available: boolean;
    shortages: Array<{
      productId: string;
      required: number;
      available: number;
      shortage: number;
    }>;
  }>;

  /**
   * Get reorder suggestions
   */
  getReorderSuggestions(): Promise<
    Array<{
      productId: string;
      currentStock: number;
      reorderPoint: number;
      suggestedQuantity: number;
    }>
  >;

  /**
   * Calculate ABC classification
   */
  calculateABCClassification(): Promise<{
    A: string[]; // Product IDs
    B: string[];
    C: string[];
  }>;
}