import { Test, TestingModule } from '@nestjs/testing';
import { Repository, LessThan } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { InventoryRepository } from '../../src/repositories/inventory.repository';
import {
  Inventory,
  InventoryStatus,
} from '../../src/entities/inventory.entity';
import {
  mockRepository,
  mockClsService,
  createMockQueryBuilder,
  createTestEntity,
} from './repository-test.helper';

describe('InventoryRepository', () => {
  let repository: InventoryRepository;
  let typeOrmRepository: jest.Mocked<Repository<Inventory>>;
  let clsService: jest.Mocked<ClsService>;

  const createInventory = (overrides = {}): Inventory =>
    createTestEntity({
      warehouseCode: 'WH-001',
      locationCode: 'LOC-A1',
      lotNumber: 'LOT-2024-001',
      serialNumber: 'SN-12345',
      quantityOnHand: 100,
      quantityAvailable: 80,
      quantityReserved: 20,
      quantityInTransit: 0,
      status: InventoryStatus.AVAILABLE,
      productId: 'product-id',
      unitCost: 10.5,
      expirationDate: new Date('2025-01-01'),
      ...overrides,
    }) as Inventory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryRepository,
        {
          provide: getRepositoryToken(Inventory),
          useValue: mockRepository(),
        },
        {
          provide: ClsService,
          useValue: mockClsService(),
        },
      ],
    }).compile();

    repository = module.get<InventoryRepository>(InventoryRepository);
    typeOrmRepository = module.get(getRepositoryToken(Inventory));
    clsService = module.get(ClsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByProduct', () => {
    it('should find inventory by product', async () => {
      const inventoryItems = [createInventory()];
      typeOrmRepository.find.mockResolvedValue(inventoryItems);

      const result = await repository.findByProduct('product-id');

      expect(result).toEqual(inventoryItems);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { productId: 'product-id', tenantId: 'test-tenant-id' },
        relations: ['product'],
        order: { locationCode: 'ASC' },
      });
    });
  });

  describe('findByWarehouse', () => {
    it('should find inventory by warehouse', async () => {
      const inventoryItems = [createInventory()];
      typeOrmRepository.find.mockResolvedValue(inventoryItems);

      const result = await repository.findByWarehouse('WH-001');

      expect(result).toEqual(inventoryItems);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { warehouseCode: 'WH-001', tenantId: 'test-tenant-id' },
        relations: ['product'],
        order: { locationCode: 'ASC' },
      });
    });
  });

  describe('findByLocation', () => {
    it('should find inventory by warehouse and location', async () => {
      const inventoryItems = [createInventory()];
      typeOrmRepository.find.mockResolvedValue(inventoryItems);

      const result = await repository.findByLocation('WH-001', 'LOC-A1');

      expect(result).toEqual(inventoryItems);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          warehouseCode: 'WH-001',
          locationCode: 'LOC-A1',
          tenantId: 'test-tenant-id',
        },
        relations: ['product'],
      });
    });
  });

  describe('findByLotNumber', () => {
    it('should find inventory by lot number', async () => {
      const inventoryItems = [createInventory()];
      typeOrmRepository.find.mockResolvedValue(inventoryItems);

      const result = await repository.findByLotNumber('LOT-2024-001');

      expect(result).toEqual(inventoryItems);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { lotNumber: 'LOT-2024-001', tenantId: 'test-tenant-id' },
        relations: ['product'],
      });
    });
  });

  describe('findByStatus', () => {
    it('should find inventory by status', async () => {
      const inventoryItems = [
        createInventory({ status: InventoryStatus.QUARANTINE }),
      ];
      typeOrmRepository.find.mockResolvedValue(inventoryItems);

      const result = await repository.findByStatus(InventoryStatus.QUARANTINE);

      expect(result).toEqual(inventoryItems);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          status: InventoryStatus.QUARANTINE,
          tenantId: 'test-tenant-id',
        },
        relations: ['product'],
      });
    });
  });

  describe('findExpiredItems', () => {
    it('should find expired inventory items', async () => {
      const expiredItems = [
        createInventory({ expirationDate: new Date('2023-01-01') }),
      ];
      typeOrmRepository.find.mockResolvedValue(expiredItems);

      const result = await repository.findExpiredItems();

      expect(result).toEqual(expiredItems);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          expirationDate: expect.objectContaining({ _type: 'lessThan' }),
          tenantId: 'test-tenant-id',
        },
        relations: ['product'],
        order: { expirationDate: 'ASC' },
      });
    });
  });

  describe('findExpiringItems', () => {
    it('should find items expiring within specified days', async () => {
      const expiringItems = [createInventory()];
      typeOrmRepository.find.mockResolvedValue(expiringItems);

      const result = await repository.findExpiringItems(30);

      expect(result).toEqual(expiringItems);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          expirationDate: expect.objectContaining({ _type: 'lessThan' }),
          tenantId: 'test-tenant-id',
        },
        relations: ['product'],
        order: { expirationDate: 'ASC' },
      });
    });
  });

  describe('getAvailableQuantity', () => {
    it('should calculate total available quantity for a product', async () => {
      const inventoryItems = [
        createInventory({ quantityAvailable: 50 }),
        createInventory({ quantityAvailable: 30 }),
      ];
      typeOrmRepository.find.mockResolvedValue(inventoryItems);

      const result = await repository.getAvailableQuantity('product-id');

      expect(result).toBe(80);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          productId: 'product-id',
          status: InventoryStatus.AVAILABLE,
          tenantId: 'test-tenant-id',
        },
      });
    });

    it('should return 0 if no inventory found', async () => {
      typeOrmRepository.find.mockResolvedValue([]);

      const result = await repository.getAvailableQuantity('product-id');

      expect(result).toBe(0);
    });
  });

  describe('getTotalQuantity', () => {
    it('should calculate total quantity on hand for a product', async () => {
      const inventoryItems = [
        createInventory({ quantityOnHand: 60 }),
        createInventory({ quantityOnHand: 40 }),
      ];
      typeOrmRepository.find.mockResolvedValue(inventoryItems);

      const result = await repository.getTotalQuantity('product-id');

      expect(result).toBe(100);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { productId: 'product-id', tenantId: 'test-tenant-id' },
      });
    });
  });

  describe('reserveQuantity', () => {
    it('should reserve quantity from available inventory', async () => {
      const inventory = createInventory({
        quantityAvailable: 100,
        quantityReserved: 0,
      });
      typeOrmRepository.findOne.mockResolvedValue(inventory);
      typeOrmRepository.save.mockResolvedValue({
        ...inventory,
        quantityAvailable: 80,
        quantityReserved: 20,
      } as Inventory);

      const result = await repository.reserveQuantity(
        'product-id',
        'WH-001',
        'LOC-A1',
        20,
      );

      expect(result).toBeTruthy();
      expect(result?.quantityAvailable).toBe(80);
      expect(result?.quantityReserved).toBe(20);
      expect(typeOrmRepository.save).toHaveBeenCalled();
    });

    it('should return null if inventory not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.reserveQuantity(
        'product-id',
        'WH-001',
        'LOC-A1',
        20,
      );

      expect(result).toBeNull();
      expect(typeOrmRepository.save).not.toHaveBeenCalled();
    });

    it('should return null if insufficient quantity available', async () => {
      const inventory = createInventory({
        quantityAvailable: 10,
        quantityReserved: 0,
      });
      typeOrmRepository.findOne.mockResolvedValue(inventory);

      const result = await repository.reserveQuantity(
        'product-id',
        'WH-001',
        'LOC-A1',
        20,
      );

      expect(result).toBeNull();
      expect(typeOrmRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateQuantities', () => {
    it('should update inventory quantities', async () => {
      const inventory = createInventory();
      typeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      typeOrmRepository.findOne.mockResolvedValue(inventory);

      const result = await repository.updateQuantities('inv-id', 120, 100, 20);

      expect(result).toEqual(inventory);
      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: 'inv-id', tenantId: 'test-tenant-id' },
        { quantityOnHand: 120, quantityAvailable: 100, quantityReserved: 20 },
      );
    });

    it('should throw error if inventory not found after update', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      typeOrmRepository.findOne.mockResolvedValue(null);

      await expect(
        repository.updateQuantities('inv-id', 120, 100, 20),
      ).rejects.toThrow('Inventory not found');
    });
  });

  describe('findLowStockItems', () => {
    it('should find low stock items', async () => {
      const lowStockItems = [createInventory({ quantityOnHand: 5 })];
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(lowStockItems);
      typeOrmRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.findLowStockItems(10);

      expect(result).toEqual(lowStockItems);
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'inventory.product',
        'product',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'inventory.tenantId = :tenantId',
        { tenantId: 'test-tenant-id' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'inventory.quantityOnHand < :threshold',
        { threshold: 10 },
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'inventory.quantityOnHand',
        'ASC',
      );
    });
  });

  describe('getInventoryValuation', () => {
    it('should calculate inventory valuation', async () => {
      const valuationData = [
        { productId: 'product-1', totalValue: '1000.00' },
        { productId: 'product-2', totalValue: '2000.00' },
      ];
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getRawMany.mockResolvedValue(valuationData);
      typeOrmRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.getInventoryValuation();

      expect(result).toEqual(valuationData);
      expect(queryBuilder.select).toHaveBeenCalledWith(
        'inventory.productId',
        'productId',
      );
      expect(queryBuilder.addSelect).toHaveBeenCalledWith(
        'SUM(inventory.quantityOnHand * inventory.unitCost)',
        'totalValue',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'inventory.tenantId = :tenantId',
        { tenantId: 'test-tenant-id' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'inventory.unitCost IS NOT NULL',
      );
      expect(queryBuilder.groupBy).toHaveBeenCalledWith('inventory.productId');
    });
  });
});
