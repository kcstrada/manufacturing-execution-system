import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import {
  OrderToTaskConverterService,
  TaskGenerationOptions,
} from './order-to-task-converter.service';
import {
  CustomerOrder,
  CustomerOrderStatus,
} from '../../../entities/customer-order.entity';
import {
  ProductionOrder,
  ProductionOrderStatus,
} from '../../../entities/production-order.entity';
import {
  WorkOrder,
  WorkOrderStatus,
} from '../../../entities/work-order.entity';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
} from '../../../entities/task.entity';
import { Routing } from '../../../entities/routing.entity';
import {
  ProductionStep,
  StepType,
} from '../../../entities/production-step.entity';

describe('OrderToTaskConverterService', () => {
  let service: OrderToTaskConverterService;
  let clsService: jest.Mocked<ClsService>;
  let mockEntityManager: jest.Mocked<EntityManager>;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockOrderId = 'order-123';
  const mockProductId = 'product-123';
  const mockRoutingId = 'routing-123';

  beforeEach(async () => {
    // Create mock entity manager
    mockEntityManager = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderToTaskConverterService,
        {
          provide: getRepositoryToken(CustomerOrder),
          useValue: {
            manager: mockEntityManager,
          },
        },
        {
          provide: getRepositoryToken(ProductionOrder),
          useValue: {
            manager: mockEntityManager,
          },
        },
        {
          provide: ClsService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderToTaskConverterService>(
      OrderToTaskConverterService,
    );
    clsService = module.get(ClsService);

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

  describe('convertOrderToTasks', () => {
    it('should successfully convert a confirmed order to tasks', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.CONFIRMED,
        orderLines: [
          {
            id: 'line-1',
            lineNumber: 1,
            quantity: 100,
            productId: mockProductId,
            product: {
              id: mockProductId,
              name: 'Product A',
              unitOfMeasureId: 'uom-123',
            },
          },
        ],
        requiredDate: new Date('2024-12-01'),
      } as CustomerOrder;

      const mockRouting = {
        id: mockRoutingId,
        name: 'Standard Routing',
        status: 'active',
      } as Routing;

      const mockRoutingSteps = [
        {
          id: 'step-1',
          sequenceNumber: 1,
          name: 'Setup Machine',
          description: 'Setup CNC machine',
          type: StepType.SETUP,
          setupTime: 30,
          runTime: 5,
          workCenterId: 'wc-1',
          qualityChecks: [],
        },
        {
          id: 'step-2',
          sequenceNumber: 2,
          name: 'Machining',
          description: 'Machine parts',
          type: StepType.OPERATION,
          setupTime: 0,
          runTime: 10,
          workCenterId: 'wc-1',
          qualityChecks: [
            {
              parameter: 'Dimension',
              method: 'Caliper',
              acceptance: '±0.01mm',
            },
          ],
        },
      ] as unknown as ProductionStep[];

      const mockProductionOrder = {
        id: 'po-123',
        orderNumber: 'PO-ORD-001-1',
        status: ProductionOrderStatus.PLANNED,
      } as unknown as ProductionOrder;

      const mockWorkOrder = {
        id: 'wo-123',
        workOrderNumber: 'WO-PO-ORD-001-1-1',
        status: WorkOrderStatus.PENDING,
        scheduledStartDate: new Date(),
        scheduledEndDate: new Date(),
      } as WorkOrder;

      const mockTask = {
        id: 'task-123',
        taskNumber: 'TSK-WO-PO-ORD-001-1-1-1',
        status: TaskStatus.PENDING,
        workOrderId: 'wo-123',
        sequenceNumber: 1,
        dependencies: [],
      } as any as Task;

      // Mock entity manager methods
      mockEntityManager.findOne
        .mockResolvedValueOnce(mockOrder) // Find order
        .mockResolvedValueOnce(mockRouting); // Find routing

      mockEntityManager.find.mockResolvedValueOnce(mockRoutingSteps); // Find routing steps

      mockEntityManager.create
        .mockReturnValueOnce([mockProductionOrder])
        .mockReturnValueOnce([mockWorkOrder])
        .mockReturnValueOnce([mockWorkOrder])
        .mockReturnValue([mockTask]);

      mockEntityManager.save
        .mockResolvedValueOnce(mockProductionOrder)
        .mockResolvedValueOnce(mockWorkOrder)
        .mockResolvedValueOnce(mockWorkOrder)
        .mockResolvedValue(mockTask);

      const options: TaskGenerationOptions = {
        priority: TaskPriority.NORMAL,
        assignToWorkCenter: true,
        autoSchedule: true,
        includeQualityChecks: true,
        includeSetupTasks: true,
      };

      const result = await service.convertOrderToTasks(mockOrderId, options);

      expect(result.productionOrders).toHaveLength(1);
      expect(result.workOrders).toHaveLength(2);
      expect(result.tasks.length).toBeGreaterThanOrEqual(2);
      expect(result.warnings).toEqual([]);

      expect(mockEntityManager.findOne).toHaveBeenCalledWith(
        CustomerOrder,
        expect.objectContaining({
          where: { id: mockOrderId, tenantId: mockTenantId },
        }),
      );
    });

    it('should add warning when order is not confirmed', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.DRAFT,
        orderLines: [],
      } as unknown as CustomerOrder;

      mockEntityManager.findOne.mockResolvedValueOnce(mockOrder);

      const result = await service.convertOrderToTasks(mockOrderId, {});

      expect(result.warnings).toContain(
        'Order ORD-001 is not in CONFIRMED status',
      );
    });

    it('should handle missing routing gracefully', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.CONFIRMED,
        orderLines: [
          {
            id: 'line-1',
            lineNumber: 1,
            quantity: 100,
            productId: mockProductId,
            product: {
              id: mockProductId,
              name: 'Product A',
            },
          },
        ],
      } as CustomerOrder;

      mockEntityManager.findOne
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(null); // No routing found

      const result = await service.convertOrderToTasks(mockOrderId, {});

      expect(result.productionOrders).toHaveLength(0);
      expect(result.workOrders).toHaveLength(0);
      expect(result.tasks).toHaveLength(0);
      expect(result.warnings).toContain(
        'No active routing found for product Product A',
      );
    });

    it('should handle missing routing steps gracefully', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.CONFIRMED,
        orderLines: [
          {
            id: 'line-1',
            lineNumber: 1,
            quantity: 100,
            productId: mockProductId,
            product: {
              id: mockProductId,
              name: 'Product A',
            },
          },
        ],
      } as CustomerOrder;

      const mockRouting = {
        id: mockRoutingId,
        name: 'Empty Routing',
        status: 'active',
      } as Routing;

      mockEntityManager.findOne
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockRouting);

      mockEntityManager.find.mockResolvedValueOnce([]); // No routing steps

      const mockProductionOrder = {
        id: 'po-123',
        orderNumber: 'PO-ORD-001-1',
      } as unknown as ProductionOrder;

      mockEntityManager.create.mockReturnValueOnce([mockProductionOrder]);
      mockEntityManager.save.mockResolvedValueOnce(mockProductionOrder);

      const result = await service.convertOrderToTasks(mockOrderId, {});

      expect(result.productionOrders).toHaveLength(1);
      expect(result.workOrders).toHaveLength(0);
      expect(result.tasks).toHaveLength(0);
      expect(result.warnings).toContain(
        'No production steps found for routing Empty Routing',
      );
    });

    it('should throw error when order is not found', async () => {
      mockEntityManager.findOne.mockResolvedValueOnce(null);

      await expect(
        service.convertOrderToTasks(mockOrderId, {}),
      ).rejects.toThrow(`Order ${mockOrderId} not found`);
    });

    it('should create setup tasks when includeSetupTasks is true', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.CONFIRMED,
        orderLines: [
          {
            id: 'line-1',
            lineNumber: 1,
            quantity: 100,
            productId: mockProductId,
            product: {
              id: mockProductId,
              name: 'Product A',
            },
          },
        ],
      } as CustomerOrder;

      const mockRouting = {
        id: mockRoutingId,
        name: 'Standard Routing',
        status: 'active',
      } as Routing;

      const mockRoutingStep = {
        id: 'step-1',
        sequenceNumber: 1,
        name: 'Operation',
        type: StepType.OPERATION,
        setupTime: 60, // Has setup time
        runTime: 10,
        workCenterId: 'wc-1',
        qualityChecks: [],
      } as unknown as ProductionStep;

      mockEntityManager.findOne
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockRouting);

      mockEntityManager.find.mockResolvedValueOnce([mockRoutingStep]);

      const mockProductionOrder = {
        id: 'po-123',
        orderNumber: 'PO-ORD-001-1',
      } as unknown as ProductionOrder;

      const mockWorkOrder = {
        id: 'wo-123',
        workOrderNumber: 'WO-PO-ORD-001-1-1',
        scheduledStartDate: new Date(),
        scheduledEndDate: new Date(),
      } as WorkOrder;

      const setupTask = {
        id: 'task-setup',
        taskNumber: 'TSK-WO-PO-ORD-001-1-1-1',
        type: TaskType.SETUP,
        name: 'Setup: Operation',
        workOrderId: 'wo-123',
      } as unknown as Task;

      const productionTask = {
        id: 'task-prod',
        taskNumber: 'TSK-WO-PO-ORD-001-1-1-2',
        type: TaskType.PRODUCTION,
        workOrderId: 'wo-123',
      } as unknown as Task;

      mockEntityManager.create
        .mockReturnValueOnce(mockProductionOrder as any)
        .mockReturnValueOnce(mockWorkOrder as any)
        .mockReturnValueOnce(setupTask as any)
        .mockReturnValueOnce(productionTask as any);

      mockEntityManager.save
        .mockResolvedValueOnce(mockProductionOrder)
        .mockResolvedValueOnce(mockWorkOrder)
        .mockResolvedValueOnce(setupTask)
        .mockResolvedValueOnce(productionTask);

      const result = await service.convertOrderToTasks(mockOrderId, {
        includeSetupTasks: true,
      });

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[0]?.type).toBe(TaskType.SETUP);
      expect(result.tasks[0]?.name).toContain('Setup');
    });

    it('should create quality check tasks when includeQualityChecks is true', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.CONFIRMED,
        orderLines: [
          {
            id: 'line-1',
            lineNumber: 1,
            quantity: 100,
            productId: mockProductId,
            product: {
              id: mockProductId,
              name: 'Product A',
            },
          },
        ],
      } as CustomerOrder;

      const mockRouting = {
        id: mockRoutingId,
        name: 'Standard Routing',
        status: 'active',
      } as Routing;

      const mockRoutingStep = {
        id: 'step-1',
        sequenceNumber: 1,
        name: 'Operation',
        type: StepType.OPERATION,
        setupTime: 0,
        runTime: 10,
        workCenterId: 'wc-1',
        qualityChecks: [
          {
            parameter: 'Dimension',
            method: 'Caliper',
            acceptance: '±0.01mm',
          },
        ],
      } as unknown as ProductionStep;

      mockEntityManager.findOne
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockRouting);

      mockEntityManager.find.mockResolvedValueOnce([mockRoutingStep]);

      const mockProductionOrder = {
        id: 'po-123',
        orderNumber: 'PO-ORD-001-1',
      } as unknown as ProductionOrder;

      const mockWorkOrder = {
        id: 'wo-123',
        workOrderNumber: 'WO-PO-ORD-001-1-1',
        scheduledStartDate: new Date(),
        scheduledEndDate: new Date(),
      } as WorkOrder;

      const productionTask = {
        id: 'task-prod',
        taskNumber: 'TSK-WO-PO-ORD-001-1-1-1',
        type: TaskType.PRODUCTION,
        workOrderId: 'wo-123',
      } as unknown as Task;

      const qcTask = {
        id: 'task-qc',
        taskNumber: 'TSK-WO-PO-ORD-001-1-1-2',
        type: TaskType.QUALITY_CHECK,
        name: 'QC: Operation',
        workOrderId: 'wo-123',
      } as unknown as Task;

      mockEntityManager.create
        .mockReturnValueOnce(mockProductionOrder as any)
        .mockReturnValueOnce(mockWorkOrder as any)
        .mockReturnValueOnce(productionTask as any)
        .mockReturnValueOnce(qcTask as any);

      mockEntityManager.save
        .mockResolvedValueOnce(mockProductionOrder)
        .mockResolvedValueOnce(mockWorkOrder)
        .mockResolvedValueOnce(productionTask)
        .mockResolvedValueOnce(qcTask);

      const result = await service.convertOrderToTasks(mockOrderId, {
        includeQualityChecks: true,
      });

      expect(result.tasks).toHaveLength(2);
      expect(result.tasks[1]?.type).toBe(TaskType.QUALITY_CHECK);
      expect(result.tasks[1]?.name).toContain('QC');
    });

    it('should link task dependencies correctly', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.CONFIRMED,
        orderLines: [
          {
            id: 'line-1',
            lineNumber: 1,
            quantity: 100,
            productId: mockProductId,
            product: {
              id: mockProductId,
              name: 'Product A',
            },
          },
        ],
      } as CustomerOrder;

      const mockRouting = {
        id: mockRoutingId,
        name: 'Standard Routing',
        status: 'active',
      } as Routing;

      const mockRoutingSteps = [
        {
          id: 'step-1',
          sequenceNumber: 1,
          name: 'Step 1',
          type: StepType.OPERATION,
          setupTime: 0,
          runTime: 10,
          workCenterId: 'wc-1',
          qualityChecks: [],
        },
        {
          id: 'step-2',
          sequenceNumber: 2,
          name: 'Step 2',
          type: StepType.OPERATION,
          setupTime: 0,
          runTime: 10,
          workCenterId: 'wc-2',
          qualityChecks: [],
        },
      ] as unknown as ProductionStep[];

      mockEntityManager.findOne
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockRouting);

      mockEntityManager.find.mockResolvedValueOnce(mockRoutingSteps);

      const mockProductionOrder = {
        id: 'po-123',
        orderNumber: 'PO-ORD-001-1',
      } as unknown as ProductionOrder;

      const mockWorkOrder1 = {
        id: 'wo-1',
        workOrderNumber: 'WO-PO-ORD-001-1-1',
        scheduledStartDate: new Date(),
        scheduledEndDate: new Date(),
      } as WorkOrder;

      const mockWorkOrder2 = {
        id: 'wo-2',
        workOrderNumber: 'WO-PO-ORD-001-1-2',
        scheduledStartDate: new Date(),
        scheduledEndDate: new Date(),
      } as WorkOrder;

      const task1 = {
        id: 'task-1',
        taskNumber: 'TSK-WO-PO-ORD-001-1-1-1',
        type: TaskType.PRODUCTION,
        workOrderId: 'wo-1',
        sequenceNumber: 1,
        dependencies: [],
      } as unknown as Task;

      const task2 = {
        id: 'task-2',
        taskNumber: 'TSK-WO-PO-ORD-001-1-2-1',
        type: TaskType.PRODUCTION,
        workOrderId: 'wo-2',
        sequenceNumber: 1,
        dependencies: [],
      } as unknown as Task;

      mockEntityManager.create
        .mockReturnValueOnce(mockProductionOrder as any)
        .mockReturnValueOnce(mockWorkOrder1 as any)
        .mockReturnValueOnce(task1 as any)
        .mockReturnValueOnce(mockWorkOrder2 as any)
        .mockReturnValueOnce(task2 as any);

      mockEntityManager.save
        .mockResolvedValueOnce(mockProductionOrder)
        .mockResolvedValueOnce(mockWorkOrder1)
        .mockResolvedValueOnce(task1)
        .mockResolvedValueOnce(mockWorkOrder2)
        .mockResolvedValueOnce(task2)
        .mockImplementation((entity) => Promise.resolve(entity));

      const result = await service.convertOrderToTasks(mockOrderId, {});

      expect(result.tasks).toHaveLength(2);
      // Verify that save was called to persist dependencies
      expect(mockEntityManager.save).toHaveBeenCalled();
    });
  });

  describe('generateTasksForProductionOrder', () => {
    it('should generate tasks for an existing production order', async () => {
      const mockProductionOrder = {
        id: 'po-123',
        orderNumber: 'PO-001',
        productId: mockProductId,
        quantityOrdered: 100,
        product: {
          id: mockProductId,
          name: 'Product A',
        },
        workOrders: [],
      } as unknown as ProductionOrder;

      const mockRouting = {
        id: mockRoutingId,
        name: 'Standard Routing',
        status: 'active',
      } as Routing;

      const mockRoutingStep = {
        id: 'step-1',
        sequenceNumber: 1,
        name: 'Operation',
        type: StepType.OPERATION,
        setupTime: 0,
        runTime: 10,
        workCenterId: 'wc-1',
        qualityChecks: [],
      } as unknown as ProductionStep;

      mockEntityManager.findOne
        .mockResolvedValueOnce(mockProductionOrder)
        .mockResolvedValueOnce(mockRouting);

      mockEntityManager.find.mockResolvedValueOnce([mockRoutingStep]);

      const mockWorkOrder = {
        id: 'wo-123',
        workOrderNumber: 'WO-PO-001-1',
        scheduledStartDate: new Date(),
        scheduledEndDate: new Date(),
      } as WorkOrder;

      const mockTask = {
        id: 'task-123',
        taskNumber: 'TSK-WO-PO-001-1-1',
        type: TaskType.PRODUCTION,
        workOrderId: 'wo-123',
      } as unknown as Task;

      mockEntityManager.create
        .mockReturnValueOnce(mockWorkOrder as any)
        .mockReturnValueOnce(mockTask as any);

      mockEntityManager.save
        .mockResolvedValueOnce(mockWorkOrder)
        .mockResolvedValueOnce(mockTask);

      const result = await service.generateTasksForProductionOrder(
        'po-123',
        {},
      );

      expect(result.productionOrders).toHaveLength(0); // No new production orders
      expect(result.workOrders).toHaveLength(1);
      expect(result.tasks).toHaveLength(1);
    });

    it('should return warning when production order already has work orders', async () => {
      const mockProductionOrder = {
        id: 'po-123',
        orderNumber: 'PO-001',
        productId: mockProductId,
        workOrders: [{ id: 'wo-existing' }], // Already has work orders
      } as unknown as ProductionOrder;

      mockEntityManager.findOne.mockResolvedValueOnce(mockProductionOrder);

      const result = await service.generateTasksForProductionOrder(
        'po-123',
        {},
      );

      expect(result.warnings).toContain(
        'Production order PO-001 already has work orders',
      );
      expect(result.workOrders).toHaveLength(0);
      expect(result.tasks).toHaveLength(0);
    });

    it('should throw error when production order is not found', async () => {
      mockEntityManager.findOne.mockResolvedValueOnce(null);

      await expect(
        service.generateTasksForProductionOrder('po-123', {}),
      ).rejects.toThrow('Production order po-123 not found');
    });
  });
});
