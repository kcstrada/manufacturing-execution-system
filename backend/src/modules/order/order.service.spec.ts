import { Test, TestingModule } from '@nestjs/testing';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { OrderService } from './order.service';
import { OrderStateMachineService } from './services/order-state-machine.service';
import { OrderToTaskConverterService } from './services/order-to-task-converter.service';
import { OrderRepository, OrderLineRepository } from '../../repositories/order.repository';
import { CustomerOrder, CustomerOrderLine, CustomerOrderStatus, OrderPriority } from '../../entities/customer-order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto, UpdateOrderStatusDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: jest.Mocked<OrderRepository>;
  let orderLineRepository: jest.Mocked<OrderLineRepository>;
  let orderRepo: jest.Mocked<Repository<CustomerOrder>>;
  let orderLineRepo: jest.Mocked<Repository<CustomerOrderLine>>;
  let clsService: jest.Mocked<ClsService>;
  let stateMachine: jest.Mocked<OrderStateMachineService>;
  let queryRunner: jest.Mocked<QueryRunner>;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockOrderId = 'order-123';
  const mockCustomerId = 'customer-123';

  beforeEach(async () => {
    // Create mock query runner
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
        delete: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: OrderRepository,
          useValue: {
            findByOrderNumber: jest.fn(),
            findByCustomer: jest.fn(),
            findOneWithRelations: jest.fn(),
            findWithFilters: jest.fn(),
            getOrderStats: jest.fn(),
            getOrdersRequiringAttention: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: OrderLineRepository,
          useValue: {
            findByOrderId: jest.fn(),
            findByProduct: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CustomerOrder),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CustomerOrderLine),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn(() => queryRunner),
          },
        },
        {
          provide: ClsService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: OrderStateMachineService,
          useValue: {
            canTransition: jest.fn(),
            transition: jest.fn(),
            getAvailableTransitions: jest.fn(),
            getAvailableEvents: jest.fn(),
            getTransitionHistory: jest.fn(),
            validateState: jest.fn(),
          },
        },
        {
          provide: OrderToTaskConverterService,
          useValue: {
            convertOrderToTasks: jest.fn(),
            generateTasksForProductionOrder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get(OrderRepository) as jest.Mocked<OrderRepository>;
    orderLineRepository = module.get(OrderLineRepository) as jest.Mocked<OrderLineRepository>;
    orderRepo = module.get(getRepositoryToken(CustomerOrder)) as jest.Mocked<Repository<CustomerOrder>>;
    orderLineRepo = module.get(getRepositoryToken(CustomerOrderLine)) as jest.Mocked<Repository<CustomerOrderLine>>;
    clsService = module.get(ClsService) as jest.Mocked<ClsService>;
    stateMachine = module.get(OrderStateMachineService) as jest.Mocked<OrderStateMachineService>;
    
    // Use stateMachine to avoid unused variable warning
    stateMachine;

    // Setup default cls service behavior
    clsService.get.mockImplementation((key?: string | symbol) => {
      if (key === 'tenantId') return mockTenantId;
      if (key === 'userId') return mockUserId;
      return undefined;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createOrderDto: CreateOrderDto = {
      orderNumber: 'ORD-001',
      customerId: mockCustomerId,
      orderDate: new Date(),
      requiredDate: new Date(),
      orderLines: [
        {
          lineNumber: 1,
          productId: 'product-123',
          quantity: 10,
          unitPrice: 100,
        },
      ],
    };

    it('should create a new order successfully', async () => {
      const mockOrder = {
        id: mockOrderId,
        ...createOrderDto,
        tenantId: mockTenantId,
        status: CustomerOrderStatus.DRAFT,
      } as CustomerOrder;

      orderRepository.findByOrderNumber.mockResolvedValue(null);
      orderRepo.create.mockReturnValue(mockOrder);
      (queryRunner.manager.save as jest.Mock).mockResolvedValue(mockOrder);
      orderLineRepo.create.mockReturnValue({} as CustomerOrderLine);
      
      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);

      const result = await service.create(createOrderDto);

      expect(result).toBe(mockOrder);
      expect(orderRepository.findByOrderNumber).toHaveBeenCalledWith(createOrderDto.orderNumber);
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if order number already exists', async () => {
      orderRepository.findByOrderNumber.mockResolvedValue({} as CustomerOrder);

      await expect(service.create(createOrderDto)).rejects.toThrow(ConflictException);
      expect(orderRepository.findByOrderNumber).toHaveBeenCalledWith(createOrderDto.orderNumber);
    });

    it('should rollback transaction on error', async () => {
      const mockOrder = {
        id: mockOrderId,
        ...createOrderDto,
        tenantId: mockTenantId,
        status: CustomerOrderStatus.DRAFT,
      } as CustomerOrder;

      orderRepository.findByOrderNumber.mockResolvedValue(null);
      orderRepo.create.mockReturnValue(mockOrder);
      (queryRunner.manager.save as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(service.create(createOrderDto)).rejects.toThrow('Database error');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      const query: OrderQueryDto = { page: 1, limit: 20 };
      const mockOrders = [{ id: mockOrderId }] as CustomerOrder[];
      
      orderRepository.findWithFilters.mockResolvedValue({
        data: mockOrders,
        total: 1,
      });

      const result = await service.findAll(query);

      expect(result).toEqual({
        data: mockOrders,
        total: 1,
        page: 1,
        limit: 20,
      });
      expect(orderRepository.findWithFilters).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      const mockOrder = { id: mockOrderId } as CustomerOrder;
      orderRepository.findOneWithRelations.mockResolvedValue(mockOrder);

      const result = await service.findOne(mockOrderId);

      expect(result).toBe(mockOrder);
      expect(orderRepository.findOneWithRelations).toHaveBeenCalledWith(mockOrderId);
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOneWithRelations.mockResolvedValue(null);

      await expect(service.findOne(mockOrderId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateOrderDto: UpdateOrderDto = {
      requiredDate: new Date(),
      notes: 'Updated notes',
    };

    it('should update an order successfully', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: CustomerOrderStatus.DRAFT,
      } as CustomerOrder;

      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockOrder);
      
      orderRepo.save.mockResolvedValue(mockOrder);

      const result = await service.update(mockOrderId, updateOrderDto);

      expect(result).toBe(mockOrder);
      expect(orderRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for shipped orders', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: CustomerOrderStatus.SHIPPED,
      } as CustomerOrder;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);

      await expect(service.update(mockOrderId, updateOrderDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should update order status successfully', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.DRAFT,
      } as CustomerOrder;

      const statusDto: UpdateOrderStatusDto = {
        status: CustomerOrderStatus.CONFIRMED,
      };

      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce({ ...mockOrder, status: statusDto.status } as CustomerOrder);
      
      orderRepo.save.mockResolvedValue(mockOrder);

      const result = await service.updateStatus(mockOrderId, statusDto);

      expect(result.status).toBe(statusDto.status);
      expect(orderRepo.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: CustomerOrderStatus.DELIVERED,
      } as CustomerOrder;

      const statusDto: UpdateOrderStatusDto = {
        status: CustomerOrderStatus.DRAFT,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);

      await expect(service.updateStatus(mockOrderId, statusDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft delete a draft order', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: CustomerOrderStatus.DRAFT,
      } as CustomerOrder;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      orderRepository.softDelete.mockResolvedValue(true);

      await service.remove(mockOrderId);

      expect(orderRepository.softDelete).toHaveBeenCalledWith(mockOrderId);
    });

    it('should throw BadRequestException for confirmed orders', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: CustomerOrderStatus.CONFIRMED,
      } as CustomerOrder;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);

      await expect(service.remove(mockOrderId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('confirm', () => {
    it('should confirm an order', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: CustomerOrderStatus.CONFIRMED,
      } as CustomerOrder;

      jest.spyOn(service, 'updateStatus').mockResolvedValue(mockOrder);

      const result = await service.confirm(mockOrderId);

      expect(result).toBe(mockOrder);
      expect(service.updateStatus).toHaveBeenCalledWith(mockOrderId, {
        status: CustomerOrderStatus.CONFIRMED,
      });
    });
  });

  describe('cancel', () => {
    it('should cancel an order with reason', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: CustomerOrderStatus.CANCELLED,
        internalNotes: 'Cancellation reason: Out of stock',
      } as CustomerOrder;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      jest.spyOn(service, 'updateStatus').mockResolvedValue(mockOrder);
      orderRepo.save.mockResolvedValue(mockOrder);

      const result = await service.cancel(mockOrderId, 'Out of stock');

      expect(result).toBe(mockOrder);
      expect(service.updateStatus).toHaveBeenCalledWith(mockOrderId, {
        status: CustomerOrderStatus.CANCELLED,
        reason: 'Out of stock',
      });
    });

    it('should throw BadRequestException for delivered orders', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: CustomerOrderStatus.DELIVERED,
      } as CustomerOrder;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);

      await expect(service.cancel(mockOrderId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getOrderStats', () => {
    it('should return order statistics', async () => {
      const mockStats = {
        totalOrders: 100,
        pendingOrders: 30,
        completedOrders: 70,
        totalRevenue: 100000,
        averageOrderValue: 1000,
      };

      orderRepository.getOrderStats.mockResolvedValue(mockStats);

      const result = await service.getOrderStats(mockCustomerId);

      expect(result).toBe(mockStats);
      expect(orderRepository.getOrderStats).toHaveBeenCalledWith(mockCustomerId);
    });
  });

  describe('getOrdersRequiringAttention', () => {
    it('should return orders requiring attention', async () => {
      const mockOrders = [{ id: mockOrderId }] as CustomerOrder[];
      
      orderRepository.getOrdersRequiringAttention.mockResolvedValue(mockOrders);

      const result = await service.getOrdersRequiringAttention();

      expect(result).toBe(mockOrders);
      expect(orderRepository.getOrdersRequiringAttention).toHaveBeenCalled();
    });
  });

  describe('duplicate', () => {
    it('should duplicate an order', async () => {
      const originalOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        customerId: mockCustomerId,
        requiredDate: new Date(),
        priority: OrderPriority.NORMAL,
      } as CustomerOrder;

      const orderLines = [
        {
          lineNumber: 1,
          productId: 'product-123',
          quantity: 10,
          unitPrice: 100,
        },
      ] as CustomerOrderLine[];

      const duplicatedOrder = {
        ...originalOrder,
        id: 'new-order-id',
        orderNumber: expect.stringContaining('ORD-001-COPY-'),
      } as CustomerOrder;

      jest.spyOn(service, 'findOne').mockResolvedValue(originalOrder);
      orderLineRepository.findByOrderId.mockResolvedValue(orderLines);
      jest.spyOn(service, 'create').mockResolvedValue(duplicatedOrder);

      const result = await service.duplicate(mockOrderId);

      expect(result).toBe(duplicatedOrder);
      expect(service.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orderNumber: expect.stringContaining('ORD-001-COPY-'),
          customerId: mockCustomerId,
          status: CustomerOrderStatus.DRAFT,
        }),
      );
    });
  });

  describe('ship', () => {
    it('should mark order as shipped', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: CustomerOrderStatus.SHIPPED,
      } as CustomerOrder;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      orderRepo.save.mockResolvedValue(mockOrder);
      jest.spyOn(service, 'updateStatus').mockResolvedValue(mockOrder);

      const shippedDate = new Date();
      const result = await service.ship(mockOrderId, shippedDate);

      expect(result).toBe(mockOrder);
      expect(service.updateStatus).toHaveBeenCalledWith(mockOrderId, {
        status: CustomerOrderStatus.SHIPPED,
      });
    });

    it('should use current date if shippedDate not provided', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: CustomerOrderStatus.SHIPPED,
      } as CustomerOrder;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      orderRepo.save.mockResolvedValue(mockOrder);
      jest.spyOn(service, 'updateStatus').mockResolvedValue(mockOrder);

      const result = await service.ship(mockOrderId);

      expect(result).toBe(mockOrder);
      expect(service.updateStatus).toHaveBeenCalledWith(mockOrderId, {
        status: CustomerOrderStatus.SHIPPED,
      });
    });
  });

  describe('deliver', () => {
    it('should mark order as delivered', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: CustomerOrderStatus.DELIVERED,
      } as CustomerOrder;

      jest.spyOn(service, 'updateStatus').mockResolvedValue(mockOrder);

      const result = await service.deliver(mockOrderId);

      expect(result).toBe(mockOrder);
      expect(service.updateStatus).toHaveBeenCalledWith(mockOrderId, {
        status: CustomerOrderStatus.DELIVERED,
      });
    });
  });

  describe('addOrderLine', () => {
    it('should add a new order line to an order', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderLines: [],
        status: CustomerOrderStatus.DRAFT,
      } as unknown as CustomerOrder;

      const newOrderLine = {
        productId: 'product-456',
        quantity: 5,
        unitPrice: 50,
      };

      const updatedOrder = {
        ...mockOrder,
        orderLines: [newOrderLine],
      } as CustomerOrder;

      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(updatedOrder);
      
      orderLineRepo.create.mockReturnValue(newOrderLine as CustomerOrderLine);
      orderLineRepo.save.mockResolvedValue(newOrderLine as CustomerOrderLine);
      jest.spyOn(service, 'calculateTotals').mockResolvedValue(updatedOrder);

      const result = await service.addOrderLine(mockOrderId, newOrderLine);

      expect(result).toBe(updatedOrder);
      expect(orderLineRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        ...newOrderLine,
        customerOrderId: mockOrderId,
        tenantId: mockTenantId,
      }));
    });

    it('should throw BadRequestException for non-draft orders', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: CustomerOrderStatus.SHIPPED,
      } as CustomerOrder;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);

      await expect(service.addOrderLine(mockOrderId, {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateOrderLine', () => {
    it('should update an existing order line', async () => {
      const lineId = 'line-123';
      const mockOrder = {
        id: mockOrderId,
        orderLines: [
          {
            id: lineId,
            productId: 'product-123',
            quantity: 10,
            unitPrice: 100,
          },
        ],
        status: CustomerOrderStatus.DRAFT,
      } as CustomerOrder;

      const updateData = { quantity: 15 };

      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockOrder)  // First call in updateOrderLine
        .mockResolvedValueOnce(mockOrder)  // Second call for line check
        .mockResolvedValueOnce(mockOrder); // Third call at the end
      
      orderLineRepo.update.mockResolvedValue({ affected: 1 } as any);
      orderRepo.save.mockResolvedValue(mockOrder);
      jest.spyOn(service, 'calculateTotals').mockResolvedValue(mockOrder);

      const result = await service.updateOrderLine(mockOrderId, lineId, updateData);

      expect(result).toBe(mockOrder);
      expect(orderLineRepo.update).toHaveBeenCalledWith(lineId, updateData);
    });

    it('should throw NotFoundException if order line not found', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderLines: [],
        status: CustomerOrderStatus.DRAFT,
      } as unknown as CustomerOrder;

      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockOrder);
      
      orderLineRepository.findByOrderId.mockResolvedValue([]);

      await expect(
        service.updateOrderLine(mockOrderId, 'non-existent-line', {})
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeOrderLine', () => {
    it('should remove an order line', async () => {
      const lineId = 'line-123';
      const mockOrder = {
        id: mockOrderId,
        orderLines: [
          {
            id: lineId,
            productId: 'product-123',
            quantity: 10,
            unitPrice: 100,
          },
        ],
        status: CustomerOrderStatus.DRAFT,
      } as CustomerOrder;

      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce({
          ...mockOrder,
          orderLines: [],
        } as unknown as CustomerOrder);
      
      orderLineRepo.delete.mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(service, 'calculateTotals').mockResolvedValue(mockOrder);

      await service.removeOrderLine(mockOrderId, lineId);

      expect(orderLineRepo.delete).toHaveBeenCalledWith(lineId);
    });
  });

  describe('calculateTotals', () => {
    it('should calculate order totals correctly', async () => {
      const mockOrderLines = [
        {
          quantity: 10,
          unitPrice: 100,
          discountPercent: 10,
          totalAmount: 900,
        },
        {
          quantity: 5,
          unitPrice: 50,
          discountAmount: 25,
          totalAmount: 225,
        },
      ] as CustomerOrderLine[];

      const mockOrder = {
        id: mockOrderId,
        discountPercent: 5,
        taxAmount: 106.875,
        shippingCost: 0,
      } as unknown as CustomerOrder;

      orderLineRepository.findByOrderId.mockResolvedValue(mockOrderLines);
      orderRepo.save.mockResolvedValue(mockOrder);

      const result = await service.calculateTotals(mockOrder);

      expect(result.subtotal).toBe(1125); // 900 + 225
      expect(result.discountAmount).toBe(56.25); // 5% of 1125
      expect(result.totalAmount).toBe(1175.625); // 1125 - 56.25 + 106.875 + 0
    });
  });

  describe('checkProductAvailability', () => {
    it('should check product availability for all order lines', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderLines: [],
      } as unknown as CustomerOrder;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);

      const result = await service.checkProductAvailability(mockOrderId);

      expect(result).toEqual({
        available: true,
        unavailableItems: [],
      });
    });
  });

  describe('generateProductionOrders', () => {
    it('should generate production orders for confirmed order', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.CONFIRMED,
        orderLines: [
          {
            productId: 'product-123',
            quantity: 10,
          },
        ],
      } as CustomerOrder;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      jest.spyOn(service, 'generateTasks').mockResolvedValue({
        productionOrdersCount: 1,
        workOrdersCount: 2,
        tasksCount: 3,
        productionOrderIds: ['po-1'],
        workOrderIds: ['wo-1', 'wo-2'],
        taskIds: ['task-1', 'task-2', 'task-3'],
        warnings: [],
      });

      const result = await service.generateProductionOrders(mockOrderId);

      expect(service.findOne).toHaveBeenCalledWith(mockOrderId);
      expect(service.generateTasks).toHaveBeenCalled();
      expect(result.notes).toContain('Generated 1 production orders');
    });

    it('should throw BadRequestException for non-confirmed orders', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: CustomerOrderStatus.DRAFT,
      } as CustomerOrder;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);

      await expect(service.generateProductionOrders(mockOrderId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('exportToCSV', () => {
    it('should export orders to CSV format', async () => {
      const query: OrderQueryDto = { page: 1, limit: 100 };
      const mockOrders = [
        {
          orderNumber: 'ORD-001',
          customer: { name: 'Customer A' },
          status: CustomerOrderStatus.CONFIRMED,
          orderDate: new Date('2024-01-01'),
          requiredDate: new Date('2024-01-15'),
          totalAmount: 1000,
        },
      ] as any[];

      orderRepository.findWithFilters.mockResolvedValue({
        data: mockOrders,
        total: 1,
      });

      const result = await service.exportToCSV(query);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toContain('Order Number');
      expect(result.toString()).toContain('ORD-001');
      expect(result.toString()).toContain('Customer A');
    });
  });

  describe('findByCustomer', () => {
    it('should return orders for a specific customer', async () => {
      const mockOrders = [
        { id: 'order-1', customerId: mockCustomerId },
        { id: 'order-2', customerId: mockCustomerId },
      ] as CustomerOrder[];

      orderRepository.findByCustomer.mockResolvedValue(mockOrders);

      const result = await service.findByCustomer(mockCustomerId);

      expect(result).toEqual(mockOrders);
      expect(orderRepository.findByCustomer).toHaveBeenCalledWith(mockCustomerId);
    });
  });

  describe('findByOrderNumber', () => {
    it('should return order by order number', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
      } as CustomerOrder;

      orderRepository.findByOrderNumber.mockResolvedValue(mockOrder);

      const result = await service.findByOrderNumber('ORD-001');

      expect(result).toBe(mockOrder);
      expect(orderRepository.findByOrderNumber).toHaveBeenCalledWith('ORD-001');
    });

    it('should return null if order not found', async () => {
      orderRepository.findByOrderNumber.mockResolvedValue(null);

      const result = await service.findByOrderNumber('NON-EXISTENT');

      expect(result).toBeNull();
    });
  });
});