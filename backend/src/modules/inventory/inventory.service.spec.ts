import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryRepository } from '../../repositories/inventory.repository';
import { InventoryTransactionRepository } from '../../repositories/inventory-transaction.repository';
import { Inventory, InventoryStatus } from '../../entities/inventory.entity';
import {
  InventoryTransaction,
  InventoryTransactionType,
} from '../../entities/inventory-transaction.entity';
import {
  CreateInventoryDto,
  AdjustInventoryDto,
  TransferInventoryDto,
} from './dto/create-inventory.dto';
import { ReserveInventoryDto } from './dto/update-inventory.dto';

describe('InventoryService', () => {
  let service: InventoryService;
  let inventoryRepository: jest.Mocked<Repository<Inventory>>;
  let transactionRepository: jest.Mocked<Repository<InventoryTransaction>>;
  let inventoryRepo: jest.Mocked<InventoryRepository>;
  let transactionRepo: jest.Mocked<InventoryTransactionRepository>;
  let clsService: jest.Mocked<ClsService>;
  let queryRunner: jest.Mocked<QueryRunner>;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockInventoryId = 'inv-123';
  const mockProductId = 'prod-123';

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
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(Inventory),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(InventoryTransaction),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: InventoryRepository,
          useValue: {
            findByProduct: jest.fn(),
            findByWarehouse: jest.fn(),
            findByLocation: jest.fn(),
            findByLotNumber: jest.fn(),
            findByStatus: jest.fn(),
            findExpiredItems: jest.fn(),
            findExpiringItems: jest.fn(),
            getAvailableQuantity: jest.fn(),
            getTotalQuantity: jest.fn(),
            reserveQuantity: jest.fn(),
            findLowStockItems: jest.fn(),
            getInventoryValuation: jest.fn(),
          },
        },
        {
          provide: InventoryTransactionRepository,
          useValue: {
            findByProduct: jest.fn(),
            findByWarehouse: jest.fn(),
            findByType: jest.fn(),
            findByReference: jest.fn(),
            findByDateRange: jest.fn(),
            getNextTransactionNumber: jest.fn(),
            calculateTotalCost: jest.fn(),
            getTransactionSummary: jest.fn(),
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
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    inventoryRepository = module.get(getRepositoryToken(Inventory));
    transactionRepository = module.get(
      getRepositoryToken(InventoryTransaction),
    );
    inventoryRepo = module.get(InventoryRepository);
    transactionRepo = module.get(InventoryTransactionRepository);
    clsService = module.get(ClsService);

    // Setup default cls service behavior
    clsService.get.mockImplementation((key?: string | symbol) => {
      if (key === 'tenantId') return mockTenantId;
      if (key === 'userId') return mockUserId;
      return undefined;
    });

    // Setup default transaction number
    transactionRepo.getNextTransactionNumber.mockResolvedValue('TRX-202501001');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create inventory item and initial transaction', async () => {
      const createDto: CreateInventoryDto = {
        productId: mockProductId,
        warehouseCode: 'WH01',
        locationCode: 'A-1-1',
        quantityOnHand: 100,
        quantityAvailable: 100,
      };

      const mockInventory = {
        id: mockInventoryId,
        ...createDto,
        tenantId: mockTenantId,
        quantityReserved: 0,
        quantityInTransit: 0,
        status: InventoryStatus.AVAILABLE,
      } as Inventory;

      const mockTransaction = {
        id: 'trans-123',
        transactionType: InventoryTransactionType.RECEIPT,
      } as InventoryTransaction;

      inventoryRepository.create.mockReturnValue(mockInventory);
      inventoryRepository.save.mockResolvedValue(mockInventory);
      transactionRepository.create.mockReturnValue(mockTransaction);
      transactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.create(createDto);

      expect(result).toEqual(mockInventory);
      expect(inventoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          tenantId: mockTenantId,
          quantityAvailable: 100,
          quantityReserved: 0,
          quantityInTransit: 0,
          status: InventoryStatus.AVAILABLE,
        }),
      );
      expect(transactionRepository.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return inventory item by id', async () => {
      const mockInventory = {
        id: mockInventoryId,
        productId: mockProductId,
        tenantId: mockTenantId,
      } as Inventory;

      inventoryRepository.findOne.mockResolvedValue(mockInventory);

      const result = await service.findOne(mockInventoryId);

      expect(result).toEqual(mockInventory);
      expect(inventoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockInventoryId, tenantId: mockTenantId },
        relations: ['product'],
      });
    });

    it('should throw NotFoundException if inventory not found', async () => {
      inventoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockInventoryId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reserveInventory', () => {
    it('should reserve inventory and create transaction', async () => {
      const reserveDto: ReserveInventoryDto = {
        quantity: 10,
        referenceType: 'order',
        referenceId: 'order-123',
      };

      const mockInventory = {
        id: mockInventoryId,
        quantityAvailable: 50,
        quantityReserved: 0,
      } as Inventory;

      const mockTransaction = {
        id: 'trans-123',
        transactionType: InventoryTransactionType.RESERVATION,
      } as InventoryTransaction;

      inventoryRepo.reserveQuantity.mockResolvedValue(mockInventory);
      transactionRepository.create.mockReturnValue(mockTransaction);
      transactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.reserveInventory(
        mockProductId,
        'WH01',
        'A-1-1',
        reserveDto,
      );

      expect(result).toEqual(mockInventory);
      expect(inventoryRepo.reserveQuantity).toHaveBeenCalledWith(
        mockProductId,
        'WH01',
        'A-1-1',
        10,
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if insufficient inventory', async () => {
      const reserveDto: ReserveInventoryDto = {
        quantity: 100,
      };

      inventoryRepo.reserveQuantity.mockResolvedValue(null);

      await expect(
        service.reserveInventory(mockProductId, 'WH01', 'A-1-1', reserveDto),
      ).rejects.toThrow(BadRequestException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('adjustInventory', () => {
    it('should adjust inventory quantity and create transaction', async () => {
      const adjustDto: AdjustInventoryDto = {
        adjustmentQuantity: -5,
        reason: 'Damaged goods',
      };

      const mockInventory = {
        id: mockInventoryId,
        productId: mockProductId,
        quantityOnHand: 100,
        quantityAvailable: 90,
        quantityReserved: 10,
      } as Inventory;

      const mockTransaction = {
        id: 'trans-123',
        transactionType: InventoryTransactionType.ADJUSTMENT,
      } as InventoryTransaction;

      inventoryRepository.findOne.mockResolvedValue(mockInventory);
      (queryRunner.manager.save as jest.Mock).mockResolvedValue({
        ...mockInventory,
        quantityOnHand: 95,
        quantityAvailable: 85,
      });
      transactionRepository.create.mockReturnValue(mockTransaction);
      transactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.adjustInventory(
        mockProductId,
        'WH01',
        'A-1-1',
        adjustDto,
      );

      expect(result).toEqual(mockTransaction);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          quantityOnHand: 95,
          quantityAvailable: 85,
        }),
      );
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if adjustment results in negative inventory', async () => {
      const adjustDto: AdjustInventoryDto = {
        adjustmentQuantity: -200,
        reason: 'Large adjustment',
      };

      const mockInventory = {
        id: mockInventoryId,
        quantityOnHand: 100,
        quantityReserved: 0,
      } as Inventory;

      inventoryRepository.findOne.mockResolvedValue(mockInventory);

      await expect(
        service.adjustInventory(mockProductId, 'WH01', 'A-1-1', adjustDto),
      ).rejects.toThrow(BadRequestException);

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('transferInventory', () => {
    it('should transfer inventory between locations', async () => {
      const transferDto: TransferInventoryDto = {
        productId: mockProductId,
        fromWarehouseCode: 'WH01',
        toWarehouseCode: 'WH02',
        fromLocation: 'A-1-1',
        toLocation: 'B-1-1',
        quantity: 20,
      };

      const sourceInventory = {
        id: 'source-inv',
        productId: mockProductId,
        quantityOnHand: 100,
        quantityAvailable: 100,
        unitCost: 10,
      } as Inventory;

      const destinationInventory = {
        id: 'dest-inv',
        productId: mockProductId,
        quantityOnHand: 50,
        quantityAvailable: 50,
      } as Inventory;

      const mockTransaction = {
        id: 'trans-123',
        transactionType: InventoryTransactionType.TRANSFER,
      } as InventoryTransaction;

      inventoryRepository.findOne
        .mockResolvedValueOnce(sourceInventory)
        .mockResolvedValueOnce(destinationInventory);
      (queryRunner.manager.save as jest.Mock).mockResolvedValue({});
      transactionRepository.create.mockReturnValue(mockTransaction);
      transactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.transferInventory(transferDto);

      expect(result).toHaveProperty('sourceTransaction');
      expect(result).toHaveProperty('destinationTransaction');
      expect(queryRunner.manager.save).toHaveBeenCalledTimes(2);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if source inventory not found', async () => {
      const transferDto: TransferInventoryDto = {
        productId: mockProductId,
        fromWarehouseCode: 'WH01',
        toWarehouseCode: 'WH02',
        quantity: 20,
      };

      inventoryRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.transferInventory(transferDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('performCycleCount', () => {
    it('should perform cycle count and update inventory', async () => {
      const mockInventory = {
        id: mockInventoryId,
        productId: mockProductId,
        quantityOnHand: 100,
        quantityAvailable: 90,
        quantityReserved: 10,
      } as Inventory;

      const mockTransaction = {
        id: 'trans-123',
        transactionType: InventoryTransactionType.CYCLE_COUNT,
      } as InventoryTransaction;

      inventoryRepository.findOne.mockResolvedValue(mockInventory);
      inventoryRepository.save.mockResolvedValue({
        ...mockInventory,
        quantityOnHand: 95,
        quantityAvailable: 85,
      } as Inventory);
      transactionRepository.create.mockReturnValue(mockTransaction);
      transactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.performCycleCount(
        mockProductId,
        'WH01',
        'A-1-1',
        95,
        'Regular cycle count',
      );

      expect(result.inventory.quantityOnHand).toBe(95);
      expect(result.transaction).toEqual(mockTransaction);
      expect(inventoryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          quantityOnHand: 95,
          quantityAvailable: 85,
        }),
      );
    });
  });

  describe('checkStockAvailability', () => {
    it('should return available true when sufficient stock', async () => {
      const items = [
        { productId: 'prod-1', quantity: 10 },
        { productId: 'prod-2', quantity: 20 },
      ];

      inventoryRepo.getAvailableQuantity
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(25);

      const result = await service.checkStockAvailability(items);

      expect(result.available).toBe(true);
      expect(result.shortages).toHaveLength(0);
    });

    it('should return shortages when insufficient stock', async () => {
      const items = [
        { productId: 'prod-1', quantity: 10 },
        { productId: 'prod-2', quantity: 20 },
      ];

      inventoryRepo.getAvailableQuantity
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(25);

      const result = await service.checkStockAvailability(items);

      expect(result.available).toBe(false);
      expect(result.shortages).toHaveLength(1);
      expect(result.shortages[0]).toEqual({
        productId: 'prod-1',
        required: 10,
        available: 5,
        shortage: 5,
      });
    });
  });

  describe('receiveStock', () => {
    it('should create new inventory if not exists', async () => {
      const mockInventory = {
        id: mockInventoryId,
        productId: mockProductId,
        warehouseCode: 'WH01',
        locationCode: 'A-1-1',
        quantityOnHand: 100,
        quantityAvailable: 100,
        quantityReserved: 0,
        quantityInTransit: 0,
        status: InventoryStatus.AVAILABLE,
        unitCost: 10,
        tenantId: mockTenantId,
      } as Inventory;

      const mockTransaction = {
        id: 'trans-123',
        transactionType: InventoryTransactionType.RECEIPT,
      } as InventoryTransaction;

      inventoryRepository.findOne.mockResolvedValue(null);
      inventoryRepository.create.mockReturnValue(mockInventory);
      inventoryRepository.save.mockResolvedValue(mockInventory);
      transactionRepository.create.mockReturnValue(mockTransaction);
      transactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.receiveStock(
        mockProductId,
        'WH01',
        'A-1-1',
        100,
        'purchase_order',
        'po-123',
        'LOT-001',
        10,
      );

      expect(result.inventory).toEqual(mockInventory);
      expect(result.transaction).toEqual(mockTransaction);
      expect(inventoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: mockProductId,
          warehouseCode: 'WH01',
          locationCode: 'A-1-1',
          quantityOnHand: 100,
          quantityAvailable: 100,
          lotNumber: 'LOT-001',
          unitCost: 10,
        }),
      );
    });

    it('should update existing inventory', async () => {
      const existingInventory = {
        id: mockInventoryId,
        productId: mockProductId,
        quantityOnHand: 50,
        quantityAvailable: 50,
        unitCost: 8,
      } as Inventory;

      const updatedInventory = {
        ...existingInventory,
        quantityOnHand: 150,
        quantityAvailable: 150,
        unitCost: 10,
      } as Inventory;

      const mockTransaction = {
        id: 'trans-123',
        transactionType: InventoryTransactionType.RECEIPT,
      } as InventoryTransaction;

      inventoryRepository.findOne.mockResolvedValue(existingInventory);
      inventoryRepository.save.mockResolvedValue(updatedInventory);
      transactionRepository.create.mockReturnValue(mockTransaction);
      transactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.receiveStock(
        mockProductId,
        'WH01',
        'A-1-1',
        100,
        undefined,
        undefined,
        undefined,
        10,
      );

      expect(result.inventory.quantityOnHand).toBe(150);
      expect(result.inventory.unitCost).toBe(10);
    });
  });

  describe('issueStock', () => {
    it('should issue stock and create transaction', async () => {
      const mockInventory = {
        id: mockInventoryId,
        productId: mockProductId,
        quantityOnHand: 100,
        quantityAvailable: 100,
        unitCost: 10,
      } as Inventory;

      const updatedInventory = {
        ...mockInventory,
        quantityOnHand: 80,
        quantityAvailable: 80,
      } as Inventory;

      const mockTransaction = {
        id: 'trans-123',
        transactionType: InventoryTransactionType.ISSUE,
      } as InventoryTransaction;

      inventoryRepository.findOne.mockResolvedValue(mockInventory);
      inventoryRepository.save.mockResolvedValue(updatedInventory);
      transactionRepository.create.mockReturnValue(mockTransaction);
      transactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.issueStock(
        mockProductId,
        'WH01',
        'A-1-1',
        20,
        'work_order',
        'wo-123',
      );

      expect(result.inventory.quantityOnHand).toBe(80);
      expect(result.transaction).toEqual(mockTransaction);
    });

    it('should throw BadRequestException if insufficient inventory', async () => {
      const mockInventory = {
        id: mockInventoryId,
        productId: mockProductId,
        quantityOnHand: 10,
        quantityAvailable: 10,
      } as Inventory;

      inventoryRepository.findOne.mockResolvedValue(mockInventory);

      await expect(
        service.issueStock(mockProductId, 'WH01', 'A-1-1', 20),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
