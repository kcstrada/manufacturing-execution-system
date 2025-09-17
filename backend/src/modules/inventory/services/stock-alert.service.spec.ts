import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';
import { StockAlertService } from './stock-alert.service';
import { InventoryService } from '../inventory.service';
import { Inventory } from '../../../entities/inventory.entity';
import { Product } from '../../../entities/product.entity';
import {
  StockAlert,
  AlertStatus,
  AlertSeverity,
} from '../../../entities/stock-alert.entity';

describe('StockAlertService', () => {
  let service: StockAlertService;
  let productRepository: Repository<Product>;
  let alertRepository: Repository<StockAlert>;
  let inventoryService: InventoryService;
  let eventEmitter: EventEmitter2;

  const mockProduct: Partial<Product> = {
    id: 'product-1',
    name: 'Test Product',
    sku: 'TEST-001',
    minStockLevel: 100,
    reorderPoint: 150,
    reorderQuantity: 500,
  };

  const mockAlert: Partial<StockAlert> = {
    id: 'alert-1',
    productId: 'product-1',
    severity: AlertSeverity.WARNING,
    status: AlertStatus.ACTIVE,
    currentStock: 75,
    minStockLevel: 100,
    message: 'Stock is low',
    alertedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockAlertService,
        {
          provide: getRepositoryToken(Inventory),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StockAlert),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: InventoryService,
          useValue: {
            getAvailableQuantity: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: ClsService,
          useValue: {
            get: jest.fn().mockReturnValue('test-tenant'),
          },
        },
      ],
    }).compile();

    service = module.get<StockAlertService>(StockAlertService);
    productRepository = module.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    alertRepository = module.get<Repository<StockAlert>>(
      getRepositoryToken(StockAlert),
    );
    inventoryService = module.get<InventoryService>(InventoryService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  describe('performStockCheck', () => {
    it('should identify products with low stock', async () => {
      jest
        .spyOn(productRepository, 'find')
        .mockResolvedValue([mockProduct as Product]);
      jest
        .spyOn(inventoryService, 'getAvailableQuantity')
        .mockResolvedValue(75);
      jest.spyOn(alertRepository, 'findOne').mockResolvedValue(null);
      jest
        .spyOn(alertRepository, 'create')
        .mockReturnValue(mockAlert as StockAlert);
      jest
        .spyOn(alertRepository, 'save')
        .mockResolvedValue(mockAlert as StockAlert);

      const alerts = await service.performStockCheck();

      expect(alerts).toHaveLength(1);
      expect(alerts[0]?.productId).toBe('product-1');
      expect(alerts[0]?.currentStock).toBe(75);
      expect(alerts[0]?.severity).toBe(AlertSeverity.WARNING);
      // EventEmitter.emit is only called when processAlerts is invoked, not in performStockCheck directly
    });

    it('should not create alerts for products with sufficient stock', async () => {
      jest
        .spyOn(productRepository, 'find')
        .mockResolvedValue([mockProduct as Product]);
      jest
        .spyOn(inventoryService, 'getAvailableQuantity')
        .mockResolvedValue(150);

      const alerts = await service.performStockCheck();

      expect(alerts).toHaveLength(0);
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('should update existing alert if severity changes', async () => {
      const existingAlert = {
        ...mockAlert,
        severity: AlertSeverity.LOW,
      } as StockAlert;

      jest
        .spyOn(productRepository, 'find')
        .mockResolvedValue([mockProduct as Product]);
      jest
        .spyOn(inventoryService, 'getAvailableQuantity')
        .mockResolvedValue(45); // Critical level
      jest.spyOn(alertRepository, 'findOne').mockResolvedValue(existingAlert);
      jest.spyOn(alertRepository, 'save').mockResolvedValue({
        ...existingAlert,
        severity: AlertSeverity.CRITICAL,
      } as StockAlert);

      const alerts = await service.performStockCheck();

      expect(alerts).toHaveLength(1);
      expect(alerts[0]?.severity).toBe(AlertSeverity.CRITICAL);
      // alertRepository.save is only called when processAlerts is invoked, not in performStockCheck directly
    });
  });

  describe('checkProductStock', () => {
    it('should return alert for low stock product', async () => {
      jest
        .spyOn(productRepository, 'findOne')
        .mockResolvedValue(mockProduct as Product);
      jest
        .spyOn(inventoryService, 'getAvailableQuantity')
        .mockResolvedValue(75);

      const alert = await service.checkProductStock('product-1');

      expect(alert).toBeDefined();
      expect(alert?.productId).toBe('product-1');
      expect(alert?.currentStock).toBe(75);
      expect(alert?.severity).toBe(AlertSeverity.WARNING);
    });

    it('should return null for product with sufficient stock', async () => {
      jest
        .spyOn(productRepository, 'findOne')
        .mockResolvedValue(mockProduct as Product);
      jest
        .spyOn(inventoryService, 'getAvailableQuantity')
        .mockResolvedValue(150);

      const alert = await service.checkProductStock('product-1');

      expect(alert).toBeNull();
    });

    it('should return null for product without min stock level', async () => {
      const productNoMin = { ...mockProduct, minStockLevel: undefined };
      jest
        .spyOn(productRepository, 'findOne')
        .mockResolvedValue(productNoMin as Product);

      const alert = await service.checkProductStock('product-1');

      expect(alert).toBeNull();
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge an active alert', async () => {
      const activeAlert = { ...mockAlert } as StockAlert;
      const acknowledgedAlert = {
        ...activeAlert,
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedById: 'user-1',
        acknowledgedAt: new Date(),
        notes: 'Reorder placed',
      } as unknown as StockAlert;

      jest.spyOn(alertRepository, 'findOne').mockResolvedValue(activeAlert);
      jest.spyOn(alertRepository, 'save').mockResolvedValue(acknowledgedAlert);

      const result = await service.acknowledgeAlert(
        'alert-1',
        'user-1',
        'Reorder placed',
      );

      expect(result.status).toBe(AlertStatus.ACKNOWLEDGED);
      expect(result.acknowledgedById).toBe('user-1');
      expect(result.notes).toBe('Reorder placed');
    });

    it('should throw error if alert not found', async () => {
      jest.spyOn(alertRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.acknowledgeAlert('invalid-id', 'user-1'),
      ).rejects.toThrow('Alert not found');
    });
  });

  describe('resolveAlert', () => {
    it('should resolve an alert', async () => {
      const activeAlert = { ...mockAlert } as StockAlert;
      const resolvedAlert = {
        ...activeAlert,
        status: AlertStatus.RESOLVED,
        resolvedById: 'user-1',
        resolvedAt: new Date(),
        resolution: 'Stock replenished',
      } as unknown as StockAlert;

      jest.spyOn(alertRepository, 'findOne').mockResolvedValue(activeAlert);
      jest.spyOn(alertRepository, 'save').mockResolvedValue(resolvedAlert);

      const result = await service.resolveAlert(
        'alert-1',
        'user-1',
        'Stock replenished',
      );

      expect(result.status).toBe(AlertStatus.RESOLVED);
      expect(result.resolvedById).toBe('user-1');
      expect(result.resolution).toBe('Stock replenished');
    });
  });

  describe('checkAndResolveAlerts', () => {
    it('should auto-resolve alerts when stock is replenished', async () => {
      const activeAlerts = [mockAlert as StockAlert];

      jest
        .spyOn(productRepository, 'findOne')
        .mockResolvedValue(mockProduct as Product);
      jest
        .spyOn(inventoryService, 'getAvailableQuantity')
        .mockResolvedValue(150);
      jest.spyOn(alertRepository, 'find').mockResolvedValue(activeAlerts);
      jest.spyOn(alertRepository, 'save').mockResolvedValue({
        ...mockAlert,
        status: AlertStatus.RESOLVED,
        resolvedById: 'system',
        resolution: 'Stock replenished to 150 units',
      } as unknown as StockAlert);

      await service.checkAndResolveAlerts('product-1');

      expect(alertRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AlertStatus.RESOLVED,
          resolvedById: 'system',
        }),
      );
    });

    it('should not resolve alerts if stock is still low', async () => {
      jest
        .spyOn(productRepository, 'findOne')
        .mockResolvedValue(mockProduct as Product);
      jest
        .spyOn(inventoryService, 'getAvailableQuantity')
        .mockResolvedValue(75);

      await service.checkAndResolveAlerts('product-1');

      expect(alertRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getActiveAlerts', () => {
    it('should return active alerts', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAlert]),
      };

      jest
        .spyOn(alertRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const alerts = await service.getActiveAlerts();

      expect(alerts).toHaveLength(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'alert.tenantId = :tenantId',
        { tenantId: 'test-tenant' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'alert.status = :status',
        { status: AlertStatus.ACTIVE },
      );
    });

    it('should filter by warehouse if provided', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAlert]),
      };

      jest
        .spyOn(alertRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      await service.getActiveAlerts('WAREHOUSE-01');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'alert.warehouseCode = :warehouseCode',
        { warehouseCode: 'WAREHOUSE-01' },
      );
    });
  });

  describe('getAlertStatistics', () => {
    it('should return alert statistics', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            status: AlertStatus.ACTIVE,
            severity: AlertSeverity.CRITICAL,
            count: '2',
          },
          {
            status: AlertStatus.ACTIVE,
            severity: AlertSeverity.WARNING,
            count: '3',
          },
          {
            status: AlertStatus.RESOLVED,
            severity: AlertSeverity.LOW,
            count: '5',
          },
        ]),
      };

      jest
        .spyOn(alertRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const stats = await service.getAlertStatistics();

      expect(stats.total).toBe(10);
      expect(stats.active).toBe(5);
      expect(stats.resolved).toBe(5);
      expect(stats.bySeverity[AlertSeverity.CRITICAL]).toBe(2);
      expect(stats.bySeverity[AlertSeverity.WARNING]).toBe(3);
      expect(stats.bySeverity[AlertSeverity.LOW]).toBe(5);
    });
  });
});
