import { Test, TestingModule } from '@nestjs/testing';
import { WasteController } from './waste.controller';
import { WasteService } from './waste.service';
import { CreateWasteRecordDto } from './dto/create-waste-record.dto';
import { UpdateWasteRecordDto } from './dto/update-waste-record.dto';
import {
  WasteRecord,
  WasteType,
  WasteCategory,
} from '../../entities/waste-record.entity';
import { NotFoundException } from '@nestjs/common';
import { AuthGuard, ResourceGuard } from 'nest-keycloak-connect';
import { mockKeycloakProviders } from '../../../test/mocks/keycloak.mock';

describe('WasteController', () => {
  let controller: WasteController;
  let service: jest.Mocked<WasteService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WasteController],
      providers: [
        {
          provide: WasteService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            getWasteMetrics: jest.fn(),
            getWasteSummary: jest.fn(),
            getWasteTrends: jest.fn(),
            getRecurringIssues: jest.fn(),
            getPendingDisposals: jest.fn(),
            getHazardousWaste: jest.fn(),
            getActiveAlerts: jest.fn(),
            findByRecordNumber: jest.fn(),
            recordDisposal: jest.fn(),
          },
        },
        ...mockKeycloakProviders,
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(ResourceGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<WasteController>(WasteController);
    service = module.get(WasteService);
  });

  describe('create', () => {
    it('should create a new waste record', async () => {
      const createDto: CreateWasteRecordDto = {
        recordDate: new Date().toISOString(),
        type: WasteType.SCRAP,
        category: WasteCategory.PRODUCTION,
        quantity: 100,
        unit: 'kg',
        reason: 'Machine malfunction',
      };

      const mockWasteRecord = {
        id: 'waste-123',
        ...createDto,
        recordNumber: 'WR-TEST-123',
        totalCost: 500,
      } as unknown as WasteRecord;

      service.create.mockResolvedValue(mockWasteRecord);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockWasteRecord);
      expect(service.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return all waste records', async () => {
      const mockRecords = [
        { id: '1', type: WasteType.SCRAP, recordNumber: 'WR-001' },
        { id: '2', type: WasteType.REWORK, recordNumber: 'WR-002' },
      ] as WasteRecord[];

      service.findAll.mockResolvedValue(mockRecords);

      const result = await controller.findAll();

      expect(result).toEqual(mockRecords);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single waste record', async () => {
      const mockRecord = {
        id: 'waste-123',
        type: WasteType.SCRAP,
        recordNumber: 'WR-TEST-123',
      } as WasteRecord;

      service.findOne.mockResolvedValue(mockRecord);

      const result = await controller.findOne('waste-123');

      expect(result).toEqual(mockRecord);
      expect(service.findOne).toHaveBeenCalledWith('waste-123');
    });

    it('should handle not found error', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a waste record', async () => {
      const updateDto: UpdateWasteRecordDto = {
        quantity: 150,
        reason: 'Updated reason',
      };

      const mockUpdatedRecord = {
        id: 'waste-123',
        type: WasteType.SCRAP,
        quantity: 150,
        reason: 'Updated reason',
      } as WasteRecord;

      service.update.mockResolvedValue(mockUpdatedRecord);

      const result = await controller.update('waste-123', updateDto);

      expect(result).toEqual(mockUpdatedRecord);
      expect(service.update).toHaveBeenCalledWith('waste-123', updateDto);
    });
  });

  describe('remove', () => {
    it('should remove a waste record', async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.remove('waste-123');

      expect(service.delete).toHaveBeenCalledWith('waste-123');
    });
  });

  describe('getMetrics', () => {
    it('should return waste metrics', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const productId = 'product-123';

      const mockMetrics = {
        totalWaste: 1000,
        totalCost: 5000,
        wasteRate: 5.2,
        recyclingRate: 65,
        topWasteTypes: [],
        topCauses: [],
      };

      service.getWasteMetrics.mockResolvedValue(mockMetrics as any);

      const result = await controller.getMetrics(startDate, endDate, productId);

      expect(result).toEqual(mockMetrics);
      expect(service.getWasteMetrics).toHaveBeenCalledWith(
        new Date(startDate),
        new Date(endDate),
        productId,
      );
    });
  });

  describe('getSummary', () => {
    it('should return waste summary', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const mockSummary = {
        totalQuantity: 150,
        totalCost: 700,
        byType: {
          [WasteType.SCRAP]: { quantity: 100, cost: 500 },
          [WasteType.REWORK]: { quantity: 50, cost: 200 },
        },
        byCategory: {},
        byProduct: [],
        wasteRate: 5.2,
        recyclingRate: 65,
        topCauses: [],
      };

      service.getWasteSummary.mockResolvedValue(mockSummary as any);

      const result = await controller.getSummary(startDate, endDate);

      expect(result).toEqual(mockSummary);
      expect(service.getWasteSummary).toHaveBeenCalledWith(
        new Date(startDate),
        new Date(endDate),
      );
    });
  });

  describe('getTrends', () => {
    it('should return waste trends', async () => {
      const period = 'daily' as const;
      const days = 30;

      const mockTrends = [
        { date: '2024-01-01', quantity: 100, cost: 500 },
        { date: '2024-01-02', quantity: 120, cost: 600 },
      ];

      service.getWasteTrends.mockResolvedValue(mockTrends as any);

      const result = await controller.getTrends(period, days);

      expect(result).toEqual(mockTrends);
      expect(service.getWasteTrends).toHaveBeenCalledWith(period, days);
    });
  });

  describe('getRecurringIssues', () => {
    it('should return recurring waste issues', async () => {
      const mockIssues = [
        {
          id: '1',
          rootCause: 'Machine failure',
          isRecurring: true,
        },
        {
          id: '2',
          rootCause: 'Human error',
          isRecurring: true,
        },
      ] as WasteRecord[];

      service.getRecurringIssues.mockResolvedValue(mockIssues);

      const result = await controller.getRecurringIssues();

      expect(result).toEqual(mockIssues);
      expect(service.getRecurringIssues).toHaveBeenCalled();
    });
  });

  describe('getPendingDisposals', () => {
    it('should return pending disposals', async () => {
      const mockPending = [
        {
          id: '1',
          type: WasteType.SCRAP,
          disposalDate: null,
        },
        {
          id: '2',
          type: WasteType.DEFECTIVE,
          disposalDate: null,
        },
      ] as unknown as WasteRecord[];

      service.getPendingDisposals.mockResolvedValue(mockPending);

      const result = await controller.getPendingDisposals();

      expect(result).toEqual(mockPending);
      expect(service.getPendingDisposals).toHaveBeenCalled();
    });
  });

  describe('findByRecordNumber', () => {
    it('should find waste record by record number', async () => {
      const recordNumber = 'WR-TEST-123';
      const mockRecord = {
        id: 'waste-123',
        recordNumber,
        type: WasteType.SCRAP,
      } as WasteRecord;

      service.findByRecordNumber.mockResolvedValue(mockRecord);

      const result = await controller.findByRecordNumber(recordNumber);

      expect(result).toEqual(mockRecord);
      expect(service.findByRecordNumber).toHaveBeenCalledWith(recordNumber);
    });
  });

  describe('recordDisposal', () => {
    it('should record disposal for a waste record', async () => {
      const id = 'waste-123';
      const disposalDto = {
        disposalMethod: 'RECYCLE',
        disposalDate: new Date().toISOString(),
        disposalReference: 'DISP-001',
      };

      const mockUpdated = {
        id,
        ...disposalDto,
      } as unknown as WasteRecord;

      service.recordDisposal.mockResolvedValue(mockUpdated);

      const result = await controller.recordDisposal(id, disposalDto as any);

      expect(result).toEqual(mockUpdated);
      expect(service.recordDisposal).toHaveBeenCalledWith(id, disposalDto);
    });
  });
});
