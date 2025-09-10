import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In, LessThan } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { Task, TaskStatus, TaskPriority } from '../../../entities/task.entity';
import { TaskAssignment, AssignmentStatus } from '../../../entities/task-assignment.entity';
import { User } from '../../../entities/user.entity';
import { WorkCenter } from '../../../entities/work-center.entity';

interface UserWorkload {
  userId: string;
  activeTasks: number;
  totalEstimatedHours: number;
  urgentTasks: number;
  overdueTask: number;
  workloadScore: number;
}

interface UserSkillMatch {
  userId: string;
  user: User;
  matchedSkills: string[];
  missingSkills: string[];
  matchScore: number;
}

@Injectable()
export class TaskAssignmentService {
  private readonly logger = new Logger(TaskAssignmentService.name);
  private lastRoundRobinUserId: string | null = null;

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(TaskAssignment)
    private readonly assignmentRepository: Repository<TaskAssignment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(WorkCenter)
    private readonly workCenterRepository: Repository<WorkCenter>,
    private readonly clsService: ClsService,
  ) {}

  /**
   * Find best user match based on skills
   */
  async findBestSkillMatch(task: Task): Promise<User | null> {
    if (!task.requiredSkills || task.requiredSkills.length === 0) {
      return null;
    }

    const availableUsers = await this.getAvailableUsers();
    const skillMatches: UserSkillMatch[] = [];

    for (const user of availableUsers) {
      const matchScore = await this.calculateSkillMatch(user, task);
      
      if (matchScore > 0) {
        skillMatches.push({
          userId: user.id,
          user,
          matchedSkills: [], // Would be populated from user skills table
          missingSkills: [],
          matchScore,
        });
      }
    }

    // Sort by match score and return best match
    skillMatches.sort((a, b) => b.matchScore - a.matchScore);
    
    if (skillMatches.length > 0) {
      const bestMatch = skillMatches[0];
      if (bestMatch) {
        this.logger.log(
          `Best skill match for task ${task.taskNumber}: User ${bestMatch.userId} with score ${bestMatch.matchScore}`
        );
        return bestMatch.user;
      }
    }

    return null;
  }

  /**
   * Find user with least workload
   */
  async findLeastLoadedUser(task: Task): Promise<User | null> {
    const availableUsers = await this.getAvailableUsers();
    const workloads: UserWorkload[] = [];

    for (const user of availableUsers) {
      const workload = await this.getUserWorkload(user.id);
      workloads.push({
        userId: user.id,
        activeTasks: workload,
        totalEstimatedHours: await this.getUserEstimatedHours(user.id),
        urgentTasks: await this.getUserUrgentTasks(user.id),
        overdueTask: await this.getUserOverdueTasks(user.id),
        workloadScore: this.calculateWorkloadScore(workload),
      });
    }

    // Sort by workload score (lower is better)
    workloads.sort((a, b) => a.workloadScore - b.workloadScore);

    if (workloads.length > 0) {
      const leastLoaded = workloads[0];
      if (leastLoaded) {
        const user = availableUsers.find(u => u.id === leastLoaded.userId);
        
        if (user) {
          this.logger.log(
            `Least loaded user for task ${task.taskNumber}: User ${user.id} with ${leastLoaded.activeTasks} active tasks`
          );
          return user;
        }
      }
    }

    return null;
  }

  /**
   * Find next user in round-robin rotation
   */
  async findNextInRotation(task: Task): Promise<User | null> {
    const availableUsers = await this.getAvailableUsers();
    
    if (availableUsers.length === 0) {
      return null;
    }

    // Sort users by ID for consistent ordering
    availableUsers.sort((a, b) => a.id.localeCompare(b.id));

    let nextUser: User | undefined;

    if (!this.lastRoundRobinUserId) {
      nextUser = availableUsers[0];
    } else {
      const lastIndex = availableUsers.findIndex(u => u.id === this.lastRoundRobinUserId);
      const nextIndex = (lastIndex + 1) % availableUsers.length;
      nextUser = availableUsers[nextIndex];
    }

    if (nextUser) {
      this.lastRoundRobinUserId = nextUser.id;
      
      this.logger.log(
        `Round-robin assignment for task ${task.taskNumber}: User ${nextUser.id}`
      );

      return nextUser;
    }

    return null;
  }

  /**
   * Find user based on priority and availability
   */
  async findByPriority(task: Task): Promise<User | null> {
    const availableUsers = await this.getAvailableUsers();
    
    // For high-priority tasks, find users with fewer urgent tasks
    const userPriorities = [];

    for (const user of availableUsers) {
      const urgentTasks = await this.getUserUrgentTasks(user.id);
      const activeTasks = await this.getUserWorkload(user.id);
      
      // Calculate priority score (lower is better for high-priority assignment)
      const priorityScore = urgentTasks * 10 + activeTasks;
      
      userPriorities.push({
        user,
        priorityScore,
        urgentTasks,
        activeTasks,
      });
    }

    // Sort by priority score
    userPriorities.sort((a, b) => a.priorityScore - b.priorityScore);

    if (userPriorities.length > 0) {
      const selected = userPriorities[0];
      if (selected) {
        this.logger.log(
          `Priority-based assignment for task ${task.taskNumber}: User ${selected.user.id} with priority score ${selected.priorityScore}`
        );
        return selected.user;
      }
    }

    return null;
  }

  /**
   * Find nearest user to work center
   */
  async findNearestUser(task: Task): Promise<User | null> {
    if (!task.workCenterId) {
      return null;
    }

    const workCenter = await this.workCenterRepository.findOne({
      where: { id: task.workCenterId },
    });

    if (!workCenter) {
      return null;
    }

    // This would typically use geolocation or assigned work centers
    // For now, returning first available user
    const availableUsers = await this.getAvailableUsers();
    
    if (availableUsers.length > 0) {
      const firstUser = availableUsers[0];
      if (firstUser) {
        this.logger.log(
          `Location-based assignment for task ${task.taskNumber}: User ${firstUser.id}`
        );
        return firstUser;
      }
    }

    return null;
  }

  /**
   * Calculate skill match score
   */
  async calculateSkillMatch(_user: User, task: Task): Promise<number> {
    if (!task.requiredSkills || task.requiredSkills.length === 0) {
      return 100; // No skills required, perfect match
    }

    // This would typically check against a user skills table
    // For now, returning a random score for demonstration
    return Math.floor(Math.random() * 100);
  }

  /**
   * Get user's current workload
   */
  async getUserWorkload(userId: string): Promise<number> {
    const activeTasks = await this.taskRepository.count({
      where: {
        assignedToId: userId,
        status: In([TaskStatus.IN_PROGRESS, TaskStatus.READY]),
        tenantId: this.getTenantId(),
      },
    });

    return activeTasks;
  }

  /**
   * Get user's estimated hours
   */
  private async getUserEstimatedHours(userId: string): Promise<number> {
    const tasks = await this.taskRepository.find({
      where: {
        assignedToId: userId,
        status: In([TaskStatus.IN_PROGRESS, TaskStatus.READY]),
        tenantId: this.getTenantId(),
      },
    });

    return tasks.reduce((total, task) => total + (task.estimatedHours || 0), 0);
  }

  /**
   * Get user's urgent tasks count
   */
  private async getUserUrgentTasks(userId: string): Promise<number> {
    return this.taskRepository.count({
      where: {
        assignedToId: userId,
        priority: In([TaskPriority.URGENT, TaskPriority.CRITICAL]),
        status: Not(In([TaskStatus.COMPLETED, TaskStatus.CANCELLED])),
        tenantId: this.getTenantId(),
      },
    });
  }

  /**
   * Get user's overdue tasks count
   */
  private async getUserOverdueTasks(userId: string): Promise<number> {
    return this.taskRepository.count({
      where: {
        assignedToId: userId,
        dueDate: LessThan(new Date()),
        status: Not(In([TaskStatus.COMPLETED, TaskStatus.CANCELLED])),
        tenantId: this.getTenantId(),
      },
    });
  }

  /**
   * Get available users for assignment
   */
  private async getAvailableUsers(): Promise<User[]> {
    // This would typically filter by:
    // - Active users
    // - Users with appropriate roles
    // - Users not on leave
    // - Users within shift hours
    
    const users = await this.userRepository.find({
      where: {
        tenantId: this.getTenantId(),
        isActive: true,
      },
    });

    // Filter out users who are at capacity
    const availableUsers = [];
    for (const user of users) {
      const workload = await this.getUserWorkload(user.id);
      if (workload < 10) { // Max 10 active tasks per user
        availableUsers.push(user);
      }
    }

    return availableUsers;
  }

  /**
   * Calculate workload score
   */
  private calculateWorkloadScore(activeTasks: number): number {
    // Simple linear scoring for now
    // Could be enhanced with weighted factors
    return activeTasks * 10;
  }

  /**
   * Get task assignment statistics
   */
  async getAssignmentStatistics(): Promise<{
    totalAssignments: number;
    pendingAssignments: number;
    completedAssignments: number;
    averageCompletionTime: number;
    byMethod: Record<string, number>;
    byUser: Record<string, number>;
  }> {
    const tenantId = this.getTenantId();

    const stats = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .select('assignment.status', 'status')
      .addSelect('assignment.assignmentMethod', 'method')
      .addSelect('assignment.userId', 'userId')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(EXTRACT(EPOCH FROM (assignment.completedAt - assignment.startedAt)))', 'avgTime')
      .where('assignment.tenantId = :tenantId', { tenantId })
      .groupBy('assignment.status, assignment.assignmentMethod, assignment.userId')
      .getRawMany();

    const result = {
      totalAssignments: 0,
      pendingAssignments: 0,
      completedAssignments: 0,
      averageCompletionTime: 0,
      byMethod: {} as Record<string, number>,
      byUser: {} as Record<string, number>,
    };

    let totalTime = 0;
    let completedCount = 0;

    stats.forEach(stat => {
      const count = parseInt(stat.count);
      result.totalAssignments += count;

      if (stat.status === AssignmentStatus.PENDING) {
        result.pendingAssignments += count;
      } else if (stat.status === AssignmentStatus.COMPLETED) {
        result.completedAssignments += count;
        if (stat.avgTime) {
          totalTime += parseFloat(stat.avgTime) * count;
          completedCount += count;
        }
      }

      if (stat.method) {
        result.byMethod[stat.method] = (result.byMethod[stat.method] || 0) + count;
      }

      if (stat.userId) {
        result.byUser[stat.userId] = (result.byUser[stat.userId] || 0) + count;
      }
    });

    if (completedCount > 0) {
      result.averageCompletionTime = Math.round(totalTime / completedCount / 3600); // Convert to hours
    }

    return result;
  }

  /**
   * Rebalance assignments
   */
  async rebalanceAssignments(): Promise<void> {
    this.logger.log('Starting assignment rebalancing');

    const overloadedUsers = await this.getOverloadedUsers();
    const underloadedUsers = await this.getUnderloadedUsers();

    for (const overloadedUser of overloadedUsers) {
      const tasksToReassign = await this.getReassignableTasks(overloadedUser.id);
      
      for (const task of tasksToReassign) {
        if (underloadedUsers.length > 0) {
          const targetUser = underloadedUsers[0];
          if (targetUser) {
            // Reassign task
            await this.reassignTaskToUser(task, targetUser.id, 'Workload rebalancing');
            
            // Update workload tracking
            const targetWorkload = await this.getUserWorkload(targetUser.id);
            if (targetWorkload >= 8) {
              // Remove from underloaded list if now at capacity
              underloadedUsers.shift();
            }
          }
        }
      }
    }

    this.logger.log('Assignment rebalancing completed');
  }

  /**
   * Get overloaded users
   */
  private async getOverloadedUsers(): Promise<User[]> {
    const users = await this.userRepository.find({
      where: {
        tenantId: this.getTenantId(),
        isActive: true,
      },
    });

    const overloaded = [];
    for (const user of users) {
      const workload = await this.getUserWorkload(user.id);
      if (workload > 8) {
        overloaded.push(user);
      }
    }

    return overloaded;
  }

  /**
   * Get underloaded users
   */
  private async getUnderloadedUsers(): Promise<User[]> {
    const users = await this.userRepository.find({
      where: {
        tenantId: this.getTenantId(),
        isActive: true,
      },
    });

    const underloaded = [];
    for (const user of users) {
      const workload = await this.getUserWorkload(user.id);
      if (workload < 3) {
        underloaded.push(user);
      }
    }

    return underloaded;
  }

  /**
   * Get tasks that can be reassigned
   */
  private async getReassignableTasks(userId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: {
        assignedToId: userId,
        status: TaskStatus.READY, // Only reassign tasks not yet started
        priority: Not(In([TaskPriority.URGENT, TaskPriority.CRITICAL])), // Don't reassign urgent tasks
        tenantId: this.getTenantId(),
      },
      order: {
        priority: 'ASC', // Reassign lower priority tasks first
      },
      take: 2, // Reassign max 2 tasks at a time
    });
  }

  /**
   * Reassign task to user
   */
  private async reassignTaskToUser(task: Task, newUserId: string, reason: string): Promise<void> {
    // Update task
    task.assignedToId = newUserId;
    await this.taskRepository.save(task);

    // Update assignment record
    const currentAssignment = await this.assignmentRepository.findOne({
      where: {
        taskId: task.id,
        status: Not(In([AssignmentStatus.COMPLETED, AssignmentStatus.REASSIGNED])),
      },
    });

    if (currentAssignment) {
      currentAssignment.status = AssignmentStatus.REASSIGNED;
      await this.assignmentRepository.save(currentAssignment);
    }

    // Create new assignment
    const newAssignment = this.assignmentRepository.create({
      tenantId: this.getTenantId(),
      taskId: task.id,
      userId: newUserId,
      status: AssignmentStatus.PENDING,
      assignedAt: new Date(),
      notes: reason,
    });

    await this.assignmentRepository.save(newAssignment);

    this.logger.log(`Task ${task.taskNumber} reassigned from ${currentAssignment?.userId} to ${newUserId}: ${reason}`);
  }

  private getTenantId(): string {
    return this.clsService.get('tenantId') || 'default';
  }
}