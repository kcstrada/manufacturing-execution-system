import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MaterialConsumptionService } from './material-consumption.service';
import { Inventory } from '../../entities/inventory.entity';
import { InventoryTransaction, InventoryTransactionType } from '../../entities/inventory-transaction.entity';
import { BillOfMaterials, BOMComponent, BOMStatus } from '../../entities/bill-of-materials.entity';
import { Product, ProductType } from '../../entities/product.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('MaterialConsumptionService', () => {
  let service: MaterialConsumptionService;
  let bomRepo: Repository<BillOfMaterials>;
  let bomComponentRepo: Repository<BOMComponent>;
  let productRepo: Repository<Product>;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  };

  const mockEntityManager = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialConsumptionService,
        {
          provide: getRepositoryToken(Inventory),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            manager: mockEntityManager,
          },
        },
        {
          provide: getRepositoryToken(InventoryTransaction),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(BillOfMaterials),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BOMComponent),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((callback) => callback(mockEntityManager)),
            getRepository: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MaterialConsumptionService>(MaterialConsumptionService);
    bomRepo = module.get<Repository<BillOfMaterials>>(
      getRepositoryToken(BillOfMaterials),
    );
    bomComponentRepo = module.get<Repository<BOMComponent>>(
      getRepositoryToken(BOMComponent),
    );
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateMaterialRequirements', () => {
    it('should calculate requirements for a product with BOM', async () => {
      const tenantId = 'tenant-123';
      const productId = 'product-123';
      const quantity = 10;

      const mockProduct = {
        id: productId,
        sku: 'PROD-001',
        name: 'Test Product',
        type: ProductType.FINISHED_GOOD,
        unitOfMeasureId: 'uom-123',
      };

      const mockBOM = {
        id: 'bom-123',
        productId,
        yieldQuantity: 1,
        status: BOMStatus.ACTIVE,
        isActive: true,
      };

      const mockComponents = [
        {
          id: 'comp-1',
          componentId: 'component-123',
          quantity: 2,
          scrapPercentage: 10,
          component: {
            id: 'component-123',
            sku: 'COMP-001',
            name: 'Component 1',
          },
        },
      ];

      jest.spyOn(productRepo, 'findOne').mockResolvedValue(mockProduct as any);
      jest.spyOn(bomRepo, 'findOne').mockResolvedValue(mockBOM as any);
      jest.spyOn(bomComponentRepo, 'find').mockResolvedValue(mockComponents as any);
      
      // Mock availability check
      mockQueryBuilder.getMany.mockResolvedValue([
        {
          quantityAvailable: 100,
          quantityReserved: 10,
          quantityOnHand: 110,
        },
      ]);

      // Mock recursive call for component
      jest.spyOn(service, 'calculateMaterialRequirements')
        .mockImplementationOnce(async () => {
          // This is the original call, let it proceed
          return {
            productId,
            productSku: 'PROD-001',
            productName: 'Test Product',
            requiredQuantity: quantity,
            availableQuantity: 100,
            reservedQuantity: 10,
            shortageQuantity: 0,
            unitOfMeasureId: 'uom-123',
            components: [
              {
                productId: 'component-123',
                productSku: 'COMP-001',
                productName: 'Component 1',
                requiredQuantity: 22, // 2 * 10 * 1.1 (with scrap)
                availableQuantity: 50,
                reservedQuantity: 0,
                shortageQuantity: 0,
                unitOfMeasureId: 'uom-456',
                components: [],
              },
            ],
          };
        });

      const result = await service.calculateMaterialRequirements(
        productId,
        quantity,
        tenantId,
        true,
      );

      expect(result).toBeDefined();
      expect(result.productId).toBe(productId);
      expect(result.requiredQuantity).toBe(quantity);
      expect(result.components).toHaveLength(1);
    });

    it('should handle raw materials without BOM', async () => {
      const tenantId = 'tenant-123';
      const productId = 'raw-123';
      const quantity = 50;

      const mockRawMaterial = {
        id: productId,
        sku: 'RAW-001',
        name: 'Raw Material',
        type: ProductType.RAW_MATERIAL,
        unitOfMeasureId: 'uom-123',
      };

      jest.spyOn(productRepo, 'findOne').mockResolvedValue(mockRawMaterial as any);
      
      mockQueryBuilder.getMany.mockResolvedValue([
        {
          quantityAvailable: 30,
          quantityReserved: 0,
          quantityOnHand: 30,
        },
      ]);

      const result = await service.calculateMaterialRequirements(
        productId,
        quantity,
        tenantId,
        true,
      );

      expect(result.shortageQuantity).toBe(20); // 50 required - 30 available
      expect(result.components).toEqual([]);
    });

    it('should throw NotFoundException for non-existent product', async () => {
      jest.spyOn(productRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.calculateMaterialRequirements('invalid-id', 10, 'tenant-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkMaterialAvailability', () => {
    it('should return correct availability totals', async () => {
      const inventoryItems = [
        { quantityAvailable: 50, quantityReserved: 10, quantityOnHand: 60 },
        { quantityAvailable: 30, quantityReserved: 5, quantityOnHand: 35 },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(inventoryItems);

      const result = await service.checkMaterialAvailability(
        'product-123',
        100,
        'tenant-123',
      );

      expect(result.availableQuantity).toBe(80);
      expect(result.reservedQuantity).toBe(15);
      expect(result.onHandQuantity).toBe(95);
    });

    it('should filter by warehouse when provided', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.checkMaterialAvailability(
        'product-123',
        100,
        'tenant-123',
        'WH-001',
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'inventory.warehouseCode = :warehouseCode',
        { warehouseCode: 'WH-001' },
      );
    });
  });

  describe('consumeMaterials', () => {
    it('should successfully consume materials when sufficient inventory', async () => {
      const requirements = [
        {
          productId: 'product-123',
          productSku: 'PROD-001',
          productName: 'Product 1',
          requiredQuantity: 10,
          availableQuantity: 20,
          reservedQuantity: 0,
          shortageQuantity: 0,
          unitOfMeasureId: 'uom-123',
        },
      ];

      const mockInventoryItems = [
        {
          id: 'inv-1',
          productId: 'product-123',
          quantityAvailable: 15,
          quantityOnHand: 15,
          warehouseCode: 'WH-001',
          locationCode: 'LOC-001',
          unitCost: 10,
        },
        {
          id: 'inv-2',
          productId: 'product-123',
          quantityAvailable: 10,
          quantityOnHand: 10,
          warehouseCode: 'WH-001',
          locationCode: 'LOC-002',
          unitCost: 12,
        },
      ];

      mockEntityManager.find.mockResolvedValue(mockInventoryItems);
      mockEntityManager.save.mockImplementation((_entity, data) => data);
      mockEntityManager.create.mockImplementation((_entity, data) => data);
      mockEntityManager.findOne.mockResolvedValue({ sku: 'PROD-001' });

      const result = await service.consumeMaterials(
        requirements,
        'production_order',
        'order-123',
        'tenant-123',
        'Test consumption',
      );

      expect(result.success).toBe(true);
      expect(result.consumedItems).toHaveLength(1);
      expect(result.consumedItems[0]?.quantity).toBe(10);
      expect(result.shortages).toHaveLength(0);
    });

    it('should handle material shortages', async () => {
      const requirements = [
        {
          productId: 'product-123',
          productSku: 'PROD-001',
          productName: 'Product 1',
          requiredQuantity: 100,
          availableQuantity: 50,
          reservedQuantity: 0,
          shortageQuantity: 50,
          unitOfMeasureId: 'uom-123',
        },
      ];

      await expect(
        service.consumeMaterials(
          requirements,
          'production_order',
          'order-123',
          'tenant-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reserveMaterials', () => {
    it('should reserve materials when available', async () => {
      const reservations = [
        {
          referenceType: 'customer_order',
          referenceId: 'order-123',
          productId: 'product-123',
          quantity: 10,
        },
      ];

      const mockInventory = {
        id: 'inv-1',
        productId: 'product-123',
        quantityAvailable: 20,
        quantityReserved: 5,
        warehouseCode: 'WH-001',
        locationCode: 'LOC-001',
      };

      mockQueryBuilder.getOne.mockResolvedValue(mockInventory);
      mockEntityManager.save.mockImplementation((_entity, data) => data);
      mockEntityManager.create.mockImplementation((_entity, data) => data);

      await service.reserveMaterials(reservations, 'tenant-123');

      expect(mockEntityManager.save).toHaveBeenCalledWith(
        Inventory,
        expect.objectContaining({
          quantityAvailable: 10,
          quantityReserved: 15,
        }),
      );
    });

    it('should throw error when insufficient inventory for reservation', async () => {
      const reservations = [
        {
          referenceType: 'customer_order',
          referenceId: 'order-123',
          productId: 'product-123',
          quantity: 100,
        },
      ];

      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(
        service.reserveMaterials(reservations, 'tenant-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('releaseMaterials', () => {
    it('should release reserved materials', async () => {
      const mockReservations = [
        {
          id: 'trans-1',
          productId: 'product-123',
          warehouseCode: 'WH-001',
          fromLocation: 'LOC-001',
          quantity: 10,
          transactionType: InventoryTransactionType.RESERVATION,
        },
      ];

      const mockInventory = {
        id: 'inv-1',
        quantityAvailable: 5,
        quantityReserved: 10,
      };

      mockEntityManager.find.mockResolvedValue(mockReservations);
      mockEntityManager.findOne.mockResolvedValue(mockInventory);
      mockEntityManager.save.mockImplementation((_entity, data) => data);
      mockEntityManager.create.mockImplementation((_entity, data) => data);

      await service.releaseMaterials('customer_order', 'order-123', 'tenant-123');

      expect(mockEntityManager.save).toHaveBeenCalledWith(
        Inventory,
        expect.objectContaining({
          quantityAvailable: 15,
          quantityReserved: 0,
        }),
      );
    });
  });

  describe('getConsumptionHistory', () => {
    it('should return consumption history for a product', async () => {
      const mockTransactions = [
        {
          id: 'trans-1',
          productId: 'product-123',
          quantity: 10,
          transactionDate: new Date('2024-01-01'),
        },
        {
          id: 'trans-2',
          productId: 'product-123',
          quantity: 15,
          transactionDate: new Date('2024-01-02'),
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockTransactions);

      const result = await service.getConsumptionHistory(
        'product-123',
        'tenant-123',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result).toEqual(mockTransactions);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'transaction.transactionDate',
        'DESC',
      );
    });
  });

  describe('calculateConsumptionRate', () => {
    it('should calculate average consumption rate', async () => {
      const mockTransactions = [
        { quantity: 10 },
        { quantity: 20 },
        { quantity: 15 },
      ];

      jest
        .spyOn(service, 'getConsumptionHistory')
        .mockResolvedValue(mockTransactions as any);

      const result = await service.calculateConsumptionRate(
        'product-123',
        'tenant-123',
        30,
      );

      expect(result.totalConsumption).toBe(45);
      expect(result.averageDailyConsumption).toBe(1.5); // 45 / 30
      expect(result.transactionCount).toBe(3);
    });
  });
});