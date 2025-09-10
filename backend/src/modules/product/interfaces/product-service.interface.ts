import { ITenantAwareService } from '../../../common/interfaces/base-service.interface';
import { Product } from '../../../entities/product.entity';

/**
 * Product service interface
 */
export interface IProductService extends ITenantAwareService<Product> {
  /**
   * Find product by SKU
   */
  findBySku(sku: string): Promise<Product | null>;

  /**
   * Find products by category
   */
  findByCategory(categoryId: string): Promise<Product[]>;

  /**
   * Find products with low stock
   */
  findLowStock(): Promise<Product[]>;

  /**
   * Check if product is available
   */
  checkAvailability(productId: string, quantity: number): Promise<boolean>;

  /**
   * Get product with current stock levels
   */
  getWithStock(productId: string): Promise<Product & { currentStock: number }>;

  /**
   * Update product pricing
   */
  updatePricing(
    productId: string,
    cost: number,
    price: number,
  ): Promise<Product>;

  /**
   * Calculate lead time for product
   */
  calculateLeadTime(productId: string, quantity: number): Promise<number>;

  /**
   * Get product BOM (Bill of Materials)
   */
  getBOM(productId: string): Promise<any>;

  /**
   * Get product routing
   */
  getRouting(productId: string): Promise<any>;

  /**
   * Activate product
   */
  activate(productId: string): Promise<Product>;

  /**
   * Deactivate product
   */
  deactivate(productId: string): Promise<Product>;

  /**
   * Duplicate product
   */
  duplicate(productId: string, newSku: string): Promise<Product>;

  /**
   * Get product cost breakdown
   */
  getCostBreakdown(productId: string): Promise<{
    materialCost: number;
    laborCost: number;
    overheadCost: number;
    totalCost: number;
  }>;
}