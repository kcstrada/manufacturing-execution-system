import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskAssignmentService } from './task-assignment.service';
import { TaskDependencyService } from './task-dependency.service';
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskType,
} from '../../../entities/task.entity';
import {
  TaskAssignment,
  AssignmentStatus,
  AssignmentMethod,
} from '../../../entities/task-assignment.entity';
import { User } from '../../../entities/user.entity';
import { WorkCenter } from '../../../entities/work-center.entity';

describe('TaskService', () => {
  let service: TaskService;
  let taskRepository: Repository<Task>;
  let assignmentRepository: Repository<TaskAssignment>;
  let userRepository: Repository<User>;
  let assignmentService: TaskAssignmentService;
  let eventEmitter: EventEmitter2;

  const mockTask: Partial<Task> = {
    id: 'task-1',
    taskNumber: 'TSK-000001',
    name: 'Test Task',
    type: TaskType.PRODUCTION,
    status: TaskStatus.PENDING,
    priority: TaskPriority.NORMAL,
    workOrderId: 'wo-1',
    sequenceNumber: 1,
    estimatedHours: 8,
    targetQuantity: 100,
    completedQuantity: 0,
    progressPercentage: 0,
  };

  const mockUser: Partial<User> = {
    id: 'user-1',
    email: 'worker@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockAssignment: Partial<TaskAssignment> = {
    id: 'assignment-1',
    taskId: 'task-1',
    userId: 'user-1',
    status: AssignmentStatus.PENDING,
    assignmentMethod: AssignmentMethod.MANUAL,
    assignedAt: new Date(),
    priority: 50,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TaskAssignment),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(WorkCenter),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: TaskAssignmentService,
          useValue: {
            findBestSkillMatch: jest.fn(),
            findLeastLoadedUser: jest.fn(),
            findNextInRotation: jest.fn(),
            findByPriority: jest.fn(),
            findNearestUser: jest.fn(),
            calculateSkillMatch: jest.fn(),
            getUserWorkload: jest.fn(),
          },
        },
        {
          provide: TaskDependencyService,
          useValue: {
            validateDependencies: jest.fn(),
            checkDependenciesComplete: jest.fn().mockResolvedValue(true),
            getTaskDependencies: jest.fn(),
            addDependency: jest.fn(),
            removeDependency: jest.fn(),
            cascadeCompletionUpdate: jest.fn().mockResolvedValue(undefined),
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
            get: jest.fn().mockReturnValue('test-tenant'),
          },
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    assignmentRepository = module.get<Repository<TaskAssignment>>(
      getRepositoryToken(TaskAssignment),
    );
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    assignmentService = module.get<TaskAssignmentService>(
      TaskAssignmentService,
    );
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const createDto = {
        name: 'New Task',
        type: TaskType.PRODUCTION,
        priority: TaskPriority.HIGH,
        workOrderId: 'wo-1',
        sequenceNumber: 1,
        estimatedHours: 4,
        targetQuantity: 50,
      };

      jest.spyOn(taskRepository, 'count').mockResolvedValue(0);
      jest.spyOn(taskRepository, 'create').mockReturnValue(mockTask as Task);
      jest.spyOn(taskRepository, 'save').mockResolvedValue(mockTask as Task);

      const result = await service.create(createDto);

      expect(result).toEqual(mockTask);
      expect(taskRepository.create).toHaveBeenCalledWith({
        ...createDto,
        tenantId: 'test-tenant',
        taskNumber: 'TSK-000001',
        status: TaskStatus.PENDING,
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith('task.created', {
        task: mockTask,
      });
    });

    it('should auto-assign task if configured', async () => {
      const createDto = {
        name: 'New Task',
        type: TaskType.PRODUCTION,
        priority: TaskPriority.HIGH,
        workOrderId: 'wo-1',
        sequenceNumber: 1,
        estimatedHours: 4,
        targetQuantity: 50,
        autoAssign: true,
      };

      jest.spyOn(taskRepository, 'count').mockResolvedValue(0);
      jest.spyOn(taskRepository, 'create').mockReturnValue(mockTask as Task);
      jest.spyOn(taskRepository, 'save').mockResolvedValue(mockTask as Task);
      jest
        .spyOn(assignmentService, 'findLeastLoadedUser')
        .mockResolvedValue(mockUser as User);
      jest
        .spyOn(assignmentRepository, 'create')
        .mockReturnValue(mockAssignment as TaskAssignment);
      jest
        .spyOn(assignmentRepository, 'save')
        .mockResolvedValue(mockAssignment as TaskAssignment);

      await service.create(createDto);

      expect(assignmentService.findLeastLoadedUser).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateDto = {
        name: 'Updated Task',
        priority: TaskPriority.URGENT,
      };

      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as Task);
      jest.spyOn(taskRepository, 'save').mockResolvedValue({
        ...mockTask,
        ...updateDto,
      } as Task);

      const result = await service.update('task-1', updateDto);

      expect(result.name).toBe('Updated Task');
      expect(result.priority).toBe(TaskPriority.URGENT);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'task.updated',
        expect.any(Object),
      );
    });

    it('should validate status transition', async () => {
      const completedTask = {
        ...mockTask,
        status: TaskStatus.COMPLETED,
      } as Task;
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(completedTask);

      await expect(
        service.update('task-1', { status: TaskStatus.IN_PROGRESS }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update progress percentage based on quantities', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as Task);
      jest
        .spyOn(taskRepository, 'save')
        .mockImplementation((task) => Promise.resolve(task as Task));

      const result = await service.update('task-1', { completedQuantity: 50 });

      expect(result.progressPercentage).toBe(50);
    });
  });

  describe('assignTask', () => {
    it('should manually assign task to user', async () => {
      const assignDto = {
        userId: 'user-1',
        assignedById: 'manager-1',
        priority: 75,
        notes: 'High priority task',
      };

      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as Task);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(mockUser as User);
      jest
        .spyOn(assignmentRepository, 'create')
        .mockReturnValue(mockAssignment as TaskAssignment);
      jest
        .spyOn(assignmentRepository, 'save')
        .mockResolvedValue(mockAssignment as TaskAssignment);
      jest.spyOn(taskRepository, 'save').mockResolvedValue({
        ...mockTask,
        assignedToId: 'user-1',
      } as Task);

      const result = await service.assignTask('task-1', assignDto);

      expect(result).toEqual(mockAssignment);
      expect(assignmentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task-1',
          userId: 'user-1',
          status: AssignmentStatus.PENDING,
          assignmentMethod: AssignmentMethod.MANUAL,
        }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'task.assigned',
        expect.any(Object),
      );
    });

    it('should throw error if user not found', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as Task);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.assignTask('task-1', { userId: 'invalid-user' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('autoAssignTask', () => {
    it.skip('should auto-assign task based on skill matching', async () => {
      const taskWithSkills = {
        ...mockTask,
        requiredSkills: ['welding', 'assembly'],
      } as Task;

      jest
        .spyOn(assignmentService, 'findBestSkillMatch')
        .mockResolvedValue(mockUser as User);
      jest
        .spyOn(assignmentService, 'calculateSkillMatch')
        .mockResolvedValue(85);
      jest.spyOn(assignmentService, 'getUserWorkload').mockResolvedValue(3);
      jest
        .spyOn(assignmentRepository, 'create')
        .mockReturnValue(mockAssignment as TaskAssignment);
      jest
        .spyOn(assignmentRepository, 'save')
        .mockResolvedValue(mockAssignment as TaskAssignment);
      jest.spyOn(taskRepository, 'save').mockResolvedValue(taskWithSkills);

      const result = await service.autoAssignTask(taskWithSkills);

      expect(assignmentService.findBestSkillMatch).toHaveBeenCalledWith(
        taskWithSkills.requiredSkills,
        expect.objectContaining({
          taskType: taskWithSkills.type,
          priority: taskWithSkills.priority,
        }),
      );
      expect(result).toEqual(mockAssignment);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'task.auto-assigned',
        expect.any(Object),
      );
    });

    it('should return null if no suitable user found', async () => {
      jest
        .spyOn(assignmentService, 'findLeastLoadedUser')
        .mockResolvedValue(null);

      const result = await service.autoAssignTask(mockTask as Task);

      expect(result).toBeNull();
    });
  });

  describe('startTask', () => {
    it('should start a task', async () => {
      const readyTask = {
        ...mockTask,
        status: TaskStatus.READY,
        dependencies: [],
      } as unknown as Task;
      const assignment = {
        ...mockAssignment,
        status: AssignmentStatus.PENDING,
      } as TaskAssignment;

      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(readyTask);
      jest.spyOn(assignmentRepository, 'findOne').mockResolvedValue(assignment);
      jest.spyOn(assignmentRepository, 'save').mockResolvedValue({
        ...assignment,
        status: AssignmentStatus.IN_PROGRESS,
        startedAt: new Date(),
      } as TaskAssignment);
      jest.spyOn(taskRepository, 'save').mockResolvedValue({
        ...readyTask,
        status: TaskStatus.IN_PROGRESS,
        actualStartDate: new Date(),
      } as Task);

      const result = await service.startTask('task-1', 'user-1');

      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
      expect(result.actualStartDate).toBeDefined();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'task.started',
        expect.any(Object),
      );
    });

    it('should throw error if task has incomplete dependencies', async () => {
      const taskWithDeps = {
        ...mockTask,
        status: TaskStatus.READY,
        dependencies: [{ id: 'dep-1', status: TaskStatus.IN_PROGRESS }],
      } as Task;

      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(taskWithDeps);

      await expect(service.startTask('task-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('completeTask', () => {
    it('should complete a task', async () => {
      const inProgressTask = {
        ...mockTask,
        status: TaskStatus.IN_PROGRESS,
        actualStartDate: new Date(Date.now() - 3600000), // 1 hour ago
      } as Task;
      const assignment = {
        ...mockAssignment,
        status: AssignmentStatus.IN_PROGRESS,
      } as TaskAssignment;

      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(inProgressTask);
      jest.spyOn(assignmentRepository, 'findOne').mockResolvedValue(assignment);
      jest.spyOn(assignmentRepository, 'save').mockResolvedValue({
        ...assignment,
        status: AssignmentStatus.COMPLETED,
        completedAt: new Date(),
      } as TaskAssignment);
      jest.spyOn(taskRepository, 'save').mockResolvedValue({
        ...inProgressTask,
        status: TaskStatus.COMPLETED,
        actualEndDate: new Date(),
        progressPercentage: 100,
      } as Task);
      jest
        .spyOn(taskRepository, 'find')
        .mockResolvedValue([inProgressTask] as Task[]);

      const result = await service.completeTask(
        'task-1',
        'user-1',
        'Task completed',
      );

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.progressPercentage).toBe(100);
      expect(result.actualEndDate).toBeDefined();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'task.completed',
        expect.any(Object),
      );
    });

    it('should throw error if task not in progress', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as Task);

      await expect(service.completeTask('task-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateProgress', () => {
    it('should update task progress', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as Task);
      jest
        .spyOn(taskRepository, 'save')
        .mockImplementation((task) => Promise.resolve(task as Task));

      const result = await service.updateProgress('task-1', 75, 5);

      expect(result.completedQuantity).toBe(75);
      expect(result.rejectedQuantity).toBe(5);
      expect(result.progressPercentage).toBe(75);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'task.progress-updated',
        expect.any(Object),
      );
    });

    it('should auto-complete task at 100% progress', async () => {
      jest.spyOn(taskRepository, 'findOne').mockResolvedValue(mockTask as Task);
      jest
        .spyOn(taskRepository, 'save')
        .mockImplementation((task) => Promise.resolve(task as Task));

      const result = await service.updateProgress('task-1', 100);

      expect(result.status).toBe(TaskStatus.COMPLETED);
      expect(result.actualEndDate).toBeDefined();
    });
  });

  describe('getUserTasks', () => {
    it('should return user tasks', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockTask]),
      };

      jest
        .spyOn(taskRepository, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as any);

      const result = await service.getUserTasks(
        'user-1',
        TaskStatus.IN_PROGRESS,
      );

      expect(result).toEqual([mockTask]);
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'task.assignedToId = :userId',
        { userId: 'user-1' },
      );
    });
  });

  describe('getOverdueTasks', () => {
    it('should return overdue tasks', async () => {
      const overdueTask = {
        ...mockTask,
        dueDate: new Date(Date.now() - 86400000), // 1 day ago
      } as Task;

      jest.spyOn(taskRepository, 'find').mockResolvedValue([overdueTask]);

      const result = await service.getOverdueTasks();

      expect(result).toEqual([overdueTask]);
      expect(taskRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: expect.any(Object),
          }),
        }),
      );
    });
  });
});
