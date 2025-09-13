import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, ConflictException } from '@nestjs/common';
import {
  Shift,
  ShiftAssignment,
  ShiftException,
  ProductionCalendar,
  ShiftType,
} from '../../entities/shift.entity';
import { Worker } from '../../entities/worker.entity';
import { WorkerService } from '../worker/worker.service';
import {
  ShiftSchedulingService,
  ShiftScheduleRequest,
  ShiftSwapRequest,
  ShiftPattern,
} from './shift-scheduling.service';

describe('ShiftSchedulingService', () => {
  let service: ShiftSchedulingService;
  let shiftRepository: jest.Mocked<Repository<Shift>>;
  let assignmentRepository: jest.Mocked<Repository<ShiftAssignment>>;
  let exceptionRepository: jest.Mocked<Repository<ShiftException>>;
  let calendarRepository: jest.Mocked<Repository<ProductionCalendar>>;
  let workerRepository: jest.Mocked<Repository<Worker>>;
  let workerService: jest.Mocked<WorkerService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockShift = {
    id: 'shift-1',
    shiftCode: 'MORNING',
    name: 'Morning Shift',
    type: ShiftType.MORNING,
    startTime: '08:00',
    endTime: '16:00',
    workDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    isActive: true,
    targetWorkers: 10,
    minWorkers: 5,
    maxWorkers: 15,
    workingHours: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActiveOnDay: jest.fn().mockReturnValue(true),
  } as unknown as Shift;

  const mockWorker: Worker = {
    id: 'worker-1',
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    isActive: true,
    isAvailable: true,
    skills: [],
    availability: {
      monday: { available: true, startTime: '08:00', endTime: '17:00' },
      tuesday: { available: true, startTime: '08:00', endTime: '17:00' },
      wednesday: { available: true, startTime: '08:00', endTime: '17:00' },
      thursday: { available: true, startTime: '08:00', endTime: '17:00' },
      friday: { available: true, startTime: '08:00', endTime: '17:00' },
      saturday: { available: false },
      sunday: { available: false },
    },
  } as unknown as Worker;

  const mockAssignment = {
    id: 'assignment-1',
    shiftId: 'shift-1',
    workerId: 'worker-1',
    date: new Date('2024-01-15'),
    status: 'confirmed',
    checkedIn: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    shift: mockShift,
    worker: mockWorker,
  } as unknown as ShiftAssignment;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftSchedulingService,
        {
          provide: getRepositoryToken(Shift),
          useValue: {
            find: jest.fn(),
            findBy: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            })),
          },
        },
        {
          provide: getRepositoryToken(ShiftAssignment),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ShiftException),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProductionCalendar),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Worker),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: WorkerService,
          useValue: {
            findWorkersWithSkills: jest.fn(),
            getWorkerAvailability: jest.fn(),
            analyzeWorkload: jest.fn(),
            checkAvailability: jest.fn(),
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

    service = module.get<ShiftSchedulingService>(ShiftSchedulingService);
    shiftRepository = module.get(getRepositoryToken(Shift)) as jest.Mocked<Repository<Shift>>;
    assignmentRepository = module.get(getRepositoryToken(ShiftAssignment)) as jest.Mocked<Repository<ShiftAssignment>>;
    exceptionRepository = module.get(getRepositoryToken(ShiftException)) as jest.Mocked<Repository<ShiftException>>;
    calendarRepository = module.get(getRepositoryToken(ProductionCalendar)) as jest.Mocked<Repository<ProductionCalendar>>;
    workerRepository = module.get(getRepositoryToken(Worker)) as jest.Mocked<Repository<Worker>>;
    workerService = module.get<WorkerService>(WorkerService) as jest.Mocked<WorkerService>;
    eventEmitter = module.get<EventEmitter2>(EventEmitter2) as jest.Mocked<EventEmitter2>;
  });

  describe('generateSchedule', () => {
    it('should generate schedule for specified period', async () => {
      const request: ShiftScheduleRequest = {
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-19'),
        shiftIds: ['shift-1'],
        autoAssign: false,
      };

      // Mock createQueryBuilder for getApplicableShifts
      (shiftRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockShift]),
      });
      
      jest.spyOn(calendarRepository, 'find').mockResolvedValue([]);
      jest.spyOn(exceptionRepository, 'find').mockResolvedValue([]);
      jest.spyOn(assignmentRepository, 'create').mockImplementation((data) => data as any);
      jest.spyOn(assignmentRepository, 'save').mockImplementation((data) =>
        Promise.resolve(Array.isArray(data) ? data : [data]) as any,
      );

      const result = await service.generateSchedule(request);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(shiftRepository.createQueryBuilder).toHaveBeenCalled();
      expect(assignmentRepository.save).toHaveBeenCalled();
    });

    it('should auto-assign workers when requested', async () => {
      const request: ShiftScheduleRequest = {
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-15'),
        shiftIds: ['shift-1'],
        autoAssign: true,
        respectSkillRequirements: true,
        balanceWorkload: true,
      };

      // Mock createQueryBuilder for getApplicableShifts
      (shiftRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockShift]),
      });
      jest.spyOn(calendarRepository, 'find').mockResolvedValue([]);
      jest.spyOn(exceptionRepository, 'find').mockResolvedValue([]);
      jest.spyOn(workerRepository, 'find').mockResolvedValue([mockWorker]);
      jest.spyOn(workerService, 'findWorkersWithSkills').mockResolvedValue([
        {
          worker: mockWorker,
          matchScore: 100,
          matchedSkills: [],
          missingSkills: [],
          skillLevelMatch: true,
          certificationValid: true,
          available: true,
        },
      ]);
      jest.spyOn(workerService, 'checkAvailability').mockResolvedValue({
        available: true,
      });
      jest.spyOn(assignmentRepository, 'find').mockResolvedValue([]);
      jest.spyOn(assignmentRepository, 'create').mockImplementation((data) => data as any);
      jest.spyOn(assignmentRepository, 'save').mockImplementation((data) =>
        Promise.resolve(Array.isArray(data) ? data : [data]) as any,
      );

      const result = await service.generateSchedule(request);

      expect(result).toBeDefined();
      expect(shiftRepository.createQueryBuilder).toHaveBeenCalled();
      expect(assignmentRepository.save).toHaveBeenCalled();
    });

    it('should respect calendar exceptions', async () => {
      // Mock createQueryBuilder for getApplicableShifts
      (shiftRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockShift]),
      });
      
      const request: ShiftScheduleRequest = {
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-01-15'),
        shiftIds: ['shift-1'],
        autoAssign: false,
      };

      const mockException: ShiftException = {
        id: 'exception-1',
        shiftId: 'shift-1',
        date: new Date('2024-01-15'),
        type: 'cancelled',
        reason: 'Holiday',
        isCancelled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as ShiftException;

      // Mock createQueryBuilder for getApplicableShifts
      (shiftRepository.createQueryBuilder as jest.Mock).mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockShift]),
      });
      jest.spyOn(calendarRepository, 'find').mockResolvedValue([]);
      jest.spyOn(exceptionRepository, 'find').mockResolvedValue([mockException]);
      jest.spyOn(exceptionRepository, 'findOne').mockResolvedValue(mockException);
      jest.spyOn(assignmentRepository, 'create').mockImplementation((data) => data as any);
      jest.spyOn(assignmentRepository, 'save').mockImplementation((data) =>
        Promise.resolve(Array.isArray(data) ? data : [data]) as any,
      );

      const result = await service.generateSchedule(request);

      // The service will still generate assignments but they will be filtered out by the exception
      expect(result).toBeDefined();
      expect(exceptionRepository.findOne).toHaveBeenCalled();
    });
  });

  describe('analyzeCoverage', () => {
    it('should analyze shift coverage', async () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-19');

      // Mock shifts find
      jest.spyOn(shiftRepository, 'find').mockResolvedValue([mockShift]);
      jest.spyOn(shiftRepository, 'findBy').mockResolvedValue([mockShift]);
      
      // Mock assignments find - this is what analyzeCoverage actually uses
      jest.spyOn(assignmentRepository, 'find').mockResolvedValue([mockAssignment]);

      const result = await service.analyzeCoverage(startDate, endDate, ['shift-1']);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('shiftId');
      expect(result[0]).toHaveProperty('coveragePercentage');
    });

    it('should identify understaffed shifts', async () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-15');

      // Mock shifts find
      jest.spyOn(shiftRepository, 'find').mockResolvedValue([mockShift]);
      jest.spyOn(shiftRepository, 'findBy').mockResolvedValue([mockShift]);
      
      // Mock assignments find - this is what analyzeCoverage actually uses
      jest.spyOn(assignmentRepository, 'find').mockResolvedValue([mockAssignment]); // Only 1 worker assigned

      const result = await service.analyzeCoverage(startDate, endDate, ['shift-1']);

      expect(result).toBeDefined();
      expect(result.some((r: any) => r.understaffed)).toBe(true);
    });
  });

  describe('requestShiftSwap', () => {
    it('should process valid shift swap request', async () => {
      const request: ShiftSwapRequest = {
        fromWorkerId: 'worker-1',
        toWorkerId: 'worker-2',
        assignmentId: 'assignment-1',
        reason: 'Personal emergency',
        requestedBy: 'worker-1',
      };

      const toWorker = { ...mockWorker, id: 'worker-2', employeeId: 'EMP002' };

      jest.spyOn(assignmentRepository, 'findOne')
        .mockResolvedValueOnce(mockAssignment)  // First call to find the assignment
        .mockResolvedValueOnce(null);           // Second call for worker-2's existing assignment
      jest.spyOn(workerRepository, 'findOne')
        .mockResolvedValueOnce(mockWorker)
        .mockResolvedValueOnce(toWorker as Worker);
      jest.spyOn(workerService, 'checkAvailability').mockResolvedValue({
        available: true,
        reason: undefined,
        conflicts: [],
      });
      const newAssignment = { ...mockAssignment, workerId: 'worker-2', id: 'assignment-new' };
      jest.spyOn(assignmentRepository, 'create').mockReturnValue(newAssignment as ShiftAssignment);
      jest.spyOn(assignmentRepository, 'save').mockResolvedValue([mockAssignment, newAssignment] as any);

      const result = await service.requestShiftSwap(request);

      expect(result).toBeDefined();
      expect(result.workerId).toBe('worker-2');
      expect(assignmentRepository.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('shift.swapped', expect.any(Object));
    });

    it('should reject swap if target worker is unavailable', async () => {
      const request: ShiftSwapRequest = {
        fromWorkerId: 'worker-1',
        toWorkerId: 'worker-2',
        assignmentId: 'assignment-1',
        reason: 'Personal emergency',
        requestedBy: 'worker-1',
      };

      const toWorker = { ...mockWorker, id: 'worker-2', employeeId: 'EMP002' };

      jest.spyOn(assignmentRepository, 'findOne').mockResolvedValue(mockAssignment);
      jest.spyOn(workerRepository, 'findOne')
        .mockResolvedValueOnce(mockWorker)
        .mockResolvedValueOnce(toWorker as Worker);
      jest.spyOn(workerService, 'checkAvailability').mockResolvedValue({
        available: false,
        reason: 'Worker not available',
        conflicts: [],
      });

      await expect(service.requestShiftSwap(request)).rejects.toThrow(ConflictException);
    });
  });

  describe('applyShiftPattern', () => {
    it('should apply shift pattern to workers', async () => {
      const pattern: ShiftPattern = {
        name: 'Standard Rotation',
        pattern: ['MORNING', 'AFTERNOON', 'NIGHT', 'OFF', 'OFF'],
        rotationPeriod: 5,
        startDate: new Date('2024-01-15'),
      };

      const mockAfternoonShift = { ...mockShift, id: 'shift-2', shiftCode: 'AFTERNOON', isActiveOnDay: jest.fn().mockReturnValue(true) };
      const mockNightShift = { ...mockShift, id: 'shift-3', shiftCode: 'NIGHT', isActiveOnDay: jest.fn().mockReturnValue(true) };
      const mockOffShift = { ...mockShift, id: 'shift-4', shiftCode: 'OFF', isActiveOnDay: jest.fn().mockReturnValue(true) };

      jest
        .spyOn(shiftRepository, 'find')
        .mockResolvedValue([mockShift, mockAfternoonShift, mockNightShift, mockOffShift, mockShift] as unknown as Shift[]);
      jest.spyOn(assignmentRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(assignmentRepository, 'create').mockImplementation((data) => data as any);
      jest.spyOn(assignmentRepository, 'save').mockImplementation((data) =>
        Promise.resolve(Array.isArray(data) ? data : [data]) as any,
      );

      const result = await service.applyShiftPattern(
        pattern,
        ['worker-1'],
        new Date('2024-01-15'),
        new Date('2024-01-19'),
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(assignmentRepository.save).toHaveBeenCalled();
    });

    it('should skip existing assignments when applying pattern', async () => {
      const pattern: ShiftPattern = {
        name: 'Standard Rotation',
        pattern: ['MORNING'],
        rotationPeriod: 1,
        startDate: new Date('2024-01-15'),
      };

      jest.spyOn(shiftRepository, 'find').mockResolvedValue([mockShift] as unknown as Shift[]);
      jest.spyOn(assignmentRepository, 'findOne').mockResolvedValue(mockAssignment);
      jest.spyOn(assignmentRepository, 'save').mockResolvedValue([] as any);

      const result = await service.applyShiftPattern(
        pattern,
        ['worker-1'],
        new Date('2024-01-15'),
        new Date('2024-01-15'),
      );

      expect(result).toEqual([]);
      expect(assignmentRepository.save).toHaveBeenCalledWith([]);
    });
  });

  describe('detectConflicts', () => {
    it('should detect double booking conflicts', async () => {
      const doubleBookedAssignments = [
        mockAssignment,
        { ...mockAssignment, id: 'assignment-2', shiftId: 'shift-2' },
      ];

      jest.spyOn(assignmentRepository, 'find').mockResolvedValue(doubleBookedAssignments as any);

      const result = await service.detectConflicts(
        'worker-1',
        new Date('2024-01-15'),
        new Date('2024-01-15'),
      );

      expect(result).toBeDefined();
      expect(result.some((c) => c.conflictType === 'double_booking')).toBe(true);
    });

    it('should detect rest period violations', async () => {
      const closeShifts = [
        { ...mockAssignment, shift: { ...mockShift, endTime: '22:00' } },
        {
          ...mockAssignment,
          id: 'assignment-2',
          date: new Date('2024-01-16'),
          shift: { ...mockShift, startTime: '00:00', endTime: '08:00' },
        },
      ];

      jest.spyOn(assignmentRepository, 'find').mockResolvedValue(closeShifts as any);

      const result = await service.detectConflicts(
        'worker-1',
        new Date('2024-01-15'),
        new Date('2024-01-16'),
      );

      expect(result).toBeDefined();
      expect(result.some((c) => c.conflictType === 'rest_period')).toBe(true);
    });

    it('should detect overtime violations', async () => {
      const manyShifts = Array(6)
        .fill(null)
        .map((_, i) => ({
          ...mockAssignment,
          id: `assignment-${i}`,
          date: new Date(`2024-01-${15 + i}`),
          shift: { ...mockShift, workingHours: 8 },
        }));

      jest.spyOn(assignmentRepository, 'find').mockResolvedValue(manyShifts as any);

      const result = await service.detectConflicts(
        'worker-1',
        new Date('2024-01-15'),
        new Date('2024-01-21'),
      );

      expect(result).toBeDefined();
      expect(result.some((c) => c.conflictType === 'overtime_violation')).toBe(true);
    });
  });

  describe('updateAssignmentStatus', () => {
    it('should update assignment status', async () => {
      jest.spyOn(assignmentRepository, 'findOne').mockResolvedValue(mockAssignment);
      jest.spyOn(assignmentRepository, 'save').mockResolvedValue({
        ...mockAssignment,
        status: 'cancelled',
      } as ShiftAssignment);

      const result = await service.updateAssignmentStatus(
        'assignment-1',
        'cancelled',
        'Worker called in sick',
      );

      expect(result).toBeDefined();
      expect(result.status).toBe('cancelled');
      expect(assignmentRepository.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('assignment.status.updated', expect.any(Object));
    });

    it('should throw error if assignment not found', async () => {
      jest.spyOn(assignmentRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateAssignmentStatus('invalid-id', 'cancelled'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculateRestHours', () => {
    it('should calculate rest hours between shifts', () => {
      const shift1 = {
        ...mockAssignment,
        date: new Date('2024-01-15'),
        shift: { ...mockShift, endTime: '16:00' },
      };
      const shift2 = {
        ...mockAssignment,
        date: new Date('2024-01-16'),
        shift: { ...mockShift, startTime: '08:00' },
      };

      const restHours = service['calculateRestHours'](shift1 as ShiftAssignment, shift2 as ShiftAssignment);

      expect(restHours).toBe(16); // 16:00 to 08:00 next day = 16 hours
    });

    it('should handle overnight shifts correctly', () => {
      const shift1 = {
        ...mockAssignment,
        date: new Date('2024-01-15'),
        shift: { ...mockShift, endTime: '23:00', isOvernight: false },
      };
      const shift2 = {
        ...mockAssignment,
        date: new Date('2024-01-16'),
        shift: { ...mockShift, startTime: '07:00' },
      };

      const restHours = service['calculateRestHours'](shift1 as ShiftAssignment, shift2 as ShiftAssignment);

      expect(restHours).toBe(8); // 23:00 to 07:00 next day = 8 hours
    });
  });
});