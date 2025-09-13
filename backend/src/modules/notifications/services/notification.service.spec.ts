import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { InAppNotificationService } from './in-app-notification.service';
import { NotificationTemplateService } from './notification-template.service';
import { NotificationPreferenceService } from './notification-preference.service';
import { Notification } from '../entities/notification.entity';
import { NotificationPreference } from '../entities/notification-preference.entity';
import {
  NotificationPayload,
  NotificationChannel,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from '../types/notification.types';
import { NotFoundException } from '@nestjs/common';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepository: Repository<Notification>;
  let preferenceRepository: Repository<NotificationPreference>;
  let emailService: EmailService;
  let inAppService: InAppNotificationService;
  let templateService: NotificationTemplateService;
  let preferenceService: NotificationPreferenceService;
  let eventEmitter: EventEmitter2;

  let mockQueryBuilder: any;
  
  const mockNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPreferenceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockEmailService = {
    send: jest.fn(),
  };

  const mockInAppService = {
    send: jest.fn(),
    getUnreadCount: jest.fn(),
    getUnreadNotifications: jest.fn(),
    markAllAsRead: jest.fn(),
  };

  const mockTemplateService = {
    getTemplate: jest.fn(),
    renderTemplate: jest.fn(),
  };

  const mockPreferenceService = {
    getUserPreference: jest.fn(),
    getUserPreferences: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: getRepositoryToken(NotificationPreference),
          useValue: mockPreferenceRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: InAppNotificationService,
          useValue: mockInAppService,
        },
        {
          provide: NotificationTemplateService,
          useValue: mockTemplateService,
        },
        {
          provide: NotificationPreferenceService,
          useValue: mockPreferenceService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepository = module.get<Repository<Notification>>(getRepositoryToken(Notification));
    preferenceRepository = module.get<Repository<NotificationPreference>>(getRepositoryToken(NotificationPreference));
    emailService = module.get<EmailService>(EmailService);
    inAppService = module.get<InAppNotificationService>(InAppNotificationService);
    templateService = module.get<NotificationTemplateService>(NotificationTemplateService);
    preferenceService = module.get<NotificationPreferenceService>(NotificationPreferenceService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    
    // Setup mock query builder
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    mockNotificationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('send', () => {
    it('should send notification via multiple channels', async () => {
      const payload: NotificationPayload = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        type: NotificationType.ORDER_CREATED,
        channel: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        priority: NotificationPriority.HIGH,
        title: 'New Order',
        message: 'A new order has been created',
      };

      const mockNotification = {
        id: 'notif-1',
        ...payload,
        status: NotificationStatus.PENDING,
        createdAt: new Date(),
      };

      const mockPreference = {
        enabled: true,
      };

      mockPreferenceService.getUserPreference.mockResolvedValue(mockPreference);
      mockNotificationRepository.create.mockReturnValue(mockNotification);
      mockNotificationRepository.save.mockResolvedValue(mockNotification);
      mockEmailService.send.mockResolvedValue({
        success: true,
        notificationId: 'notif-1',
        channel: NotificationChannel.EMAIL,
        status: NotificationStatus.SENT,
      });
      mockInAppService.send.mockResolvedValue({
        success: true,
        notificationId: 'notif-1',
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.DELIVERED,
      });

      const result = await service.send(payload);

      expect(preferenceService.getUserPreference).toHaveBeenCalledTimes(2);
      expect(notificationRepository.create).toHaveBeenCalledTimes(2);
      expect(emailService.send).toHaveBeenCalled();
      expect(inAppService.send).toHaveBeenCalled();
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
    });

    it('should respect user preferences', async () => {
      const payload: NotificationPayload = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        type: NotificationType.ORDER_CREATED,
        channel: NotificationChannel.EMAIL,
        title: 'New Order',
        message: 'A new order has been created',
      };

      mockPreferenceService.getUserPreference.mockResolvedValue({
        enabled: false,
      });

      const result = await service.send(payload);

      expect(emailService.send).not.toHaveBeenCalled();
      expect(result.successCount).toBe(0);
    });

    it('should use template if provided', async () => {
      const payload: NotificationPayload = {
        tenantId: 'tenant-1',
        userId: 'user-1',
        type: NotificationType.ORDER_CREATED,
        channel: NotificationChannel.EMAIL,
        templateId: 'template-1',
        templateData: { orderNumber: 'ORD-001' },
        title: 'Template Title',
        message: 'Template Message',
      };

      const mockTemplate = {
        id: 'template-1',
        subject: 'Order {{orderNumber}}',
        body: 'Order {{orderNumber}} created',
      };

      mockTemplateService.getTemplate.mockResolvedValue(mockTemplate);
      mockTemplateService.renderTemplate.mockResolvedValue({
        subject: 'Order ORD-001',
        body: 'Order ORD-001 created',
      });
      mockPreferenceService.getUserPreference.mockResolvedValue({ enabled: true });
      mockNotificationRepository.create.mockReturnValue({ id: 'notif-1' });
      mockNotificationRepository.save.mockResolvedValue({ id: 'notif-1' });
      mockEmailService.send.mockResolvedValue({ success: true });

      await service.send(payload);

      expect(templateService.getTemplate).toHaveBeenCalledWith('template-1');
      expect(templateService.renderTemplate).toHaveBeenCalledWith(mockTemplate, { orderNumber: 'ORD-001' });
    });

    it('should handle multiple recipients', async () => {
      const payload: NotificationPayload = {
        tenantId: 'tenant-1',
        userIds: ['user-1', 'user-2', 'user-3'],
        type: NotificationType.SYSTEM_ALERT,
        channel: NotificationChannel.IN_APP,
        title: 'System Alert',
        message: 'System maintenance scheduled',
      };

      mockPreferenceService.getUserPreference.mockResolvedValue({ enabled: true });
      mockNotificationRepository.create.mockReturnValue({ id: 'notif-1' });
      mockNotificationRepository.save.mockResolvedValue({ id: 'notif-1' });
      mockInAppService.send.mockResolvedValue({ success: true });

      const result = await service.send(payload);

      expect(notificationRepository.create).toHaveBeenCalledTimes(3);
      expect(result.totalCount).toBe(3);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      await service.markAsRead('notif-1', 'user-1');

      expect(notificationRepository.update).toHaveBeenCalledWith(
        { id: 'notif-1', userId: 'user-1' },
        { status: NotificationStatus.READ, readAt: expect.any(Date) }
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('notification.read', {
        notificationId: 'notif-1',
        userId: 'user-1',
      });
    });
  });

  describe('markAsAcknowledged', () => {
    it('should mark notification as acknowledged', async () => {
      await service.markAsAcknowledged('notif-1', 'user-1');

      expect(notificationRepository.update).toHaveBeenCalledWith(
        { id: 'notif-1', userId: 'user-1' },
        { status: NotificationStatus.ACKNOWLEDGED, acknowledgedAt: expect.any(Date) }
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('notification.acknowledged', {
        notificationId: 'notif-1',
        userId: 'user-1',
      });
    });
  });

  describe('getNotifications', () => {
    it('should return filtered notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          type: NotificationType.ORDER_CREATED,
          status: NotificationStatus.READ,
        },
        {
          id: 'notif-2',
          type: NotificationType.INVENTORY_LOW_STOCK,
          status: NotificationStatus.DELIVERED,
        },
      ];

      mockQueryBuilder.getMany.mockResolvedValue(mockNotifications);
      mockNotificationRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getNotifications({
        tenantId: 'tenant-1',
        userId: 'user-1',
        type: NotificationType.ORDER_CREATED,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('notification.tenantId = :tenantId', { tenantId: 'tenant-1' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('notification.userId = :userId', { userId: 'user-1' });
      expect(result).toEqual(mockNotifications);
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.getNotifications({
        tenantId: 'tenant-1',
        startDate,
        endDate,
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'notification.createdAt >= :startDate',
        { startDate }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'notification.createdAt <= :endDate',
        { endDate }
      );
    });

    it('should search by text', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.getNotifications({
        tenantId: 'tenant-1',
        search: 'order',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(notification.title ILIKE :search OR notification.message ILIKE :search)',
        { search: '%order%' }
      );
    });
  });

  describe('getStats', () => {
    it('should calculate notification statistics', async () => {
      const mockNotifications = [
        { status: NotificationStatus.PENDING, type: NotificationType.ORDER_CREATED, channel: [NotificationChannel.EMAIL], priority: NotificationPriority.HIGH },
        { status: NotificationStatus.SENT, type: NotificationType.ORDER_CREATED, channel: [NotificationChannel.EMAIL], priority: NotificationPriority.HIGH },
        { status: NotificationStatus.DELIVERED, type: NotificationType.INVENTORY_LOW_STOCK, channel: [NotificationChannel.IN_APP], priority: NotificationPriority.MEDIUM },
        { status: NotificationStatus.READ, type: NotificationType.INVENTORY_LOW_STOCK, channel: [NotificationChannel.IN_APP], priority: NotificationPriority.MEDIUM },
        { status: NotificationStatus.FAILED, type: NotificationType.TASK_ASSIGNED, channel: [NotificationChannel.EMAIL], priority: NotificationPriority.LOW },
      ] as any[];

      // Mock the query builder for getStats method
      const mockStatsQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockNotifications),
      };
      mockNotificationRepository.createQueryBuilder.mockReturnValue(mockStatsQueryBuilder);

      const result = await service.getStats('tenant-1', 'user-1');

      expect(result).toEqual({
        total: 5,
        pending: 1,
        sent: 1,
        delivered: 1,
        read: 1,
        failed: 1,
        byType: {
          [NotificationType.ORDER_CREATED]: 2,
          [NotificationType.INVENTORY_LOW_STOCK]: 2,
          [NotificationType.TASK_ASSIGNED]: 1,
        },
        byChannel: {
          [NotificationChannel.EMAIL]: 3,
          [NotificationChannel.IN_APP]: 2,
        },
        byPriority: {
          [NotificationPriority.HIGH]: 2,
          [NotificationPriority.MEDIUM]: 2,
          [NotificationPriority.LOW]: 1,
        },
      });
    });
  });

  describe('retryFailed', () => {
    it('should retry failed notifications', async () => {
      const failedNotifications = [
        {
          id: 'notif-1',
          channel: NotificationChannel.EMAIL,
          status: NotificationStatus.FAILED,
          retryCount: 1,
        },
        {
          id: 'notif-2',
          channel: NotificationChannel.EMAIL,
          status: NotificationStatus.FAILED,
          retryCount: 2,
        },
      ];

      mockNotificationRepository.find.mockResolvedValue(failedNotifications);
      mockNotificationRepository.save.mockImplementation(notif => Promise.resolve(notif));
      mockEmailService.send.mockResolvedValue({
        success: true,
        status: NotificationStatus.SENT,
      });

      await service.retryFailed('tenant-1');

      expect(notificationRepository.find).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tenantId: 'tenant-1',
          status: NotificationStatus.FAILED,
        }),
      });
      expect(emailService.send).toHaveBeenCalledTimes(2);
    });

    it('should not retry notifications that exceeded retry limit', async () => {
      const failedNotifications = [
        {
          id: 'notif-1',
          channel: NotificationChannel.EMAIL,
          status: NotificationStatus.FAILED,
          retryCount: 3,
        },
      ];

      mockNotificationRepository.find.mockResolvedValue([]);

      await service.retryFailed('tenant-1');

      expect(emailService.send).not.toHaveBeenCalled();
    });
  });

  describe('cleanupExpired', () => {
    it('should mark expired notifications', async () => {
      const expiredNotifications = [
        {
          id: 'notif-1',
          status: NotificationStatus.PENDING,
          expiresAt: new Date('2023-01-01'),
        },
      ];

      mockNotificationRepository.find.mockResolvedValue(expiredNotifications);
      mockNotificationRepository.save.mockImplementation(notif => Promise.resolve(notif));

      await service.cleanupExpired('tenant-1');

      expect(notificationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: NotificationStatus.EXPIRED,
        })
      );
    });
  });
});