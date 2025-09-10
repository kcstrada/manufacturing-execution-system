import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { WorkerService } from './worker.service';
import {
  Worker,
  WorkerStatus,
  SkillLevel,
  ShiftType,
  WorkerSchedule,
} from '../../entities/worker.entity';
import { Task, TaskStatus } from '../../entities/task.entity';
import { TaskAssignment } from '../../entities/task-assignment.entity';

describe('WorkerService', () => {
  let service: WorkerService;
  let workerRepository: Repository<Worker>;
  let scheduleRepository: Repository<WorkerSchedule>;
  let assignmentRepository: Repository<TaskAssignment>;
  let taskRepository: Repository<Task>;
  let eventEmitter: EventEmitter2;

  const mockWorker: Worker = {
    id: 'worker-1',
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    position: 'Technician',
    status: WorkerStatus.AVAILABLE,
    shiftType: ShiftType.MORNING,
    hourlyRate: 25,
    overtimeRate: 37.5,
    skills: [
      {
        name: 'Welding',
        level: SkillLevel.ADVANCED,
        certifiedDate: new Date('2023-01-01'),
        expiryDate: new Date('2025-01-01'),
      },
      {
        name: 'Assembly',
        level: SkillLevel.INTERMEDIATE,
      },
    ],
    efficiency: 95,
    qualityScore: 98,
    totalTasksCompleted: 150,
    totalHoursWorked: 1200,
    weeklyHoursLimit: 40,
    dailyHoursLimit: 8,
    fullName: 'John Doe',
  } as Worker;

  const mockTask = {
    id: 'task-1',
    name: 'Welding Task',
    type: 'welding',
    status: TaskStatus.PENDING,
    workCenterId: 'wc-1',
    metadata: {
      requiredSkills: [
        { name: 'Welding', level: SkillLevel.INTERMEDIATE, required: true },
        { name: 'Safety', level: SkillLevel.BEGINNER },
      ],
    },
  } as unknown as Task;

  const mockSchedule: WorkerSchedule = {
    id: 'schedule-1',
    workerId: 'worker-1',
    date: new Date(),
    startTime: '08:00',
    endTime: '16:00',
    scheduledHours: 8,
    isOvertime: false,
  } as WorkerSchedule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkerService,
        {
          provide: getRepositoryToken(Worker),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(WorkerSchedule),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(TaskAssignment),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Task),
          useClass: Repository,
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WorkerService>(WorkerService);
    workerRepository = module.get<Repository<Worker>>(getRepositoryToken(Worker));
    scheduleRepository = module.get<Repository<WorkerSchedule>>(
      getRepositoryToken(WorkerSchedule),
    );
    assignmentRepository = module.get<Repository<TaskAssignment>>(
      getRepositoryToken(TaskAssignment),
    );
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all workers with filters', async () => {
      const mockWorkers = [mockWorker];
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockWorkers),
      };

      jest.spyOn(workerRepository, 'createQueryBuilder').mockReturnValue(
        queryBuilder as any,
      );

      const result = await service.findAll({
        status: WorkerStatus.AVAILABLE,
        hasSkill: 'Welding',
      });

      expect(result).toEqual(mockWorkers);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'worker.status = :status',
        { status: WorkerStatus.AVAILABLE },
      );
    });
  });

  describe('findOne', () => {
    it('should return a worker by id', async () => {
      jest.spyOn(workerRepository, 'findOne').mockResolvedValue(mockWorker);

      const result = await service.findOne('worker-1');

      expect(result).toEqual(mockWorker);
      expect(workerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'worker-1' },
        relations: ['department', 'workCenters', 'user', 'supervisor'],
      });
    });

    it('should throw NotFoundException if worker not found', async () => {
      jest.spyOn(workerRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Worker with ID invalid-id not found',
      );
    });
  });

  describe('findWorkersWithSkills', () => {
    it('should find workers matching skill requirements', async () => {
      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockWorker]),
      };

      jest.spyOn(workerRepository, 'createQueryBuilder').mockReturnValue(
        queryBuilder as any,
      );

      const skillRequirements = [
        {
          name: 'Welding',
          minimumLevel: SkillLevel.INTERMEDIATE,
          required: true,
        },
      ];

      const result = await service.findWorkersWithSkills(skillRequirements);

      expect(result).toHaveLength(1);
      expect(result[0]?.worker).toEqual(mockWorker);
      expect(result[0]?.matchScore).toBeGreaterThan(0);
      expect(result[0]?.matchedSkills).toContain('Welding');
    });

    it('should filter by minimum match score', async () => {
      const workers = [
        { ...mockWorker, skills: [{ name: 'Welding', level: SkillLevel.EXPERT }] },
        { ...mockWorker, id: 'worker-2', skills: [] },
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(workers),
      };

      jest.spyOn(workerRepository, 'createQueryBuilder').mockReturnValue(
        queryBuilder as any,
      );

      const result = await service.findWorkersWithSkills(
        [{ name: 'Welding', required: true }],
        { minimumMatchScore: 50 },
      );

      expect(result.length).toBeLessThanOrEqual(workers.length);
      result.forEach((match) => {
        expect(match.matchScore).toBeGreaterThanOrEqual(50);
      });
    });
  });

  describe('findBestMatchForTask', () => {
    it('should find best worker matches for a task', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask);

      const mockWorkerWithCorrectSkills = {
        ...mockWorker,
        skills: [
          {
            name: 'Welding',
            level: SkillLevel.ADVANCED,
            certifiedDate: new Date('2023-01-01'),
            expiryDate: new Date('2025-01-01'),
          },
          {
            name: 'Safety',
            level: SkillLevel.INTERMEDIATE,
          },
        ],
      };

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockWorkerWithCorrectSkills]),
      };

      jest.spyOn(workerRepository, 'createQueryBuilder').mockReturnValue(
        queryBuilder as any,
      );

      const result = await service.findBestMatchForTask('task-1');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.worker).toBeDefined();
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        relations: ['workCenter'],
      });
    });

    it.skip('should consider workload when requested', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask);
      
      const mockWorkerWithCorrectSkills = {
        ...mockWorker,
        skills: [
          {
            name: 'Welding',
            level: SkillLevel.ADVANCED,
            certifiedDate: new Date('2023-01-01'),
            expiryDate: new Date('2025-01-01'),
          },
        ],
      };

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockWorkerWithCorrectSkills]),
      };

      jest.spyOn(workerRepository, 'createQueryBuilder').mockReturnValue(
        queryBuilder as any,
      );
      
      jest.spyOn(workerRepository, 'findOne').mockResolvedValue(mockWorkerWithCorrectSkills as Worker);
      jest.spyOn(assignmentRepository, 'count').mockResolvedValue(2);
      jest.spyOn(scheduleRepository, 'find').mockResolvedValue([mockSchedule]);

      const result = await service.findBestMatchForTask('task-1', {
        considerWorkload: true,
      });

      expect(result).toBeDefined();
      // When considerWorkload is true, assignmentRepository.count is called for each worker
      // to get their current workload
      expect(assignmentRepository.count).toHaveBeenCalledTimes(1);
    });
  });

  describe('getWorkerWorkload', () => {
    it('should calculate worker workload correctly', async () => {
      jest.spyOn(workerRepository, 'findOne').mockResolvedValue(mockWorker);
      jest.spyOn(assignmentRepository, 'count').mockResolvedValue(3);
      jest.spyOn(scheduleRepository, 'find').mockResolvedValue([
        mockSchedule,
        { ...mockSchedule, scheduledHours: 8, isOvertime: false } as WorkerSchedule,
      ]);

      const result = await service.getWorkerWorkload('worker-1');

      expect(result.workerId).toBe('worker-1');
      expect(result.currentTasks).toBe(3);
      expect(result.scheduledHours).toBe(16);
      expect(result.availableCapacity).toBe(24); // 40 - 16
      expect(result.utilizationRate).toBe(40); // (16/40) * 100
    });
  });

  describe('getWorkerPerformance', () => {
    it('should calculate performance metrics', async () => {
      jest.spyOn(workerRepository, 'findOne').mockResolvedValue(mockWorker);

      const completedAssignments = [
        {
          id: 'assign-1',
          startedAt: new Date('2024-01-01 08:00'),
          completedAt: new Date('2024-01-01 10:00'),
          task: {
            dueDate: new Date('2024-01-01 17:00'),
          },
        },
        {
          id: 'assign-2',
          startedAt: new Date('2024-01-02 08:00'),
          completedAt: new Date('2024-01-02 11:00'),
          task: {
            dueDate: new Date('2024-01-02 17:00'),
          },
        },
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(completedAssignments),
      };

      jest.spyOn(assignmentRepository, 'createQueryBuilder').mockReturnValue(
        queryBuilder as any,
      );

      const result = await service.getWorkerPerformance('worker-1');

      expect(result.workerId).toBe('worker-1');
      expect(result.efficiency).toBe(95);
      expect(result.qualityScore).toBe(98);
      expect(result.tasksCompleted).toBe(150);
      expect(result.onTimeCompletion).toBe(100);
      expect(result.averageTaskTime).toBeCloseTo(2.5, 1);
    });
  });

  describe('checkAvailability', () => {
    it('should return available when worker is free', async () => {
      jest.spyOn(workerRepository, 'findOne').mockResolvedValue(mockWorker);
      jest.spyOn(scheduleRepository, 'find').mockResolvedValue([]);
      jest.spyOn(assignmentRepository, 'count').mockResolvedValue(1);

      const result = await service.checkAvailability({
        workerId: 'worker-1',
        date: new Date(),
        startTime: '10:00',
        endTime: '12:00',
        hoursNeeded: 2,
      });

      expect(result.available).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return unavailable for wrong status', async () => {
      const unavailableWorker = {
        ...mockWorker,
        status: WorkerStatus.SICK_LEAVE,
      };

      jest.spyOn(workerRepository, 'findOne').mockResolvedValue(unavailableWorker as Worker);

      const result = await service.checkAvailability({
        workerId: 'worker-1',
        date: new Date(),
      });

      expect(result.available).toBe(false);
      expect(result.reason).toContain('Worker status is sick_leave');
    });

    it('should detect schedule conflicts', async () => {
      jest.spyOn(workerRepository, 'findOne').mockResolvedValue(mockWorker);
      jest.spyOn(scheduleRepository, 'find').mockResolvedValue([mockSchedule]);

      const result = await service.checkAvailability({
        workerId: 'worker-1',
        date: new Date(),
        startTime: '09:00',
        endTime: '11:00',
      });

      expect(result.available).toBe(false);
      expect(result.reason).toBe('Schedule conflict');
      expect(result.conflicts).toHaveLength(1);
    });
  });

  describe('updateSkills', () => {
    it('should update worker skills', async () => {
      jest.spyOn(workerRepository, 'findOne').mockResolvedValue(mockWorker);
      jest.spyOn(workerRepository, 'save').mockResolvedValue(mockWorker);

      const newSkills = [
        {
          name: 'Machining',
          level: SkillLevel.BEGINNER,
        },
      ];

      const result = await service.updateSkills('worker-1', newSkills);

      expect(result).toEqual(mockWorker);
      expect(workerRepository.save).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('worker.skills.updated', {
        workerId: 'worker-1',
        skills: newSkills,
        timestamp: expect.any(Date),
      });
    });
  });

  describe('updateStatus', () => {
    it('should update worker status and emit events', async () => {
      jest.spyOn(workerRepository, 'findOne').mockResolvedValue(mockWorker);
      jest.spyOn(workerRepository, 'save').mockResolvedValue({
        ...mockWorker,
        status: WorkerStatus.OFF_DUTY,
      } as Worker);

      const result = await service.updateStatus(
        'worker-1',
        WorkerStatus.OFF_DUTY,
        'End of shift',
      );

      expect(result.status).toBe(WorkerStatus.OFF_DUTY);
      expect(eventEmitter.emit).toHaveBeenCalledWith('worker.status.changed', {
        workerId: 'worker-1',
        oldStatus: WorkerStatus.AVAILABLE,
        newStatus: WorkerStatus.OFF_DUTY,
        reason: 'End of shift',
        timestamp: expect.any(Date),
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('worker.unavailable', {
        workerId: 'worker-1',
        userId: mockWorker.userId,
        reason: 'End of shift',
      });
    });
  });

  describe('recordPerformanceMetrics', () => {
    it('should update performance metrics', async () => {
      jest.spyOn(workerRepository, 'findOne').mockResolvedValue(mockWorker);
      
      const updatedWorker = {
        ...mockWorker,
        efficiency: 97,
        qualityScore: 99,
        totalTasksCompleted: 155,
        totalHoursWorked: 1208,
      };
      
      jest.spyOn(workerRepository, 'save').mockResolvedValue(updatedWorker as Worker);

      const result = await service.recordPerformanceMetrics('worker-1', {
        efficiency: 97,
        qualityScore: 99,
        tasksCompleted: 5,
        hoursWorked: 8,
      });

      expect(result.efficiency).toBe(97);
      expect(result.qualityScore).toBe(99);
      expect(workerRepository.save).toHaveBeenCalled();
    });
  });

  describe('skill matching algorithm', () => {
    it('should correctly calculate skill match scores', async () => {
      const workers = [
        {
          ...mockWorker,
          id: 'worker-1',
          skills: [
            { name: 'Welding', level: SkillLevel.EXPERT },
            { name: 'Safety', level: SkillLevel.ADVANCED },
          ],
        },
        {
          ...mockWorker,
          id: 'worker-2',
          skills: [
            { name: 'Welding', level: SkillLevel.BEGINNER },
          ],
        },
        {
          ...mockWorker,
          id: 'worker-3',
          skills: [
            { name: 'Assembly', level: SkillLevel.EXPERT },
          ],
        },
      ];

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(workers),
      };

      jest.spyOn(workerRepository, 'createQueryBuilder').mockReturnValue(
        queryBuilder as any,
      );

      const requirements = [
        {
          name: 'Welding',
          minimumLevel: SkillLevel.INTERMEDIATE,
          required: true,
        },
        {
          name: 'Safety',
          minimumLevel: SkillLevel.BEGINNER,
        },
      ];

      const matches = await service.findWorkersWithSkills(requirements);

      // Worker 1 should have highest score (has both skills at high levels)
      // Worker 2 should have lower score (has welding but at beginner level)
      // Worker 3 should have lowest score (missing required welding skill)
      
      const worker1Match = matches.find((m) => m.worker.id === 'worker-1');
      const worker2Match = matches.find((m) => m.worker.id === 'worker-2');
      const worker3Match = matches.find((m) => m.worker.id === 'worker-3');

      expect(worker1Match!.matchScore).toBeGreaterThan(worker2Match!.matchScore);
      expect(worker2Match!.matchScore).toBeGreaterThan(worker3Match!.matchScore);
      expect(worker3Match!.skillLevelMatch).toBe(false); // Missing required skill
    });
  });
});