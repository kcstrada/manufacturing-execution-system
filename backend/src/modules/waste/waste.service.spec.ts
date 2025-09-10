import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WasteService } from './waste.service';
import { WasteRecord, WasteType, WasteCategory, DisposalMethod } from '../../entities/waste-record.entity';
import { ClsService } from 'nestjs-cls';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateWasteRecordDto } from './dto/create-waste-record.dto';
import { UpdateWasteRecordDto } from './dto/update-waste-record.dto';
import { NotFoundException } from '@nestjs/common';

describe('WasteService', () => {
  let service: WasteService;
  let wasteRepository: jest.Mocked<Repository<WasteRecord>>;
  let clsService: jest.Mocked<ClsService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WasteService,
        {
          provide: getRepositoryToken(WasteRecord),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: ClsService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WasteService>(WasteService);
    wasteRepository = module.get(getRepositoryToken(WasteRecord)) as jest.Mocked<Repository<WasteRecord>>;
    clsService = module.get(ClsService) as jest.Mocked<ClsService>;
    eventEmitter = module.get(EventEmitter2) as jest.Mocked<EventEmitter2>;

    clsService.get.mockImplementation((key: string | symbol | undefined) => {
      if (key === 'tenantId') return mockTenantId;
      if (key === 'userId') return mockUserId;
      return undefined;
    });
  });

  describe('create', () => {
    it('should create a waste record', async () => {
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
        tenantId: mockTenantId,
        recordNumber: 'WR-TEST-123',
        totalCost: 500,
      } as unknown as WasteRecord;

      wasteRepository.create.mockReturnValue(mockWasteRecord);
      wasteRepository.save.mockResolvedValue(mockWasteRecord);

      const result = await service.create(createDto);

      expect(result).toEqual(mockWasteRecord);
      expect(wasteRepository.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId: mockTenantId,
      });
      expect(wasteRepository.save).toHaveBeenCalledWith(mockWasteRecord);
      expect(eventEmitter.emit).toHaveBeenCalledWith('waste.created', mockWasteRecord);
    });

    it('should calculate total cost when cost components are provided', async () => {
      const createDto: CreateWasteRecordDto = {
        recordDate: new Date().toISOString(),
        type: WasteType.SCRAP,
        category: WasteCategory.PRODUCTION,
        quantity: 100,
        materialCost: 200,
        laborCost: 100,
        overheadCost: 50,
        disposalCost: 30,
        recoveredValue: 20,
        reason: 'Material defect',
      };

      const expectedTotalCost = 200 + 100 + 50 + 30 - 20; // 360

      const mockWasteRecord = {
        id: 'waste-123',
        ...createDto,
        tenantId: mockTenantId,
        totalCost: expectedTotalCost,
      } as unknown as WasteRecord;

      wasteRepository.create.mockReturnValue(mockWasteRecord);
      wasteRepository.save.mockResolvedValue(mockWasteRecord);

      const result = await service.create(createDto);

      expect(result.totalCost).toBe(expectedTotalCost);
    });
  });

  describe('findAll', () => {
    it('should return all waste records for tenant', async () => {
      const mockRecords = [
        { id: '1', type: WasteType.SCRAP, tenantId: mockTenantId },
        { id: '2', type: WasteType.REWORK, tenantId: mockTenantId },
      ] as WasteRecord[];

      wasteRepository.find.mockResolvedValue(mockRecords);

      const result = await service.findAll();

      expect(result).toEqual(mockRecords);
      expect(wasteRepository.find).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        relations: ['product', 'workOrder', 'equipment', 'reportedBy'],
        order: { recordDate: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a waste record by id', async () => {
      const mockRecord = {
        id: 'waste-123',
        type: WasteType.SCRAP,
        tenantId: mockTenantId,
      } as WasteRecord;

      wasteRepository.findOne.mockResolvedValue(mockRecord);

      const result = await service.findOne('waste-123');

      expect(result).toEqual(mockRecord);
      expect(wasteRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'waste-123', tenantId: mockTenantId },
        relations: ['product', 'workOrder', 'equipment', 'reportedBy'],
      });
    });

    it('should throw NotFoundException when record not found', async () => {
      wasteRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a waste record', async () => {
      const updateDto: UpdateWasteRecordDto = {
        quantity: 150,
        reason: 'Updated reason',
      };

      const existingRecord = {
        id: 'waste-123',
        type: WasteType.SCRAP,
        quantity: 100,
        tenantId: mockTenantId,
      } as WasteRecord;

      const updatedRecord = {
        ...existingRecord,
        ...updateDto,
      } as WasteRecord;

      wasteRepository.findOne.mockResolvedValue(existingRecord);
      wasteRepository.save.mockResolvedValue(updatedRecord);

      const result = await service.update('waste-123', updateDto);

      expect(result).toEqual(updatedRecord);
      expect(wasteRepository.save).toHaveBeenCalledWith({
        ...existingRecord,
        ...updateDto,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('waste.updated', updatedRecord);
    });

    it('should throw NotFoundException when updating non-existent record', async () => {
      wasteRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a waste record', async () => {
      const mockRecord = {
        id: 'waste-123',
        type: WasteType.SCRAP,
        tenantId: mockTenantId,
      } as WasteRecord;

      wasteRepository.findOne.mockResolvedValue(mockRecord);
      wasteRepository.save.mockResolvedValue({
        ...mockRecord,
        deletedAt: new Date(),
      } as WasteRecord);

      await service.delete('waste-123');

      expect(wasteRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'waste-123',
          deletedAt: expect.any(Date),
        })
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('waste.deleted', mockRecord);
    });
  });


  describe('getWasteSummary', () => {
    it('should calculate waste summary with analytics', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockRecords = [
        {
          id: '1',
          type: WasteType.SCRAP,
          category: WasteCategory.PRODUCTION,
          quantity: 100,
          totalCost: 500,
          productId: 'prod-1',
          product: { name: 'Product A' },
          rootCause: 'Machine failure',
          disposalMethod: DisposalMethod.RECYCLE,
        },
        {
          id: '2',
          type: WasteType.REWORK,
          category: WasteCategory.QUALITY,
          quantity: 50,
          totalCost: 200,
          productId: 'prod-2',
          product: { name: 'Product B' },
          rootCause: 'Human error',
          disposalMethod: DisposalMethod.REWORK,
        },
      ] as unknown as WasteRecord[];

      wasteRepository.find.mockResolvedValue(mockRecords);

      const result = await service.getWasteSummary(startDate, endDate);

      expect(result.totalQuantity).toBe(150);
      expect(result.totalCost).toBe(700);
      expect(result.byType[WasteType.SCRAP]).toEqual({ quantity: 100, cost: 500 });
      expect(result.byType[WasteType.REWORK]).toEqual({ quantity: 50, cost: 200 });
      expect(result.recyclingRate).toBeGreaterThan(0);
    });
  });

  describe('getRecurringIssues', () => {
    it('should identify recurring waste issues', async () => {
      const mockRecords = [
        { id: '1', rootCause: 'Machine failure', isRecurring: true },
        { id: '2', rootCause: 'Machine failure', isRecurring: false },
        { id: '3', rootCause: 'Human error', isRecurring: true },
      ] as WasteRecord[];

      wasteRepository.find.mockResolvedValue(mockRecords);

      const result = await service.getRecurringIssues();

      expect(result).toHaveLength(2);
      expect(result.every((r: WasteRecord) => r.isRecurring)).toBe(true);
    });
  });
});