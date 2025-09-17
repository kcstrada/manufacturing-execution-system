import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, Not } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';
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
import { CreateTaskDto, UpdateTaskDto, AssignTaskDto } from '../dto/task.dto';
import { TaskAssignmentService } from './task-assignment.service';
import { TaskDependencyService } from './task-dependency.service';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskAssignment)
    private readonly assignmentRepository: Repository<TaskAssignment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly assignmentService: TaskAssignmentService,
    private readonly dependencyService: TaskDependencyService,
    private readonly eventEmitter: EventEmitter2,
    private readonly clsService: ClsService,
  ) {}

  /**
   * Create a new task
   */
  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const tenantId = this.getTenantId();

    const task = this.taskRepository.create({
      ...createTaskDto,
      tenantId,
      taskNumber: await this.generateTaskNumber(),
      status: TaskStatus.PENDING,
    });

    const savedTask = await this.taskRepository.save(task);

    // Auto-assign if configured
    if (createTaskDto.autoAssign) {
      await this.autoAssignTask(savedTask);
    }

    this.eventEmitter.emit('task.created', { task: savedTask });
    this.logger.log(`Task created: ${savedTask.taskNumber}`);

    return savedTask;
  }

  /**
   * Update a task
   */
  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);

    // Check if status transition is valid
    if (updateTaskDto.status) {
      this.validateStatusTransition(task.status, updateTaskDto.status);
    }

    // Update progress percentage based on quantities
    if (updateTaskDto.completedQuantity !== undefined) {
      task.progressPercentage = Math.round(
        (updateTaskDto.completedQuantity / task.targetQuantity) * 100,
      );
    }

    // Set actual dates based on status changes
    if (
      updateTaskDto.status === TaskStatus.IN_PROGRESS &&
      !task.actualStartDate
    ) {
      task.actualStartDate = new Date();
    }

    if (updateTaskDto.status === TaskStatus.COMPLETED) {
      task.actualEndDate = new Date();
      task.progressPercentage = 100;
    }

    Object.assign(task, updateTaskDto);
    const updatedTask = await this.taskRepository.save(task);

    this.eventEmitter.emit('task.updated', { task: updatedTask });

    return updatedTask;
  }

  /**
   * Find one task by ID
   */
  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, tenantId: this.getTenantId() },
      relations: [
        'workOrder',
        'assignedTo',
        'workCenter',
        'product',
        'dependencies',
      ],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  /**
   * Find all tasks with filters
   */
  async findAll(filters?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    type?: TaskType;
    workOrderId?: string;
    assignedToId?: string;
    workCenterId?: string;
    overdue?: boolean;
  }): Promise<Task[]> {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.workOrder', 'workOrder')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .leftJoinAndSelect('task.workCenter', 'workCenter')
      .leftJoinAndSelect('task.product', 'product')
      .where('task.tenantId = :tenantId', { tenantId: this.getTenantId() });

    if (filters?.status) {
      query.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters?.priority) {
      query.andWhere('task.priority = :priority', {
        priority: filters.priority,
      });
    }

    if (filters?.type) {
      query.andWhere('task.type = :type', { type: filters.type });
    }

    if (filters?.workOrderId) {
      query.andWhere('task.workOrderId = :workOrderId', {
        workOrderId: filters.workOrderId,
      });
    }

    if (filters?.assignedToId) {
      query.andWhere('task.assignedToId = :assignedToId', {
        assignedToId: filters.assignedToId,
      });
    }

    if (filters?.workCenterId) {
      query.andWhere('task.workCenterId = :workCenterId', {
        workCenterId: filters.workCenterId,
      });
    }

    if (filters?.overdue) {
      query
        .andWhere('task.dueDate < :now', { now: new Date() })
        .andWhere('task.status != :completed', {
          completed: TaskStatus.COMPLETED,
        });
    }

    return query
      .orderBy('task.priority', 'DESC')
      .addOrderBy('task.dueDate', 'ASC')
      .getMany();
  }

  /**
   * Manually assign a task to a user
   */
  async assignTask(
    taskId: string,
    assignTaskDto: AssignTaskDto,
  ): Promise<TaskAssignment> {
    const task = await this.findOne(taskId);
    const user = await this.userRepository.findOne({
      where: { id: assignTaskDto.userId, tenantId: this.getTenantId() },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${assignTaskDto.userId} not found`,
      );
    }

    // Check if user has required skills
    if (task.requiredSkills && task.requiredSkills.length > 0) {
      const hasRequiredSkills = await this.checkUserSkills(
        user.id,
        task.requiredSkills,
      );
      if (!hasRequiredSkills && !assignTaskDto.force) {
        throw new BadRequestException(
          'User does not have required skills for this task',
        );
      }
    }

    // Create assignment
    const assignment = this.assignmentRepository.create({
      tenantId: this.getTenantId(),
      taskId: task.id,
      userId: user.id,
      status: AssignmentStatus.PENDING,
      assignmentMethod: AssignmentMethod.MANUAL,
      assignedAt: new Date(),
      assignedById: assignTaskDto.assignedById,
      priority:
        assignTaskDto.priority || task.priority === TaskPriority.URGENT
          ? 100
          : 50,
      dueDate: task.dueDate,
      notes: assignTaskDto.notes,
    });

    const savedAssignment = await this.assignmentRepository.save(assignment);

    // Update task with assigned user
    task.assignedToId = user.id;
    await this.taskRepository.save(task);

    this.eventEmitter.emit('task.assigned', {
      task,
      assignment: savedAssignment,
      user,
    });

    this.logger.log(`Task ${task.taskNumber} assigned to user ${user.id}`);

    return savedAssignment;
  }

  /**
   * Auto-assign task based on rules
   */
  async autoAssignTask(task: Task): Promise<TaskAssignment | null> {
    this.logger.log(`Auto-assigning task ${task.taskNumber}`);

    // Get assignment strategy from configuration or task type
    const strategy = this.determineAssignmentStrategy(task);

    let assignedUser: User | null = null;

    switch (strategy) {
      case AssignmentMethod.AUTO_SKILL_BASED:
        assignedUser = await this.assignmentService.findBestSkillMatch(task);
        break;

      case AssignmentMethod.AUTO_WORKLOAD:
        assignedUser = await this.assignmentService.findLeastLoadedUser(task);
        break;

      case AssignmentMethod.AUTO_ROUND_ROBIN:
        assignedUser = await this.assignmentService.findNextInRotation(task);
        break;

      case AssignmentMethod.AUTO_PRIORITY:
        assignedUser = await this.assignmentService.findByPriority(task);
        break;

      case AssignmentMethod.AUTO_LOCATION:
        assignedUser = await this.assignmentService.findNearestUser(task);
        break;

      default:
        this.logger.warn(`Unknown assignment strategy: ${strategy}`);
        return null;
    }

    if (!assignedUser) {
      this.logger.warn(`No suitable user found for task ${task.taskNumber}`);
      return null;
    }

    // Create assignment
    const assignment = this.assignmentRepository.create({
      tenantId: this.getTenantId(),
      taskId: task.id,
      userId: assignedUser.id,
      status: AssignmentStatus.PENDING,
      assignmentMethod: strategy,
      assignedAt: new Date(),
      priority: this.calculatePriority(task),
      dueDate: task.dueDate,
      skillMatchScore: await this.assignmentService.calculateSkillMatch(
        assignedUser,
        task,
      ),
      userWorkload: await this.assignmentService.getUserWorkload(
        assignedUser.id,
      ),
    });

    const savedAssignment = await this.assignmentRepository.save(assignment);

    // Update task
    task.assignedToId = assignedUser.id;
    await this.taskRepository.save(task);

    this.eventEmitter.emit('task.auto-assigned', {
      task,
      assignment: savedAssignment,
      user: assignedUser,
      strategy,
    });

    return savedAssignment;
  }

  /**
   * Reassign a task to another user
   */
  async reassignTask(
    taskId: string,
    newUserId: string,
    reason: string,
    reassignedBy: string,
  ): Promise<TaskAssignment> {
    const task = await this.findOne(taskId);
    const currentAssignment = await this.assignmentRepository.findOne({
      where: {
        taskId: task.id,
        status: Not(
          In([AssignmentStatus.COMPLETED, AssignmentStatus.REASSIGNED]),
        ),
      },
      order: { createdAt: 'DESC' },
    });

    if (!currentAssignment) {
      throw new NotFoundException('No active assignment found for this task');
    }

    // Mark current assignment as reassigned
    currentAssignment.status = AssignmentStatus.REASSIGNED;
    currentAssignment.reassignmentHistory = [
      ...(currentAssignment.reassignmentHistory || []),
      {
        fromUserId: currentAssignment.userId,
        toUserId: newUserId,
        reassignedAt: new Date(),
        reassignedBy,
        reason,
      },
    ];
    await this.assignmentRepository.save(currentAssignment);

    // Create new assignment
    const newAssignment = await this.assignTask(taskId, {
      userId: newUserId,
      assignedById: reassignedBy,
      notes: `Reassigned: ${reason}`,
      priority: currentAssignment.priority,
    });

    this.eventEmitter.emit('task.reassigned', {
      task,
      oldAssignment: currentAssignment,
      newAssignment,
      reason,
    });

    return newAssignment;
  }

  /**
   * Get task assignments
   */
  async getTaskAssignments(taskId: string): Promise<TaskAssignment[]> {
    return this.assignmentRepository.find({
      where: { taskId, tenantId: this.getTenantId() },
      relations: ['user'],
      order: { assignedAt: 'DESC' },
    });
  }

  /**
   * Get user's current tasks
   */
  async getUserTasks(userId: string, status?: TaskStatus): Promise<Task[]> {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.workOrder', 'workOrder')
      .leftJoinAndSelect('task.workCenter', 'workCenter')
      .leftJoinAndSelect('task.product', 'product')
      .where('task.tenantId = :tenantId', { tenantId: this.getTenantId() })
      .andWhere('task.assignedToId = :userId', { userId });

    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    return query
      .orderBy('task.priority', 'DESC')
      .addOrderBy('task.dueDate', 'ASC')
      .getMany();
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<Task[]> {
    return this.taskRepository.find({
      where: {
        tenantId: this.getTenantId(),
        dueDate: LessThan(new Date()),
        status: Not(In([TaskStatus.COMPLETED, TaskStatus.CANCELLED])),
      },
      relations: ['assignedTo', 'workOrder'],
      order: {
        dueDate: 'ASC',
        priority: 'DESC',
      },
    });
  }

  /**
   * Update task progress
   */
  async updateProgress(
    taskId: string,
    completedQuantity: number,
    rejectedQuantity?: number,
  ): Promise<Task> {
    const task = await this.findOne(taskId);

    task.completedQuantity = completedQuantity;
    if (rejectedQuantity !== undefined) {
      task.rejectedQuantity = rejectedQuantity;
    }

    task.progressPercentage = Math.round(
      (completedQuantity / task.targetQuantity) * 100,
    );

    // Auto-complete if 100%
    if (
      task.progressPercentage >= 100 &&
      task.status !== TaskStatus.COMPLETED
    ) {
      task.status = TaskStatus.COMPLETED;
      task.actualEndDate = new Date();
    }

    const updatedTask = await this.taskRepository.save(task);

    this.eventEmitter.emit('task.progress-updated', { task: updatedTask });

    return updatedTask;
  }

  /**
   * Start a task
   */
  async startTask(taskId: string, userId: string): Promise<Task> {
    const task = await this.findOne(taskId);

    if (
      task.status !== TaskStatus.READY &&
      task.status !== TaskStatus.PENDING
    ) {
      throw new BadRequestException(
        'Task cannot be started from current status',
      );
    }

    // Check dependencies
    const incompleteDependencies = await this.checkDependencies(task);
    if (incompleteDependencies.length > 0) {
      throw new BadRequestException('Task has incomplete dependencies');
    }

    task.status = TaskStatus.IN_PROGRESS;
    task.actualStartDate = new Date();

    // Update assignment
    const assignment = await this.assignmentRepository.findOne({
      where: {
        taskId: task.id,
        userId,
        status: Not(
          In([AssignmentStatus.COMPLETED, AssignmentStatus.REASSIGNED]),
        ),
      },
    });

    if (assignment) {
      assignment.status = AssignmentStatus.IN_PROGRESS;
      assignment.startedAt = new Date();
      await this.assignmentRepository.save(assignment);
    }

    const updatedTask = await this.taskRepository.save(task);

    this.eventEmitter.emit('task.started', { task: updatedTask, userId });

    return updatedTask;
  }

  /**
   * Complete a task
   */
  async completeTask(
    taskId: string,
    userId: string,
    notes?: string,
  ): Promise<Task> {
    const task = await this.findOne(taskId);

    if (task.status !== TaskStatus.IN_PROGRESS) {
      throw new BadRequestException('Task must be in progress to complete');
    }

    task.status = TaskStatus.COMPLETED;
    task.actualEndDate = new Date();
    task.progressPercentage = 100;
    if (notes) {
      task.notes = notes;
    }

    // Calculate actual hours
    if (task.actualStartDate) {
      const hours =
        (task.actualEndDate.getTime() - task.actualStartDate.getTime()) /
        (1000 * 60 * 60);
      task.actualHours = Math.round(hours * 100) / 100;
    }

    // Update assignment
    const assignment = await this.assignmentRepository.findOne({
      where: {
        taskId: task.id,
        userId,
        status: AssignmentStatus.IN_PROGRESS,
      },
    });

    if (assignment) {
      assignment.status = AssignmentStatus.COMPLETED;
      assignment.completedAt = new Date();
      assignment.completionPercentage = 100;
      assignment.actualHours = task.actualHours;
      await this.assignmentRepository.save(assignment);
    }

    const updatedTask = await this.taskRepository.save(task);

    this.eventEmitter.emit('task.completed', { task: updatedTask, userId });

    // Check if work order can be progressed
    await this.checkWorkOrderProgress(task.workOrderId);

    // Cascade completion update to dependent tasks
    await this.dependencyService.cascadeCompletionUpdate(taskId);

    return updatedTask;
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(
    currentStatus: TaskStatus,
    newStatus: TaskStatus,
  ): void {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.PENDING]: [TaskStatus.READY, TaskStatus.CANCELLED],
      [TaskStatus.READY]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
      [TaskStatus.IN_PROGRESS]: [
        TaskStatus.PAUSED,
        TaskStatus.COMPLETED,
        TaskStatus.FAILED,
      ],
      [TaskStatus.PAUSED]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
      [TaskStatus.COMPLETED]: [],
      [TaskStatus.CANCELLED]: [],
      [TaskStatus.FAILED]: [TaskStatus.READY, TaskStatus.CANCELLED],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  /**
   * Check task dependencies
   */
  private async checkDependencies(task: Task): Promise<Task[]> {
    if (!task.dependencies || task.dependencies.length === 0) {
      return [];
    }

    const incompleteDeps = [];
    for (const dep of task.dependencies) {
      if (dep.status !== TaskStatus.COMPLETED) {
        incompleteDeps.push(dep);
      }
    }

    return incompleteDeps;
  }

  /**
   * Check if work order can progress
   */
  private async checkWorkOrderProgress(workOrderId: string): Promise<void> {
    const tasks = await this.taskRepository.find({
      where: { workOrderId, tenantId: this.getTenantId() },
    });

    const allCompleted = tasks.every((t) => t.status === TaskStatus.COMPLETED);

    if (allCompleted) {
      this.eventEmitter.emit('workorder.tasks-completed', { workOrderId });
    }
  }

  /**
   * Generate task number
   */
  private async generateTaskNumber(): Promise<string> {
    const count = await this.taskRepository.count({
      where: { tenantId: this.getTenantId() },
    });
    return `TSK-${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Determine assignment strategy
   */
  private determineAssignmentStrategy(task: Task): AssignmentMethod {
    // Priority-based assignment for urgent tasks
    if (
      task.priority === TaskPriority.URGENT ||
      task.priority === TaskPriority.CRITICAL
    ) {
      return AssignmentMethod.AUTO_PRIORITY;
    }

    // Skill-based for technical tasks
    if (task.requiredSkills && task.requiredSkills.length > 0) {
      return AssignmentMethod.AUTO_SKILL_BASED;
    }

    // Location-based if work center is specified
    if (task.workCenterId) {
      return AssignmentMethod.AUTO_LOCATION;
    }

    // Default to workload balancing
    return AssignmentMethod.AUTO_WORKLOAD;
  }

  /**
   * Calculate priority score
   */
  private calculatePriority(task: Task): number {
    let priority = 0;

    // Base priority from task priority
    switch (task.priority) {
      case TaskPriority.CRITICAL:
        priority = 100;
        break;
      case TaskPriority.URGENT:
        priority = 80;
        break;
      case TaskPriority.HIGH:
        priority = 60;
        break;
      case TaskPriority.NORMAL:
        priority = 40;
        break;
      case TaskPriority.LOW:
        priority = 20;
        break;
    }

    // Add urgency based on due date
    if (task.dueDate) {
      const hoursUntilDue =
        (task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilDue < 24) {
        priority += 20;
      } else if (hoursUntilDue < 48) {
        priority += 10;
      }
    }

    return Math.min(priority, 100);
  }

  /**
   * Check if user has required skills
   */
  private async checkUserSkills(
    _userId: string,
    _requiredSkills: string[],
  ): Promise<boolean> {
    // This would typically check against a user skills table
    // For now, returning true as placeholder
    return true;
  }

  private getTenantId(): string {
    return this.clsService.get('tenantId') || 'default';
  }
}
