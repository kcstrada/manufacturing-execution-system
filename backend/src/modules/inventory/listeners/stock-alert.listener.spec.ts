import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bull';
import { StockAlertListener, StockAlertEvent } from './stock-alert.listener';
import { StockAlert, AlertSeverity, AlertStatus } from '../../../entities/stock-alert.entity';
import { StockLevelAlert } from '../services/stock-alert.service';

describe('StockAlertListener', () => {
  let listener: StockAlertListener;
  let notificationQueue: Queue;
  let emailQueue: Queue;

  const mockAlert: StockAlert = {
    id: 'alert-1',
    productId: 'product-1',
    warehouseCode: 'WH-01',
    severity: AlertSeverity.CRITICAL,
    status: AlertStatus.ACTIVE,
    currentStock: 25,
    minStockLevel: 100,
    message: 'Critical stock level',
    alertedAt: new Date(),
    tenantId: 'tenant-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as StockAlert;

  const mockProduct: StockLevelAlert = {
    productId: 'product-1',
    productName: 'Test Product',
    sku: 'TEST-001',
    warehouseCode: 'WH-01',
    currentStock: 25,
    minStockLevel: 100,
    reorderPoint: 150,
    reorderQuantity: 500,
    severity: AlertSeverity.CRITICAL,
    message: 'Critical stock level',
  };

  const mockEvent: StockAlertEvent = {
    alert: mockAlert,
    product: mockProduct,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockAlertListener,
        {
          provide: 'BullQueue_notifications',
          useValue: {
            add: jest.fn(),
          },
        },
        {
          provide: 'BullQueue_email',
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    listener = module.get<StockAlertListener>(StockAlertListener);
    notificationQueue = module.get<Queue>('BullQueue_notifications');
    emailQueue = module.get<Queue>('BullQueue_email');
  });

  describe('handleAlertCreated', () => {
    it('should send dashboard notification for all alerts', async () => {
      await listener.handleAlertCreated(mockEvent);

      expect(notificationQueue.add).toHaveBeenCalledWith(
        'dashboard-notification',
        expect.objectContaining({
          type: 'stock-alert',
          severity: AlertSeverity.CRITICAL,
          title: 'Stock Alert: Test Product',
          message: 'Critical stock level',
        })
      );
    });

    it('should send email notification for critical alerts', async () => {
      await listener.handleAlertCreated(mockEvent);

      expect(emailQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          template: 'stock-alert',
          subject: expect.stringContaining('CRITICAL: Low Stock Alert'),
        }),
        expect.objectContaining({
          priority: 1,
          attempts: 3,
        })
      );
    });

    it('should send email notification for high severity alerts', async () => {
      const highSeverityEvent = {
        ...mockEvent,
        alert: { ...mockAlert, severity: AlertSeverity.HIGH } as StockAlert,
        product: { ...mockProduct, severity: AlertSeverity.HIGH },
      };

      await listener.handleAlertCreated(highSeverityEvent);

      expect(emailQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          template: 'stock-alert',
          subject: expect.stringContaining('HIGH: Low Stock Alert'),
        }),
        expect.objectContaining({
          priority: 2,
        })
      );
    });

    it('should not send email for low severity alerts', async () => {
      const lowSeverityEvent = {
        ...mockEvent,
        alert: { ...mockAlert, severity: AlertSeverity.LOW } as StockAlert,
        product: { ...mockProduct, severity: AlertSeverity.LOW },
      };

      await listener.handleAlertCreated(lowSeverityEvent);

      expect(emailQueue.add).not.toHaveBeenCalled();
    });

    it('should send webhook notification if configured', async () => {
      process.env.STOCK_ALERT_WEBHOOK_URL = 'https://webhook.example.com/alerts';

      await listener.handleAlertCreated(mockEvent);

      expect(notificationQueue.add).toHaveBeenCalledWith(
        'webhook-notification',
        expect.objectContaining({
          url: 'https://webhook.example.com/alerts',
          method: 'POST',
          headers: expect.objectContaining({
            'X-Alert-Type': 'stock-alert',
            'X-Alert-Severity': AlertSeverity.CRITICAL,
          }),
        }),
        expect.objectContaining({
          attempts: 3,
        })
      );

      delete process.env.STOCK_ALERT_WEBHOOK_URL;
    });

    it('should not send webhook if not configured', async () => {
      delete process.env.STOCK_ALERT_WEBHOOK_URL;

      await listener.handleAlertCreated(mockEvent);

      expect(notificationQueue.add).not.toHaveBeenCalledWith(
        'webhook-notification',
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('handleAlertAcknowledged', () => {
    it('should update dashboard notification when alert is acknowledged', async () => {
      const acknowledgedEvent = {
        ...mockEvent,
        alert: {
          ...mockAlert,
          status: AlertStatus.ACKNOWLEDGED,
          acknowledgedBy: { id: 'user-1', name: 'John Doe' },
          acknowledgedAt: new Date(),
        },
      };

      await listener.handleAlertAcknowledged(acknowledgedEvent as any);

      expect(notificationQueue.add).toHaveBeenCalledWith(
        'update-notification',
        expect.objectContaining({
          type: 'alert-acknowledged',
          alertId: 'alert-1',
        })
      );
    });
  });

  describe('handleAlertResolved', () => {
    it('should update dashboard notification when alert is resolved', async () => {
      const resolvedEvent = {
        ...mockEvent,
        alert: {
          ...mockAlert,
          status: AlertStatus.RESOLVED,
          resolvedBy: { id: 'user-1', name: 'John Doe' },
          resolvedAt: new Date(),
          resolution: 'Stock replenished',
        },
      };

      await listener.handleAlertResolved(resolvedEvent as any);

      expect(notificationQueue.add).toHaveBeenCalledWith(
        'update-notification',
        expect.objectContaining({
          type: 'alert-resolved',
          alertId: 'alert-1',
          resolution: 'Stock replenished',
        })
      );
    });
  });

  describe('getAlertRecipients', () => {
    it('should return appropriate recipients based on severity', async () => {
      // Critical severity
      const criticalRecipients = await (listener as any).getAlertRecipients(AlertSeverity.CRITICAL);
      expect(criticalRecipients).toContain(process.env.INVENTORY_MANAGER_EMAIL || 'inventory@example.com');
      expect(criticalRecipients).toContain(process.env.WAREHOUSE_MANAGER_EMAIL || 'warehouse@example.com');
      expect(criticalRecipients).toContain(process.env.EXECUTIVE_EMAIL || 'executive@example.com');

      // High severity
      const highRecipients = await (listener as any).getAlertRecipients(AlertSeverity.HIGH);
      expect(highRecipients).toContain(process.env.INVENTORY_MANAGER_EMAIL || 'inventory@example.com');
      expect(highRecipients).toContain(process.env.WAREHOUSE_MANAGER_EMAIL || 'warehouse@example.com');
      expect(highRecipients).not.toContain(process.env.EXECUTIVE_EMAIL || 'executive@example.com');

      // Low severity
      const lowRecipients = await (listener as any).getAlertRecipients(AlertSeverity.LOW);
      expect(lowRecipients).toContain(process.env.INVENTORY_MANAGER_EMAIL || 'inventory@example.com');
      expect(lowRecipients).not.toContain(process.env.WAREHOUSE_MANAGER_EMAIL || 'warehouse@example.com');
      expect(lowRecipients).not.toContain(process.env.EXECUTIVE_EMAIL || 'executive@example.com');
    });
  });
});