import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TaskDependencyService } from './task-dependency.service';
import { Task, TaskStatus } from '../../../entities/task.entity';

describe('TaskDependencyService', () => {
  let service: TaskDependencyService;

  const mockTaskRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockClsService = {
    get: jest.fn().mockReturnValue('test-tenant'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskDependencyService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: ClsService,
          useValue: mockClsService,
        },
      ],
    }).compile();

    service = module.get<TaskDependencyService>(TaskDependencyService);

    jest.clearAllMocks();
  });

  describe('addDependency', () => {
    it('should add a dependency successfully', async () => {
      const taskId = 'task-1';
      const dependsOnTaskId = 'task-2';
      const workOrderId = 'wo-1';

      const task = {
        id: taskId,
        taskNumber: 'TSK-001',
        workOrderId,
        dependencies: [],
        status: TaskStatus.PENDING,
      } as unknown as Task;

      const dependsOnTask = {
        id: dependsOnTaskId,
        taskNumber: 'TSK-002',
        workOrderId,
        status: TaskStatus.PENDING,
      } as unknown as Task;

      mockTaskRepository.findOne
        .mockResolvedValueOnce(task)
        .mockResolvedValueOnce(dependsOnTask);

      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockTaskRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      mockTaskRepository.save.mockResolvedValue({
        ...task,
        dependencies: [dependsOnTask],
      });

      const result = await service.addDependency(taskId, dependsOnTaskId);

      expect(result.dependencies).toContain(dependsOnTask);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'task.dependency-added',
        expect.objectContaining({
          task: expect.objectContaining({ id: taskId }),
          dependsOn: dependsOnTask,
        })
      );
    });

    it('should throw error when task depends on itself', async () => {
      const taskId = 'task-1';

      await expect(service.addDependency(taskId, taskId)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw error when dependency already exists', async () => {
      const taskId = 'task-1';
      const dependsOnTaskId = 'task-2';

      const task = {
        id: taskId,
        dependencies: [{ id: dependsOnTaskId }],
      } as unknown as Task;

      const dependsOnTask = {
        id: dependsOnTaskId,
      } as unknown as Task;

      mockTaskRepository.findOne
        .mockResolvedValueOnce(task)
        .mockResolvedValueOnce(dependsOnTask);

      await expect(service.addDependency(taskId, dependsOnTaskId)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw error when tasks are in different work orders', async () => {
      const taskId = 'task-1';
      const dependsOnTaskId = 'task-2';

      const task = {
        id: taskId,
        workOrderId: 'wo-1',
        dependencies: [],
      } as unknown as Task;

      const dependsOnTask = {
        id: dependsOnTaskId,
        workOrderId: 'wo-2',
      } as unknown as Task;

      mockTaskRepository.findOne
        .mockResolvedValueOnce(task)
        .mockResolvedValueOnce(dependsOnTask);

      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockTaskRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await expect(service.addDependency(taskId, dependsOnTaskId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('removeDependency', () => {
    it('should remove a dependency successfully', async () => {
      const taskId = 'task-1';
      const dependsOnTaskId = 'task-2';

      const task = {
        id: taskId,
        dependencies: [
          { id: dependsOnTaskId, taskNumber: 'TSK-002' },
          { id: 'task-3', taskNumber: 'TSK-003' },
        ],
      } as unknown as Task;

      mockTaskRepository.findOne.mockResolvedValue(task);
      mockTaskRepository.save.mockResolvedValue({
        ...task,
        dependencies: [{ id: 'task-3', taskNumber: 'TSK-003' }],
      });

      const result = await service.removeDependency(taskId, dependsOnTaskId);

      expect(result.dependencies).not.toContainEqual(
        expect.objectContaining({ id: dependsOnTaskId })
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'task.dependency-removed',
        expect.objectContaining({
          task: expect.objectContaining({ id: taskId }),
          removedDependencyId: dependsOnTaskId,
        })
      );
    });

    it('should throw error when dependency not found', async () => {
      const taskId = 'task-1';
      const dependsOnTaskId = 'task-2';

      const task = {
        id: taskId,
        dependencies: [{ id: 'task-3' }],
      } as unknown as Task;

      mockTaskRepository.findOne.mockResolvedValue(task);

      await expect(service.removeDependency(taskId, dependsOnTaskId)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getTaskDependencies', () => {
    it('should return direct dependencies', async () => {
      const taskId = 'task-1';
      const dependencies = [
        { id: 'task-2', taskNumber: 'TSK-002' },
        { id: 'task-3', taskNumber: 'TSK-003' },
      ] as unknown as Task[];

      const task = {
        id: taskId,
        dependencies,
      } as unknown as Task;

      mockTaskRepository.findOne.mockResolvedValue(task);

      const result = await service.getTaskDependencies(taskId, false);

      expect(result).toEqual(dependencies);
    });

    it('should return transitive dependencies', async () => {
      const taskId = 'task-1';
      
      const task1 = {
        id: taskId,
        dependencies: [
          { id: 'task-2', taskNumber: 'TSK-002' } as unknown as Task,
        ],
      } as unknown as Task;

      const task2 = {
        id: 'task-2',
        dependencies: [
          { id: 'task-3', taskNumber: 'TSK-003' } as unknown as Task,
        ],
      } as unknown as Task;

      const task3 = {
        id: 'task-3',
        dependencies: [],
      } as unknown as Task;

      mockTaskRepository.findOne
        .mockResolvedValueOnce(task1)
        .mockResolvedValueOnce(task2)
        .mockResolvedValueOnce(task3);

      const result = await service.getTaskDependencies(taskId, true);

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(
        expect.objectContaining({ id: 'task-2' })
      );
      expect(result).toContainEqual(
        expect.objectContaining({ id: 'task-3' })
      );
    });
  });

  describe('validateDependencies', () => {
    it('should validate dependencies successfully', async () => {
      const workOrderId = 'wo-1';
      
      const tasks = [
        {
          id: 'task-1',
          taskNumber: 'TSK-001',
          workOrderId,
          status: TaskStatus.COMPLETED,
          dependencies: [],
        },
        {
          id: 'task-2',
          taskNumber: 'TSK-002',
          workOrderId,
          status: TaskStatus.PENDING,
          dependencies: [{ id: 'task-1' }],
        },
      ] as unknown as Task[];

      mockTaskRepository.find.mockResolvedValue(tasks);

      const result = await service.validateDependencies(workOrderId);

      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.readyTasks).toContainEqual(
        expect.objectContaining({ id: 'task-2' })
      );
    });

    it('should detect circular dependencies', async () => {
      const workOrderId = 'wo-1';
      
      const task1 = {
        id: 'task-1',
        taskNumber: 'TSK-001',
        workOrderId,
        status: TaskStatus.PENDING,
        dependencies: [],
      } as unknown as Task;

      const task2 = {
        id: 'task-2',
        taskNumber: 'TSK-002',
        workOrderId,
        status: TaskStatus.PENDING,
        dependencies: [],
      } as unknown as Task;

      // Create circular dependency
      task1.dependencies = [task2];
      task2.dependencies = [task1];

      const tasks = [task1, task2];

      mockTaskRepository.find.mockResolvedValue(tasks);

      const result = await service.validateDependencies(workOrderId);

      expect(result.isValid).toBe(false);
      expect(result.issues[0]).toContain('circular dependency');
      expect(result.circularDependencies).toBeDefined();
    });
  });

  describe('cascadeCompletionUpdate', () => {
    it('should update dependent tasks to ready status', async () => {
      const completedTaskId = 'task-1';
      
      const dependentTask = {
        id: 'task-2',
        taskNumber: 'TSK-002',
        status: TaskStatus.PENDING,
        dependencies: [
          { id: completedTaskId, status: TaskStatus.COMPLETED },
        ],
      } as unknown as Task;

      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([dependentTask]),
      };
      mockTaskRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      mockTaskRepository.findOne.mockResolvedValue(dependentTask);
      mockTaskRepository.save.mockResolvedValue({
        ...dependentTask,
        status: TaskStatus.READY,
      });

      const result = await service.cascadeCompletionUpdate(completedTaskId);

      expect(result).toHaveLength(1);
      expect(result[0]?.status).toBe(TaskStatus.READY);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'task.ready',
        expect.objectContaining({
          task: expect.objectContaining({ status: TaskStatus.READY }),
        })
      );
    });
  });

  describe('getCriticalPath', () => {
    it.skip('should calculate critical path correctly', async () => {
      const workOrderId = 'wo-1';
      
      // Create tasks with dependency references by ID only
      const tasks = [
        {
          id: 'task-1',
          taskNumber: 'TSK-001',
          workOrderId,
          estimatedHours: 2,
          dependencies: [],
        },
        {
          id: 'task-2',
          taskNumber: 'TSK-002',
          workOrderId,
          estimatedHours: 3,
          dependencies: [{ id: 'task-1' }],
        },
        {
          id: 'task-3',
          taskNumber: 'TSK-003',
          workOrderId,
          estimatedHours: 1,
          dependencies: [{ id: 'task-1' }],
        },
        {
          id: 'task-4',
          taskNumber: 'TSK-004',
          workOrderId,
          estimatedHours: 2,
          dependencies: [{ id: 'task-2' }, { id: 'task-3' }],
        },
      ] as unknown as Task[];

      mockTaskRepository.find.mockResolvedValue(tasks);

      const result = await service.getCriticalPath(workOrderId);

      // Critical path should be task1 -> task2 -> task4 (total: 7 hours)
      expect(result).toContainEqual(
        expect.objectContaining({ id: 'task-1' })
      );
      expect(result).toContainEqual(
        expect.objectContaining({ id: 'task-2' })
      );
      expect(result).toContainEqual(
        expect.objectContaining({ id: 'task-4' })
      );
    });

    it('should throw error when circular dependencies exist', async () => {
      const workOrderId = 'wo-1';
      
      const task1 = {
        id: 'task-1',
        workOrderId,
        estimatedHours: 2,
        dependencies: [],
      } as unknown as Task;

      const task2 = {
        id: 'task-2',
        workOrderId,
        estimatedHours: 3,
        dependencies: [],
      } as unknown as Task;

      // Create circular dependency
      task1.dependencies = [task2];
      task2.dependencies = [task1];

      mockTaskRepository.find.mockResolvedValue([task1, task2]);

      await expect(service.getCriticalPath(workOrderId)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('splitTask', () => {
    it('should split task into subtasks', async () => {
      const taskId = 'task-1';
      const originalTask = {
        id: taskId,
        taskNumber: 'TSK-001',
        name: 'Original Task',
        status: TaskStatus.PENDING,
        workOrderId: 'wo-1',
        tenantId: 'test-tenant',
        estimatedHours: 10,
        targetQuantity: 100,
        dependencies: [],
      } as unknown as Task;

      const splitConfig = {
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

      mockTaskRepository.findOne.mockResolvedValue(originalTask);
      mockTaskRepository.create.mockImplementation((data: any) => ({
        ...data,
        id: `task-${Math.random()}`,
      }));
      mockTaskRepository.save.mockImplementation((task) => Promise.resolve(task));

      const queryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      mockTaskRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await service.splitTask(taskId, splitConfig);

      expect(result).toHaveLength(2);
      expect(result[0]?.name).toBe('Subtask 1');
      expect(result[1]?.name).toBe('Subtask 2');
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'task.split',
        expect.objectContaining({
          originalTask: expect.objectContaining({ id: taskId }),
          subtasks: result,
        })
      );
    });

    it('should throw error when task is already in progress', async () => {
      const taskId = 'task-1';
      const task = {
        id: taskId,
        status: TaskStatus.IN_PROGRESS,
      } as unknown as Task;

      mockTaskRepository.findOne.mockResolvedValue(task);

      await expect(
        service.splitTask(taskId, { subtasks: [], preserveDependencies: true })
      ).rejects.toThrow(BadRequestException);
    });
  });
});