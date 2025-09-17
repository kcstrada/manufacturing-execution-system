import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Not } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  Shift,
  ShiftAssignment,
  ShiftException,
  ProductionCalendar,
  DayOfWeek,
} from '../../entities/shift.entity';
import { Worker, WorkerStatus } from '../../entities/worker.entity';
import { WorkerService } from '../worker/worker.service';
import { startOfWeek, endOfWeek, format, differenceInHours } from 'date-fns';

export interface ShiftScheduleRequest {
  startDate: Date;
  endDate: Date;
  shiftIds?: string[];
  departmentId?: string;
  workCenterId?: string;
  autoAssign?: boolean;
  respectSkillRequirements?: boolean;
  balanceWorkload?: boolean;
}

export interface ShiftCoverageAnalysis {
  shiftId: string;
  date: Date;
  requiredWorkers: number;
  assignedWorkers: number;
  coveragePercentage: number;
  missingSkills?: string[];
  understaffed: boolean;
  overstaffed: boolean;
}

export interface ShiftSwapRequest {
  fromWorkerId: string;
  toWorkerId: string;
  assignmentId: string;
  reason: string;
  requestedBy: string;
}

export interface ScheduleConflict {
  workerId: string;
  date: Date;
  conflictType:
    | 'double_booking'
    | 'overtime_violation'
    | 'rest_period'
    | 'availability';
  details: string;
}

export interface ShiftPattern {
  name: string;
  pattern: string[]; // Array of shift codes
  rotationPeriod: number; // in days
  startDate: Date;
}

