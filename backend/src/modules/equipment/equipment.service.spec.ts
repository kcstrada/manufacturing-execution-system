import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository, Between, LessThan } from 'typeorm';
import { EquipmentService } from './equipment.service';
import {
  Equipment,
  EquipmentStatus,
  EquipmentType,
  MaintenanceSchedule,
  MaintenanceRecord,
  MaintenanceType,
  MaintenanceStatus,
} from '../../entities/equipment.entity';
import { CreateEquipmentDto, CreateMaintenanceScheduleDto, RecordMaintenanceDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { NotFoundException } from '@nestjs/common';

describe('EquipmentService', () => {
  let service: EquipmentService;
  let equipmentRepository: Repository<Equipment>;
  let scheduleRepository: Repository<MaintenanceSchedule>;
  let recordRepository: Repository<MaintenanceRecord>;
  let eventEmitter: EventEmitter2;

  const mockEquipment = {
    id: 'equipment-1',
    equipmentCode: 'EQ001',
    name: 'CNC Machine',
    description: 'High precision CNC milling machine',
    type: EquipmentType.MACHINE,
    manufacturer: 'Haas Automation',
    model: 'VF-2SS',
    serialNumber: 'SN123456',
    status: EquipmentStatus.IDLE,
    workCenterId: 'wc-1',
    departmentId: 'dept-1',
    purchaseDate: new Date('2020-01-01'),
    installationDate: new Date('2020-01-15'),
    warrantyExpiry: new Date('2023-01-01'),
    purchaseCost: 100000,
    currentValue: 80000,
    hourlyOperatingCost: 50,
    location: 'Factory Floor A',
    isCritical: true,
    specifications: {
      power: '20 kW',
      dimensions: '3m x 2m x 2.5m',
      weight: '5000 kg',
    },
    totalOperatingHours: 5000,
    maintenanceIntervalHours: 250,
    hoursSinceLastMaintenance: 50,
    lastMaintenanceDate: new Date('2024-01-01'),
    nextMaintenanceDate: new Date('2024-02-01'),
    totalMaintenanceCount: 20,
    totalBreakdownCount: 2,
    availability: 95,
    performance: 88,
    quality: 99,
    oee: 82.8,
    requiresCalibration: true,
    lastCalibrationDate: new Date('2024-01-01'),
    nextCalibrationDate: new Date('2024-04-01'),
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2024-01-15'),
    tenantId: 'tenant-1',
    version: 1,
    isActive: true,
    maintenanceSchedules: [],
    maintenanceRecords: [],
    beforeInsert: jest.fn(),
    beforeUpdate: jest.fn(),
  } as unknown as Equipment;

  const mockSchedule = {
    id: 'schedule-1',
    title: 'Regular Maintenance',
    equipment: mockEquipment,
    equipmentId: 'equipment-1',
    type: MaintenanceType.PREVENTIVE,
    description: 'Regular preventive maintenance',
    scheduledDate: new Date('2024-02-01'),
    estimatedDuration: 2,
    estimatedCost: 500,
    isRecurring: true,
    recurringIntervalDays: 30,
    status: MaintenanceStatus.SCHEDULED,
    assignedToId: 'worker-1',
    tasks: [
      { id: '1', description: 'Check oil levels', completed: false },
      { id: '2', description: 'Clean filters', completed: false },
    ],
    tenantId: 'tenant-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as MaintenanceSchedule;

  const mockMaintenanceRecord = {
    id: 'record-1',
    recordNumber: 'MR-001',
    equipment: mockEquipment,
    equipmentId: 'equipment-1',
    type: MaintenanceType.PREVENTIVE,
    workPerformed: 'Completed preventive maintenance',
    startDate: new Date('2024-02-01T08:00:00'),
    endDate: new Date('2024-02-01T10:00:00'),
    duration: 2,
    performedById: 'worker-1',
    performedBy: 'John Doe',
    partsReplaced: [
      { name: 'Oil filter', quantity: 1, partNumber: 'OF-123', cost: 50 },
      { name: 'Air filter', quantity: 1, partNumber: 'AF-456', cost: 30 },
    ],
    laborCost: 200,
    partsCost: 80,
    totalCost: 280,
    findings: 'All systems operational',
    recommendations: 'Continue regular maintenance schedule',
    wasBreakdown: false,
    tenantId: 'tenant-1',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  } as MaintenanceRecord;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        {
          provide: getRepositoryToken(Equipment),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(MaintenanceSchedule),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(MaintenanceRecord),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
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

    service = module.get<EquipmentService>(EquipmentService);
    equipmentRepository = module.get<Repository<Equipment>>(getRepositoryToken(Equipment));
    scheduleRepository = module.get<Repository<MaintenanceSchedule>>(getRepositoryToken(MaintenanceSchedule));
    recordRepository = module.get<Repository<MaintenanceRecord>>(getRepositoryToken(MaintenanceRecord));
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  describe('create', () => {
    it('should create new equipment', async () => {
      const createDto: CreateEquipmentDto = {
        equipmentCode: 'EQ001',
        name: 'CNC Machine',
        description: 'High precision CNC milling machine',
        type: EquipmentType.MACHINE,
        manufacturer: 'Haas Automation',
        model: 'VF-2SS',
        serialNumber: 'SN123456',
        workCenterId: 'wc-1',
        departmentId: 'dept-1',
        isCritical: true,
        specifications: {
          power: '20 kW',
          dimensions: '3m x 2m x 2.5m',
          weight: '5000 kg',
        },
      };

      jest.spyOn(equipmentRepository, 'create').mockReturnValue(mockEquipment);
      jest.spyOn(equipmentRepository, 'save').mockResolvedValue(mockEquipment);

      const result = await service.create(createDto);

      expect(result).toEqual(mockEquipment);
      expect(equipmentRepository.create).toHaveBeenCalledWith(createDto);
      expect(equipmentRepository.save).toHaveBeenCalledWith(mockEquipment);
      expect(eventEmitter.emit).toHaveBeenCalledWith('equipment.created', mockEquipment);
    });
  });

  describe('findAll', () => {
    it('should return all equipment', async () => {
      jest.spyOn(equipmentRepository, 'find').mockResolvedValue([mockEquipment]);

      const result = await service.findAll({});

      expect(result).toEqual([mockEquipment]);
      expect(equipmentRepository.find).toHaveBeenCalled();
    });

    it('should filter equipment by status', async () => {
      jest.spyOn(equipmentRepository, 'find').mockResolvedValue([mockEquipment]);

      const result = await service.findAll({ status: EquipmentStatus.IDLE });

      expect(result).toEqual([mockEquipment]);
      expect(equipmentRepository.find).toHaveBeenCalledWith({
        where: { status: EquipmentStatus.IDLE },
        relations: ['maintenanceSchedules', 'maintenanceRecords'],
      });
    });
  });

  describe('findOne', () => {
    it('should return equipment by id', async () => {
      jest.spyOn(equipmentRepository, 'findOne').mockResolvedValue(mockEquipment);

      const result = await service.findOne('equipment-1');

      expect(result).toEqual(mockEquipment);
      expect(equipmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'equipment-1' },
        relations: ['maintenanceSchedules', 'maintenanceRecords'],
      });
    });

    it('should throw NotFoundException if equipment not found', async () => {
      jest.spyOn(equipmentRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update equipment', async () => {
      const updateDto: UpdateEquipmentDto = {
        name: 'Updated CNC Machine',
        description: 'Updated description',
      };

      const updatedEquipment = {
        ...mockEquipment,
        ...updateDto,
      } as Equipment;

      jest.spyOn(equipmentRepository, 'findOne').mockResolvedValue(mockEquipment);
      jest.spyOn(equipmentRepository, 'save').mockResolvedValue(updatedEquipment);

      const result = await service.update('equipment-1', updateDto);

      expect(result.name).toEqual('Updated CNC Machine');
      expect(result.description).toEqual('Updated description');
      expect(eventEmitter.emit).toHaveBeenCalledWith('equipment.updated', expect.any(Object));
    });
  });

  describe('updateStatus', () => {
    it('should update equipment status', async () => {
      const updatedEquipment = {
        ...mockEquipment,
        status: EquipmentStatus.IN_USE,
      } as Equipment;

      jest.spyOn(equipmentRepository, 'findOne').mockResolvedValue(mockEquipment);
      jest.spyOn(equipmentRepository, 'save').mockResolvedValue(updatedEquipment);

      const result = await service.updateStatus('equipment-1', EquipmentStatus.IN_USE);

      expect(result.status).toEqual(EquipmentStatus.IN_USE);
      expect(eventEmitter.emit).toHaveBeenCalledWith('equipment.status.changed', expect.any(Object));
    });
  });

  describe('updateOperatingHours', () => {
    it('should update operating hours', async () => {
      const updatedEquipment = {
        ...mockEquipment,
        totalOperatingHours: 5100,
      } as Equipment;

      jest.spyOn(equipmentRepository, 'findOne').mockResolvedValue(mockEquipment);
      jest.spyOn(equipmentRepository, 'save').mockResolvedValue(updatedEquipment);

      const result = await service.updateOperatingHours('equipment-1', 100);

      expect(result.totalOperatingHours).toEqual(5100);
    });
  });

  describe('recordCalibration', () => {
    it('should record calibration', async () => {
      const calibrationDate = new Date('2024-04-01');
      const nextCalibrationDate = new Date('2024-07-01');

      const updatedEquipment = {
        ...mockEquipment,
        lastCalibrationDate: calibrationDate,
        nextCalibrationDate: nextCalibrationDate,
      } as Equipment;

      jest.spyOn(equipmentRepository, 'findOne').mockResolvedValue(mockEquipment);
      jest.spyOn(equipmentRepository, 'save').mockResolvedValue(updatedEquipment);

      const result = await service.recordCalibration('equipment-1', calibrationDate, nextCalibrationDate);

      expect(result.lastCalibrationDate).toEqual(calibrationDate);
      expect(result.nextCalibrationDate).toEqual(nextCalibrationDate);
      expect(eventEmitter.emit).toHaveBeenCalledWith('equipment.calibrated', expect.any(Object));
    });
  });

  describe('calculateOEE', () => {
    it('should calculate OEE for equipment', async () => {
      jest.spyOn(equipmentRepository, 'findOne').mockResolvedValue(mockEquipment);

      const result = await service.calculateOEE('equipment-1');

      expect(result).toBe(82.8);
    });

    it('should return 0 if no OEE available', async () => {
      const equipmentWithoutOEE = {
        ...mockEquipment,
        oee: 0,
      } as Equipment;

      jest.spyOn(equipmentRepository, 'findOne').mockResolvedValue(equipmentWithoutOEE);

      const result = await service.calculateOEE('equipment-1');

      expect(result).toBe(0);
    });
  });

  describe('getEquipmentRequiringCalibration', () => {
    it('should return equipment requiring calibration', async () => {
      jest.spyOn(equipmentRepository, 'find').mockResolvedValue([mockEquipment]);

      const result = await service.getEquipmentRequiringCalibration();

      expect(result).toEqual([mockEquipment]);
      expect(equipmentRepository.find).toHaveBeenCalledWith({
        where: {
          requiresCalibration: true,
          nextCalibrationDate: LessThan(expect.any(Date)),
        },
      });
    });
  });

  describe('getEquipmentMetrics', () => {
    it('should return equipment metrics', async () => {
      jest.spyOn(equipmentRepository, 'count').mockImplementation((options: any) => {
        if (options?.where?.status === EquipmentStatus.IN_USE) return Promise.resolve(5);
        if (options?.where?.status === EquipmentStatus.IDLE) return Promise.resolve(3);
        if (options?.where?.status === EquipmentStatus.MAINTENANCE) return Promise.resolve(1);
        if (options?.where?.status === EquipmentStatus.OUT_OF_SERVICE) return Promise.resolve(1);
        if (options?.where?.isCritical === true) return Promise.resolve(4);
        return Promise.resolve(10);
      });

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ avg: 85.5 }),
      };

      jest.spyOn(equipmentRepository, 'createQueryBuilder').mockReturnValue(queryBuilder as any);

      const result = await service.getEquipmentMetrics();

      expect(result).toEqual({
        total: 10,
        byStatus: {
          'in_use': 5,
          idle: 3,
          maintenance: 1,
          'out_of_service': 1,
        },
        critical: 4,
        utilizationRate: 50,
        averageOEE: 85.5,
      });
    });
  });

  describe('Maintenance Schedule Management', () => {
    describe('createMaintenanceSchedule', () => {
      it('should create maintenance schedule', async () => {
        const createDto: CreateMaintenanceScheduleDto = {
          equipmentId: 'equipment-1',
          type: MaintenanceType.PREVENTIVE,
          title: 'Regular maintenance',
          description: 'Regular maintenance',
          scheduledDate: '2024-02-01',
          estimatedDuration: 2,
          assignedToId: 'worker-1',
        };

        jest.spyOn(scheduleRepository, 'create').mockReturnValue(mockSchedule);
        jest.spyOn(scheduleRepository, 'save').mockResolvedValue(mockSchedule);

        const result = await service.createMaintenanceSchedule(createDto);

        expect(result).toEqual(mockSchedule);
        expect(scheduleRepository.create).toHaveBeenCalledWith({
          ...createDto,
          scheduledDate: new Date(createDto.scheduledDate),
          status: MaintenanceStatus.SCHEDULED,
        });
        expect(eventEmitter.emit).toHaveBeenCalledWith('maintenance.scheduled', mockSchedule);
      });
    });

    describe('getUpcomingMaintenance', () => {
      it('should return upcoming maintenance within specified days', async () => {
        jest.spyOn(scheduleRepository, 'find').mockResolvedValue([mockSchedule]);

        const result = await service.getUpcomingMaintenance(7);

        expect(result).toEqual([mockSchedule]);
        expect(scheduleRepository.find).toHaveBeenCalledWith({
          where: {
            status: MaintenanceStatus.SCHEDULED,
            scheduledDate: Between(expect.any(Date), expect.any(Date)),
          },
          relations: ['equipment'],
          order: { scheduledDate: 'ASC' },
        });
      });
    });

    describe('getOverdueMaintenance', () => {
      it('should return overdue maintenance', async () => {
        jest.spyOn(scheduleRepository, 'find').mockResolvedValue([mockSchedule]);

        const result = await service.getOverdueMaintenance();

        expect(result).toEqual([mockSchedule]);
        expect(scheduleRepository.find).toHaveBeenCalledWith({
          where: {
            status: MaintenanceStatus.SCHEDULED,
            scheduledDate: LessThan(expect.any(Date)),
          },
          relations: ['equipment'],
          order: { scheduledDate: 'ASC' },
        });
      });
    });

    describe('startMaintenance', () => {
      it('should start maintenance', async () => {
        const updatedSchedule = {
          ...mockSchedule,
          status: MaintenanceStatus.IN_PROGRESS,
        } as MaintenanceSchedule;

        jest.spyOn(scheduleRepository, 'findOne').mockResolvedValue(mockSchedule);
        jest.spyOn(scheduleRepository, 'save').mockResolvedValue(updatedSchedule);
        jest.spyOn(equipmentRepository, 'update').mockResolvedValue(undefined as any);

        const result = await service.startMaintenance('schedule-1');

        expect(result.status).toEqual(MaintenanceStatus.IN_PROGRESS);
        expect(equipmentRepository.update).toHaveBeenCalledWith(
          'equipment-1',
          { status: EquipmentStatus.MAINTENANCE }
        );
        expect(eventEmitter.emit).toHaveBeenCalledWith('maintenance.started', expect.any(Object));
      });
    });

    describe('completeMaintenance', () => {
      it('should complete maintenance and create record', async () => {
        const inProgressSchedule = {
          ...mockSchedule,
          status: MaintenanceStatus.IN_PROGRESS,
        } as MaintenanceSchedule;

        const completedSchedule = {
          ...inProgressSchedule,
          status: MaintenanceStatus.COMPLETED,
        } as MaintenanceSchedule;

        const recordDto: RecordMaintenanceDto = {
          equipmentId: 'equipment-1',
          type: MaintenanceType.PREVENTIVE,
          startDate: '2024-02-01T08:00:00',
          workPerformed: 'Completed maintenance',
          performedById: 'worker-1',
          performedBy: 'John Doe',
          duration: 2,
          partsReplaced: [{ name: 'Oil filter', quantity: 1 }],
          findings: 'All checks passed',
        };

        jest.spyOn(scheduleRepository, 'findOne').mockResolvedValue(inProgressSchedule);
        jest.spyOn(scheduleRepository, 'save').mockResolvedValue(completedSchedule);
        jest.spyOn(recordRepository, 'create').mockReturnValue(mockMaintenanceRecord);
        jest.spyOn(recordRepository, 'save').mockResolvedValue(mockMaintenanceRecord);
        jest.spyOn(equipmentRepository, 'findOne').mockResolvedValue(mockEquipment);
        jest.spyOn(equipmentRepository, 'save').mockResolvedValue({
          ...mockEquipment,
          status: EquipmentStatus.IDLE,
          lastMaintenanceDate: new Date(),
        } as Equipment);

        const result = await service.completeMaintenance('schedule-1', recordDto);

        expect(result).toEqual(mockMaintenanceRecord);
        expect(scheduleRepository.save).toHaveBeenCalled();
        expect(recordRepository.create).toHaveBeenCalled();
        expect(equipmentRepository.save).toHaveBeenCalled();
        expect(eventEmitter.emit).toHaveBeenCalledWith('maintenance.completed', expect.any(Object));
      });
    });

    describe('getMaintenanceHistory', () => {
      it('should return maintenance history for equipment', async () => {
        jest.spyOn(recordRepository, 'find').mockResolvedValue([mockMaintenanceRecord]);

        const result = await service.getMaintenanceHistory('equipment-1', 10);

        expect(result).toEqual([mockMaintenanceRecord]);
        expect(recordRepository.find).toHaveBeenCalledWith({
          where: { equipmentId: 'equipment-1' },
          order: { endDate: 'DESC' },
          take: 10,
          relations: ['equipment'],
        });
      });
    });

    describe('getMaintenanceMetrics', () => {
      it('should return maintenance metrics', async () => {
        const startDate = new Date('2024-01-01');
        const endDate = new Date('2024-12-31');

        jest.spyOn(recordRepository, 'find').mockResolvedValue([
          mockMaintenanceRecord,
          { ...mockMaintenanceRecord, type: MaintenanceType.CORRECTIVE } as MaintenanceRecord,
          { ...mockMaintenanceRecord, type: MaintenanceType.PREDICTIVE } as MaintenanceRecord,
        ]);

        const result = await service.getMaintenanceMetrics(startDate, endDate);

        expect(result).toEqual({
          totalMaintenances: 3,
          byType: {
            preventive: 1,
            corrective: 1,
            predictive: 1,
          },
          averageDuration: 2,
          totalCost: 840,
          averageCost: 280,
          completionRate: 100,
        });
      });
    });
  });

  describe('remove', () => {
    it('should remove equipment', async () => {
      jest.spyOn(equipmentRepository, 'findOne').mockResolvedValue(mockEquipment);
      jest.spyOn(equipmentRepository, 'remove').mockResolvedValue(mockEquipment);

      await service.remove('equipment-1');

      expect(equipmentRepository.remove).toHaveBeenCalledWith(mockEquipment);
      expect(eventEmitter.emit).toHaveBeenCalledWith('equipment.deleted', mockEquipment);
    });
  });
});