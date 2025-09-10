import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';
import { Task, TaskStatus, TaskPriority } from '../../../entities/task.entity';
import { TaskAssignment, AssignmentStatus } from '../../../entities/task-assignment.entity';
import { User } from '../../../entities/user.entity';
import { TaskDependencyService } from './task-dependency.service';
import { TaskService } from './task.service';
import { TaskAssignmentService } from './task-assignment.service';

export interface TaskSplitConfig {
  taskId: string;
  subtasks: Array<{
    name: string;
    description?: string;
    estimatedHours: number;
    targetQuantity: number;
    assignToUserId?: string;
    priority?: TaskPriority;
  }>;
  preserveDependencies?: boolean;
  autoAssign?: boolean;
  splitReason?: string;
}

export interface BulkReassignConfig {
  taskIds: string[];
  fromUserId?: string;
  toUserId: string;
  reason: string;
  reassignedBy: string;
  priority?: number;
}

export interface WorkloadBalanceConfig {
  workCenterId?: string;
  maxTasksPerWorker?: number;
  considerSkills?: boolean;
  timeWindow?: {
    start: Date;
    end: Date;
  };
}

export interface TaskReassignmentResult {
  taskId: string;
  previousAssignee?: User;
  newAssignee: User;
  reason: string;
  success: boolean;
  error?: string;
}

