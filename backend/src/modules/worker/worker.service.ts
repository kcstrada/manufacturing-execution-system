import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Worker,
  WorkerStatus,
  SkillLevel,
  ShiftType,
  WorkerSchedule,
} from '../../entities/worker.entity';
import { Task } from '../../entities/task.entity';
import { TaskAssignment } from '../../entities/task-assignment.entity';

export interface SkillRequirement {
  name: string;
  minimumLevel?: SkillLevel;
  required?: boolean;
  certificationRequired?: boolean;
}

export interface WorkerAvailabilityCheck {
  workerId: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  hoursNeeded?: number;
}

export interface WorkerSkillMatch {
  worker: Worker;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  skillLevelMatch: boolean;
  certificationValid: boolean;
  available: boolean;
}

export interface WorkerPerformanceMetrics {
  workerId: string;
  efficiency: number;
  qualityScore: number;
  tasksCompleted: number;
  hoursWorked: number;
  averageTaskTime: number;
  onTimeCompletion: number;
  reworkRate: number;
}

export interface WorkloadAnalysis {
  workerId: string;
  currentTasks: number;
  scheduledHours: number;
  availableCapacity: number;
  utilizationRate: number;
  overtimeHours: number;
}

@Injectable()
export class WorkerService {

  constructor(
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    @InjectRepository(WorkerSchedule)
    private readonly scheduleRepository: Repository<WorkerSchedule>,
    @InjectRepository(TaskAssignment)
    private readonly assignmentRepository: Repository<TaskAssignment>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(filters?: {
    status?: WorkerStatus;
    departmentId?: string;
    workCenterId?: string;
    shiftType?: ShiftType;
    hasSkill?: string;
  }): Promise<Worker[]> {
    const query = this.workerRepository.createQueryBuilder('worker')
      .leftJoinAndSelect('worker.department', 'department')
      .leftJoinAndSelect('worker.workCenters', 'workCenters')
      .leftJoinAndSelect('worker.user', 'user');

    if (filters?.status) {
      query.andWhere('worker.status = :status', { status: filters.status });
    }

    if (filters?.departmentId) {
      query.andWhere('worker.departmentId = :departmentId', {
        departmentId: filters.departmentId,
      });
    }

    if (filters?.workCenterId) {
      query.andWhere('workCenters.id = :workCenterId', {
        workCenterId: filters.workCenterId,
      });
    }

    if (filters?.shiftType) {
      query.andWhere('worker.shiftType = :shiftType', {
        shiftType: filters.shiftType,
      });
    }

    if (filters?.hasSkill) {
      query.andWhere(`worker.skills @> :skill`, {
        skill: JSON.stringify([{ name: filters.hasSkill }]),
      });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Worker> {
    const worker = await this.workerRepository.findOne({
      where: { id },
      relations: ['department', 'workCenters', 'user', 'supervisor'],
    });

    if (!worker) {
      throw new NotFoundException(`Worker with ID ${id} not found`);
    }

    return worker;
  }

  async findByUserId(userId: string): Promise<Worker | null> {
    return this.workerRepository.findOne({
      where: { userId },
      relations: ['department', 'workCenters'],
    });
  }

  async findWorkersWithSkills(
    skillRequirements: SkillRequirement[],
    options?: {
      includeUnavailable?: boolean;
      workCenterId?: string;
      minimumMatchScore?: number;
    },
  ): Promise<WorkerSkillMatch[]> {
    const query = this.workerRepository.createQueryBuilder('worker')
      .leftJoinAndSelect('worker.workCenters', 'workCenters');

    // Filter by availability unless explicitly including unavailable
    if (!options?.includeUnavailable) {
      query.andWhere('worker.status IN (:...statuses)', {
        statuses: [WorkerStatus.AVAILABLE, WorkerStatus.WORKING],
      });
    }

    // Filter by work center if specified
    if (options?.workCenterId) {
      query.andWhere('workCenters.id = :workCenterId', {
        workCenterId: options.workCenterId,
      });
    }

    const workers = await query.getMany();
    const matches: WorkerSkillMatch[] = [];

    for (const worker of workers) {
      const match = this.evaluateSkillMatch(worker, skillRequirements);
      
      // Apply minimum match score filter if specified
      if (
        !options?.minimumMatchScore ||
        match.matchScore >= options.minimumMatchScore
      ) {
        matches.push(match);
      }
    }

    // Sort by match score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return matches;
  }

  private evaluateSkillMatch(
    worker: Worker,
    requirements: SkillRequirement[],
  ): WorkerSkillMatch {
    const workerSkills = worker.skills || [];
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    let totalScore = 0;
    let requiredSkillsMet = true;
    let certificationValid = true;

    for (const requirement of requirements) {
      const workerSkill = workerSkills.find(
        (s) => s.name.toLowerCase() === requirement.name.toLowerCase(),
      );

      if (workerSkill) {
        matchedSkills.push(requirement.name);

        // Calculate score based on skill level match
        let skillScore = 0.5; // Base score for having the skill
        
        if (requirement.minimumLevel) {
          const requiredLevelValue = this.getSkillLevelValue(requirement.minimumLevel);
          const workerLevelValue = this.getSkillLevelValue(workerSkill.level);
          
          if (workerLevelValue >= requiredLevelValue) {
            skillScore = 1.0; // Full score for meeting level requirement
            // Bonus for exceeding requirement
            skillScore += (workerLevelValue - requiredLevelValue) * 0.1;
          } else {
            skillScore = 0.5 * (workerLevelValue / requiredLevelValue);
          }
        } else {
          skillScore = 1.0; // Full score if no level requirement
        }

        // Check certification if required
        if (requirement.certificationRequired) {
          if (
            !workerSkill.certifiedDate ||
            (workerSkill.expiryDate && new Date(workerSkill.expiryDate) < new Date())
          ) {
            certificationValid = false;
            skillScore *= 0.5; // Reduce score for invalid certification
          }
        }

        totalScore += skillScore;
      } else {
        missingSkills.push(requirement.name);
        
        if (requirement.required) {
          requiredSkillsMet = false;
        }
      }
    }

    // Calculate final match score (0-100)
    const matchScore = requirements.length > 0
      ? (totalScore / requirements.length) * 100
      : 0;

    return {
      worker,
      matchScore,
      matchedSkills,
      missingSkills,
      skillLevelMatch: requiredSkillsMet,
      certificationValid,
      available: worker.status === WorkerStatus.AVAILABLE,
    };
  }

  private getSkillLevelValue(level: SkillLevel): number {
    const levelValues = {
      [SkillLevel.BEGINNER]: 1,
      [SkillLevel.INTERMEDIATE]: 2,
      [SkillLevel.ADVANCED]: 3,
      [SkillLevel.EXPERT]: 4,
    };
    return levelValues[level] || 0;
  }

  async findBestMatchForTask(
    taskId: string,
    options?: {
      considerWorkload?: boolean;
      considerPerformance?: boolean;
      maxCandidates?: number;
    },
  ): Promise<WorkerSkillMatch[]> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['workCenter'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Extract skill requirements from task
    const skillRequirements = this.extractTaskSkillRequirements(task);

    // Find workers with matching skills
    let candidates = await this.findWorkersWithSkills(skillRequirements, {
      workCenterId: task.workCenterId,
      minimumMatchScore: 50, // At least 50% match
    });

    // Consider workload if requested
    if (options?.considerWorkload) {
      candidates = await this.sortByWorkload(candidates);
    }

    // Consider performance if requested
    if (options?.considerPerformance) {
      candidates = await this.sortByPerformance(candidates);
    }

    // Limit candidates if specified
    if (options?.maxCandidates) {
      candidates = candidates.slice(0, options.maxCandidates);
    }

    return candidates;
  }

  private extractTaskSkillRequirements(task: Task): SkillRequirement[] {
    const requirements: SkillRequirement[] = [];

    // Extract from task metadata or type
    if (task.metadata?.requiredSkills) {
      for (const skill of task.metadata.requiredSkills) {
        requirements.push({
          name: skill.name || skill,
          minimumLevel: skill.level,
          required: skill.required !== false,
          certificationRequired: skill.certificationRequired,
        });
      }
    }

    // Add default skills based on task type
    if (task.type) {
      const typeSkills = this.getDefaultSkillsForTaskType(task.type);
      requirements.push(...typeSkills);
    }

    return requirements;
  }

  private getDefaultSkillsForTaskType(taskType: string): SkillRequirement[] {
    const skillMap: Record<string, SkillRequirement[]> = {
      assembly: [
        { name: 'Assembly', minimumLevel: SkillLevel.INTERMEDIATE, required: true },
        { name: 'Quality Control', minimumLevel: SkillLevel.BEGINNER },
      ],
      welding: [
        { name: 'Welding', minimumLevel: SkillLevel.ADVANCED, required: true, certificationRequired: true },
        { name: 'Safety', minimumLevel: SkillLevel.INTERMEDIATE, required: true },
      ],
      packaging: [
        { name: 'Packaging', minimumLevel: SkillLevel.BEGINNER },
        { name: 'Inventory Management', minimumLevel: SkillLevel.BEGINNER },
      ],
      quality_control: [
        { name: 'Quality Control', minimumLevel: SkillLevel.ADVANCED, required: true },
        { name: 'Documentation', minimumLevel: SkillLevel.INTERMEDIATE },
      ],
      maintenance: [
        { name: 'Maintenance', minimumLevel: SkillLevel.ADVANCED, required: true },
        { name: 'Troubleshooting', minimumLevel: SkillLevel.INTERMEDIATE, required: true },
      ],
    };

    return skillMap[taskType.toLowerCase()] || [];
  }

  private async sortByWorkload(
    candidates: WorkerSkillMatch[],
  ): Promise<WorkerSkillMatch[]> {
    const workloadMap = new Map<string, number>();

    for (const candidate of candidates) {
      const workload = await this.getWorkerWorkload(candidate.worker.id);
      workloadMap.set(candidate.worker.id, workload.currentTasks);
    }

    // Sort by workload (ascending) and then by match score (descending)
    return candidates.sort((a, b) => {
      const workloadA = workloadMap.get(a.worker.id) || 0;
      const workloadB = workloadMap.get(b.worker.id) || 0;
      
      if (workloadA !== workloadB) {
        return workloadA - workloadB; // Less workload is better
      }
      
      return b.matchScore - a.matchScore; // Higher match score is better
    });
  }

  private async sortByPerformance(
    candidates: WorkerSkillMatch[],
  ): Promise<WorkerSkillMatch[]> {
    const performanceMap = new Map<string, number>();

    for (const candidate of candidates) {
      const performance = await this.getWorkerPerformance(candidate.worker.id);
      const performanceScore = 
        (performance.efficiency + performance.qualityScore) / 2;
      performanceMap.set(candidate.worker.id, performanceScore);
    }

    // Sort by combined score of match and performance
    return candidates.sort((a, b) => {
      const perfA = performanceMap.get(a.worker.id) || 0;
      const perfB = performanceMap.get(b.worker.id) || 0;
      
      // Combined score: 70% skill match, 30% performance
      const scoreA = a.matchScore * 0.7 + perfA * 0.3;
      const scoreB = b.matchScore * 0.7 + perfB * 0.3;
      
      return scoreB - scoreA;
    });
  }

  async getWorkerWorkload(workerId: string): Promise<WorkloadAnalysis> {
    const worker = await this.findOne(workerId);

    // Get current active assignments
    const activeAssignments = await this.assignmentRepository.count({
      where: {
        userId: worker.userId,
        status: In(['pending', 'assigned', 'in_progress']),
      },
    });

    // Get scheduled hours for current week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const schedules = await this.scheduleRepository.find({
      where: {
        workerId,
        date: Between(weekStart, weekEnd),
      },
    });

    const scheduledHours = schedules.reduce(
      (sum, schedule) => sum + Number(schedule.scheduledHours),
      0,
    );
    
    const overtimeHours = schedules
      .filter((s) => s.isOvertime)
      .reduce((sum, schedule) => sum + Number(schedule.scheduledHours), 0);

    const availableCapacity = Math.max(
      0,
      worker.weeklyHoursLimit - scheduledHours,
    );
    
    const utilizationRate = 
      worker.weeklyHoursLimit > 0
        ? (scheduledHours / worker.weeklyHoursLimit) * 100
        : 0;

    return {
      workerId,
      currentTasks: activeAssignments,
      scheduledHours,
      availableCapacity,
      utilizationRate,
      overtimeHours,
    };
  }

  async getWorkerPerformance(
    workerId: string,
    dateRange?: { start: Date; end: Date },
  ): Promise<WorkerPerformanceMetrics> {
    const worker = await this.findOne(workerId);

    // Get completed tasks
    const query = this.assignmentRepository.createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.task', 'task')
      .where('assignment.userId = :userId', { userId: worker.userId })
      .andWhere('assignment.status = :status', { status: 'completed' });

    if (dateRange) {
      query.andWhere('assignment.completedAt BETWEEN :start AND :end', {
        start: dateRange.start,
        end: dateRange.end,
      });
    }

    const completedAssignments = await query.getMany();

    // Calculate metrics
    let totalTaskTime = 0;
    let onTimeCount = 0;
    let reworkCount = 0;

    for (const assignment of completedAssignments) {
      if (assignment.startedAt && assignment.completedAt) {
        const taskTime = 
          (assignment.completedAt.getTime() - assignment.startedAt.getTime()) / 
          (1000 * 60 * 60); // Convert to hours
        totalTaskTime += taskTime;
      }

      if (assignment.task) {
        // Check if completed on time
        if (
          assignment.task.dueDate &&
          assignment.completedAt &&
          assignment.completedAt <= assignment.task.dueDate
        ) {
          onTimeCount++;
        }

        // Check for rework (simplified - check if task was reassigned)
        if (assignment.metadata?.wasReassigned) {
          reworkCount++;
        }
      }
    }

    const averageTaskTime = 
      completedAssignments.length > 0
        ? totalTaskTime / completedAssignments.length
        : 0;

    const onTimeCompletion = 
      completedAssignments.length > 0
        ? (onTimeCount / completedAssignments.length) * 100
        : 100;

    const reworkRate = 
      completedAssignments.length > 0
        ? (reworkCount / completedAssignments.length) * 100
        : 0;

    return {
      workerId,
      efficiency: Number(worker.efficiency),
      qualityScore: Number(worker.qualityScore),
      tasksCompleted: worker.totalTasksCompleted,
      hoursWorked: Number(worker.totalHoursWorked),
      averageTaskTime,
      onTimeCompletion,
      reworkRate,
    };
  }

  async checkAvailability(
    check: WorkerAvailabilityCheck,
  ): Promise<{
    available: boolean;
    reason?: string;
    conflicts?: any[];
  }> {
    const worker = await this.findOne(check.workerId);

    // Check worker status
    if (
      ![WorkerStatus.AVAILABLE, WorkerStatus.WORKING].includes(worker.status)
    ) {
      return {
        available: false,
        reason: `Worker status is ${worker.status}`,
      };
    }

    // Check schedule conflicts
    const scheduleConflicts = await this.scheduleRepository.find({
      where: {
        workerId: check.workerId,
        date: check.date,
      },
    });

    if (check.startTime && check.endTime) {
      const conflicts = scheduleConflicts.filter((schedule) => {
        return this.timeRangesOverlap(
          schedule.startTime,
          schedule.endTime,
          check.startTime!,
          check.endTime!,
        );
      });

      if (conflicts.length > 0) {
        return {
          available: false,
          reason: 'Schedule conflict',
          conflicts,
        };
      }
    }

    // Check daily/weekly hour limits
    if (check.hoursNeeded) {
      const workload = await this.getWorkerWorkload(check.workerId);
      
      if (workload.availableCapacity < check.hoursNeeded) {
        return {
          available: false,
          reason: `Insufficient capacity (${workload.availableCapacity} hours available)`,
        };
      }
    }

    // Check day-of-week availability
    const dayOfWeek = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ][check.date.getDay()];

    if (worker.availability) {
      const dayAvailability = worker.availability[dayOfWeek as keyof typeof worker.availability];
      
      if (dayAvailability && dayAvailability.available === false) {
        return {
          available: false,
          reason: `Worker not available on ${dayOfWeek}`,
        };
      }
    }

    return { available: true };
  }

