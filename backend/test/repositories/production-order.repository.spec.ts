import { Test, TestingModule } from '@nestjs/testing';
import { Repository, Between } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { ProductionOrderRepository } from '../../src/repositories/production-order.repository';
import { ProductionOrder, ProductionOrderStatus } from '../../src/entities/production-order.entity';
import { mockRepository, mockClsService, createMockQueryBuilder, createTestEntity } from './repository-test.helper';

describe('ProductionOrderRepository', () => {
  let repository: ProductionOrderRepository;
  let typeOrmRepository: jest.Mocked<Repository<ProductionOrder>>;
  let clsService: jest.Mocked<ClsService>;

  const createProductionOrder = (overrides = {}): ProductionOrder => createTestEntity({
    orderNumber: 'PO-2024-001',
    quantityOrdered: 1000,
    quantityProduced: 0,
    quantityScrapped: 0,
    status: ProductionOrderStatus.PLANNED,
    priority: 5,
    productId: 'product-id',
    unitOfMeasureId: 'uom-id',
    customerOrderId: 'customer-order-id',
    plannedStartDate: new Date('2024-01-01'),
    plannedEndDate: new Date('2024-01-15'),
    ...overrides,
  }) as ProductionOrder;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionOrderRepository,
        {
          provide: getRepositoryToken(ProductionOrder),
          useValue: mockRepository(),
        },
        {
          provide: ClsService,
          useValue: mockClsService(),
        },
      ],
    }).compile();

    repository = module.get<ProductionOrderRepository>(ProductionOrderRepository);
    typeOrmRepository = module.get(getRepositoryToken(ProductionOrder));
    clsService = module.get(ClsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByOrderNumber', () => {
    it('should find production order by number', async () => {
      const order = createProductionOrder();
      typeOrmRepository.findOne.mockResolvedValue(order);

      const result = await repository.findByOrderNumber('PO-2024-001');

      expect(result).toEqual(order);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { orderNumber: 'PO-2024-001', tenantId: 'test-tenant-id' },
        relations: ['product', 'unitOfMeasure', 'workOrders'],
      });
    });
  });

  describe('findByStatus', () => {
    it('should find production orders by status', async () => {
      const orders = [createProductionOrder({ status: ProductionOrderStatus.IN_PROGRESS })];
      typeOrmRepository.find.mockResolvedValue(orders);

      const result = await repository.findByStatus(ProductionOrderStatus.IN_PROGRESS);

      expect(result).toEqual(orders);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { status: ProductionOrderStatus.IN_PROGRESS, tenantId: 'test-tenant-id' },
        relations: ['product', 'unitOfMeasure'],
        order: { priority: 'DESC', plannedStartDate: 'ASC' },
      });
    });
  });

  describe('findByProduct', () => {
    it('should find production orders by product', async () => {
      const orders = [createProductionOrder()];
      typeOrmRepository.find.mockResolvedValue(orders);

      const result = await repository.findByProduct('product-id');

      expect(result).toEqual(orders);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { productId: 'product-id', tenantId: 'test-tenant-id' },
        relations: ['unitOfMeasure', 'workOrders'],
        order: { plannedStartDate: 'DESC' },
      });
    });
  });

  describe('findByDateRange', () => {
    it('should find production orders in date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const orders = [createProductionOrder()];
      typeOrmRepository.find.mockResolvedValue(orders);

      const result = await repository.findByDateRange(startDate, endDate);

      expect(result).toEqual(orders);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          plannedStartDate: Between(startDate, endDate),
          tenantId: 'test-tenant-id',
        },
        relations: ['product', 'unitOfMeasure'],
        order: { plannedStartDate: 'ASC' },
      });
    });
  });

  describe('findHighPriority', () => {
    it('should find high priority orders', async () => {
      const orders = [createProductionOrder({ priority: 9 })];
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(orders);
      typeOrmRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.findHighPriority(8);

      expect(result).toEqual(orders);
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('order.product', 'product');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('order.unitOfMeasure', 'uom');
      expect(queryBuilder.where).toHaveBeenCalledWith('order.tenantId = :tenantId', { tenantId: 'test-tenant-id' });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('order.priority >= :minPriority', { minPriority: 8 });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('order.status NOT IN (:...statuses)', {
        statuses: [ProductionOrderStatus.COMPLETED, ProductionOrderStatus.CANCELLED],
      });
    });

    it('should use default minimum priority of 8', async () => {
      const orders = [createProductionOrder({ priority: 8 })];
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(orders);
      typeOrmRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.findHighPriority();

      expect(result).toEqual(orders);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('order.priority >= :minPriority', { minPriority: 8 });
    });
  });

  describe('updateProgress', () => {
    it('should update production order progress', async () => {
      const order = createProductionOrder({ quantityProduced: 500, quantityScrapped: 10 });
      typeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      typeOrmRepository.findOne.mockResolvedValue(order);

      const result = await repository.updateProgress('order-id', 500, 10);

      expect(result).toEqual(order);
      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: 'order-id', tenantId: 'test-tenant-id' },
        { quantityProduced: 500, quantityScrapped: 10 }
      );
    });
  });

  describe('startProduction', () => {
    it('should start production', async () => {
      const order = createProductionOrder({ status: ProductionOrderStatus.IN_PROGRESS });
      typeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      typeOrmRepository.findOne.mockResolvedValue(order);

      const result = await repository.startProduction('order-id');

      expect(result).toEqual(order);
      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: 'order-id', tenantId: 'test-tenant-id' },
        {
          status: ProductionOrderStatus.IN_PROGRESS,
          actualStartDate: expect.any(Date),
        }
      );
    });
  });

  describe('completeProduction', () => {
    it('should complete production', async () => {
      const order = createProductionOrder({ 
        status: ProductionOrderStatus.COMPLETED,
        quantityProduced: 950,
        quantityScrapped: 50 
      });
      typeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      typeOrmRepository.findOne.mockResolvedValue(order);

      const result = await repository.completeProduction('order-id', 950, 50);

      expect(result).toEqual(order);
      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: 'order-id', tenantId: 'test-tenant-id' },
        {
          status: ProductionOrderStatus.COMPLETED,
          actualEndDate: expect.any(Date),
          quantityProduced: 950,
          quantityScrapped: 50,
        }
      );
    });
  });

  describe('calculateCompletionPercentage', () => {
    it('should calculate completion percentage', async () => {
      const order = createProductionOrder({ quantityOrdered: 1000, quantityProduced: 750 });
      typeOrmRepository.findOne.mockResolvedValue(order);

      const result = await repository.calculateCompletionPercentage('order-id');

      expect(result).toBe(75);
    });

    it('should return 0 if order not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.calculateCompletionPercentage('order-id');

      expect(result).toBe(0);
    });

    it('should return 0 if quantity ordered is 0', async () => {
      const order = createProductionOrder({ quantityOrdered: 0, quantityProduced: 0 });
      typeOrmRepository.findOne.mockResolvedValue(order);

      const result = await repository.calculateCompletionPercentage('order-id');

      expect(result).toBe(0);
    });
  });

  describe('findByCustomerOrder', () => {
    it('should find production orders by customer order', async () => {
      const orders = [createProductionOrder()];
      typeOrmRepository.find.mockResolvedValue(orders);

      const result = await repository.findByCustomerOrder('customer-order-id');

      expect(result).toEqual(orders);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { customerOrderId: 'customer-order-id', tenantId: 'test-tenant-id' },
        relations: ['product', 'unitOfMeasure'],
        order: { priority: 'DESC' },
      });
    });
  });
});