@Injectable()
export class TaskSplitReassignService {
  private readonly logger = new Logger(TaskSplitReassignService.name);

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskAssignment)
    private readonly assignmentRepository: Repository<TaskAssignment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dependencyService: TaskDependencyService,
    private readonly taskService: TaskService,
    private readonly assignmentService: TaskAssignmentService,
    private readonly eventEmitter: EventEmitter2,
    private readonly clsService: ClsService,
  ) {}

  /**
   * Split a task and optionally assign subtasks to different users
   */
  async splitTaskWithAssignments(config: TaskSplitConfig): Promise<Task[]> {
    const { taskId, subtasks, preserveDependencies, autoAssign, splitReason } = config;

    // Validate original task
    const originalTask = await this.taskRepository.findOne({
      where: { id: taskId, tenantId: this.getTenantId() },
      relations: ['dependencies', 'assignedTo'],
    });

    if (!originalTask) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    if (originalTask.status !== TaskStatus.PENDING && originalTask.status !== TaskStatus.READY) {
      throw new BadRequestException('Can only split tasks that have not started');
    }

    // Calculate if subtasks cover the original task
    const totalQuantity = subtasks.reduce((sum, st) => sum + st.targetQuantity, 0);

    if (Math.abs(totalQuantity - originalTask.targetQuantity) > 0.01) {
      this.logger.warn(
        `Split tasks quantity (${totalQuantity}) doesn't match original (${originalTask.targetQuantity})`
      );
    }

    // Create subtasks
    const createdTasks: Task[] = [];
    let previousTask: Task | null = null;

    for (let i = 0; i < subtasks.length; i++) {
      const subtaskConfig = subtasks[i];
      if (!subtaskConfig) continue;

      const subtask = this.taskRepository.create({
        ...originalTask,
        id: undefined,
        taskNumber: `${originalTask.taskNumber}-${String(i + 1).padStart(2, '0')}`,
        name: subtaskConfig.name,
        description: subtaskConfig.description || originalTask.description,
        estimatedHours: subtaskConfig.estimatedHours,
        targetQuantity: subtaskConfig.targetQuantity,
        priority: subtaskConfig.priority || originalTask.priority,
        status: TaskStatus.PENDING,
        dependencies: [],
        assignedTo: undefined,
        assignedToId: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      });

      // Set dependencies
      if (preserveDependencies && i === 0) {
        // First subtask inherits original dependencies
        subtask.dependencies = originalTask.dependencies;
      } else if (previousTask) {
        // Each subtask depends on the previous one
        subtask.dependencies = [previousTask];
      }

      const savedSubtask = await this.taskRepository.save(subtask);

      // Handle assignment
      if (subtaskConfig.assignToUserId) {
        await this.taskService.assignTask(savedSubtask.id, {
          userId: subtaskConfig.assignToUserId,
          assignedById: this.getCurrentUserId(),
          notes: `Split from task ${originalTask.taskNumber}`,
        });
      } else if (autoAssign) {
        await this.taskService.autoAssignTask(savedSubtask);
      }

      createdTasks.push(savedSubtask);
      previousTask = savedSubtask;
    }

    // Update tasks that depended on the original task
    if (preserveDependencies && createdTasks.length > 0) {
      const dependents = await this.dependencyService.getTaskDependents(taskId);
      const lastSubtask = createdTasks[createdTasks.length - 1];

      for (const dependent of dependents) {
        const depWithDeps = await this.taskRepository.findOne({
          where: { id: dependent.id },
          relations: ['dependencies'],
        });

        if (depWithDeps && lastSubtask) {
          // Replace original task with last subtask in dependencies
          const depIndex = depWithDeps.dependencies.findIndex(d => d.id === taskId);
          if (depIndex !== -1) {
            depWithDeps.dependencies[depIndex] = lastSubtask;
            await this.taskRepository.save(depWithDeps);
          }
        }
      }
    }

    // Mark original task as cancelled
    originalTask.status = TaskStatus.CANCELLED;
    originalTask.notes = `Split into ${createdTasks.length} subtasks. Reason: ${splitReason || 'Task division required'}`;
    await this.taskRepository.save(originalTask);

    // Cancel any active assignments for the original task
    await this.assignmentRepository.update(
      {
        taskId: originalTask.id,
        status: Not(In([AssignmentStatus.COMPLETED, AssignmentStatus.REASSIGNED])),
      },
      {
        status: AssignmentStatus.REASSIGNED,
        notes: 'Task was split into subtasks',
      }
    );

    this.eventEmitter.emit('task.split', {
      originalTask,
      subtasks: createdTasks,
      reason: splitReason,
    });

    this.logger.log(
      `Task ${originalTask.taskNumber} split into ${createdTasks.length} subtasks`
    );

    return createdTasks;
  }

  /**
   * Bulk reassign tasks from one user to another
   */
  async bulkReassignTasks(config: BulkReassignConfig): Promise<TaskReassignmentResult[]> {
    const { taskIds, fromUserId, toUserId, reason, reassignedBy } = config;

    const results: TaskReassignmentResult[] = [];

    // Validate target user
    const targetUser = await this.userRepository.findOne({
      where: { id: toUserId, tenantId: this.getTenantId() },
    });

    if (!targetUser) {
      throw new NotFoundException(`Target user with ID ${toUserId} not found`);
    }

    // Get tasks to reassign
    let tasksQuery = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .where('task.tenantId = :tenantId', { tenantId: this.getTenantId() })
      .andWhere('task.id IN (:...taskIds)', { taskIds });

    if (fromUserId) {
      tasksQuery = tasksQuery.andWhere('task.assignedToId = :fromUserId', { fromUserId });
    }

    const tasks = await tasksQuery.getMany();

    // Process each task
    for (const task of tasks) {
      try {
        // Skip if task is already completed or cancelled
        if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
          results.push({
            taskId: task.id,
            previousAssignee: task.assignedTo,
            newAssignee: targetUser,
            reason,
            success: false,
            error: 'Task is already completed or cancelled',
          });
          continue;
        }

        // Perform reassignment
        await this.taskService.reassignTask(
          task.id,
          toUserId,
          reason,
          reassignedBy
        );

        results.push({
          taskId: task.id,
          previousAssignee: task.assignedTo,
          newAssignee: targetUser,
          reason,
          success: true,
        });

        this.logger.log(`Task ${task.taskNumber} reassigned to ${targetUser.id}`);
      } catch (error: any) {
        results.push({
          taskId: task.id,
          previousAssignee: task.assignedTo,
          newAssignee: targetUser,
          reason,
          success: false,
          error: error.message,
        });

        this.logger.error(`Failed to reassign task ${task.id}: ${error.message}`);
      }
    }

    // Emit bulk reassignment event
    this.eventEmitter.emit('tasks.bulk-reassigned', {
      fromUserId,
      toUserId,
      taskCount: results.filter(r => r.success).length,
      reason,
      reassignedBy,
    });

    return results;
  }

  /**
   * Reassign tasks due to worker unavailability
   */
  async handleWorkerUnavailability(
    workerId: string,
    reason: string,
    redistributionStrategy: 'workload' | 'skills' | 'priority' = 'workload'
  ): Promise<TaskReassignmentResult[]> {
    // Get all active tasks assigned to the worker
    const activeTasks = await this.taskRepository.find({
      where: {
        assignedToId: workerId,
        tenantId: this.getTenantId(),
        status: Not(In([TaskStatus.COMPLETED, TaskStatus.CANCELLED])),
      },
      relations: ['workCenter', 'product'],
      order: {
        priority: 'DESC',
        dueDate: 'ASC',
      },
    });

    if (activeTasks.length === 0) {
      this.logger.log(`No active tasks found for worker ${workerId}`);
      return [];
    }

    const results: TaskReassignmentResult[] = [];

    // Get available workers for redistribution
    // const availableWorkers = await this.getAvailableWorkers(workerId);

    for (const task of activeTasks) {
      try {
        let targetUser: User | null = null;

        switch (redistributionStrategy) {
          case 'skills':
            targetUser = await this.assignmentService.findBestSkillMatch(task);
            break;
          case 'priority':
            targetUser = await this.assignmentService.findByPriority(task);
            break;
          case 'workload':
          default:
            targetUser = await this.assignmentService.findLeastLoadedUser(task);
            break;
        }

        if (!targetUser) {
          this.logger.warn(`No suitable replacement found for task ${task.taskNumber}`);
          continue;
        }

        await this.taskService.reassignTask(
          task.id,
          targetUser.id,
          `Worker unavailable: ${reason}`,
          'system'
        );

        results.push({
          taskId: task.id,
          previousAssignee: { id: workerId } as User,
          newAssignee: targetUser,
          reason: `Worker unavailable: ${reason}`,
          success: true,
        });
      } catch (error: any) {
        results.push({
          taskId: task.id,
          previousAssignee: { id: workerId } as User,
          newAssignee: {} as User,
          reason: `Worker unavailable: ${reason}`,
          success: false,
          error: error.message,
        });
      }
    }

    this.eventEmitter.emit('worker.unavailability-handled', {
      workerId,
      tasksReassigned: results.filter(r => r.success).length,
      totalTasks: activeTasks.length,
      reason,
    });

    return results;
  }

  /**
   * Balance workload across workers
   */
  async balanceWorkload(config: WorkloadBalanceConfig): Promise<TaskReassignmentResult[]> {
    const { workCenterId, maxTasksPerWorker = 5, considerSkills, timeWindow } = config;

    // Get workload distribution
    const workloadStats = await this.getWorkloadStatistics(workCenterId, timeWindow);
    
    const overloadedWorkers = workloadStats.filter(
      stat => stat.taskCount > maxTasksPerWorker
    );
    const underloadedWorkers = workloadStats.filter(
      stat => stat.taskCount < maxTasksPerWorker
    );

    if (overloadedWorkers.length === 0 || underloadedWorkers.length === 0) {
      this.logger.log('Workload is already balanced or no workers available for balancing');
      return [];
    }

    const results: TaskReassignmentResult[] = [];

    // Redistribute tasks from overloaded to underloaded workers
    for (const overloaded of overloadedWorkers) {
      const excessTasks = overloaded.taskCount - maxTasksPerWorker;
      
      // Get tasks that can be reassigned
      const reassignableTasks = await this.getReassignableTasks(
        overloaded.userId,
        excessTasks
      );

      for (const task of reassignableTasks) {
        // Find best underloaded worker
        const targetWorker = underloadedWorkers
          .filter(w => w.taskCount < maxTasksPerWorker)
          .sort((a, b) => a.taskCount - b.taskCount)[0];

        if (!targetWorker) break;

        try {
          // Check skills if required
          if (considerSkills && task.requiredSkills && task.requiredSkills.length > 0) {
            const hasSkills = await this.checkUserSkills(
              targetWorker.userId,
              task.requiredSkills
            );
            if (!hasSkills) continue;
          }

          await this.taskService.reassignTask(
            task.id,
            targetWorker.userId,
            'Workload balancing',
            'system'
          );

          targetWorker.taskCount++;
          overloaded.taskCount--;

          results.push({
            taskId: task.id,
            previousAssignee: { id: overloaded.userId } as User,
            newAssignee: { id: targetWorker.userId } as User,
            reason: 'Workload balancing',
            success: true,
          });
        } catch (error: any) {
          this.logger.error(`Failed to reassign task ${task.id}: ${error.message}`);
        }
      }
    }

    this.eventEmitter.emit('workload.balanced', {
      tasksReassigned: results.filter(r => r.success).length,
      workCenterId,
    });

    return results;
  }

  /**
   * Emergency task redistribution
   */
  async emergencyRedistribution(
    criteria: {
      priority?: TaskPriority;
      dueWithinHours?: number;
      workCenterId?: string;
    }
  ): Promise<TaskReassignmentResult[]> {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .where('task.tenantId = :tenantId', { tenantId: this.getTenantId() })
      .andWhere('task.status IN (:...statuses)', {
        statuses: [TaskStatus.PENDING, TaskStatus.READY, TaskStatus.IN_PROGRESS],
      });

    if (criteria.priority) {
      query.andWhere('task.priority = :priority', { priority: criteria.priority });
    }

    if (criteria.dueWithinHours) {
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + criteria.dueWithinHours);
      query.andWhere('task.dueDate <= :deadline', { deadline });
    }

    if (criteria.workCenterId) {
      query.andWhere('task.workCenterId = :workCenterId', {
        workCenterId: criteria.workCenterId,
      });
    }

    const urgentTasks = await query
      .orderBy('task.priority', 'DESC')
      .addOrderBy('task.dueDate', 'ASC')
      .getMany();

    const results: TaskReassignmentResult[] = [];

    for (const task of urgentTasks) {
      // Find the most available worker with required skills
      const targetUser = await this.assignmentService.findByPriority(task);

      if (!targetUser) {
        this.logger.warn(`No worker available for urgent task ${task.taskNumber}`);
        continue;
      }

      // Skip if already assigned to the best worker
      if (task.assignedToId === targetUser.id) {
        continue;
      }

      try {
        await this.taskService.reassignTask(
          task.id,
          targetUser.id,
          'Emergency redistribution - urgent task',
          'system'
        );

        results.push({
          taskId: task.id,
          previousAssignee: task.assignedTo,
          newAssignee: targetUser,
          reason: 'Emergency redistribution',
          success: true,
        });
      } catch (error: any) {
        results.push({
          taskId: task.id,
          previousAssignee: task.assignedTo,
          newAssignee: targetUser,
          reason: 'Emergency redistribution',
          success: false,
          error: error.message,
        });
      }
    }

    this.eventEmitter.emit('emergency.redistribution-completed', {
      tasksReassigned: results.filter(r => r.success).length,
      criteria,
    });

    return results;
  }

  /**
   * Get workload statistics for workers
   */
  private async getWorkloadStatistics(
    workCenterId?: string,
    timeWindow?: { start: Date; end: Date }
  ): Promise<Array<{ userId: string; taskCount: number; totalHours: number }>> {
    const query = this.taskRepository
      .createQueryBuilder('task')
      .select('task.assignedToId', 'userId')
      .addSelect('COUNT(task.id)', 'taskCount')
      .addSelect('SUM(task.estimatedHours)', 'totalHours')
      .where('task.tenantId = :tenantId', { tenantId: this.getTenantId() })
      .andWhere('task.assignedToId IS NOT NULL')
      .andWhere('task.status IN (:...statuses)', {
        statuses: [TaskStatus.PENDING, TaskStatus.READY, TaskStatus.IN_PROGRESS],
      });

    if (workCenterId) {
      query.andWhere('task.workCenterId = :workCenterId', { workCenterId });
    }

    if (timeWindow) {
      query
        .andWhere('task.scheduledStartDate >= :start', { start: timeWindow.start })
        .andWhere('task.scheduledEndDate <= :end', { end: timeWindow.end });
    }

    const results = await query
      .groupBy('task.assignedToId')
      .getRawMany();

    return results.map(r => ({
      userId: r.userId,
      taskCount: parseInt(r.taskCount, 10),
      totalHours: parseFloat(r.totalHours) || 0,
    }));
  }

  /**
   * Get tasks that can be reassigned
   */
  private async getReassignableTasks(
    userId: string,
    limit: number
  ): Promise<Task[]> {
    return this.taskRepository.find({
      where: {
        assignedToId: userId,
        tenantId: this.getTenantId(),
        status: In([TaskStatus.PENDING, TaskStatus.READY]),
      },
      relations: ['dependencies'],
      order: {
        priority: 'ASC', // Start with lower priority tasks
        dueDate: 'DESC', // And tasks due later
      },
      take: limit,
    });
  }

  /**
   * Get available workers excluding a specific worker
   * Currently unused but kept for future enhancements
   */
  /*
  private async getAvailableWorkers(excludeWorkerId: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.tenantId = :tenantId', { tenantId: this.getTenantId() })
      .andWhere('user.id != :excludeId', { excludeId: excludeWorkerId })
      .andWhere('user.active = true')
      .getMany();
  }
  */

  /**
   * Check if user has required skills
   */
  private async checkUserSkills(_userId: string, _requiredSkills: string[]): Promise<boolean> {
    // This would typically check against a user skills table
    // For now, returning true as placeholder
    return true;
  }

  private getTenantId(): string {
    return this.clsService.get('tenantId') || 'default';
  }

  private getCurrentUserId(): string {
    return this.clsService.get('userId') || 'system';
  }
}