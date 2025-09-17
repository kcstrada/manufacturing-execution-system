import { Test, TestingModule } from '@nestjs/testing';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { OrderService } from './order.service';
import { OrderStateMachineService } from './services/order-state-machine.service';
import { OrderToTaskConverterService } from './services/order-to-task-converter.service';
import {
  OrderRepository,
  OrderLineRepository,
} from '../../repositories/order.repository';
import {
  CustomerOrder,
  CustomerOrderLine,
  CustomerOrderStatus,
} from '../../entities/customer-order.entity';
import { GenerateTasksDto } from './dto/generate-tasks.dto';
import { TaskPriority } from '../../entities/task.entity';

describe('OrderService - Task Generation', () => {
  let service: OrderService;
  let orderRepo: jest.Mocked<Repository<CustomerOrder>>;
  let clsService: jest.Mocked<ClsService>;
  let orderToTaskConverter: jest.Mocked<OrderToTaskConverterService>;
  let queryRunner: jest.Mocked<QueryRunner>;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockOrderId = 'order-123';

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
    orderRepo = module.get(getRepositoryToken(CustomerOrder));
    clsService = module.get(ClsService);
    orderToTaskConverter = module.get(OrderToTaskConverterService);

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

  describe('generateTasks', () => {
    it('should successfully generate tasks for a confirmed order', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.CONFIRMED,
      } as CustomerOrder;

      const generateTasksDto: GenerateTasksDto = {
        priority: TaskPriority.HIGH,
        assignToWorkCenter: true,
        autoSchedule: true,
        includeQualityChecks: true,
        includeSetupTasks: false,
      };

      const conversionResult: any = {
        productionOrders: [{ id: 'po-1' }, { id: 'po-2' }],
        workOrders: [{ id: 'wo-1' }, { id: 'wo-2' }, { id: 'wo-3' }],
        tasks: [
          { id: 'task-1' },
          { id: 'task-2' },
          { id: 'task-3' },
          { id: 'task-4' },
        ],
        warnings: ['Some warning'],
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      orderToTaskConverter.convertOrderToTasks.mockResolvedValue(
        conversionResult,
      );

      const result = await service.generateTasks(mockOrderId, generateTasksDto);

      expect(result).toEqual({
        productionOrdersCount: 2,
        workOrdersCount: 3,
        tasksCount: 4,
        productionOrderIds: ['po-1', 'po-2'],
        workOrderIds: ['wo-1', 'wo-2', 'wo-3'],
        taskIds: ['task-1', 'task-2', 'task-3', 'task-4'],
        warnings: ['Some warning'],
      });

      expect(orderToTaskConverter.convertOrderToTasks).toHaveBeenCalledWith(
        mockOrderId,
        generateTasksDto,
        queryRunner.manager,
      );

      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should throw error if order is not confirmed', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.DRAFT,
      } as CustomerOrder;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);

      await expect(service.generateTasks(mockOrderId, {})).rejects.toThrow(
        BadRequestException,
      );

      expect(orderToTaskConverter.convertOrderToTasks).not.toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.CONFIRMED,
      } as CustomerOrder;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      orderToTaskConverter.convertOrderToTasks.mockRejectedValue(
        new Error('Conversion failed'),
      );

      await expect(service.generateTasks(mockOrderId, {})).rejects.toThrow(
        'Conversion failed',
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('generateProductionOrders', () => {
    it('should generate production orders with default options', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.CONFIRMED,
      } as CustomerOrder;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      jest.spyOn(service, 'generateTasks').mockResolvedValue({
        productionOrdersCount: 1,
        workOrdersCount: 1,
        tasksCount: 1,
        productionOrderIds: ['po-1'],
        workOrderIds: ['wo-1'],
        taskIds: ['task-1'],
        warnings: [],
      });
      orderRepo.save.mockResolvedValue(mockOrder);

      const result = await service.generateProductionOrders(mockOrderId);

      expect(service.generateTasks).toHaveBeenCalledWith(mockOrderId, {
        priority: TaskPriority.NORMAL,
        assignToWorkCenter: true,
        autoSchedule: true,
        includeQualityChecks: true,
        includeSetupTasks: true,
      });

      expect(result.notes).toContain('Generated 1 production orders');
      expect(orderRepo.save).toHaveBeenCalledWith(mockOrder);
    });

    it('should include warnings in order notes', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.CONFIRMED,
      } as CustomerOrder;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      jest.spyOn(service, 'generateTasks').mockResolvedValue({
        productionOrdersCount: 1,
        workOrdersCount: 2,
        tasksCount: 3,
        productionOrderIds: ['po-1'],
        workOrderIds: ['wo-1', 'wo-2'],
        taskIds: ['task-1', 'task-2', 'task-3'],
        warnings: ['Warning 1', 'Warning 2'],
      });
      orderRepo.save.mockResolvedValue(mockOrder);

      const result = await service.generateProductionOrders(mockOrderId);

      expect(result.notes).toContain('Warnings: Warning 1, Warning 2');
    });

    it('should throw error if order is not confirmed', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.PENDING,
      } as CustomerOrder;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);

      await expect(
        service.generateProductionOrders(mockOrderId),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
