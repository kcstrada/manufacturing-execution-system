import { Test, TestingModule } from '@nestjs/testing';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { OrderService } from './order.service';
import { OrderStateMachineService } from './services/order-state-machine.service';
import { OrderRepository, OrderLineRepository } from '../../repositories/order.repository';
import { CustomerOrder, CustomerOrderLine, CustomerOrderStatus } from '../../entities/customer-order.entity';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { WorkflowEvent } from './interfaces/state-machine.interface';

describe('OrderService - State Machine Integration', () => {
  let service: OrderService;
  let orderRepo: jest.Mocked<Repository<CustomerOrder>>;
  let clsService: jest.Mocked<ClsService>;
  let stateMachine: jest.Mocked<OrderStateMachineService>;
  let queryRunner: jest.Mocked<QueryRunner>;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockOrderId = 'order-123';

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
        delete: jest.fn(),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: OrderRepository,
          useValue: {
            findByOrderNumber: jest.fn(),
            findByCustomer: jest.fn(),
            findOneWithRelations: jest.fn(),
            findWithFilters: jest.fn(),
            getOrderStats: jest.fn(),
            getOrdersRequiringAttention: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: OrderLineRepository,
          useValue: {
            findByOrderId: jest.fn(),
            findByProduct: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CustomerOrder),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CustomerOrderLine),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
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
        {
          provide: OrderStateMachineService,
          useValue: {
            canTransition: jest.fn(),
            transition: jest.fn(),
            getAvailableTransitions: jest.fn(),
            getAvailableEvents: jest.fn(),
            getTransitionHistory: jest.fn(),
            validateState: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepo = module.get(getRepositoryToken(CustomerOrder)) as jest.Mocked<Repository<CustomerOrder>>;
    clsService = module.get(ClsService) as jest.Mocked<ClsService>;
    stateMachine = module.get(OrderStateMachineService) as jest.Mocked<OrderStateMachineService>;

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

  describe('updateStatus with State Machine', () => {
    it('should use state machine for DRAFT to PENDING transition', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.DRAFT,
      } as CustomerOrder;

      const statusDto: UpdateOrderStatusDto = {
        status: CustomerOrderStatus.PENDING,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      stateMachine.transition.mockResolvedValue({
        success: true,
        previousState: CustomerOrderStatus.DRAFT,
        currentState: CustomerOrderStatus.PENDING,
        timestamp: new Date(),
      });
      orderRepo.save.mockResolvedValue(mockOrder);

      await service.updateStatus(mockOrderId, statusDto);

      expect(stateMachine.transition).toHaveBeenCalledWith(
        mockOrder,
        WorkflowEvent.CONFIRM,
        expect.objectContaining({
          userId: mockUserId,
          reason: undefined,
        })
      );
      expect(orderRepo.save).toHaveBeenCalled();
    });

    it('should use state machine for IN_PRODUCTION to QUALITY_CONTROL transition', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.IN_PRODUCTION,
      } as CustomerOrder;

      const statusDto: UpdateOrderStatusDto = {
        status: CustomerOrderStatus.QUALITY_CONTROL,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      stateMachine.transition.mockResolvedValue({
        success: true,
        previousState: CustomerOrderStatus.IN_PRODUCTION,
        currentState: CustomerOrderStatus.QUALITY_CONTROL,
        timestamp: new Date(),
      });
      orderRepo.save.mockResolvedValue(mockOrder);

      await service.updateStatus(mockOrderId, statusDto);

      expect(stateMachine.transition).toHaveBeenCalledWith(
        mockOrder,
        WorkflowEvent.COMPLETE_PRODUCTION,
        expect.any(Object)
      );
    });

    it('should use state machine for QUALITY_CONTROL to QC_PASSED transition', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.QUALITY_CONTROL,
      } as CustomerOrder;

      const statusDto: UpdateOrderStatusDto = {
        status: CustomerOrderStatus.QC_PASSED,
        reason: 'All quality checks passed',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      stateMachine.transition.mockResolvedValue({
        success: true,
        previousState: CustomerOrderStatus.QUALITY_CONTROL,
        currentState: CustomerOrderStatus.QC_PASSED,
        timestamp: new Date(),
      });
      orderRepo.save.mockResolvedValue(mockOrder);

      await service.updateStatus(mockOrderId, statusDto);

      expect(stateMachine.transition).toHaveBeenCalledWith(
        mockOrder,
        WorkflowEvent.PASS_QC,
        expect.objectContaining({
          reason: 'All quality checks passed',
        })
      );
    });

    it('should use state machine for QUALITY_CONTROL to QC_FAILED transition', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.QUALITY_CONTROL,
      } as CustomerOrder;

      const statusDto: UpdateOrderStatusDto = {
        status: CustomerOrderStatus.QC_FAILED,
        reason: 'Defects found',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      stateMachine.transition.mockResolvedValue({
        success: true,
        previousState: CustomerOrderStatus.QUALITY_CONTROL,
        currentState: CustomerOrderStatus.QC_FAILED,
        timestamp: new Date(),
      });
      orderRepo.save.mockResolvedValue(mockOrder);

      await service.updateStatus(mockOrderId, statusDto);

      expect(stateMachine.transition).toHaveBeenCalledWith(
        mockOrder,
        WorkflowEvent.FAIL_QC,
        expect.objectContaining({
          reason: 'Defects found',
        })
      );
    });

    it('should handle QC_FAILED to IN_PRODUCTION (rework) transition', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.QC_FAILED,
      } as CustomerOrder;

      const statusDto: UpdateOrderStatusDto = {
        status: CustomerOrderStatus.IN_PRODUCTION,
        reason: 'Rework initiated',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      stateMachine.transition.mockResolvedValue({
        success: true,
        previousState: CustomerOrderStatus.QC_FAILED,
        currentState: CustomerOrderStatus.IN_PRODUCTION,
        timestamp: new Date(),
      });
      orderRepo.save.mockResolvedValue(mockOrder);

      await service.updateStatus(mockOrderId, statusDto);

      expect(stateMachine.transition).toHaveBeenCalledWith(
        mockOrder,
        WorkflowEvent.START_PRODUCTION,
        expect.objectContaining({
          reason: 'Rework initiated',
        })
      );
    });

    it('should handle order cancellation from multiple states', async () => {
      const states = [
        CustomerOrderStatus.DRAFT,
        CustomerOrderStatus.PENDING,
        CustomerOrderStatus.CONFIRMED,
        CustomerOrderStatus.QC_FAILED,
        CustomerOrderStatus.ON_HOLD,
      ];

      for (const currentStatus of states) {
        const mockOrder = {
          id: mockOrderId,
          orderNumber: 'ORD-001',
          status: currentStatus,
        } as CustomerOrder;

        const statusDto: UpdateOrderStatusDto = {
          status: CustomerOrderStatus.CANCELLED,
          reason: 'Customer request',
        };

        jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
        stateMachine.transition.mockResolvedValue({
          success: true,
          previousState: currentStatus,
          currentState: CustomerOrderStatus.CANCELLED,
          timestamp: new Date(),
        });
        orderRepo.save.mockResolvedValue(mockOrder);

        await service.updateStatus(mockOrderId, statusDto);

        expect(stateMachine.transition).toHaveBeenCalledWith(
          mockOrder,
          WorkflowEvent.CANCEL,
          expect.objectContaining({
            reason: 'Customer request',
          })
        );
      }
    });

    it('should handle ON_HOLD transitions', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.CONFIRMED,
      } as CustomerOrder;

      const statusDto: UpdateOrderStatusDto = {
        status: CustomerOrderStatus.ON_HOLD,
        reason: 'Payment issue',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      stateMachine.transition.mockResolvedValue({
        success: true,
        previousState: CustomerOrderStatus.CONFIRMED,
        currentState: CustomerOrderStatus.ON_HOLD,
        timestamp: new Date(),
      });
      orderRepo.save.mockResolvedValue(mockOrder);

      await service.updateStatus(mockOrderId, statusDto);

      expect(stateMachine.transition).toHaveBeenCalledWith(
        mockOrder,
        WorkflowEvent.HOLD,
        expect.objectContaining({
          reason: 'Payment issue',
        })
      );
    });

    it('should handle release from ON_HOLD', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.ON_HOLD,
      } as CustomerOrder;

      const statusDto: UpdateOrderStatusDto = {
        status: CustomerOrderStatus.CONFIRMED,
        reason: 'Issue resolved',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      stateMachine.transition.mockResolvedValue({
        success: true,
        previousState: CustomerOrderStatus.ON_HOLD,
        currentState: CustomerOrderStatus.CONFIRMED,
        timestamp: new Date(),
      });
      orderRepo.save.mockResolvedValue(mockOrder);

      await service.updateStatus(mockOrderId, statusDto);

      expect(stateMachine.transition).toHaveBeenCalledWith(
        mockOrder,
        WorkflowEvent.RELEASE,
        expect.objectContaining({
          reason: 'Issue resolved',
        })
      );
    });

    it('should throw error when state machine transition fails', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.DRAFT,
      } as CustomerOrder;

      const statusDto: UpdateOrderStatusDto = {
        status: CustomerOrderStatus.SHIPPED, // Invalid transition
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      stateMachine.transition.mockResolvedValue({
        success: false,
        previousState: CustomerOrderStatus.DRAFT,
        currentState: CustomerOrderStatus.DRAFT,
        message: 'Invalid transition from DRAFT to SHIPPED',
        timestamp: new Date(),
      });

      await expect(service.updateStatus(mockOrderId, statusDto)).rejects.toThrow(BadRequestException);
    });

    it('should fall back to old validation for unmapped transitions', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.PARTIALLY_SHIPPED,
      } as CustomerOrder;

      const statusDto: UpdateOrderStatusDto = {
        status: CustomerOrderStatus.SHIPPED,
      };

      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockOrder);
      orderRepo.save.mockResolvedValue(mockOrder);

      await service.updateStatus(mockOrderId, statusDto);

      // Should not call state machine for this transition
      expect(stateMachine.transition).not.toHaveBeenCalled();
      expect(orderRepo.save).toHaveBeenCalled();
    });

    it('should include shippedDate metadata for SHIP event', async () => {
      const mockOrder = {
        id: mockOrderId,
        orderNumber: 'ORD-001',
        status: CustomerOrderStatus.QC_PASSED,
      } as CustomerOrder;

      const shippedDate = new Date('2024-01-15');
      const statusDto: UpdateOrderStatusDto = {
        status: CustomerOrderStatus.SHIPPED,
        shippedDate,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      stateMachine.transition.mockResolvedValue({
        success: true,
        previousState: CustomerOrderStatus.QC_PASSED,
        currentState: CustomerOrderStatus.SHIPPED,
        timestamp: new Date(),
      });
      orderRepo.save.mockResolvedValue(mockOrder);

      await service.updateStatus(mockOrderId, statusDto);

      expect(stateMachine.transition).toHaveBeenCalledWith(
        mockOrder,
        WorkflowEvent.SHIP,
        expect.objectContaining({
          metadata: { shippedDate },
        })
      );
    });
  });

  describe('validateStatusTransition with new statuses', () => {
    it('should allow transition from PENDING to CONFIRMED', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: CustomerOrderStatus.PENDING,
      } as CustomerOrder;

      const statusDto: UpdateOrderStatusDto = {
        status: CustomerOrderStatus.CONFIRMED,
      };

      jest.spyOn(service, 'findOne')
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockOrder);
      stateMachine.transition.mockResolvedValue({
        success: true,
        previousState: CustomerOrderStatus.PENDING,
        currentState: CustomerOrderStatus.CONFIRMED,
        timestamp: new Date(),
      });
      orderRepo.save.mockResolvedValue(mockOrder);

      await expect(service.updateStatus(mockOrderId, statusDto)).resolves.toBeDefined();
    });

    it('should allow transition from IN_PRODUCTION to QUALITY_CONTROL', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: CustomerOrderStatus.IN_PRODUCTION,
      } as CustomerOrder;

      const statusDto: UpdateOrderStatusDto = {
        status: CustomerOrderStatus.QUALITY_CONTROL,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);
      stateMachine.transition.mockResolvedValue({
        success: true,
        previousState: CustomerOrderStatus.IN_PRODUCTION,
        currentState: CustomerOrderStatus.QUALITY_CONTROL,
        timestamp: new Date(),
      });
      orderRepo.save.mockResolvedValue(mockOrder);

      await expect(service.updateStatus(mockOrderId, statusDto)).resolves.toBeDefined();
    });

    it('should reject invalid transition from QC_PASSED to IN_PRODUCTION', async () => {
      const mockOrder = {
        id: mockOrderId,
        status: CustomerOrderStatus.QC_PASSED,
      } as CustomerOrder;

      const statusDto: UpdateOrderStatusDto = {
        status: CustomerOrderStatus.IN_PRODUCTION,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockOrder);

      await expect(service.updateStatus(mockOrderId, statusDto)).rejects.toThrow(BadRequestException);
    });
  });
});