import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentController } from './equipment.controller';
import { EquipmentService, EquipmentMetrics, MaintenanceMetrics } from './equipment.service';
import { AuthGuard, ResourceGuard } from 'nest-keycloak-connect';
import { mockKeycloakProviders } from '../../../test/mocks/keycloak.mock';
import {
  Equipment,
  EquipmentStatus,
  EquipmentType,
  MaintenanceSchedule,
  MaintenanceRecord,
  MaintenanceType,
  MaintenanceStatus,
} from '../../entities/equipment.entity';
import {
  CreateEquipmentDto,
  CreateMaintenanceScheduleDto,
  RecordMaintenanceDto,
} from './dto/create-equipment.dto';
import {
  UpdateEquipmentDto,
  UpdateMaintenanceScheduleDto,
} from './dto/update-equipment.dto';

describe('EquipmentController', () => {
  let controller: EquipmentController;
  let service: EquipmentService;

  const mockEquipment = {
    ...({} as unknown as Equipment),
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
    maintenanceSchedules: [],
    maintenanceRecords: [],
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

  const mockEquipmentMetrics: EquipmentMetrics = {
    totalEquipment: 10,
    operationalCount: 8,
    maintenanceCount: 1,
    breakdownCount: 1,
    averageOEE: 85.5,
    upcomingMaintenance: 3,
    overdueMaintenance: 1,
    criticalEquipment: {
      total: 4,
      operational: 3,
    },
  };

  const mockMaintenanceMetrics: MaintenanceMetrics = {
    totalScheduled: 10,
    completed: 9,
    overdue: 1,
    inProgress: 0,
    mtbf: 720, // Mean Time Between Failures in hours
    mttr: 4, // Mean Time To Repair in hours
    totalCost: 2500,
    breakdownRate: 5,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentController],
      providers: [
        {
          provide: EquipmentService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn(),
            updateOperatingHours: jest.fn(),
            recordCalibration: jest.fn(),
            calculateOEE: jest.fn(),
            remove: jest.fn(),
            getEquipmentMetrics: jest.fn(),
            getEquipmentRequiringCalibration: jest.fn(),
            createMaintenanceSchedule: jest.fn(),
            getUpcomingMaintenance: jest.fn(),
            getOverdueMaintenance: jest.fn(),
            getMaintenanceMetrics: jest.fn(),
            updateMaintenanceSchedule: jest.fn(),
            startMaintenance: jest.fn(),
            completeMaintenance: jest.fn(),
            recordMaintenance: jest.fn(),
            getMaintenanceHistory: jest.fn(),
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

    controller = module.get<EquipmentController>(EquipmentController);
    service = module.get<EquipmentService>(EquipmentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Equipment Management', () => {
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

        jest.spyOn(service, 'create').mockResolvedValue(mockEquipment);

        const result = await controller.create(createDto);

        expect(result).toEqual(mockEquipment);
        expect(service.create).toHaveBeenCalledWith(createDto);
      });
    });

    describe('findAll', () => {
      it('should return all equipment', async () => {
        jest.spyOn(service, 'findAll').mockResolvedValue([mockEquipment]);

        const result = await controller.findAll();

        expect(result).toEqual([mockEquipment]);
        expect(service.findAll).toHaveBeenCalledWith({});
      });

      it('should filter equipment by parameters', async () => {
        jest.spyOn(service, 'findAll').mockResolvedValue([mockEquipment]);

        const result = await controller.findAll(
          EquipmentStatus.IDLE,
          EquipmentType.MACHINE,
          'wc-1',
          'dept-1',
          true,
          true,
        );

        expect(result).toEqual([mockEquipment]);
        expect(service.findAll).toHaveBeenCalledWith({
          status: EquipmentStatus.IDLE,
          type: EquipmentType.MACHINE,
          workCenterId: 'wc-1',
          departmentId: 'dept-1',
          isCritical: true,
          requiresCalibration: true,
        });
      });
    });

    describe('getMetrics', () => {
      it('should return equipment metrics', async () => {
        jest.spyOn(service, 'getEquipmentMetrics').mockResolvedValue(mockEquipmentMetrics);

        const result = await controller.getMetrics();

        expect(result).toEqual(mockEquipmentMetrics);
        expect(service.getEquipmentMetrics).toHaveBeenCalled();
      });
    });

    describe('getCalibrationDue', () => {
      it('should return equipment requiring calibration', async () => {
        jest.spyOn(service, 'getEquipmentRequiringCalibration').mockResolvedValue([mockEquipment]);

        const result = await controller.getCalibrationDue();

        expect(result).toEqual([mockEquipment]);
        expect(service.getEquipmentRequiringCalibration).toHaveBeenCalled();
      });
    });

    describe('findOne', () => {
      it('should return equipment by id', async () => {
        jest.spyOn(service, 'findOne').mockResolvedValue(mockEquipment);

        const result = await controller.findOne('equipment-1');

        expect(result).toEqual(mockEquipment);
        expect(service.findOne).toHaveBeenCalledWith('equipment-1');
      });
    });

    describe('update', () => {
      it('should update equipment', async () => {
        const updateDto: UpdateEquipmentDto = {
          name: 'Updated CNC Machine',
          description: 'Updated description',
        };

        jest.spyOn(service, 'update').mockResolvedValue({
          ...mockEquipment,
          ...updateDto,
        } as Equipment);

        const result = await controller.update('equipment-1', updateDto);

        expect(result.name).toEqual('Updated CNC Machine');
        expect(service.update).toHaveBeenCalledWith('equipment-1', updateDto);
      });
    });

    describe('updateStatus', () => {
      it('should update equipment status', async () => {
        jest.spyOn(service, 'updateStatus').mockResolvedValue({
          ...mockEquipment,
          status: EquipmentStatus.IN_USE,
        } as Equipment);

        const result = await controller.updateStatus('equipment-1', EquipmentStatus.IN_USE);

        expect(result.status).toEqual(EquipmentStatus.IN_USE);
        expect(service.updateStatus).toHaveBeenCalledWith('equipment-1', EquipmentStatus.IN_USE);
      });
    });

    describe('updateOperatingHours', () => {
      it('should update operating hours', async () => {
        jest.spyOn(service, 'updateOperatingHours').mockResolvedValue({
          ...mockEquipment,
          totalOperatingHours: 5100,
        } as Equipment);

        const result = await controller.updateOperatingHours('equipment-1', 100);

        expect(result.totalOperatingHours).toEqual(5100);
        expect(service.updateOperatingHours).toHaveBeenCalledWith('equipment-1', 100);
      });
    });

    describe('recordCalibration', () => {
      it('should record calibration', async () => {
        const body = {
          calibrationDate: '2024-04-01',
          nextCalibrationDate: '2024-07-01',
        };

        jest.spyOn(service, 'recordCalibration').mockResolvedValue({
          ...mockEquipment,
          lastCalibrationDate: new Date(body.calibrationDate),
          nextCalibrationDate: new Date(body.nextCalibrationDate),
        } as Equipment);

        const result = await controller.recordCalibration('equipment-1', body);

        expect(result.lastCalibrationDate).toEqual(new Date(body.calibrationDate));
        expect(service.recordCalibration).toHaveBeenCalledWith(
          'equipment-1',
          new Date(body.calibrationDate),
          new Date(body.nextCalibrationDate),
        );
      });
    });

    describe('calculateOEE', () => {
      it('should calculate OEE', async () => {
        jest.spyOn(service, 'calculateOEE').mockResolvedValue(82.8);

        const result = await controller.calculateOEE('equipment-1');

        expect(result).toEqual({ oee: 82.8 });
        expect(service.calculateOEE).toHaveBeenCalledWith('equipment-1', undefined);
      });

      it('should calculate OEE for specific period', async () => {
        jest.spyOn(service, 'calculateOEE').mockResolvedValue(85.5);

        const result = await controller.calculateOEE(
          'equipment-1',
          '2024-01-01',
          '2024-01-31',
        );

        expect(result).toEqual({ oee: 85.5 });
        expect(service.calculateOEE).toHaveBeenCalledWith(
          'equipment-1',
          {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31'),
          },
        );
      });
    });

    describe('remove', () => {
      it('should delete equipment', async () => {
        jest.spyOn(service, 'remove').mockResolvedValue(undefined);

        await controller.remove('equipment-1');

        expect(service.remove).toHaveBeenCalledWith('equipment-1');
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

        jest.spyOn(service, 'createMaintenanceSchedule').mockResolvedValue(mockSchedule);

        const result = await controller.createMaintenanceSchedule(createDto);

        expect(result).toEqual(mockSchedule);
        expect(service.createMaintenanceSchedule).toHaveBeenCalledWith(createDto);
      });
    });

    describe('getUpcomingMaintenance', () => {
      it('should return upcoming maintenance', async () => {
        jest.spyOn(service, 'getUpcomingMaintenance').mockResolvedValue([mockSchedule]);

        const result = await controller.getUpcomingMaintenance(7);

        expect(result).toEqual([mockSchedule]);
        expect(service.getUpcomingMaintenance).toHaveBeenCalledWith(7);
      });
    });

    describe('getOverdueMaintenance', () => {
      it('should return overdue maintenance', async () => {
        jest.spyOn(service, 'getOverdueMaintenance').mockResolvedValue([mockSchedule]);

        const result = await controller.getOverdueMaintenance();

        expect(result).toEqual([mockSchedule]);
        expect(service.getOverdueMaintenance).toHaveBeenCalled();
      });
    });

    describe('getMaintenanceMetrics', () => {
      it('should return maintenance metrics', async () => {
        jest.spyOn(service, 'getMaintenanceMetrics').mockResolvedValue(mockMaintenanceMetrics);

        const result = await controller.getMaintenanceMetrics('2024-01-01', '2024-12-31');

        expect(result).toEqual(mockMaintenanceMetrics);
        expect(service.getMaintenanceMetrics).toHaveBeenCalledWith(
          new Date('2024-01-01'),
          new Date('2024-12-31'),
        );
      });
    });

    describe('updateMaintenanceSchedule', () => {
      it('should update maintenance schedule', async () => {
        const updateDto: UpdateMaintenanceScheduleDto = {
          description: 'Updated maintenance',
          scheduledDate: '2024-02-15',
        };

        jest.spyOn(service, 'updateMaintenanceSchedule').mockResolvedValue({
          ...mockSchedule,
          description: 'Updated maintenance',
          scheduledDate: new Date('2024-02-15'),
        } as MaintenanceSchedule);

        const result = await controller.updateMaintenanceSchedule('schedule-1', updateDto);

        expect(result.description).toEqual('Updated maintenance');
        expect(service.updateMaintenanceSchedule).toHaveBeenCalledWith('schedule-1', updateDto);
      });
    });

    describe('startMaintenance', () => {
      it('should start maintenance', async () => {
        jest.spyOn(service, 'startMaintenance').mockResolvedValue({
          ...mockSchedule,
          status: MaintenanceStatus.IN_PROGRESS,
        } as MaintenanceSchedule);

        const result = await controller.startMaintenance('schedule-1');

        expect(result.status).toEqual(MaintenanceStatus.IN_PROGRESS);
        expect(service.startMaintenance).toHaveBeenCalledWith('schedule-1');
      });
    });

    describe('completeMaintenance', () => {
      it('should complete maintenance', async () => {
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

        jest.spyOn(service, 'completeMaintenance').mockResolvedValue(mockMaintenanceRecord);

        const result = await controller.completeMaintenance('schedule-1', recordDto);

        expect(result).toEqual(mockMaintenanceRecord);
        expect(service.completeMaintenance).toHaveBeenCalledWith('schedule-1', recordDto);
      });
    });
  });

  describe('Maintenance Records', () => {
    describe('recordMaintenance', () => {
      it('should record maintenance activity', async () => {
        const recordDto: RecordMaintenanceDto = {
          equipmentId: 'equipment-1',
          type: MaintenanceType.CORRECTIVE,
          startDate: '2024-02-01T14:00:00',
          workPerformed: 'Emergency repair',
          performedById: 'worker-1',
          performedBy: 'Jane Smith',
          duration: 3,
          partsReplaced: [{ name: 'Motor', quantity: 1 }],
          findings: 'Motor replaced',
        };

        jest.spyOn(service, 'recordMaintenance').mockResolvedValue(mockMaintenanceRecord);

        const result = await controller.recordMaintenance(recordDto);

        expect(result).toEqual(mockMaintenanceRecord);
        expect(service.recordMaintenance).toHaveBeenCalledWith(recordDto);
      });
    });

    describe('getMaintenanceHistory', () => {
      it('should return maintenance history', async () => {
        jest.spyOn(service, 'getMaintenanceHistory').mockResolvedValue([mockMaintenanceRecord]);

        const result = await controller.getMaintenanceHistory('equipment-1', 10);

        expect(result).toEqual([mockMaintenanceRecord]);
        expect(service.getMaintenanceHistory).toHaveBeenCalledWith('equipment-1', 10);
      });
    });
  });
});