@Injectable()
export class ShiftSchedulingService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
    @InjectRepository(ShiftAssignment)
    private readonly assignmentRepository: Repository<ShiftAssignment>,
    @InjectRepository(ShiftException)
    private readonly exceptionRepository: Repository<ShiftException>,
    @InjectRepository(ProductionCalendar)
    private readonly calendarRepository: Repository<ProductionCalendar>,
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    private readonly workerService: WorkerService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async generateSchedule(
    request: ShiftScheduleRequest,
  ): Promise<ShiftAssignment[]> {
    const {
      startDate,
      endDate,
      shiftIds,
      departmentId,
      workCenterId,
      autoAssign,
    } = request;

    // Get applicable shifts
    const shifts = await this.getApplicableShifts({
      shiftIds,
      departmentId,
      workCenterId,
    });

    if (shifts.length === 0) {
      throw new NotFoundException('No shifts found for the specified criteria');
    }

    // Get production calendar for the period
    const calendar = await this.calendarRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
      order: {
        date: 'ASC',
      },
    });

    const assignments: ShiftAssignment[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = this.getDayOfWeek(currentDate);
      const calendarEntry = calendar.find(
        (c) =>
          format(c.date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'),
      );

      // Skip non-working days unless there are shift overrides
      if (
        calendarEntry &&
        !calendarEntry.isWorkingDay &&
        !calendarEntry.shiftOverrides
      ) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      for (const shift of shifts) {
        // Check if shift is active on this day
        if (!shift.isActiveOnDay(dayOfWeek)) {
          continue;
        }

        // Check for shift exceptions
        const exception = await this.exceptionRepository.findOne({
          where: {
            shiftId: shift.id,
            date: currentDate,
          },
        });

        if (exception?.isCancelled) {
          continue;
        }

        // Create shift assignments for the required number of workers
        const targetWorkers = this.calculateTargetWorkers(
          shift,
          calendarEntry,
          exception || undefined,
        );

        if (autoAssign) {
          // Auto-assign workers based on availability and skills
          const assignedWorkers = await this.autoAssignWorkers({
            shift,
            date: currentDate,
            targetCount: targetWorkers,
            respectSkills: request.respectSkillRequirements,
            balanceWorkload: request.balanceWorkload,
          });

          assignments.push(...assignedWorkers);
        } else {
          // Create unassigned shift slots
          for (let i = 0; i < targetWorkers; i++) {
            const assignment = this.assignmentRepository.create({
              shiftId: shift.id,
              date: currentDate,
              status: 'scheduled',
              workCenterId: workCenterId,
            });
            assignments.push(assignment);
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Save all assignments
    const savedAssignments = await this.assignmentRepository.save(assignments);

    // Emit event for schedule generation
    this.eventEmitter.emit('schedule.generated', {
      startDate,
      endDate,
      assignmentCount: savedAssignments.length,
      timestamp: new Date(),
    });

    return savedAssignments;
  }

  private async getApplicableShifts(filters: {
    shiftIds?: string[];
    departmentId?: string;
    workCenterId?: string;
  }): Promise<Shift[]> {
    const query = this.shiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.workCenters', 'workCenters')
      .where('shift.isActive = :isActive', { isActive: true });

    if (filters.shiftIds?.length) {
      query.andWhere('shift.id IN (:...shiftIds)', {
        shiftIds: filters.shiftIds,
      });
    }

    if (filters.departmentId) {
      query.andWhere('shift.departmentId = :departmentId', {
        departmentId: filters.departmentId,
      });
    }

    if (filters.workCenterId) {
      query.andWhere('workCenters.id = :workCenterId', {
        workCenterId: filters.workCenterId,
      });
    }

    return query.getMany();
  }

  private getDayOfWeek(date: Date): DayOfWeek {
    const days = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    return days[date.getDay()] || DayOfWeek.SUNDAY;
  }

  private calculateTargetWorkers(
    shift: Shift,
    calendarEntry?: ProductionCalendar,
    exception?: ShiftException,
  ): number {
    let target = shift.targetWorkers;

    // Apply calendar overrides
    if (calendarEntry?.shiftOverrides) {
      const override = calendarEntry.shiftOverrides.find(
        (o) => o.shiftId === shift.id,
      );
      if (override?.minWorkers) {
        target = override.minWorkers;
      }
    }

    // Apply exception adjustments
    if (exception?.reducedCapacity) {
      target = Math.ceil(target * (exception.reducedCapacity / 100));
    }

    // Apply capacity percentage from calendar
    if (
      calendarEntry?.capacityPercentage &&
      calendarEntry.capacityPercentage !== 100
    ) {
      target = Math.ceil(target * (calendarEntry.capacityPercentage / 100));
    }

    return Math.max(shift.minWorkers, Math.min(target, shift.maxWorkers));
  }

  private async autoAssignWorkers(params: {
    shift: Shift;
    date: Date;
    targetCount: number;
    respectSkills?: boolean;
    balanceWorkload?: boolean;
  }): Promise<ShiftAssignment[]> {
    const { shift, date, targetCount, respectSkills, balanceWorkload } = params;
    const assignments: ShiftAssignment[] = [];

    // Get available workers
    let availableWorkers = await this.getAvailableWorkers(date, shift);

    // Filter by skills if required
    if (respectSkills && shift.skillRequirements?.length) {
      availableWorkers = await this.filterBySkills(
        availableWorkers,
        shift.skillRequirements,
      );
    }

    // Sort by workload if balancing is requested
    if (balanceWorkload) {
      availableWorkers = await this.sortByWorkload(availableWorkers, date);
    }

    // Assign workers up to target count
    const workersToAssign = availableWorkers.slice(0, targetCount);

    for (const worker of workersToAssign) {
      const assignment = this.assignmentRepository.create({
        shiftId: shift.id,
        workerId: worker.id,
        date,
        status: 'scheduled',
        workCenterId: shift.workCenters?.[0]?.id,
      });
      assignments.push(assignment);
    }

    return assignments;
  }

  private async getAvailableWorkers(
    date: Date,
    shift: Shift,
  ): Promise<Worker[]> {
    // Get all active workers
    const workers = await this.workerRepository.find({
      where: {
        status: In([WorkerStatus.AVAILABLE, WorkerStatus.WORKING]),
        departmentId: shift.departmentId,
      },
    });

    const availableWorkers: Worker[] = [];

    for (const worker of workers) {
      // Check if worker is already assigned to another shift on this date
      const existingAssignment = await this.assignmentRepository.findOne({
        where: {
          workerId: worker.id,
          date,
          status: Not('cancelled'),
        },
      });

      if (existingAssignment) {
        continue;
      }

      // Check worker availability
      const availability = await this.workerService.checkAvailability({
        workerId: worker.id,
        date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        hoursNeeded: shift.workingHours,
      });

      if (availability.available) {
        availableWorkers.push(worker);
      }
    }

    return availableWorkers;
  }

  private async filterBySkills(
    workers: Worker[],
    requirements: Array<{ skill: string; minCount: number; level?: string }>,
  ): Promise<Worker[]> {
    const filteredWorkers: Worker[] = [];

    for (const worker of workers) {
      let meetsRequirements = true;

      for (const requirement of requirements) {
        const workerSkill = worker.skills?.find(
          (s) => s.name.toLowerCase() === requirement.skill.toLowerCase(),
        );

        if (!workerSkill) {
          meetsRequirements = false;
          break;
        }

        // Check skill level if specified
        if (requirement.level && workerSkill.level !== requirement.level) {
          meetsRequirements = false;
          break;
        }
      }

      if (meetsRequirements) {
        filteredWorkers.push(worker);
      }
    }

    return filteredWorkers;
  }

  private async sortByWorkload(
    workers: Worker[],
    date: Date,
  ): Promise<Worker[]> {
    const workloadMap = new Map<string, number>();

    // Calculate weekly workload for each worker
    const weekStart = startOfWeek(date);
    const weekEnd = endOfWeek(date);

    for (const worker of workers) {
      const assignments = await this.assignmentRepository.count({
        where: {
          workerId: worker.id,
          date: Between(weekStart, weekEnd),
          status: Not('cancelled'),
        },
      });
      workloadMap.set(worker.id, assignments);
    }

    // Sort by ascending workload (least loaded first)
    return workers.sort((a, b) => {
      const workloadA = workloadMap.get(a.id) || 0;
      const workloadB = workloadMap.get(b.id) || 0;
      return workloadA - workloadB;
    });
  }

  async analyzeCoverage(
    startDate: Date,
    endDate: Date,
    shiftIds?: string[],
  ): Promise<ShiftCoverageAnalysis[]> {
    const shifts = shiftIds?.length
      ? await this.shiftRepository.findBy({ id: In(shiftIds) })
      : await this.shiftRepository.find();

    const coverageAnalysis: ShiftCoverageAnalysis[] = [];

    const assignments = await this.assignmentRepository.find({
      where: {
        date: Between(startDate, endDate),
        status: Not('cancelled'),
      },
      relations: ['shift'],
    });

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      for (const shift of shifts) {
        const dayOfWeek = this.getDayOfWeek(currentDate);

        if (!shift.isActiveOnDay(dayOfWeek)) {
          continue;
        }

        const shiftAssignments = assignments.filter(
          (a) =>
            a.shiftId === shift.id &&
            format(a.date, 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd'),
        );

        const assignedCount = shiftAssignments.filter((a) => a.workerId).length;
        const requiredCount = shift.targetWorkers;
        const coveragePercentage =
          requiredCount > 0 ? (assignedCount / requiredCount) * 100 : 0;

        coverageAnalysis.push({
          shiftId: shift.id,
          date: new Date(currentDate),
          requiredWorkers: requiredCount,
          assignedWorkers: assignedCount,
          coveragePercentage,
          understaffed: assignedCount < shift.minWorkers,
          overstaffed: assignedCount > shift.maxWorkers,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return coverageAnalysis;
  }

  async requestShiftSwap(request: ShiftSwapRequest): Promise<ShiftAssignment> {
    const { fromWorkerId, toWorkerId, assignmentId, reason, requestedBy } =
      request;

    // Get the original assignment
    const originalAssignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['shift'],
    });

    if (!originalAssignment) {
      throw new NotFoundException('Shift assignment not found');
    }

    if (originalAssignment.workerId !== fromWorkerId) {
      throw new BadRequestException('Worker is not assigned to this shift');
    }

    // Check if the new worker is available
    const availability = await this.workerService.checkAvailability({
      workerId: toWorkerId,
      date: originalAssignment.date,
      startTime: originalAssignment.shift.startTime,
      endTime: originalAssignment.shift.endTime,
      hoursNeeded: originalAssignment.shift.workingHours,
    });

    if (!availability.available) {
      throw new ConflictException(
        `Worker is not available: ${availability.reason}`,
      );
    }

    // Check for conflicts
    const existingAssignment = await this.assignmentRepository.findOne({
      where: {
        workerId: toWorkerId,
        date: originalAssignment.date,
        status: Not('cancelled'),
      },
    });

    if (existingAssignment) {
      throw new ConflictException(
        'Worker already has a shift assignment on this date',
      );
    }

    // Create new assignment for the replacement worker
    const newAssignment = this.assignmentRepository.create({
      ...originalAssignment,
      id: undefined,
      workerId: toWorkerId,
      replacementForId: originalAssignment.id,
      notes: `Swap request: ${reason}`,
      approvedById: requestedBy,
      approvedAt: new Date(),
    });

    // Cancel the original assignment
    originalAssignment.status = 'cancelled';
    originalAssignment.notes = `Swapped to another worker: ${reason}`;

    await this.assignmentRepository.save([originalAssignment, newAssignment]);

    // Emit event
    this.eventEmitter.emit('shift.swapped', {
      originalAssignmentId: assignmentId,
      fromWorkerId,
      toWorkerId,
      date: originalAssignment.date,
      shiftId: originalAssignment.shiftId,
      reason,
      requestedBy,
      timestamp: new Date(),
    });

    return newAssignment;
  }

  async applyShiftPattern(
    pattern: ShiftPattern,
    workerIds: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<ShiftAssignment[]> {
    const assignments: ShiftAssignment[] = [];
    const shifts = await this.shiftRepository.find({
      where: { shiftCode: In(pattern.pattern) },
    });

    if (shifts.length !== pattern.pattern.length) {
      throw new NotFoundException('Some shifts in the pattern were not found');
    }

    const shiftMap = new Map(shifts.map((s) => [s.shiftCode, s]));
    const currentDate = new Date(startDate);
    let patternIndex = 0;

    while (currentDate <= endDate) {
      const shiftCode = pattern.pattern[patternIndex % pattern.pattern.length];
      if (!shiftCode) {
        continue;
      }
      const shift = shiftMap.get(shiftCode);

      if (!shift) {
        continue;
      }

      for (const workerId of workerIds) {
        // Check for existing assignments
        const existing = await this.assignmentRepository.findOne({
          where: {
            workerId,
            date: currentDate,
            status: Not('cancelled'),
          },
        });

        if (!existing) {
          const assignment = this.assignmentRepository.create({
            shiftId: shift.id,
            workerId,
            date: new Date(currentDate),
            status: 'scheduled',
          });
          assignments.push(assignment);
        }
      }

      // Move to next day and pattern position
      currentDate.setDate(currentDate.getDate() + 1);
      patternIndex++;
    }

    const savedAssignments = await this.assignmentRepository.save(assignments);

    this.eventEmitter.emit('pattern.applied', {
      patternName: pattern.name,
      workerCount: workerIds.length,
      assignmentCount: savedAssignments.length,
      startDate,
      endDate,
      timestamp: new Date(),
    });

    return savedAssignments;
  }

  async detectConflicts(
    workerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];

    const assignments = await this.assignmentRepository.find({
      where: {
        workerId,
        date: Between(startDate, endDate),
        status: Not('cancelled'),
      },
      relations: ['shift'],
      order: { date: 'ASC' },
    });

    for (let i = 0; i < assignments.length; i++) {
      const current = assignments[i];
      if (!current) {
        continue;
      }

      // Check for double booking on the same day
      const sameDayAssignments = assignments.filter(
        (a) =>
          format(a.date, 'yyyy-MM-dd') === format(current.date, 'yyyy-MM-dd') &&
          a.id !== current.id,
      );

      if (sameDayAssignments.length > 0) {
        conflicts.push({
          workerId,
          date: current.date,
          conflictType: 'double_booking',
          details: `Multiple shifts assigned on ${format(current.date, 'yyyy-MM-dd')}`,
        });
      }

      // Check for minimum rest period between shifts (e.g., 8 hours)
      if (i > 0) {
        const previous = assignments[i - 1];
        if (previous && current) {
          const restHours = this.calculateRestHours(previous, current);

          if (restHours < 8) {
            conflicts.push({
              workerId,
              date: current.date,
              conflictType: 'rest_period',
              details: `Only ${restHours} hours rest between shifts (minimum 8 required)`,
            });
          }
        }
      }

      // Check for weekly hour limits
      const weekStart = startOfWeek(current.date);
      const weekEnd = endOfWeek(current.date);
      const weeklyAssignments = assignments.filter(
        (a) => a.date >= weekStart && a.date <= weekEnd,
      );

      const weeklyHours = weeklyAssignments.reduce(
        (sum, a) => sum + (a.shift?.workingHours || 0),
        0,
      );

      if (weeklyHours > 40) {
        conflicts.push({
          workerId,
          date: current.date,
          conflictType: 'overtime_violation',
          details: `Weekly hours exceed limit: ${weeklyHours} hours`,
        });
      }
    }

    return conflicts;
  }

  private calculateRestHours(
    previousAssignment: ShiftAssignment,
    currentAssignment: ShiftAssignment,
  ): number {
    if (!previousAssignment.shift || !currentAssignment.shift) {
      return 24; // Default to full day if shift info is missing
    }

    const prevEnd = new Date(
      `${format(previousAssignment.date, 'yyyy-MM-dd')} ${previousAssignment.shift.endTime}`,
    );
    const currStart = new Date(
      `${format(currentAssignment.date, 'yyyy-MM-dd')} ${currentAssignment.shift.startTime}`,
    );

    // Handle overnight shifts
    if (previousAssignment.shift.isOvernight) {
      prevEnd.setDate(prevEnd.getDate() + 1);
    }

    return differenceInHours(currStart, prevEnd);
  }

  async updateAssignmentStatus(
    assignmentId: string,
    status: string,
    notes?: string,
  ): Promise<ShiftAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    assignment.status = status;
    if (notes) {
      assignment.notes = notes;
    }

    const updated = await this.assignmentRepository.save(assignment);

    this.eventEmitter.emit('assignment.status.updated', {
      assignmentId,
      oldStatus: assignment.status,
      newStatus: status,
      timestamp: new Date(),
    });

    return updated;
  }
}
