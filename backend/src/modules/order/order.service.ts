import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerOrder, CustomerOrderLine, CustomerOrderStatus } from '../../entities/customer-order.entity';
import { OrderRepository, OrderLineRepository } from '../../repositories/order.repository';
import { IOrderService } from './interfaces/order-service.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto, UpdateOrderStatusDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { ClsService } from 'nestjs-cls';
import { OrderStateMachineService } from './services/order-state-machine.service';
import { WorkflowEvent } from './interfaces/state-machine.interface';

@Injectable()
export class OrderService implements IOrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderLineRepository: OrderLineRepository,
    @InjectRepository(CustomerOrder)
    private readonly orderRepo: Repository<CustomerOrder>,
    @InjectRepository(CustomerOrderLine)
    private readonly orderLineRepo: Repository<CustomerOrderLine>,
    private readonly dataSource: DataSource,
    private readonly clsService: ClsService,
    private readonly stateMachine: OrderStateMachineService,
  ) {}

  /**
   * Create a new customer order
   */
  async create(createOrderDto: CreateOrderDto): Promise<CustomerOrder> {
    const tenantId = this.getTenantId();
    
    // Check if order number already exists
    const existingOrder = await this.orderRepository.findByOrderNumber(createOrderDto.orderNumber);
    if (existingOrder) {
      throw new ConflictException(`Order number ${createOrderDto.orderNumber} already exists`);
    }

    // Start transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create order
      const order = this.orderRepo.create({
        ...createOrderDto,
        tenantId,
        status: createOrderDto.status || CustomerOrderStatus.DRAFT,
        createdBy: this.getUserId(),
      });

      // Calculate initial totals
      let subtotal = 0;
      const orderLines: CustomerOrderLine[] = [];

      // Create order lines
      for (const lineDto of createOrderDto.orderLines) {
        const lineTotal = lineDto.quantity * lineDto.unitPrice;
        const discountAmount = (lineTotal * (lineDto.discountPercent || 0)) / 100;
        const lineTotalAfterDiscount = lineTotal - discountAmount;
        
        const orderLine = this.orderLineRepo.create({
          ...lineDto,
          tenantId,
          totalAmount: lineTotalAfterDiscount + (lineDto.taxAmount || 0),
        });
        
        orderLines.push(orderLine);
        subtotal += lineTotalAfterDiscount;
      }

      // Calculate order totals
      order.subtotal = subtotal;
      const orderDiscountAmount = createOrderDto.discountAmount || 
        (subtotal * (createOrderDto.discountPercent || 0)) / 100;
      order.discountAmount = orderDiscountAmount;
      order.taxAmount = createOrderDto.taxAmount || 0;
      order.shippingCost = createOrderDto.shippingCost || 0;
      order.totalAmount = subtotal - orderDiscountAmount + order.taxAmount + order.shippingCost;

      // Save order
      const savedOrder = await queryRunner.manager.save(order);

      // Save order lines with order reference
      for (const orderLine of orderLines) {
        orderLine.customerOrderId = savedOrder.id;
        orderLine.customerOrder = savedOrder;
      }
      await queryRunner.manager.save(orderLines);

      await queryRunner.commitTransaction();

      // Return order with relations
      return this.findOne(savedOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find all orders with filters
   */
  async findAll(query: OrderQueryDto): Promise<{
    data: CustomerOrder[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { data, total } = await this.orderRepository.findWithFilters(query);
    
    return {
      data,
      total,
      page: query.page || 1,
      limit: query.limit || 20,
    };
  }

  /**
   * Find a single order by ID
   */
  async findOne(id: string): Promise<CustomerOrder> {
    const order = await this.orderRepository.findOneWithRelations(id);
    
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    
    return order;
  }

  /**
   * Find orders by customer
   */
  async findByCustomer(customerId: string): Promise<CustomerOrder[]> {
    return this.orderRepository.findByCustomer(customerId);
  }

  /**
   * Find order by order number
   */
  async findByOrderNumber(orderNumber: string): Promise<CustomerOrder | null> {
    return this.orderRepository.findByOrderNumber(orderNumber);
  }

  /**
   * Update an order
   */
  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<CustomerOrder> {
    const order = await this.findOne(id);
    
    // Check if order can be updated
    if (order.status === CustomerOrderStatus.SHIPPED || 
        order.status === CustomerOrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot update shipped or delivered orders');
    }

    // Start transaction if updating order lines
    if (updateOrderDto.orderLines) {
      return this.updateWithOrderLines(order, updateOrderDto);
    }

    // Simple update without order lines
    Object.assign(order, updateOrderDto);
    
    // Recalculate totals if financial fields changed
    if (updateOrderDto.discountPercent !== undefined || 
        updateOrderDto.discountAmount !== undefined ||
        updateOrderDto.taxAmount !== undefined ||
        updateOrderDto.shippingCost !== undefined) {
      await this.calculateTotals(order);
    }

    const updatedOrder = await this.orderRepo.save(order);
    return this.findOne(updatedOrder.id);
  }

  /**
   * Update order with order lines
   */
  private async updateWithOrderLines(
    order: CustomerOrder, 
    updateOrderDto: UpdateOrderDto
  ): Promise<CustomerOrder> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update order fields
      Object.assign(order, updateOrderDto);

      // Handle order lines
      if (updateOrderDto.orderLines) {
        // Get existing order lines
        const existingLines = await this.orderLineRepository.findByOrderId(order.id);
        const existingLineIds = existingLines.map(line => line.id);
        const updatedLineIds: string[] = [];

        for (const lineDto of updateOrderDto.orderLines) {
          if (lineDto.id) {
            // Update existing line
            const existingLine = existingLines.find(l => l.id === lineDto.id);
            if (existingLine) {
              Object.assign(existingLine, lineDto);
              await queryRunner.manager.save(existingLine);
              updatedLineIds.push(lineDto.id);
            }
          } else {
            // Create new line
            const newLine = this.orderLineRepo.create({
              ...lineDto,
              tenantId: order.tenantId,
              customerOrderId: order.id,
            });
            await queryRunner.manager.save(newLine);
          }
        }

        // Remove lines that weren't in the update
        const linesToRemove = existingLineIds.filter(id => !updatedLineIds.includes(id));
        if (linesToRemove.length > 0) {
          await queryRunner.manager.delete(CustomerOrderLine, linesToRemove);
        }
      }

      // Recalculate totals
      await this.calculateTotals(order);
      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();
      return this.findOne(order.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update order status using state machine
   */
  async updateStatus(id: string, statusDto: UpdateOrderStatusDto): Promise<CustomerOrder> {
    const order = await this.findOne(id);
    
    // Map status to workflow event
    const event = this.mapStatusToEvent(order.status, statusDto.status);
    
    if (!event) {
      // Fall back to old validation for backward compatibility
      this.validateStatusTransition(order.status, statusDto.status);
      order.status = statusDto.status;
      
      // Set shipped date if shipping
      if (statusDto.status === CustomerOrderStatus.SHIPPED) {
        order.shippedDate = statusDto.shippedDate || new Date();
      }
      
      const updatedOrder = await this.orderRepo.save(order);
      
      this.logger.log(
        `Order ${order.orderNumber} status changed from ${order.status} to ${statusDto.status}`,
      );
      
      return this.findOne(updatedOrder.id);
    }
    
    // Use state machine for transition
    const result = await this.stateMachine.transition(order, event, {
      userId: this.clsService.get('userId'),
      reason: statusDto.reason,
      metadata: { shippedDate: statusDto.shippedDate },
    });
    
    if (!result.success) {
      throw new BadRequestException(result.message || 'Status transition failed');
    }
    
    const updatedOrder = await this.orderRepo.save(order);
    return this.findOne(updatedOrder.id);
  }
  
  /**
   * Map status transition to workflow event
   */
  private mapStatusToEvent(
    currentStatus: CustomerOrderStatus, 
    newStatus: CustomerOrderStatus
  ): WorkflowEvent | null {
    const transitionMap: Record<string, WorkflowEvent> = {
      [`${CustomerOrderStatus.DRAFT}_${CustomerOrderStatus.PENDING}`]: WorkflowEvent.CONFIRM,
      [`${CustomerOrderStatus.PENDING}_${CustomerOrderStatus.CONFIRMED}`]: WorkflowEvent.CONFIRM,
      [`${CustomerOrderStatus.CONFIRMED}_${CustomerOrderStatus.IN_PRODUCTION}`]: WorkflowEvent.START_PRODUCTION,
      [`${CustomerOrderStatus.IN_PRODUCTION}_${CustomerOrderStatus.QUALITY_CONTROL}`]: WorkflowEvent.COMPLETE_PRODUCTION,
      [`${CustomerOrderStatus.QUALITY_CONTROL}_${CustomerOrderStatus.QC_PASSED}`]: WorkflowEvent.PASS_QC,
      [`${CustomerOrderStatus.QUALITY_CONTROL}_${CustomerOrderStatus.QC_FAILED}`]: WorkflowEvent.FAIL_QC,
      [`${CustomerOrderStatus.QC_FAILED}_${CustomerOrderStatus.IN_PRODUCTION}`]: WorkflowEvent.START_PRODUCTION,
      [`${CustomerOrderStatus.QC_PASSED}_${CustomerOrderStatus.SHIPPED}`]: WorkflowEvent.SHIP,
      [`${CustomerOrderStatus.SHIPPED}_${CustomerOrderStatus.DELIVERED}`]: WorkflowEvent.DELIVER,
    };
    
    // Check for cancel event
    if (newStatus === CustomerOrderStatus.CANCELLED) {
      return WorkflowEvent.CANCEL;
    }
    
    // Check for hold event
    if (newStatus === CustomerOrderStatus.ON_HOLD) {
      return WorkflowEvent.HOLD;
    }
    
    // Check for release event
    if (currentStatus === CustomerOrderStatus.ON_HOLD && 
        (newStatus === CustomerOrderStatus.CONFIRMED || newStatus === CustomerOrderStatus.IN_PRODUCTION)) {
      return WorkflowEvent.RELEASE;
    }
    
    return transitionMap[`${currentStatus}_${newStatus}`] || null;
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(
    currentStatus: CustomerOrderStatus, 
    newStatus: CustomerOrderStatus
  ): void {
    const validTransitions: Record<CustomerOrderStatus, CustomerOrderStatus[]> = {
      [CustomerOrderStatus.DRAFT]: [
        CustomerOrderStatus.PENDING,
        CustomerOrderStatus.CONFIRMED,
        CustomerOrderStatus.CANCELLED,
      ],
      [CustomerOrderStatus.PENDING]: [
        CustomerOrderStatus.CONFIRMED,
        CustomerOrderStatus.CANCELLED,
        CustomerOrderStatus.ON_HOLD,
      ],
      [CustomerOrderStatus.CONFIRMED]: [
        CustomerOrderStatus.IN_PRODUCTION,
        CustomerOrderStatus.CANCELLED,
        CustomerOrderStatus.ON_HOLD,
      ],
      [CustomerOrderStatus.IN_PRODUCTION]: [
        CustomerOrderStatus.QUALITY_CONTROL,
        CustomerOrderStatus.PARTIALLY_SHIPPED,
        CustomerOrderStatus.SHIPPED,
        CustomerOrderStatus.CANCELLED,
        CustomerOrderStatus.ON_HOLD,
      ],
      [CustomerOrderStatus.QUALITY_CONTROL]: [
        CustomerOrderStatus.QC_PASSED,
        CustomerOrderStatus.QC_FAILED,
      ],
      [CustomerOrderStatus.QC_PASSED]: [
        CustomerOrderStatus.SHIPPED,
        CustomerOrderStatus.PARTIALLY_SHIPPED,
      ],
      [CustomerOrderStatus.QC_FAILED]: [
        CustomerOrderStatus.IN_PRODUCTION,
        CustomerOrderStatus.CANCELLED,
      ],
      [CustomerOrderStatus.PARTIALLY_SHIPPED]: [
        CustomerOrderStatus.SHIPPED,
        CustomerOrderStatus.CANCELLED,
      ],
      [CustomerOrderStatus.SHIPPED]: [
        CustomerOrderStatus.DELIVERED,
      ],
      [CustomerOrderStatus.DELIVERED]: [],
      [CustomerOrderStatus.ON_HOLD]: [
        CustomerOrderStatus.CONFIRMED,
        CustomerOrderStatus.IN_PRODUCTION,
        CustomerOrderStatus.CANCELLED,
      ],
      [CustomerOrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  /**
   * Remove an order (soft delete)
   */
  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    
    if (order.status !== CustomerOrderStatus.DRAFT && 
        order.status !== CustomerOrderStatus.CANCELLED) {
      throw new BadRequestException('Can only delete draft or cancelled orders');
    }
    
    await this.orderRepository.softDelete(id);
  }

  /**
   * Confirm an order
   */
  async confirm(id: string): Promise<CustomerOrder> {
    return this.updateStatus(id, { 
      status: CustomerOrderStatus.CONFIRMED 
    });
  }

  /**
   * Cancel an order
   */
  async cancel(id: string, reason?: string): Promise<CustomerOrder> {
    const order = await this.findOne(id);
    
    if (order.status === CustomerOrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel delivered orders');
    }
    
    if (reason) {
      order.internalNotes = `${order.internalNotes || ''}\nCancellation reason: ${reason}`;
      await this.orderRepo.save(order);
    }
    
    return this.updateStatus(id, { 
      status: CustomerOrderStatus.CANCELLED,
      reason,
    });
  }

  /**
   * Mark order as shipped
   */
  async ship(id: string, shippedDate?: Date): Promise<CustomerOrder> {
    const order = await this.findOne(id);
    order.shippedDate = shippedDate || new Date();
    await this.orderRepo.save(order);
    
    return this.updateStatus(id, { 
      status: CustomerOrderStatus.SHIPPED 
    });
  }

  /**
   * Mark order as delivered
   */
  async deliver(id: string): Promise<CustomerOrder> {
    return this.updateStatus(id, { 
      status: CustomerOrderStatus.DELIVERED 
    });
  }

  /**
   * Calculate order totals
   */
  async calculateTotals(order: CustomerOrder): Promise<CustomerOrder> {
    const orderLines = await this.orderLineRepository.findByOrderId(order.id);
    
    let subtotal = 0;
    for (const line of orderLines) {
      subtotal += line.totalAmount;
    }
    
    order.subtotal = subtotal;
    const discountAmount = order.discountAmount || 
      (subtotal * (order.discountPercent || 0)) / 100;
    order.discountAmount = discountAmount;
    order.totalAmount = subtotal - discountAmount + order.taxAmount + order.shippingCost;
    
    return order;
  }

  /**
   * Add order line
   */
  async addOrderLine(
    orderId: string, 
    orderLine: Partial<CustomerOrderLine>
  ): Promise<CustomerOrder> {
    const order = await this.findOne(orderId);
    
    if (order.status !== CustomerOrderStatus.DRAFT && 
        order.status !== CustomerOrderStatus.CONFIRMED) {
      throw new BadRequestException('Cannot add lines to orders in this status');
    }
    
    const tenantId = this.getTenantId();
    const newLine = this.orderLineRepo.create({
      ...orderLine,
      tenantId,
      customerOrderId: orderId,
    });
    
    await this.orderLineRepo.save(newLine);
    await this.calculateTotals(order);
    await this.orderRepo.save(order);
    
    return this.findOne(orderId);
  }

  /**
   * Update order line
   */
  async updateOrderLine(
    orderId: string,
    lineId: string,
    orderLine: Partial<CustomerOrderLine>
  ): Promise<CustomerOrder> {
    const order = await this.findOne(orderId);
    
    if (order.status !== CustomerOrderStatus.DRAFT && 
        order.status !== CustomerOrderStatus.CONFIRMED) {
      throw new BadRequestException('Cannot update lines for orders in this status');
    }
    
    // Check if the order line exists
    const orderWithLines = await this.findOne(orderId);
    const lineExists = orderWithLines.orderLines?.some(line => line.id === lineId);
    
    if (!lineExists) {
      throw new NotFoundException(`Order line with ID ${lineId} not found`);
    }
    
    await this.orderLineRepo.update(lineId, orderLine);
    await this.calculateTotals(order);
    await this.orderRepo.save(order);
    
    return this.findOne(orderId);
  }

  /**
   * Remove order line
   */
  async removeOrderLine(orderId: string, lineId: string): Promise<CustomerOrder> {
    const order = await this.findOne(orderId);
    
    if (order.status !== CustomerOrderStatus.DRAFT && 
        order.status !== CustomerOrderStatus.CONFIRMED) {
      throw new BadRequestException('Cannot remove lines from orders in this status');
    }
    
    await this.orderLineRepo.delete(lineId);
    await this.calculateTotals(order);
    await this.orderRepo.save(order);
    
    return this.findOne(orderId);
  }

  /**
   * Get order summary statistics
   */
  async getOrderStats(customerId?: string): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    return this.orderRepository.getOrderStats(customerId);
  }

  /**
   * Get orders requiring attention
   */
  async getOrdersRequiringAttention(): Promise<CustomerOrder[]> {
    return this.orderRepository.getOrdersRequiringAttention();
  }

  /**
   * Check product availability for order
   */
  async checkProductAvailability(orderId: string): Promise<{
    available: boolean;
    unavailableItems: Array<{
      productId: string;
      required: number;
      available: number;
    }>;
  }> {
    await this.findOne(orderId); // Validate order exists
    const unavailableItems: Array<{
      productId: string;
      required: number;
      available: number;
    }> = [];
    
    // TODO: Implement inventory check logic
    // This would typically check against inventory levels
    
    return {
      available: unavailableItems.length === 0,
      unavailableItems,
    };
  }

  /**
   * Generate production orders from customer order
   */
  async generateProductionOrders(orderId: string): Promise<void> {
    const order = await this.findOne(orderId);
    
    if (order.status !== CustomerOrderStatus.CONFIRMED) {
      throw new BadRequestException('Can only generate production orders for confirmed orders');
    }
    
    // TODO: Implement production order generation logic
    // This would typically create production orders based on order lines
    
    order.status = CustomerOrderStatus.IN_PRODUCTION;
    await this.orderRepo.save(order);
  }

  /**
   * Duplicate an order
   */
  async duplicate(orderId: string): Promise<CustomerOrder> {
    const originalOrder = await this.findOne(orderId);
    const orderLines = await this.orderLineRepository.findByOrderId(orderId);
    
    // Create new order number
    const newOrderNumber = `${originalOrder.orderNumber}-COPY-${Date.now()}`;
    
    const createDto: CreateOrderDto = {
      orderNumber: newOrderNumber,
      customerPONumber: originalOrder.customerPONumber,
      customerId: originalOrder.customerId,
      orderDate: new Date(),
      requiredDate: originalOrder.requiredDate,
      promisedDate: originalOrder.promisedDate,
      status: CustomerOrderStatus.DRAFT,
      priority: originalOrder.priority,
      shippingAddress: originalOrder.shippingAddress,
      shippingMethod: originalOrder.shippingMethod,
      shippingCost: originalOrder.shippingCost,
      discountPercent: originalOrder.discountPercent,
      discountAmount: originalOrder.discountAmount,
      taxAmount: originalOrder.taxAmount,
      salesRepId: originalOrder.salesRepId,
      notes: originalOrder.notes,
      internalNotes: `Duplicated from order ${originalOrder.orderNumber}`,
      orderLines: orderLines.map(line => ({
        lineNumber: line.lineNumber,
        productId: line.productId,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountPercent: line.discountPercent,
        taxAmount: line.taxAmount,
        requiredDate: line.requiredDate,
        promisedDate: line.promisedDate,
        notes: line.notes,
      })),
    };
    
    return this.create(createDto);
  }

  /**
   * Export orders to CSV
   */
  async exportToCSV(query: OrderQueryDto): Promise<Buffer> {
    const { data: orders } = await this.orderRepository.findWithFilters(query);
    
    // Create CSV headers
    const headers = [
      'Order Number',
      'Customer',
      'Order Date',
      'Required Date',
      'Status',
      'Priority',
      'Total Amount',
      'Sales Rep',
    ];
    
    // Create CSV rows
    const rows = orders.map(order => [
      order.orderNumber,
      order.customer?.name || '',
      order.orderDate.toString(),
      order.requiredDate.toString(),
      order.status,
      order.priority,
      order.totalAmount.toString(),
      order.salesRep?.email || '',
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');
    
    return Buffer.from(csvContent, 'utf-8');
  }

  /**
   * Get tenant ID from context
   */
  private getTenantId(): string {
    const tenantId = this.clsService.get('tenantId');
    if (!tenantId) {
      throw new Error('Tenant ID not found in context');
    }
    return tenantId;
  }

  /**
   * Get user ID from context
   */
  private getUserId(): string | undefined {
    return this.clsService.get('userId');
  }
}