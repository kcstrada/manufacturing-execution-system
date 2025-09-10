import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderWorkflowListener, OrderStateChangedEvent } from './order-workflow.listener';
import { CustomerOrder, CustomerOrderStatus } from '../../../entities/customer-order.entity';
import { OrderToTaskConverterService } from '../services/order-to-task-converter.service';
import { TaskPriority } from '../../../entities/task.entity';

describe('OrderWorkflowListener', () => {
  let listener: OrderWorkflowListener;
  let orderToTaskConverter: jest.Mocked<OrderToTaskConverterService>;

  const mockOrderId = 'order-123';
  const mockOrderNumber = 'ORD-001';
  const mockUserId = 'user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderWorkflowListener,
        {
          provide: getRepositoryToken(CustomerOrder),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
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

    listener = module.get<OrderWorkflowListener>(OrderWorkflowListener);
    orderToTaskConverter = module.get(OrderToTaskConverterService) as jest.Mocked<OrderToTaskConverterService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleOrderStateChanged', () => {
    it('should handle order confirmed event and generate tasks', async () => {
      const event: OrderStateChangedEvent = {
        orderId: mockOrderId,
        orderNumber: mockOrderNumber,
        previousState: CustomerOrderStatus.DRAFT,
        currentState: CustomerOrderStatus.CONFIRMED,
        userId: mockUserId,
        timestamp: new Date(),
      };

      const mockConversionResult: any = {
        productionOrders: [{ id: 'po-1' }],
        workOrders: [{ id: 'wo-1' }, { id: 'wo-2' }],
        tasks: [{ id: 'task-1' }, { id: 'task-2' }, { id: 'task-3' }],
        warnings: [],
      };

      orderToTaskConverter.convertOrderToTasks.mockResolvedValue(mockConversionResult);

      const handleOrderConfirmedSpy = jest.spyOn(listener as any, 'handleOrderConfirmed');
      
      await listener.handleOrderStateChanged(event);

      expect(handleOrderConfirmedSpy).toHaveBeenCalledWith(event);
      expect(orderToTaskConverter.convertOrderToTasks).toHaveBeenCalledWith(
        mockOrderId,
        {
          priority: TaskPriority.NORMAL,
          assignToWorkCenter: true,
          autoSchedule: true,
          includeQualityChecks: true,
          includeSetupTasks: true,
        }
      );
    });

    it('should handle task generation failure gracefully', async () => {
      const event: OrderStateChangedEvent = {
        orderId: mockOrderId,
        orderNumber: mockOrderNumber,
        previousState: CustomerOrderStatus.DRAFT,
        currentState: CustomerOrderStatus.CONFIRMED,
        userId: mockUserId,
        timestamp: new Date(),
      };

      orderToTaskConverter.convertOrderToTasks.mockRejectedValue(
        new Error('Task generation failed')
      );

      const loggerErrorSpy = jest.spyOn((listener as any).logger, 'error');
      
      await listener.handleOrderStateChanged(event);

      expect(orderToTaskConverter.convertOrderToTasks).toHaveBeenCalled();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to generate tasks for order ORD-001')
      );
    });

    it('should log warnings from task generation', async () => {
      const event: OrderStateChangedEvent = {
        orderId: mockOrderId,
        orderNumber: mockOrderNumber,
        previousState: CustomerOrderStatus.DRAFT,
        currentState: CustomerOrderStatus.CONFIRMED,
        userId: mockUserId,
        timestamp: new Date(),
      };

      const mockConversionResult: any = {
        productionOrders: [],
        workOrders: [],
        tasks: [],
        warnings: ['No routing found', 'Missing BOM'],
      };

      orderToTaskConverter.convertOrderToTasks.mockResolvedValue(mockConversionResult);

      const loggerWarnSpy = jest.spyOn((listener as any).logger, 'warn');
      
      await listener.handleOrderStateChanged(event);

      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Warnings during task generation: No routing found, Missing BOM'
      );
    });

    it('should handle production started event', async () => {
      const event: OrderStateChangedEvent = {
        orderId: mockOrderId,
        orderNumber: mockOrderNumber,
        previousState: CustomerOrderStatus.CONFIRMED,
        currentState: CustomerOrderStatus.IN_PRODUCTION,
        userId: mockUserId,
        timestamp: new Date(),
      };

      const handleProductionStartedSpy = jest.spyOn(listener as any, 'handleProductionStarted');
      
      await listener.handleOrderStateChanged(event);

      expect(handleProductionStartedSpy).toHaveBeenCalledWith(event);
    });

    it('should handle quality control started event', async () => {
      const event: OrderStateChangedEvent = {
        orderId: mockOrderId,
        orderNumber: mockOrderNumber,
        previousState: CustomerOrderStatus.IN_PRODUCTION,
        currentState: CustomerOrderStatus.QUALITY_CONTROL,
        userId: mockUserId,
        timestamp: new Date(),
      };

      const handleQualityControlStartedSpy = jest.spyOn(listener as any, 'handleQualityControlStarted');
      
      await listener.handleOrderStateChanged(event);

      expect(handleQualityControlStartedSpy).toHaveBeenCalledWith(event);
    });

    it('should handle QC passed event', async () => {
      const event: OrderStateChangedEvent = {
        orderId: mockOrderId,
        orderNumber: mockOrderNumber,
        previousState: CustomerOrderStatus.QUALITY_CONTROL,
        currentState: CustomerOrderStatus.QC_PASSED,
        userId: mockUserId,
        timestamp: new Date(),
      };

      const handleQualityControlPassedSpy = jest.spyOn(listener as any, 'handleQualityControlPassed');
      
      await listener.handleOrderStateChanged(event);

      expect(handleQualityControlPassedSpy).toHaveBeenCalledWith(event);
    });

    it('should handle QC failed event', async () => {
      const event: OrderStateChangedEvent = {
        orderId: mockOrderId,
        orderNumber: mockOrderNumber,
        previousState: CustomerOrderStatus.QUALITY_CONTROL,
        currentState: CustomerOrderStatus.QC_FAILED,
        userId: mockUserId,
        timestamp: new Date(),
      };

      const handleQualityControlFailedSpy = jest.spyOn(listener as any, 'handleQualityControlFailed');
      
      await listener.handleOrderStateChanged(event);

      expect(handleQualityControlFailedSpy).toHaveBeenCalledWith(event);
    });

    it('should handle order shipped event', async () => {
      const event: OrderStateChangedEvent = {
        orderId: mockOrderId,
        orderNumber: mockOrderNumber,
        previousState: CustomerOrderStatus.QC_PASSED,
        currentState: CustomerOrderStatus.SHIPPED,
        userId: mockUserId,
        timestamp: new Date(),
      };

      const handleOrderShippedSpy = jest.spyOn(listener as any, 'handleOrderShipped');
      
      await listener.handleOrderStateChanged(event);

      expect(handleOrderShippedSpy).toHaveBeenCalledWith(event);
    });

    it('should handle order delivered event', async () => {
      const event: OrderStateChangedEvent = {
        orderId: mockOrderId,
        orderNumber: mockOrderNumber,
        previousState: CustomerOrderStatus.SHIPPED,
        currentState: CustomerOrderStatus.DELIVERED,
        userId: mockUserId,
        timestamp: new Date(),
      };

      const handleOrderDeliveredSpy = jest.spyOn(listener as any, 'handleOrderDelivered');
      
      await listener.handleOrderStateChanged(event);

      expect(handleOrderDeliveredSpy).toHaveBeenCalledWith(event);
    });

    it('should handle order cancelled event', async () => {
      const event: OrderStateChangedEvent = {
        orderId: mockOrderId,
        orderNumber: mockOrderNumber,
        previousState: CustomerOrderStatus.CONFIRMED,
        currentState: CustomerOrderStatus.CANCELLED,
        userId: mockUserId,
        timestamp: new Date(),
      };

      const handleOrderCancelledSpy = jest.spyOn(listener as any, 'handleOrderCancelled');
      
      await listener.handleOrderStateChanged(event);

      expect(handleOrderCancelledSpy).toHaveBeenCalledWith(event);
    });

    it('should handle order on hold event', async () => {
      const event: OrderStateChangedEvent = {
        orderId: mockOrderId,
        orderNumber: mockOrderNumber,
        previousState: CustomerOrderStatus.CONFIRMED,
        currentState: CustomerOrderStatus.ON_HOLD,
        userId: mockUserId,
        timestamp: new Date(),
      };

      const handleOrderOnHoldSpy = jest.spyOn(listener as any, 'handleOrderOnHold');
      
      await listener.handleOrderStateChanged(event);

      expect(handleOrderOnHoldSpy).toHaveBeenCalledWith(event);
    });
  });

  describe('handleProductionComplete', () => {
    it('should handle production complete event', async () => {
      const payload = {
        orderId: mockOrderId,
        orderNumber: mockOrderNumber,
      };

      const logSpy = jest.spyOn((listener as any).logger, 'log');
      
      await listener.handleProductionComplete(payload);

      expect(logSpy).toHaveBeenCalledWith(`Production complete for order ${mockOrderNumber}`);
    });
  });

  describe('handleQCComplete', () => {
    it('should handle QC passed event', async () => {
      const payload = {
        orderId: mockOrderId,
        orderNumber: mockOrderNumber,
        passed: true,
      };

      const logSpy = jest.spyOn((listener as any).logger, 'log');
      
      await listener.handleQCComplete(payload);

      expect(logSpy).toHaveBeenCalledWith(`QC passed for order ${mockOrderNumber}`);
    });

    it('should handle QC failed event with issues', async () => {
      const payload = {
        orderId: mockOrderId,
        orderNumber: mockOrderNumber,
        passed: false,
        issues: ['Issue 1', 'Issue 2'],
      };

      const warnSpy = jest.spyOn((listener as any).logger, 'warn');
      
      await listener.handleQCComplete(payload);

      expect(warnSpy).toHaveBeenCalledWith(`QC failed for order ${mockOrderNumber}: Issue 1, Issue 2`);
    });
  });

  describe('handlePaymentReceived', () => {
    it('should handle payment received event', async () => {
      const payload = {
        orderId: mockOrderId,
        amount: 1000,
      };

      const logSpy = jest.spyOn((listener as any).logger, 'log');
      
      await listener.handlePaymentReceived(payload);

      expect(logSpy).toHaveBeenCalledWith(`Payment received for order ${mockOrderId}: $1000`);
    });
  });

  describe('handleInventoryAllocated', () => {
    it('should handle successful inventory allocation', async () => {
      const payload = {
        orderId: mockOrderId,
        success: true,
      };

      const logSpy = jest.spyOn((listener as any).logger, 'log');
      
      await listener.handleInventoryAllocated(payload);

      expect(logSpy).toHaveBeenCalledWith(`Inventory allocated for order ${mockOrderId}`);
    });

    it('should handle failed inventory allocation', async () => {
      const payload = {
        orderId: mockOrderId,
        success: false,
      };

      const warnSpy = jest.spyOn((listener as any).logger, 'warn');
      
      await listener.handleInventoryAllocated(payload);

      expect(warnSpy).toHaveBeenCalledWith(`Failed to allocate inventory for order ${mockOrderId}`);
    });
  });
});