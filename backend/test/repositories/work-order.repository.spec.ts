import { Test, TestingModule } from '@nestjs/testing';
import { Repository, Between, LessThan, In } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { WorkOrderRepository } from '../../src/repositories/work-order.repository';
import {
  WorkOrder,
  WorkOrderStatus,
} from '../../src/entities/work-order.entity';
import {
  mockRepository,
  mockClsService,
  createTestEntity,
} from './repository-test.helper';

describe('WorkOrderRepository', () => {
  let repository: WorkOrderRepository;
  let typeOrmRepository: jest.Mocked<Repository<WorkOrder>>;
  let clsService: jest.Mocked<ClsService>;

  const createWorkOrder = (overrides = {}): WorkOrder =>
    createTestEntity({
      workOrderNumber: 'WO-001',
      sequence: 1,
      operationDescription: 'Test Operation',
      quantityOrdered: 100,
      quantityCompleted: 0,
      quantityRejected: 0,
      setupTimeMinutes: 30,
      runTimePerUnitMinutes: 5,
      status: WorkOrderStatus.PENDING,
      productionOrderId: 'prod-order-id',
      workCenterId: 'work-center-id',
      productId: 'product-id',
      scheduledStartDate: new Date('2024-01-01'),
      scheduledEndDate: new Date('2024-01-02'),
      ...overrides,
    }) as WorkOrder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkOrderRepository,
        {
          provide: getRepositoryToken(WorkOrder),
          useValue: mockRepository(),
        },
        {
          provide: ClsService,
          useValue: mockClsService(),
        },
      ],
    }).compile();

    repository = module.get<WorkOrderRepository>(WorkOrderRepository);
    typeOrmRepository = module.get(getRepositoryToken(WorkOrder));
    clsService = module.get(ClsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByWorkOrderNumber', () => {
    it('should find work order by number', async () => {
      const workOrder = createWorkOrder();
      typeOrmRepository.findOne.mockResolvedValue(workOrder);

      const result = await repository.findByWorkOrderNumber('WO-001');

      expect(result).toEqual(workOrder);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { workOrderNumber: 'WO-001', tenantId: 'test-tenant-id' },
        relations: ['productionOrder', 'workCenter', 'product', 'assignedTo'],
      });
    });
  });

  describe('findByStatus', () => {
    it('should find work orders by status', async () => {
      const workOrders = [
        createWorkOrder({ status: WorkOrderStatus.IN_PROGRESS }),
      ];
      typeOrmRepository.find.mockResolvedValue(workOrders);

      const result = await repository.findByStatus(WorkOrderStatus.IN_PROGRESS);

      expect(result).toEqual(workOrders);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          status: WorkOrderStatus.IN_PROGRESS,
          tenantId: 'test-tenant-id',
        },
        relations: ['productionOrder', 'workCenter', 'product'],
        order: { scheduledStartDate: 'ASC' },
      });
    });
  });

  describe('findByWorkCenter', () => {
    it('should find work orders by work center', async () => {
      const workOrders = [createWorkOrder()];
      typeOrmRepository.find.mockResolvedValue(workOrders);

      const result = await repository.findByWorkCenter('work-center-id');

      expect(result).toEqual(workOrders);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { workCenterId: 'work-center-id', tenantId: 'test-tenant-id' },
        relations: ['productionOrder', 'product'],
        order: { sequence: 'ASC' },
      });
    });
  });

  describe('findByProductionOrder', () => {
    it('should find work orders by production order', async () => {
      const workOrders = [createWorkOrder()];
      typeOrmRepository.find.mockResolvedValue(workOrders);

      const result = await repository.findByProductionOrder('prod-order-id');

      expect(result).toEqual(workOrders);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          productionOrderId: 'prod-order-id',
          tenantId: 'test-tenant-id',
        },
        relations: ['workCenter', 'product'],
        order: { sequence: 'ASC' },
      });
    });
  });

  describe('findScheduledInDateRange', () => {
    it('should find work orders scheduled in date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const workOrders = [createWorkOrder()];
      typeOrmRepository.find.mockResolvedValue(workOrders);

      const result = await repository.findScheduledInDateRange(
        startDate,
        endDate,
      );

      expect(result).toEqual(workOrders);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          scheduledStartDate: Between(startDate, endDate),
          tenantId: 'test-tenant-id',
        },
        relations: ['productionOrder', 'workCenter', 'product'],
        order: { scheduledStartDate: 'ASC' },
      });
    });
  });

  describe('findOverdue', () => {
    it('should find overdue work orders', async () => {
      const workOrders = [createWorkOrder()];
      typeOrmRepository.find.mockResolvedValue(workOrders);

      const result = await repository.findOverdue();

      expect(result).toEqual(workOrders);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          scheduledEndDate: expect.objectContaining({ _type: 'lessThan' }),
          status: expect.objectContaining({
            _value: [
              WorkOrderStatus.PENDING,
              WorkOrderStatus.SCHEDULED,
              WorkOrderStatus.RELEASED,
              WorkOrderStatus.IN_PROGRESS,
            ],
          }),
          tenantId: 'test-tenant-id',
        },
        relations: ['productionOrder', 'workCenter', 'product'],
        order: { scheduledEndDate: 'ASC' },
      });
    });
  });

  describe('updateProgress', () => {
    it('should update work order progress', async () => {
      const workOrder = createWorkOrder({
        quantityCompleted: 50,
        quantityRejected: 5,
      });
      typeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      typeOrmRepository.findOne.mockResolvedValue(workOrder);

      const result = await repository.updateProgress('wo-id', 50, 5);

      expect(result).toEqual(workOrder);
      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: 'wo-id', tenantId: 'test-tenant-id' },
        { quantityCompleted: 50, quantityRejected: 5 },
      );
    });
  });

  describe('startWorkOrder', () => {
    it('should start a work order', async () => {
      const workOrder = createWorkOrder({
        status: WorkOrderStatus.IN_PROGRESS,
      });
      typeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      typeOrmRepository.findOne.mockResolvedValue(workOrder);

      const result = await repository.startWorkOrder('wo-id', 'user-id');

      expect(result).toEqual(workOrder);
      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: 'wo-id', tenantId: 'test-tenant-id' },
        {
          status: WorkOrderStatus.IN_PROGRESS,
          actualStartDate: expect.any(Date),
          assignedToId: 'user-id',
        },
      );
    });
  });

  describe('completeWorkOrder', () => {
    it('should complete a work order', async () => {
      const workOrder = createWorkOrder({
        status: WorkOrderStatus.COMPLETED,
        quantityCompleted: 95,
        quantityRejected: 5,
      });
      typeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      typeOrmRepository.findOne.mockResolvedValue(workOrder);

      const result = await repository.completeWorkOrder(
        'wo-id',
        'user-id',
        95,
        5,
      );

      expect(result).toEqual(workOrder);
      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: 'wo-id', tenantId: 'test-tenant-id' },
        {
          status: WorkOrderStatus.COMPLETED,
          actualEndDate: expect.any(Date),
          completedById: 'user-id',
          quantityCompleted: 95,
          quantityRejected: 5,
        },
      );
    });
  });

  describe('findByAssignedUser', () => {
    it('should find work orders by assigned user', async () => {
      const workOrders = [createWorkOrder({ assignedToId: 'user-id' })];
      typeOrmRepository.find.mockResolvedValue(workOrders);

      const result = await repository.findByAssignedUser('user-id');

      expect(result).toEqual(workOrders);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { assignedToId: 'user-id', tenantId: 'test-tenant-id' },
        relations: ['productionOrder', 'workCenter', 'product'],
        order: { scheduledStartDate: 'ASC' },
      });
    });
  });

  describe('calculateCompletionPercentage', () => {
    it('should calculate completion percentage', async () => {
      const workOrder = createWorkOrder({
        quantityOrdered: 100,
        quantityCompleted: 75,
      });
      typeOrmRepository.findOne.mockResolvedValue(workOrder);

      const result = await repository.calculateCompletionPercentage('wo-id');

      expect(result).toBe(75);
    });

    it('should return 0 if work order not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.calculateCompletionPercentage('wo-id');

      expect(result).toBe(0);
    });

    it('should return 0 if quantity ordered is 0', async () => {
      const workOrder = createWorkOrder({
        quantityOrdered: 0,
        quantityCompleted: 0,
      });
      typeOrmRepository.findOne.mockResolvedValue(workOrder);

      const result = await repository.calculateCompletionPercentage('wo-id');

      expect(result).toBe(0);
    });
  });
});
