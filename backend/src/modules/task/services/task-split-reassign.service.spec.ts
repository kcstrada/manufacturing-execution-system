import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';
import { Repository } from 'typeorm';
import { TaskSplitReassignService } from './task-split-reassign.service';
import { TaskDependencyService } from './task-dependency.service';
import { TaskService } from './task.service';
import { TaskAssignmentService } from './task-assignment.service';
import { Task, TaskStatus, TaskPriority } from '../../../entities/task.entity';
import { TaskAssignment, AssignmentStatus } from '../../../entities/task-assignment.entity';
import { User } from '../../../entities/user.entity';
import { WorkCenter } from '../../../entities/work-center.entity';
import { TaskSplitConfigDto, BulkReassignConfigDto } from '../dto/task-split-reassign.dto';

describe('TaskSplitReassignService', () => {
  let service: TaskSplitReassignService;
  let taskRepository: Repository<Task>;
  let assignmentRepository: Repository<TaskAssignment>;
  let userRepository: Repository<User>;
  // let _workCenterRepository: Repository<WorkCenter>;
  // let dependencyService: TaskDependencyService;
  let eventEmitter: EventEmitter2;

  const mockTask = {
    id: 'task-1',
    name: 'Test Task',
    status: TaskStatus.PENDING,
    estimatedHours: 10,
    targetQuantity: 100,
    workCenterId: 'wc-1',
    dependencies: [],
    dependents: [],
    assignments: [],
  } as unknown as Task;

  const mockUser = {
    id: 'user-1',
    email: 'worker1@test.com',
    firstName: 'Worker',
    lastName: 'One',
  } as User;

  const mockAssignment = {
    id: 'assignment-1',
    taskId: 'task-1',
    userId: 'user-1',
    status: AssignmentStatus.PENDING,
    user: mockUser,
    task: mockTask,
  } as TaskAssignment;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskSplitReassignService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
            }),
          },
        },
        {
          provide: getRepositoryToken(TaskAssignment),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
              getOne: jest.fn().mockResolvedValue(null),
            }),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WorkCenter),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: TaskDependencyService,
          useValue: {
            addDependency: jest.fn(),
            preserveDependencies: jest.fn(),
            getTaskDependents: jest.fn().mockResolvedValue([]),
            removeDependency: jest.fn(),
          },
        },
        {
          provide: TaskService,
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: TaskAssignmentService,
          useValue: {
            assignTask: jest.fn(),
            unassignTask: jest.fn(),
            reassignTask: jest.fn(),
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
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TaskSplitReassignService>(TaskSplitReassignService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    assignmentRepository = module.get<Repository<TaskAssignment>>(
      getRepositoryToken(TaskAssignment),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    // _workCenterRepository = module.get<Repository<WorkCenter>>(
    //   getRepositoryToken(WorkCenter),
    // );
    // dependencyService = module.get<TaskDependencyService>(TaskDependencyService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('splitTaskWithAssignments', () => {
    it('should split a task into subtasks', async () => {
      const splitConfig: TaskSplitConfigDto = {
        taskId: 'task-1',
        subtasks: [
          {
            name: 'Subtask 1',
            estimatedHours: 5,
            targetQuantity: 50,
          },
          {
            name: 'Subtask 2',
            estimatedHours: 5,
            targetQuantity: 50,
          },
        ],
        preserveDependencies: true,
      };

      // const subtask1 = { ...mockTask, id: 'subtask-1', name: 'Subtask 1' };
      // const subtask2 = { ...mockTask, id: 'subtask-2', name: 'Subtask 2' };

      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask);
      jest.spyOn(taskRepository, 'create').mockImplementation((data: any) => ({
        ...mockTask,
        ...data,
        id: data.name === 'Subtask 1' ? 'subtask-1' : 'subtask-2',
      } as Task));
      jest.spyOn(taskRepository, 'save').mockImplementation(async (task: any) => task);
      jest.spyOn(taskRepository, 'update').mockResolvedValue({ affected: 1 } as any);
      // jest.spyOn(dependencyService, 'preserveDependencies').mockResolvedValue(undefined);

      const result = await service.splitTaskWithAssignments(splitConfig);

      expect(result).toHaveLength(2);
      expect(taskRepository.create).toHaveBeenCalledTimes(2);
      expect(taskRepository.save).toHaveBeenCalledTimes(2);
      expect(taskRepository.update).toHaveBeenCalledWith('task-1', {
        status: TaskStatus.CANCELLED,
      });
    });

    it('should throw error if task is already started', async () => {
      const splitConfig: TaskSplitConfigDto = {
        taskId: 'task-1',
        subtasks: [],
      };

      const startedTask = { ...mockTask, status: TaskStatus.IN_PROGRESS };
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(startedTask as Task);

      await expect(service.splitTaskWithAssignments(splitConfig)).rejects.toThrow(
        'Can only split tasks that have not started',
      );
    });
  });

  describe('bulkReassignTasks', () => {
    it('should reassign multiple tasks', async () => {
      const config: BulkReassignConfigDto = {
        taskIds: ['task-1', 'task-2'],
        toUserId: 'user-2',
        reason: 'Workload balancing',
        reassignedBy: 'admin',
      };

      const newUser = { ...mockUser, id: 'user-2', email: 'worker2@test.com' };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(newUser as User);
      jest.spyOn(assignmentRepository, 'find').mockResolvedValue([mockAssignment]);
      jest.spyOn(assignmentRepository, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(assignmentRepository, 'create').mockReturnValue({
        ...mockAssignment,
        userId: 'user-2',
      } as TaskAssignment);
      jest.spyOn(assignmentRepository, 'save').mockImplementation(async (a: any) => a);

      const result = await service.bulkReassignTasks(config);

      expect(result).toHaveLength(2);
      expect(result[0]?.success).toBe(true);
      expect(assignmentRepository.update).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('task.reassigned', expect.any(Object));
    });
  });

  describe('handleWorkerUnavailability', () => {
    it('should redistribute tasks from unavailable worker', async () => {
      const workerId = 'user-1';
      const reason = 'Sick leave';

      const activeAssignments = [mockAssignment];
      const availableWorkers = [
        { ...mockUser, id: 'user-2', email: 'worker2@test.com' },
        { ...mockUser, id: 'user-3', email: 'worker3@test.com' },
      ];

      jest.spyOn(assignmentRepository, 'find').mockResolvedValue(activeAssignments);
      jest.spyOn(userRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(availableWorkers),
      } as any);
      jest.spyOn(assignmentRepository, 'count').mockResolvedValue(2);
      jest.spyOn(assignmentRepository, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(assignmentRepository, 'create').mockReturnValue({
        ...mockAssignment,
        userId: 'user-2',
      } as TaskAssignment);
      jest.spyOn(assignmentRepository, 'save').mockImplementation(async (a: any) => a);

      const result = await service.handleWorkerUnavailability(workerId, reason);

      expect(result).toHaveLength(1);
      expect(result[0]?.success).toBe(true);
      expect(assignmentRepository.find).toHaveBeenCalledWith({
        where: {
          userId: workerId,
          status: AssignmentStatus.PENDING,
        },
        relations: ['task', 'user'],
      });
    });
  });

  describe('balanceWorkload', () => {
    it('should balance workload across workers', async () => {
      const config = {
        maxTasksPerWorker: 3,
      };

      const overloadedWorker = { ...mockUser, id: 'user-1' };
      const underloadedWorker = { ...mockUser, id: 'user-2' };

      jest.spyOn(userRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([overloadedWorker, underloadedWorker]),
      } as any);

      jest.spyOn(assignmentRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValueOnce(5).mockResolvedValueOnce(1),
      } as any);

      jest.spyOn(assignmentRepository, 'find').mockResolvedValue([
        mockAssignment,
        { ...mockAssignment, id: 'assignment-2' } as TaskAssignment,
      ]);

      jest.spyOn(assignmentRepository, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(assignmentRepository, 'create').mockReturnValue({
        ...mockAssignment,
        userId: 'user-2',
      } as TaskAssignment);
      jest.spyOn(assignmentRepository, 'save').mockImplementation(async (a: any) => a);

      const result = await service.balanceWorkload(config);

      expect(result.length).toBeGreaterThan(0);
      expect(eventEmitter.emit).toHaveBeenCalledWith('workload.balanced', expect.any(Object));
    });
  });

  describe('emergencyRedistribution', () => {
    it('should redistribute urgent tasks', async () => {
      const config = {
        priority: TaskPriority.URGENT,
      };

      const urgentTask = { ...mockTask, priority: TaskPriority.URGENT };
      const urgentAssignment = { ...mockAssignment, task: urgentTask };

      jest.spyOn(assignmentRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([urgentAssignment]),
      } as any);

      jest.spyOn(userRepository, 'createQueryBuilder').mockReturnValue({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { ...mockUser, id: 'user-2' },
        ]),
      } as any);

      jest.spyOn(assignmentRepository, 'count').mockResolvedValue(0);
      jest.spyOn(assignmentRepository, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(assignmentRepository, 'create').mockReturnValue({
        ...urgentAssignment,
        userId: 'user-2',
      } as TaskAssignment);
      jest.spyOn(assignmentRepository, 'save').mockImplementation(async (a: any) => a);

      const result = await service.emergencyRedistribution(config);

      expect(result).toHaveLength(1);
      expect(result[0]?.success).toBe(true);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'emergency.redistribution',
        expect.any(Object),
      );
    });
  });

  // reassignTask test removed - method doesn't exist in service
});