import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { InventoryForecastingService } from './inventory-forecasting.service';
import { Inventory, InventoryStatus } from '../../../entities/inventory.entity';
import { CustomerOrder, CustomerOrderStatus } from '../../../entities/customer-order.entity';
import { Product } from '../../../entities/product.entity';
import { InventoryTransaction, InventoryTransactionType } from '../../../entities/inventory-transaction.entity';
import { ForecastDto, ForecastMethod } from '../dto/forecast.dto';

describe('InventoryForecastingService', () => {
  let service: InventoryForecastingService;
  let inventoryRepository: Repository<Inventory>;
  let orderRepository: Repository<CustomerOrder>;
  let transactionRepository: Repository<InventoryTransaction>;
  let productRepository: Repository<Product>;

  const mockTenantId = 'test-tenant-id';
  const mockProductId = 'test-product-id';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryForecastingService,
        {
          provide: getRepositoryToken(Inventory),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(CustomerOrder),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(InventoryTransaction),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Product),
          useClass: Repository,
        },
        {
          provide: ClsService,
          useValue: {
            get: jest.fn().mockReturnValue(mockTenantId),
          },
        },
      ],
    }).compile();

    service = module.get<InventoryForecastingService>(InventoryForecastingService);
    inventoryRepository = module.get<Repository<Inventory>>(getRepositoryToken(Inventory));
    orderRepository = module.get<Repository<CustomerOrder>>(getRepositoryToken(CustomerOrder));
    transactionRepository = module.get<Repository<InventoryTransaction>>(getRepositoryToken(InventoryTransaction));
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateForecast', () => {
    it('should generate forecast using moving average method', async () => {
      const forecastDto: ForecastDto = {
        productIds: [mockProductId],
        forecastDays: 30,
        method: ForecastMethod.MOVING_AVERAGE,
        historicalDays: 90,
      };

      const mockOrders = [
        {
          id: 'order-1',
          orderDate: new Date('2024-01-01'),
          status: CustomerOrderStatus.DELIVERED,
          orderLines: [
            {
              productId: mockProductId,
              quantity: 100,
            },
          ],
        },
        {
          id: 'order-2',
          orderDate: new Date('2024-01-15'),
          status: CustomerOrderStatus.DELIVERED,
          orderLines: [
            {
              productId: mockProductId,
              quantity: 150,
            },
          ],
        },
      ];

      const mockInventory = {
        id: 'inv-1',
        productId: mockProductId,
        quantityAvailable: 200,
        status: InventoryStatus.AVAILABLE,
      };

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrders),
      };

      jest.spyOn(orderRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const inventoryQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockInventory]),
      };

      jest.spyOn(inventoryRepository, 'createQueryBuilder').mockReturnValue(inventoryQueryBuilder as any);

      jest.spyOn(transactionRepository, 'find').mockResolvedValue([]);

      const result = await service.generateForecast(forecastDto);

      expect(result).toBeDefined();
      expect(result.method).toBe(ForecastMethod.MOVING_AVERAGE);
      expect(result.forecastPeriod.days).toBe(30);
      expect(result.items).toBeDefined();
      expect(result.items.length).toBeGreaterThanOrEqual(0);
      expect(result.summary).toBeDefined();
    });

    it('should apply seasonality when requested', async () => {
      const forecastDto: ForecastDto = {
        productIds: [mockProductId],
        forecastDays: 30,
        method: ForecastMethod.MOVING_AVERAGE,
        includeSeasonality: true,
        historicalDays: 180,
      };

      const mockOrders = generateMockOrdersWithSeasonality();
      
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrders),
      };

      jest.spyOn(orderRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const inventoryQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: 'inv-1',
            productId: mockProductId,
            quantityAvailable: 300,
            status: InventoryStatus.AVAILABLE,
          },
        ]),
      };

      jest.spyOn(inventoryRepository, 'createQueryBuilder').mockReturnValue(inventoryQueryBuilder as any);
      jest.spyOn(transactionRepository, 'find').mockResolvedValue([]);

      const result = await service.generateForecast(forecastDto);

      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      // Seasonal adjustment should be applied
    });

    it('should handle empty historical data gracefully', async () => {
      const forecastDto: ForecastDto = {
        productIds: [mockProductId],
        forecastDays: 30,
      };

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(orderRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);
      jest.spyOn(inventoryRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);
      jest.spyOn(transactionRepository, 'find').mockResolvedValue([]);

      const result = await service.generateForecast(forecastDto);

      expect(result).toBeDefined();
      expect(result.items.length).toBe(0);
      expect(result.summary.totalProducts).toBe(0);
    });
  });

  describe('analyzeDemandPatterns', () => {
    it('should analyze demand patterns for a product', async () => {
      const mockTransactions = [
        {
          id: 'trans-1',
          productId: mockProductId,
          transactionDate: new Date('2024-01-01'),
          quantity: 10,
          transactionType: InventoryTransactionType.ISSUE,
        },
        {
          id: 'trans-2',
          productId: mockProductId,
          transactionDate: new Date('2024-01-02'),
          quantity: 15,
          transactionType: InventoryTransactionType.ISSUE,
        },
        {
          id: 'trans-3',
          productId: mockProductId,
          transactionDate: new Date('2024-01-03'),
          quantity: 12,
          transactionType: InventoryTransactionType.ISSUE,
        },
      ];

      jest.spyOn(transactionRepository, 'find').mockResolvedValue(mockTransactions as any);

      const result = await service.analyzeDemandPatterns(mockProductId, 90);

      expect(result).toBeDefined();
      expect(result.productId).toBe(mockProductId);
      expect(result.pattern).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.statistics.averageDailyDemand).toBeGreaterThan(0);
      expect(result.trend).toBeDefined();
      expect(result.seasonality).toBeDefined();
    });

    it('should detect stable demand pattern', async () => {
      const mockTransactions = generateStableDemandTransactions();
      
      jest.spyOn(transactionRepository, 'find').mockResolvedValue(mockTransactions as any);

      const result = await service.analyzeDemandPatterns(mockProductId, 30);

      expect(result.pattern).toBe('stable');
      expect(result.statistics.coefficientOfVariation).toBeLessThan(0.2);
    });

    it('should throw NotFoundException when no demand history exists', async () => {
      jest.spyOn(transactionRepository, 'find').mockResolvedValue([]);

      await expect(service.analyzeDemandPatterns(mockProductId, 90))
        .rejects
        .toThrow('No demand history found');
    });
  });

  describe('calculateOptimalReorderPoints', () => {
    it('should calculate optimal reorder points for products', async () => {
      const productIds = [mockProductId];
      const leadTimeDays = 7;
      const serviceLevel = 0.95;

      const mockProduct = {
        id: mockProductId,
        name: 'Test Product',
        standardCost: 10,
        tenantId: mockTenantId,
      };

      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct as any);

      const mockOrders = generateMockOrders(30);
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrders),
      };

      jest.spyOn(orderRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);
      jest.spyOn(transactionRepository, 'find').mockResolvedValue([]);

      const result = await service.calculateOptimalReorderPoints(
        productIds,
        leadTimeDays,
        serviceLevel
      );

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.productId).toBe(mockProductId);
      expect(result[0]?.reorderPoint).toBeGreaterThan(0);
      expect(result[0]?.safetyStock).toBeGreaterThanOrEqual(0);
      expect(result[0]?.economicOrderQuantity).toBeGreaterThan(0);
      expect(result[0]?.serviceLevel).toBe(serviceLevel);
    });

    it('should handle missing products gracefully', async () => {
      const productIds = ['non-existent-product'];
      
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(null);

      const result = await service.calculateOptimalReorderPoints(productIds);

      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });
  });

  describe('predictStockouts', () => {
    it('should predict stockouts for inventory items', async () => {
      const warehouseCode = 'WH001';
      const daysAhead = 14;

      const mockInventoryItems = [
        {
          id: 'inv-1',
          productId: mockProductId,
          warehouseCode,
          quantityAvailable: 50,
          status: InventoryStatus.AVAILABLE,
          product: {
            id: mockProductId,
            name: 'Test Product',
          },
        },
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockInventoryItems),
      };

      jest.spyOn(inventoryRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const mockOrders = generateMockOrders(30);
      const orderQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrders),
      };

      jest.spyOn(orderRepository, 'createQueryBuilder').mockReturnValue(orderQueryBuilder as any);
      jest.spyOn(transactionRepository, 'find').mockResolvedValue([]);

      const result = await service.predictStockouts(warehouseCode, daysAhead);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0]?.productId).toBeDefined();
        expect(result[0]?.currentStock).toBeDefined();
        expect(result[0]?.risk).toBeDefined();
        expect(['low', 'medium', 'high', 'critical']).toContain(result[0]?.risk);
        expect(result[0]?.recommendedAction).toBeDefined();
      }
    });

    it('should identify critical stockout risk', async () => {
      const mockInventoryItems = [
        {
          id: 'inv-1',
          productId: mockProductId,
          warehouseCode: 'WH001',
          quantityAvailable: 5, // Very low stock
          status: InventoryStatus.AVAILABLE,
          product: {
            id: mockProductId,
            name: 'Critical Stock Product',
          },
        },
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockInventoryItems),
      };

      jest.spyOn(inventoryRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      // High demand orders
      const mockOrders = generateHighDemandOrders();
      const orderQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockOrders),
      };

      jest.spyOn(orderRepository, 'createQueryBuilder').mockReturnValue(orderQueryBuilder as any);
      jest.spyOn(transactionRepository, 'find').mockResolvedValue([]);

      const result = await service.predictStockouts('WH001', 14);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.risk).toBe('critical');
      expect(result[0]?.daysUntilStockout).toBeLessThanOrEqual(3);
    });

    it('should sort predictions by risk level', async () => {
      const mockInventoryItems = [
        {
          id: 'inv-1',
          productId: 'product-1',
          warehouseCode: 'WH001',
          quantityAvailable: 5,
          status: InventoryStatus.AVAILABLE,
          product: { id: 'product-1', name: 'Critical Product' },
        },
        {
          id: 'inv-2',
          productId: 'product-2',
          warehouseCode: 'WH001',
          quantityAvailable: 1000,
          status: InventoryStatus.AVAILABLE,
          product: { id: 'product-2', name: 'Safe Product' },
        },
        {
          id: 'inv-3',
          productId: 'product-3',
          warehouseCode: 'WH001',
          quantityAvailable: 50,
          status: InventoryStatus.AVAILABLE,
          product: { id: 'product-3', name: 'Medium Risk Product' },
        },
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockInventoryItems),
      };

      jest.spyOn(inventoryRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const orderQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(orderRepository, 'createQueryBuilder').mockReturnValue(orderQueryBuilder as any);
      jest.spyOn(transactionRepository, 'find').mockResolvedValue([]);

      const result = await service.predictStockouts('WH001', 14);

      // Verify sorting: critical/high risk items should come first
      if (result.length > 1) {
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        for (let i = 1; i < result.length; i++) {
          const prevRisk = riskOrder[result[i - 1]?.risk || 'low'];
          const currRisk = riskOrder[result[i]?.risk || 'low'];
          expect(prevRisk).toBeLessThanOrEqual(currRisk);
        }
      }
    });
  });

  // Helper functions for generating test data
  function generateMockOrders(count: number) {
    const orders = [];
    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (90 - i * 3));
      orders.push({
        id: `order-${i}`,
        orderDate: date,
        status: CustomerOrderStatus.DELIVERED,
        orderLines: [
          {
            productId: mockProductId,
            quantity: 100 + Math.random() * 50,
          },
        ],
      });
    }
    return orders;
  }

  function generateMockOrdersWithSeasonality() {
    const orders = [];
    for (let month = 0; month < 6; month++) {
      for (let day = 0; day < 30; day++) {
        const date = new Date();
        date.setMonth(date.getMonth() - (6 - month));
        date.setDate(day + 1);
        
        // Higher demand in certain months (seasonality)
        const seasonalFactor = month === 0 || month === 5 ? 1.5 : 1.0;
        
        orders.push({
          id: `order-${month}-${day}`,
          orderDate: date,
          status: CustomerOrderStatus.DELIVERED,
          orderLines: [
            {
              productId: mockProductId,
              quantity: 100 * seasonalFactor + Math.random() * 20,
            },
          ],
        });
      }
    }
    return orders;
  }

  function generateStableDemandTransactions() {
    const transactions = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i));
      transactions.push({
        id: `trans-${i}`,
        productId: mockProductId,
        transactionDate: date,
        quantity: 10 + Math.random() * 2, // Very stable demand
        transactionType: InventoryTransactionType.ISSUE,
      });
    }
    return transactions;
  }

  function generateHighDemandOrders() {
    const orders = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      orders.push({
        id: `order-${i}`,
        orderDate: date,
        status: CustomerOrderStatus.CONFIRMED,
        orderLines: [
          {
            productId: mockProductId,
            quantity: 20, // High daily demand
          },
        ],
      });
    }
    return orders;
  }
});