import { CustomerOrder, CustomerOrderLine } from '../../../entities/customer-order.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto, UpdateOrderStatusDto } from '../dto/update-order.dto';
import { OrderQueryDto } from '../dto/order-query.dto';

export interface IOrderService {
  /**
   * Create a new customer order
   */
  create(createOrderDto: CreateOrderDto): Promise<CustomerOrder>;

  /**
   * Find all orders with filters
   */
  findAll(query: OrderQueryDto): Promise<{
    data: CustomerOrder[];
    total: number;
    page: number;
    limit: number;
  }>;

  /**
   * Find a single order by ID
   */
  findOne(id: string): Promise<CustomerOrder>;

  /**
   * Find orders by customer
   */
  findByCustomer(customerId: string): Promise<CustomerOrder[]>;

  /**
   * Find order by order number
   */
  findByOrderNumber(orderNumber: string): Promise<CustomerOrder | null>;

  /**
   * Update an order
   */
  update(id: string, updateOrderDto: UpdateOrderDto): Promise<CustomerOrder>;

  /**
   * Update order status
   */
  updateStatus(id: string, statusDto: UpdateOrderStatusDto): Promise<CustomerOrder>;

  /**
   * Remove an order (soft delete)
   */
  remove(id: string): Promise<void>;

  /**
   * Confirm an order
   */
  confirm(id: string): Promise<CustomerOrder>;

  /**
   * Cancel an order
   */
  cancel(id: string, reason?: string): Promise<CustomerOrder>;

  /**
   * Mark order as shipped
   */
  ship(id: string, shippedDate?: Date): Promise<CustomerOrder>;

  /**
   * Mark order as delivered
   */
  deliver(id: string): Promise<CustomerOrder>;

  /**
   * Calculate order totals
   */
  calculateTotals(order: CustomerOrder): Promise<CustomerOrder>;

  /**
   * Add order line
   */
  addOrderLine(orderId: string, orderLine: Partial<CustomerOrderLine>): Promise<CustomerOrder>;

  /**
   * Update order line
   */
  updateOrderLine(
    orderId: string,
    lineId: string,
    orderLine: Partial<CustomerOrderLine>
  ): Promise<CustomerOrder>;

  /**
   * Remove order line
   */
  removeOrderLine(orderId: string, lineId: string): Promise<CustomerOrder>;

  /**
   * Get order summary statistics
   */
  getOrderStats(customerId?: string): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  }>;

  /**
   * Get orders requiring attention
   */
  getOrdersRequiringAttention(): Promise<CustomerOrder[]>;

  /**
   * Check product availability for order
   */
  checkProductAvailability(orderId: string): Promise<{
    available: boolean;
    unavailableItems: Array<{
      productId: string;
      required: number;
      available: number;
    }>;
  }>;

  /**
   * Generate production orders from customer order
   */
  generateProductionOrders(orderId: string): Promise<void>;

  /**
   * Duplicate an order
   */
  duplicate(orderId: string): Promise<CustomerOrder>;

  /**
   * Export orders to CSV
   */
  exportToCSV(query: OrderQueryDto): Promise<Buffer>;
}