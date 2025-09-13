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
  let taskRepository: jest.Mocked<Repository<Task>>;
  let assignmentRepository: jest.Mocked<Repository<TaskAssignment>>;
  let userRepository: jest.Mocked<Repository<User>>;
  // let _workCenterRepository: Repository<WorkCenter>;
  // let dependencyService: TaskDependencyService;
  let taskService: jest.Mocked<TaskService>;
  let assignmentService: jest.Mocked<TaskAssignmentService>;
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
            update: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
              getRawMany: jest.fn().mockResolvedValue([]),
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
            update: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
              getOne: jest.fn().mockResolvedValue(null),
              getCount: jest.fn().mockResolvedValue(0),
              getRawMany: jest.fn().mockResolvedValue([]),
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
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([]),
              getOne: jest.fn().mockResolvedValue(null),
              getRawMany: jest.fn().mockResolvedValue([]),
            }),
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
            reassignTask: jest.fn().mockResolvedValue({ success: true }),
          },
        },
        {
          provide: TaskAssignmentService,
          useValue: {
            assignTask: jest.fn(),
            unassignTask: jest.fn(),
            reassignTask: jest.fn(),
            findBestSkillMatch: jest.fn(),
            findLeastLoadedUser: jest.fn(),
            findByPriority: jest.fn(),
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
            get: jest.fn().mockReturnValue('tenant-1'),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TaskSplitReassignService>(TaskSplitReassignService);
    taskRepository = module.get(getRepositoryToken(Task)) as jest.Mocked<Repository<Task>>;
    assignmentRepository = module.get(getRepositoryToken(TaskAssignment)) as jest.Mocked<Repository<TaskAssignment>>;
    userRepository = module.get(getRepositoryToken(User)) as jest.Mocked<Repository<User>>;
    // _workCenterRepository = module.get<Repository<WorkCenter>>(
    //   getRepositoryToken(WorkCenter),
    // );
    // dependencyService = module.get<TaskDependencyService>(TaskDependencyService);
    taskService = module.get<TaskService>(TaskService) as jest.Mocked<TaskService>;
    assignmentService = module.get<TaskAssignmentService>(TaskAssignmentService) as jest.Mocked<TaskAssignmentService>;
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup TaskService mock to properly handle reassignTask calls
    taskService.reassignTask.mockResolvedValue(mockAssignment);
    
    // Setup TaskAssignmentService mocks
    assignmentService.findLeastLoadedUser.mockResolvedValue({ ...mockUser, id: 'user-2' } as User);
    assignmentService.findBestSkillMatch.mockResolvedValue({ ...mockUser, id: 'user-2' } as User);
    assignmentService.findByPriority.mockResolvedValue({ ...mockUser, id: 'user-2' } as User);
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
      // This service doesn't update the parent task, it should save it to mark as cancelled
      jest.spyOn(taskRepository, 'save').mockImplementation(async (task: any) => task);
      // jest.spyOn(dependencyService, 'preserveDependencies').mockResolvedValue(undefined);

      const result = await service.splitTaskWithAssignments(splitConfig);

      expect(result).toHaveLength(2);
      expect(taskRepository.create).toHaveBeenCalledTimes(2);
      expect(taskRepository.save).toHaveBeenCalled();
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
      const secondTask = { ...mockTask, id: 'task-2', name: 'Test Task 2', assignedTo: mockUser, status: TaskStatus.PENDING } as Task;
      const taskWithAssignedTo = { ...mockTask, assignedTo: mockUser, status: TaskStatus.PENDING } as Task;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(newUser as User);
      // Mock the query builder used in bulkReassignTasks
      jest.spyOn(taskRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([taskWithAssignedTo, secondTask]),
      } as any);
      
      // Ensure the taskService.reassignTask mock doesn't throw
      taskService.reassignTask.mockResolvedValue(mockAssignment);
      
      const result = await service.bulkReassignTasks(config);
      
      expect(result).toHaveLength(2);
      expect(result[0]?.success).toBe(true);
      expect(result[1]?.success).toBe(true);
      expect(taskService.reassignTask).toHaveBeenCalledTimes(2);
      expect(eventEmitter.emit).toHaveBeenCalledWith('tasks.bulk-reassigned', expect.any(Object));
    });
  });

  describe('handleWorkerUnavailability', () => {
    it('should redistribute tasks from unavailable worker', async () => {
      const workerId = 'user-1';
      const reason = 'Sick leave';

      const activeTasks = [{ ...mockTask, assignedToId: workerId, status: TaskStatus.PENDING }];
      const targetUser = { ...mockUser, id: 'user-2', email: 'worker2@test.com' };

      // Mock the taskRepository.find call that the service actually makes
      jest.spyOn(taskRepository, 'find').mockResolvedValue(activeTasks as Task[]);
      
      // Mock the assignment service to return a target user
      assignmentService.findLeastLoadedUser.mockResolvedValue(targetUser as User);
      
      // Ensure the taskService.reassignTask mock doesn't throw
      taskService.reassignTask.mockResolvedValue(mockAssignment);
      
      const result = await service.handleWorkerUnavailability(workerId, reason);

      expect(result).toHaveLength(1);
      expect(result[0]?.success).toBe(true);
      expect(taskRepository.find).toHaveBeenCalledWith({
        where: {
          assignedToId: workerId,
          tenantId: 'tenant-1',
          status: expect.any(Object),
        },
        relations: ['workCenter', 'product'],
        order: {
          priority: 'DESC',
          dueDate: 'ASC',
        },
      });
      expect(assignmentService.findLeastLoadedUser).toHaveBeenCalledWith(activeTasks[0]);
      expect(taskService.reassignTask).toHaveBeenCalledWith(
        activeTasks[0]!.id,
        targetUser.id,
        'Worker unavailable: Sick leave',
        'system'
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith('worker.unavailability-handled', expect.any(Object));
    });
  });

  describe('balanceWorkload', () => {
    it('should balance workload across workers', async () => {
      const config = {
        maxTasksPerWorker: 3,
      };

      const overloadedTasks = [
        { ...mockTask, id: 'task-1', assignedToId: 'user-1', status: TaskStatus.PENDING },
        { ...mockTask, id: 'task-2', assignedToId: 'user-1', status: TaskStatus.PENDING },
      ] as Task[];

      // Mock getWorkloadStatistics by mocking the query builder's getRawMany method
      jest.spyOn(taskRepository, 'createQueryBuilder').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { userId: 'user-1', taskCount: '5', totalHours: '40' }, // overloaded
          { userId: 'user-2', taskCount: '1', totalHours: '8' },  // underloaded
        ]),
      } as any);

      // Mock getReassignableTasks
      jest.spyOn(taskRepository, 'find').mockResolvedValue(overloadedTasks);
      
      // Ensure the taskService.reassignTask mock doesn't throw
      taskService.reassignTask.mockResolvedValue(mockAssignment);
      
      const result = await service.balanceWorkload(config);

      expect(result.length).toBeGreaterThan(0);
      expect(taskService.reassignTask).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('workload.balanced', expect.any(Object));
    });
  });

  describe('emergencyRedistribution', () => {
    it('should redistribute urgent tasks', async () => {
      const config = {
        priority: TaskPriority.URGENT,
      };

      const urgentTask = { 
        ...mockTask, 
        priority: TaskPriority.URGENT, 
        status: TaskStatus.PENDING,
        assignedToId: 'user-1',
        assignedTo: mockUser
      } as Task;
      const targetUser = { ...mockUser, id: 'user-2', email: 'worker2@test.com' };

      // Mock the query builder used in emergencyRedistribution
      jest.spyOn(taskRepository, 'createQueryBuilder').mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([urgentTask]),
      } as any);

      // Mock the assignment service to return a target user
      assignmentService.findByPriority.mockResolvedValue(targetUser as User);
      
      // Ensure the taskService.reassignTask mock doesn't throw
      taskService.reassignTask.mockResolvedValue(mockAssignment);
      
      const result = await service.emergencyRedistribution(config);

      expect(result).toHaveLength(1);
      expect(result[0]?.success).toBe(true);
      expect(assignmentService.findByPriority).toHaveBeenCalledWith(urgentTask);
      expect(taskService.reassignTask).toHaveBeenCalledWith(
        urgentTask.id,
        targetUser.id,
        'Emergency redistribution - urgent task',
        'system'
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'emergency.redistribution-completed',
        expect.any(Object),
      );
    });
  });

  // reassignTask test removed - method doesn't exist in service
});