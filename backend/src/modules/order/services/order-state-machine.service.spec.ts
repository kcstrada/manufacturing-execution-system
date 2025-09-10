import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';
import { OrderStateMachineService } from './order-state-machine.service';
import { OrderStateTransition } from '../../../entities/order-state-transition.entity';
import { CustomerOrder, CustomerOrderStatus } from '../../../entities/customer-order.entity';
import { WorkflowEvent } from '../interfaces/state-machine.interface';

describe('OrderStateMachineService', () => {
  let service: OrderStateMachineService;
  let transitionRepo: jest.Mocked<Repository<OrderStateTransition>>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let clsService: jest.Mocked<ClsService>;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockOrderId = 'order-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderStateMachineService,
        {
          provide: getRepositoryToken(OrderStateTransition),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
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
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderStateMachineService>(OrderStateMachineService);
    transitionRepo = module.get(getRepositoryToken(OrderStateTransition)) as jest.Mocked<Repository<OrderStateTransition>>;
    eventEmitter = module.get(EventEmitter2) as jest.Mocked<EventEmitter2>;
    clsService = module.get(ClsService) as jest.Mocked<ClsService>;

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

  describe('canTransition', () => {
    it('should allow valid transition from DRAFT to PENDING', async () => {
      const order = {
        id: mockOrderId,
        status: CustomerOrderStatus.DRAFT,
        orderLines: [{ id: 'line-1' }],
      } as CustomerOrder;

      const canTransition = await service.canTransition(order, WorkflowEvent.CONFIRM);
      expect(canTransition).toBe(true);
    });

    it('should not allow invalid transition from DELIVERED to DRAFT', async () => {
      const order = {
        id: mockOrderId,
        status: CustomerOrderStatus.DELIVERED,
      } as CustomerOrder;

      const canTransition = await service.canTransition(order, WorkflowEvent.CONFIRM);
      expect(canTransition).toBe(false);
    });

    it('should check guard conditions', async () => {
      const order = {
        id: mockOrderId,
        status: CustomerOrderStatus.DRAFT,
        orderLines: [], // No order lines
      } as unknown as CustomerOrder;

      const canTransition = await service.canTransition(order, WorkflowEvent.CONFIRM);
      expect(canTransition).toBe(false);
    });
  });

  describe('transition', () => {
    it('should successfully transition from DRAFT to PENDING', async () => {
      const order = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.DRAFT,
        orderLines: [{ id: 'line-1' }],
      } as CustomerOrder;

      transitionRepo.create.mockReturnValue({} as OrderStateTransition);
      transitionRepo.save.mockResolvedValue({} as OrderStateTransition);

      const result = await service.transition(order, WorkflowEvent.CONFIRM);

      expect(result.success).toBe(true);
      expect(result.previousState).toBe(CustomerOrderStatus.DRAFT);
      expect(result.currentState).toBe(CustomerOrderStatus.PENDING);
      expect(order.status).toBe(CustomerOrderStatus.PENDING);
      expect(eventEmitter.emit).toHaveBeenCalledWith('order.state.changed', expect.objectContaining({
        orderId: mockOrderId,
        previousState: CustomerOrderStatus.DRAFT,
        currentState: CustomerOrderStatus.PENDING,
      }));
    });

    it('should fail transition when guard condition fails', async () => {
      const order = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.DRAFT,
        orderLines: [], // No order lines - guard will fail
      } as unknown as CustomerOrder;

      const result = await service.transition(order, WorkflowEvent.CONFIRM);

      expect(result.success).toBe(false);
      expect(result.currentState).toBe(CustomerOrderStatus.DRAFT);
      expect(order.status).toBe(CustomerOrderStatus.DRAFT);
      expect(result.message).toContain('Guard condition failed');
    });

    it('should fail transition for invalid event', async () => {
      const order = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.DRAFT,
      } as CustomerOrder;

      const result = await service.transition(order, WorkflowEvent.SHIP);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No transition available');
    });

    it('should handle CANCEL event from multiple states', async () => {
      const states = [
        CustomerOrderStatus.DRAFT,
        CustomerOrderStatus.PENDING,
        CustomerOrderStatus.CONFIRMED,
        CustomerOrderStatus.QC_FAILED,
        CustomerOrderStatus.ON_HOLD,
      ];

      for (const status of states) {
        const order = {
          id: mockOrderId,
          orderNumber: 'ORD-001',
          status,
        } as CustomerOrder;

        transitionRepo.create.mockReturnValue({} as OrderStateTransition);
        transitionRepo.save.mockResolvedValue({} as OrderStateTransition);

        const result = await service.transition(order, WorkflowEvent.CANCEL);

        expect(result.success).toBe(true);
        expect(result.currentState).toBe(CustomerOrderStatus.CANCELLED);
      }
    });
  });

  describe('getAvailableTransitions', () => {
    it('should return available transitions for DRAFT status', () => {
      const order = {
        status: CustomerOrderStatus.DRAFT,
      } as CustomerOrder;

      const transitions = service.getAvailableTransitions(order);

      expect(transitions).toHaveLength(2);
      expect(transitions.map(t => t.to)).toContain(CustomerOrderStatus.PENDING);
      expect(transitions.map(t => t.to)).toContain(CustomerOrderStatus.CANCELLED);
    });

    it('should return available transitions for IN_PRODUCTION status', () => {
      const order = {
        status: CustomerOrderStatus.IN_PRODUCTION,
      } as CustomerOrder;

      const transitions = service.getAvailableTransitions(order);

      expect(transitions.map(t => t.to)).toContain(CustomerOrderStatus.QUALITY_CONTROL);
      expect(transitions.map(t => t.to)).toContain(CustomerOrderStatus.ON_HOLD);
    });
  });

  describe('getAvailableEvents', () => {
    it('should return available events for DRAFT status', () => {
      const order = {
        status: CustomerOrderStatus.DRAFT,
      } as CustomerOrder;

      const events = service.getAvailableEvents(order);

      expect(events).toContain(WorkflowEvent.CONFIRM);
      expect(events).toContain(WorkflowEvent.CANCEL);
    });

    it('should return available events for QUALITY_CONTROL status', () => {
      const order = {
        status: CustomerOrderStatus.QUALITY_CONTROL,
      } as CustomerOrder;

      const events = service.getAvailableEvents(order);

      expect(events).toContain(WorkflowEvent.PASS_QC);
      expect(events).toContain(WorkflowEvent.FAIL_QC);
    });
  });

  describe('getTransitionHistory', () => {
    it('should return transition history for an order', async () => {
      const mockTransitions = [
        {
          fromState: CustomerOrderStatus.DRAFT,
          toState: CustomerOrderStatus.PENDING,
          success: true,
          transitionedAt: new Date('2024-01-01'),
          notes: 'Order confirmed',
        },
        {
          fromState: CustomerOrderStatus.PENDING,
          toState: CustomerOrderStatus.CONFIRMED,
          success: true,
          transitionedAt: new Date('2024-01-02'),
          notes: 'Payment received',
        },
      ] as OrderStateTransition[];

      transitionRepo.find.mockResolvedValue(mockTransitions);

      const history = await service.getTransitionHistory(mockOrderId);

      expect(history).toHaveLength(2);
      expect(history[0]?.previousState).toBe(CustomerOrderStatus.DRAFT);
      expect(history[0]?.currentState).toBe(CustomerOrderStatus.PENDING);
      expect(history[1]?.previousState).toBe(CustomerOrderStatus.PENDING);
      expect(history[1]?.currentState).toBe(CustomerOrderStatus.CONFIRMED);
    });
  });

  describe('validateState', () => {
    it('should validate valid state', () => {
      const order = {
        status: CustomerOrderStatus.IN_PRODUCTION,
      } as CustomerOrder;

      const isValid = service.validateState(order);
      expect(isValid).toBe(true);
    });

    it('should invalidate unknown state', () => {
      const order = {
        status: 'UNKNOWN_STATE' as CustomerOrderStatus,
      } as CustomerOrder;

      const isValid = service.validateState(order);
      expect(isValid).toBe(false);
    });
  });

  describe('workflow transitions', () => {
    it('should transition through production workflow', async () => {
      const order = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.CONFIRMED,
        orderLines: [{ id: 'line-1' }],
      } as CustomerOrder;

      transitionRepo.create.mockReturnValue({} as OrderStateTransition);
      transitionRepo.save.mockResolvedValue({} as OrderStateTransition);

      // Start production
      let result = await service.transition(order, WorkflowEvent.START_PRODUCTION);
      expect(result.success).toBe(true);
      expect(order.status).toBe(CustomerOrderStatus.IN_PRODUCTION);

      // Complete production
      result = await service.transition(order, WorkflowEvent.COMPLETE_PRODUCTION);
      expect(result.success).toBe(true);
      expect(order.status).toBe(CustomerOrderStatus.QUALITY_CONTROL);

      // Pass QC
      result = await service.transition(order, WorkflowEvent.PASS_QC);
      expect(result.success).toBe(true);
      expect(order.status).toBe(CustomerOrderStatus.QC_PASSED);
    });

    it('should handle QC failure and rework', async () => {
      const order = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.QUALITY_CONTROL,
      } as CustomerOrder;

      transitionRepo.create.mockReturnValue({} as OrderStateTransition);
      transitionRepo.save.mockResolvedValue({} as OrderStateTransition);

      // Fail QC
      let result = await service.transition(order, WorkflowEvent.FAIL_QC);
      expect(result.success).toBe(true);
      expect(order.status).toBe(CustomerOrderStatus.QC_FAILED);

      // Rework - back to production
      result = await service.transition(order, WorkflowEvent.START_PRODUCTION);
      expect(result.success).toBe(true);
      expect(order.status).toBe(CustomerOrderStatus.IN_PRODUCTION);
    });

    it('should handle hold and release', async () => {
      const order = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.CONFIRMED,
      } as CustomerOrder;

      transitionRepo.create.mockReturnValue({} as OrderStateTransition);
      transitionRepo.save.mockResolvedValue({} as OrderStateTransition);
      transitionRepo.find.mockResolvedValue([
        {
          fromState: CustomerOrderStatus.CONFIRMED,
          toState: CustomerOrderStatus.ON_HOLD,
          success: true,
        } as OrderStateTransition,
      ]);

      // Put on hold
      let result = await service.transition(order, WorkflowEvent.HOLD);
      expect(result.success).toBe(true);
      expect(order.status).toBe(CustomerOrderStatus.ON_HOLD);

      // Release hold
      result = await service.transition(order, WorkflowEvent.RELEASE);
      expect(result.success).toBe(true);
      expect(order.status).toBe(CustomerOrderStatus.CONFIRMED);
    });
  });
});