  private timeRangesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    const toMinutes = (time: string): number => {
      const parts = time.split(':').map(Number);
      const hours = parts[0] || 0;
      const minutes = parts[1] || 0;
      return hours * 60 + minutes;
    };

    const start1Min = toMinutes(start1);
    const end1Min = toMinutes(end1);
    const start2Min = toMinutes(start2);
    const end2Min = toMinutes(end2);

    return start1Min < end2Min && start2Min < end1Min;
  }

  async updateSkills(
    workerId: string,
    skills: Array<{
      name: string;
      level: SkillLevel;
      certifiedDate?: Date;
      expiryDate?: Date;
    }>,
  ): Promise<Worker> {
    const worker = await this.findOne(workerId);

    worker.skills = skills;
    await this.workerRepository.save(worker);

    this.eventEmitter.emit('worker.skills.updated', {
      workerId,
      skills,
      timestamp: new Date(),
    });

    return worker;
  }

  async updateStatus(
    workerId: string,
    status: WorkerStatus,
    reason?: string,
  ): Promise<Worker> {
    const worker = await this.findOne(workerId);
    const oldStatus = worker.status;

    worker.status = status;
    await this.workerRepository.save(worker);

    this.eventEmitter.emit('worker.status.changed', {
      workerId,
      oldStatus,
      newStatus: status,
      reason,
      timestamp: new Date(),
    });

    // Handle status-specific logic
    if (status === WorkerStatus.OFF_DUTY || status === WorkerStatus.SICK_LEAVE) {
      // Trigger task reassignment for unavailable worker
      this.eventEmitter.emit('worker.unavailable', {
        workerId,
        userId: worker.userId,
        reason: reason || status,
      });
    }

    return worker;
  }

  async recordPerformanceMetrics(
    workerId: string,
    metrics: {
      efficiency?: number;
      qualityScore?: number;
      tasksCompleted?: number;
      hoursWorked?: number;
    },
  ): Promise<Worker> {
    const worker = await this.findOne(workerId);

    if (metrics.efficiency !== undefined) {
      worker.efficiency = metrics.efficiency;
    }
    if (metrics.qualityScore !== undefined) {
      worker.qualityScore = metrics.qualityScore;
    }
    if (metrics.tasksCompleted !== undefined) {
      worker.totalTasksCompleted += metrics.tasksCompleted;
    }
    if (metrics.hoursWorked !== undefined) {
      worker.totalHoursWorked = Number(worker.totalHoursWorked) + metrics.hoursWorked;
    }

    await this.workerRepository.save(worker);

    return worker;
  }
}