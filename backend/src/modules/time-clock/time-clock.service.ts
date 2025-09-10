import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull, Not } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  TimeClockEntry,
  TimeClockSession,
  TimeClockRule,
  ClockEventType,
  ClockMethod,
} from '../../entities/time-clock.entity';
import { Worker, WorkerStatus } from '../../entities/worker.entity';
import { ShiftAssignment } from '../../entities/shift.entity';
import {
  ClockInDto,
  ClockOutDto,
  BreakDto,
  ManualClockEntryDto,
  ApproveClockEntryDto,
  CorrectTimeEntryDto,
  TimeClockReportDto,
  TimeClockStatusDto,
  WorkerTimeStatusResponseDto,
  TimeClockValidationResponseDto,
} from './dto/time-clock.dto';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  differenceInMinutes,
  format,
} from 'date-fns';

@Injectable()
export class TimeClockService {
  constructor(
    @InjectRepository(TimeClockEntry)
    private readonly entryRepository: Repository<TimeClockEntry>,
    @InjectRepository(TimeClockSession)
    private readonly sessionRepository: Repository<TimeClockSession>,
    @InjectRepository(TimeClockRule)
    private readonly ruleRepository: Repository<TimeClockRule>,
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    @InjectRepository(ShiftAssignment)
    private readonly shiftAssignmentRepository: Repository<ShiftAssignment>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async clockIn(workerId: string, dto: ClockInDto): Promise<TimeClockEntry> {
    // Check if worker exists and is active
    const worker = await this.workerRepository.findOne({
      where: { id: workerId, isActive: true },
    });

    if (!worker) {
      throw new NotFoundException('Worker not found or inactive');
    }

    // Check if already clocked in
    const openSession = await this.getOpenSession(workerId);
    if (openSession) {
      throw new ConflictException('Worker is already clocked in');
    }

    // Validate location if GPS required
    if (dto.method === ClockMethod.MOBILE) {
      await this.validateGpsLocation(workerId, dto.latitude, dto.longitude);
    }

    // Get or create today's session
    const session = await this.getOrCreateSession(workerId, dto.shiftAssignmentId);

    // Create clock in entry
    const entry = this.entryRepository.create({
      workerId,
      eventType: ClockEventType.CLOCK_IN,
      clockedAt: new Date(),
      method: dto.method || ClockMethod.MANUAL,
      workCenterId: dto.workCenterId,
      shiftAssignmentId: dto.shiftAssignmentId,
      taskId: dto.taskId,
      ipAddress: dto.ipAddress,
      deviceId: dto.deviceId,
      notes: dto.notes,
      gpsLocation: dto.latitude && dto.longitude
        ? `POINT(${dto.longitude} ${dto.latitude})`
        : undefined,
    });

    await this.entryRepository.save(entry);

    // Update session
    session.clockInTime = entry.clockedAt;
    session.status = 'open';
    await this.sessionRepository.save(session);

    // Update worker status
    await this.workerRepository.update(workerId, { 
      status: WorkerStatus.WORKING 
    });

    // Emit event
    this.eventEmitter.emit('timeclock.clockin', {
      workerId,
      clockedAt: entry.clockedAt,
      workCenterId: dto.workCenterId,
    });

    return entry;
  }

  async clockOut(workerId: string, dto: ClockOutDto): Promise<TimeClockEntry> {
    // Check if worker exists
    const worker = await this.workerRepository.findOne({
      where: { id: workerId },
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    // Get open session
    const session = await this.getOpenSession(workerId);
    if (!session) {
      throw new ConflictException('Worker is not clocked in');
    }

    // Validate location if GPS required
    if (dto.method === ClockMethod.MOBILE) {
      await this.validateGpsLocation(workerId, dto.latitude, dto.longitude);
    }

    // Create clock out entry
    const entry = this.entryRepository.create({
      workerId,
      eventType: ClockEventType.CLOCK_OUT,
      clockedAt: new Date(),
      method: dto.method || ClockMethod.MANUAL,
      shiftAssignmentId: session.shiftAssignmentId,
      ipAddress: dto.ipAddress,
      deviceId: dto.deviceId,
      notes: dto.notes,
      gpsLocation: dto.latitude && dto.longitude
        ? `POINT(${dto.longitude} ${dto.latitude})`
        : undefined,
    });

    await this.entryRepository.save(entry);

    // Update session
    session.clockOutTime = entry.clockedAt;
    session.status = 'closed';
    await this.sessionRepository.save(session);

    // Update worker status
    await this.workerRepository.update(workerId, { 
      status: WorkerStatus.OFF_DUTY 
    });

    // Emit event
    this.eventEmitter.emit('timeclock.clockout', {
      workerId,
      clockedAt: entry.clockedAt,
      hoursWorked: session.totalHours,
    });

    return entry;
  }

  async recordBreak(workerId: string, dto: BreakDto): Promise<TimeClockEntry> {
    // Get open session
    const session = await this.getOpenSession(workerId);
    if (!session) {
      throw new ConflictException('Worker is not clocked in');
    }

    // Map break type to event type
    const eventTypeMap: Record<string, ClockEventType> = {
      'break_start': ClockEventType.BREAK_START,
      'break_end': ClockEventType.BREAK_END,
      'lunch_start': ClockEventType.LUNCH_START,
      'lunch_end': ClockEventType.LUNCH_END,
    };

    const eventType = eventTypeMap[dto.breakType];
    if (!eventType) {
      throw new BadRequestException('Invalid break type');
    }

    // Check for valid break sequence
    await this.validateBreakSequence(workerId, eventType);

    // Create break entry
    const entry = this.entryRepository.create({
      workerId,
      eventType,
      clockedAt: new Date(),
      method: dto.method || ClockMethod.MANUAL,
      shiftAssignmentId: session.shiftAssignmentId,
      notes: dto.notes,
    });

    await this.entryRepository.save(entry);

    // Update worker status
    if (eventType === ClockEventType.BREAK_START || eventType === ClockEventType.LUNCH_START) {
      await this.workerRepository.update(workerId, { 
        status: WorkerStatus.BREAK 
      });
    } else {
      await this.workerRepository.update(workerId, { 
        status: WorkerStatus.WORKING 
      });
    }

    // Update session break tracking
    await this.updateSessionBreaks(session, eventType);

    return entry;
  }

  async createManualEntry(dto: ManualClockEntryDto, approvedBy: string): Promise<TimeClockEntry> {
    // Validate worker
    const worker = await this.workerRepository.findOne({
      where: { id: dto.workerId },
    });

    if (!worker) {
      throw new NotFoundException('Worker not found');
    }

    // Check if manual entries require approval
    const rules = await this.getActiveRules();
    const requiresApproval = rules?.requireManagerApprovalForManualEntry ?? true;

    // Create manual entry
    const entry = this.entryRepository.create({
      workerId: dto.workerId,
      eventType: dto.eventType,
      clockedAt: new Date(dto.clockedAt),
      method: ClockMethod.MANUAL,
      workCenterId: dto.workCenterId,
      shiftAssignmentId: dto.shiftAssignmentId,
      notes: dto.notes,
      isManualEntry: true,
      exceptionReason: dto.reason,
      isException: true,
      approvedBy: requiresApproval ? approvedBy : undefined,
      approvedAt: requiresApproval ? new Date() : undefined,
    });

    await this.entryRepository.save(entry);

    // Update or create session if needed
    if (dto.eventType === ClockEventType.CLOCK_IN || dto.eventType === ClockEventType.CLOCK_OUT) {
      await this.updateSessionFromManualEntry(entry);
    }

    // Emit event
    this.eventEmitter.emit('timeclock.manual.entry', {
      workerId: dto.workerId,
      eventType: dto.eventType,
      approvedBy,
    });

    return entry;
  }

  async approveEntry(dto: ApproveClockEntryDto, approvedBy: string): Promise<TimeClockEntry> {
    const entry = await this.entryRepository.findOne({
      where: { id: dto.entryId },
    });

    if (!entry) {
      throw new NotFoundException('Time clock entry not found');
    }

    if (entry.approvedBy) {
      throw new ConflictException('Entry has already been approved');
    }

    entry.approvedBy = dto.approved ? approvedBy : undefined;
    entry.approvedAt = dto.approved ? new Date() : undefined;
    entry.approvalNotes = dto.approvalNotes;

    await this.entryRepository.save(entry);

    // Emit event
    this.eventEmitter.emit('timeclock.entry.approved', {
      entryId: dto.entryId,
      approved: dto.approved,
      approvedBy,
    });

    return entry;
  }

  async correctTimeEntry(dto: CorrectTimeEntryDto, correctedBy: string): Promise<TimeClockSession> {
    const session = await this.sessionRepository.findOne({
      where: { id: dto.sessionId },
    });

    if (!session) {
      throw new NotFoundException('Time clock session not found');
    }

    // Store original values
    const originalValues = {
      clockInTime: session.clockInTime,
      clockOutTime: session.clockOutTime,
      breakMinutes: session.breakMinutes,
      lunchMinutes: session.lunchMinutes,
    };

    // Apply corrections
    if (dto.clockInTime) {
      session.clockInTime = new Date(dto.clockInTime);
    }
    if (dto.clockOutTime) {
      session.clockOutTime = new Date(dto.clockOutTime);
    }
    if (dto.breakMinutes !== undefined) {
      session.breakMinutes = dto.breakMinutes;
    }
    if (dto.lunchMinutes !== undefined) {
      session.lunchMinutes = dto.lunchMinutes;
    }

    // Add to exceptions
    session.exceptions = session.exceptions || [];
    session.exceptions.push({
      type: 'correction',
      time: new Date(),
      reason: dto.reason,
      approvedBy: correctedBy,
    });

    session.status = 'corrected';
    session.approvedBy = correctedBy;
    session.approvedAt = new Date();

    await this.sessionRepository.save(session);

    // Emit event
    this.eventEmitter.emit('timeclock.session.corrected', {
      sessionId: dto.sessionId,
      originalValues,
      newValues: {
        clockInTime: session.clockInTime,
        clockOutTime: session.clockOutTime,
        breakMinutes: session.breakMinutes,
        lunchMinutes: session.lunchMinutes,
      },
      correctedBy,
    });

    return session;
  }

  async getWorkerStatus(dto: TimeClockStatusDto): Promise<WorkerTimeStatusResponseDto[]> {
    const date = dto.date ? new Date(dto.date) : new Date();
    const workerIds = dto.workerId ? [dto.workerId] : undefined;

    const workers = workerIds
      ? await this.workerRepository.findByIds(workerIds)
      : await this.workerRepository.find({ where: { isActive: true } });

    const statuses: WorkerTimeStatusResponseDto[] = [];

    for (const worker of workers) {
      const todaySession = await this.sessionRepository.findOne({
        where: {
          workerId: worker.id,
          sessionDate: date,
        },
      });

      const lastEntry = await this.entryRepository.findOne({
        where: { workerId: worker.id },
        order: { clockedAt: 'DESC' },
      });

      const weekStart = startOfWeek(date);
      const weekEnd = endOfWeek(date);
      const weekSessions = await this.sessionRepository.find({
        where: {
          workerId: worker.id,
          sessionDate: Between(weekStart, weekEnd),
        },
      });

      // Calculate totals
      const todayTotals = {
        regularHours: todaySession?.regularHours || 0,
        overtimeHours: todaySession?.overtimeHours || 0,
        breakMinutes: todaySession?.breakMinutes || 0,
        lunchMinutes: todaySession?.lunchMinutes || 0,
      };

      const weekTotals = weekSessions.reduce(
        (acc, session) => ({
          regularHours: acc.regularHours + session.regularHours,
          overtimeHours: acc.overtimeHours + session.overtimeHours,
          totalHours: acc.totalHours + session.totalHours,
        }),
        { regularHours: 0, overtimeHours: 0, totalHours: 0 },
      );

      // Determine current status
      let status: 'clocked_in' | 'clocked_out' | 'on_break' | 'on_lunch' = 'clocked_out';
      let currentSession = undefined;

      if (todaySession && todaySession.clockInTime && !todaySession.clockOutTime) {
        status = 'clocked_in';
        
        // Check if on break
        if (lastEntry) {
          if (lastEntry.eventType === ClockEventType.BREAK_START) {
            status = 'on_break';
          } else if (lastEntry.eventType === ClockEventType.LUNCH_START) {
            status = 'on_lunch';
          }
        }

        const hoursWorked = differenceInMinutes(new Date(), todaySession.clockInTime) / 60;
        currentSession = {
          clockInTime: todaySession.clockInTime,
          hoursWorked: Number(hoursWorked.toFixed(2)),
          breaksTaken: todaySession.breakPeriods?.length || 0,
          overtimeHours: todaySession.overtimeHours,
        };
      }

      statuses.push({
        workerId: worker.id,
        workerName: `${worker.firstName} ${worker.lastName}`,
        status,
        lastEvent: lastEntry
          ? {
              type: lastEntry.eventType,
              time: lastEntry.clockedAt,
              location: lastEntry.workCenterId,
            }
          : undefined,
        currentSession,
        todayTotals,
        weekTotals,
      });
    }

    return statuses;
  }

  async generateReport(dto: TimeClockReportDto): Promise<any> {
    const startDate = startOfDay(new Date(dto.startDate));
    const endDate = endOfDay(new Date(dto.endDate));

    const query = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.worker', 'worker')
      .leftJoinAndSelect('session.shiftAssignment', 'shiftAssignment')
      .where('session.sessionDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (dto.workerIds?.length) {
      query.andWhere('session.workerId IN (:...workerIds)', { 
        workerIds: dto.workerIds 
      });
    }

    if (dto.departmentId) {
      query.andWhere('worker.departmentId = :departmentId', { 
        departmentId: dto.departmentId 
      });
    }

    if (dto.workCenterId) {
      query.andWhere('worker.workCenterId = :workCenterId', { 
        workCenterId: dto.workCenterId 
      });
    }

    if (dto.overtimeOnly) {
      query.andWhere('session.overtimeHours > 0');
    }

    if (dto.exceptionsOnly) {
      query.andWhere('(session.isLateArrival = true OR session.isEarlyDeparture = true OR session.isAbsent = true)');
    }

    const sessions = await query.getMany();

    // Calculate summary statistics
    const summary = {
      totalSessions: sessions.length,
      totalRegularHours: 0,
      totalOvertimeHours: 0,
      totalProductiveHours: 0,
      lateArrivals: 0,
      earlyDepartures: 0,
      absences: 0,
      averageHoursPerDay: 0,
    };

    const workerSummaries = new Map<string, any>();

    for (const session of sessions) {
      summary.totalRegularHours += session.regularHours;
      summary.totalOvertimeHours += session.overtimeHours;
      summary.totalProductiveHours += session.productiveHours;
      
      if (session.isLateArrival) summary.lateArrivals++;
      if (session.isEarlyDeparture) summary.earlyDepartures++;
      if (session.isAbsent) summary.absences++;

      // Aggregate by worker
      if (!workerSummaries.has(session.workerId)) {
        workerSummaries.set(session.workerId, {
          workerId: session.workerId,
          workerName: session.worker ? 
            `${session.worker.firstName} ${session.worker.lastName}` : 
            'Unknown',
          totalDays: 0,
          totalRegularHours: 0,
          totalOvertimeHours: 0,
          totalProductiveHours: 0,
          lateArrivals: 0,
          earlyDepartures: 0,
          absences: 0,
        });
      }

      const workerSummary = workerSummaries.get(session.workerId);
      workerSummary.totalDays++;
      workerSummary.totalRegularHours += session.regularHours;
      workerSummary.totalOvertimeHours += session.overtimeHours;
      workerSummary.totalProductiveHours += session.productiveHours;
      if (session.isLateArrival) workerSummary.lateArrivals++;
      if (session.isEarlyDeparture) workerSummary.earlyDepartures++;
      if (session.isAbsent) workerSummary.absences++;
    }

    summary.averageHoursPerDay = sessions.length > 0
      ? summary.totalProductiveHours / sessions.length
      : 0;

    return {
      summary,
      byWorker: Array.from(workerSummaries.values()),
      sessions: sessions.map((s) => ({
        sessionId: s.id,
        workerId: s.workerId,
        workerName: s.worker ? 
          `${s.worker.firstName} ${s.worker.lastName}` : 
          'Unknown',
        date: s.sessionDate,
        clockIn: s.clockInTime,
        clockOut: s.clockOutTime,
        regularHours: s.regularHours,
        overtimeHours: s.overtimeHours,
        productiveHours: s.productiveHours,
        breakMinutes: s.breakMinutes,
        lunchMinutes: s.lunchMinutes,
        status: s.status,
        lateArrival: s.isLateArrival,
        earlyDeparture: s.isEarlyDeparture,
        lateMinutes: s.lateMinutes,
        earlyMinutes: s.earlyDepartureMinutes,
      })),
    };
  }

  async validateClockEvent(
    workerId: string,
    eventType: ClockEventType,
    clockTime?: Date,
  ): Promise<TimeClockValidationResponseDto> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: any = {};

    // Get active rules
    const rules = await this.getActiveRules();
    
    // Check worker status
    const worker = await this.workerRepository.findOne({
      where: { id: workerId },
    });

    if (!worker) {
      errors.push('Worker not found');
      return { valid: false, errors };
    }

    if (!worker.isActive) {
      errors.push('Worker is inactive');
    }

    // Check for open session
    const openSession = await this.getOpenSession(workerId);

    if (eventType === ClockEventType.CLOCK_IN && openSession) {
      errors.push('Worker is already clocked in');
    }

    if (eventType === ClockEventType.CLOCK_OUT && !openSession) {
      errors.push('Worker is not clocked in');
    }

    // Check shift assignment
    const now = clockTime || new Date();
    const shiftAssignment = await this.shiftAssignmentRepository.findOne({
      where: {
        workerId,
        date: now,
        status: Not('cancelled'),
      },
      relations: ['shift'],
    });

    if (shiftAssignment) {
      suggestions.shiftAssignment = shiftAssignment.id;

      // Check if within grace period
      if (rules && eventType === ClockEventType.CLOCK_IN) {
        const shiftStart = new Date(
          `${format(now, 'yyyy-MM-dd')} ${shiftAssignment.shift.startTime}`,
        );
        const minutesDiff = differenceInMinutes(now, shiftStart);

        if (minutesDiff > rules.graceMinutesLate) {
          warnings.push(`Clock in is ${minutesDiff} minutes late`);
          suggestions.requiresApproval = true;
        }

        // Calculate rounded time
        if (rules.roundingMinutes > 0) {
          suggestions.roundedTime = this.roundTime(
            now,
            rules.roundingMinutes,
            rules.roundingDirection,
          );
        }
      }
    } else {
      warnings.push('No shift assignment found for today');
    }

    // Check for consecutive work hours
    if (openSession && rules) {
      const workMinutes = differenceInMinutes(now, openSession.clockInTime!);
      if (workMinutes > rules.maxConsecutiveWorkMinutes) {
        warnings.push('Maximum consecutive work hours exceeded');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      suggestions: Object.keys(suggestions).length > 0 ? suggestions : undefined,
    };
  }

  // Helper methods

  private async getOpenSession(workerId: string): Promise<TimeClockSession | null> {
    return this.sessionRepository.findOne({
      where: {
        workerId,
        status: 'open',
        clockOutTime: IsNull(),
      },
    });
  }

  private async getOrCreateSession(
    workerId: string,
    shiftAssignmentId?: string,
  ): Promise<TimeClockSession> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let session = await this.sessionRepository.findOne({
      where: {
        workerId,
        sessionDate: today,
      },
    });

    if (!session) {
      session = this.sessionRepository.create({
        workerId,
        sessionDate: today,
        shiftAssignmentId,
        status: 'open',
      });
      await this.sessionRepository.save(session);
    }

    return session;
  }

  private async validateGpsLocation(
    _workerId: string,
    latitude?: number,
    longitude?: number,
  ): Promise<void> {
    const rules = await this.getActiveRules();
    
    if (!rules?.requireGpsForMobile) {
      return;
    }

    if (!latitude || !longitude) {
      throw new BadRequestException('GPS location is required for mobile clock in');
    }

    // Check if within allowed radius
    if (rules.maxGpsRadius) {
      // This would need actual implementation to check distance from work centers
      // For now, we'll just validate that GPS coords are provided
    }
  }

  private async validateBreakSequence(
    workerId: string,
    eventType: ClockEventType,
  ): Promise<void> {
    const lastEntry = await this.entryRepository.findOne({
      where: { workerId },
      order: { clockedAt: 'DESC' },
    });

    if (!lastEntry) {
      throw new BadRequestException('No previous clock events found');
    }

    const validSequences: Record<ClockEventType, ClockEventType[]> = {
      [ClockEventType.BREAK_START]: [
        ClockEventType.CLOCK_IN,
        ClockEventType.BREAK_END,
        ClockEventType.LUNCH_END,
      ],
      [ClockEventType.BREAK_END]: [ClockEventType.BREAK_START],
      [ClockEventType.LUNCH_START]: [
        ClockEventType.CLOCK_IN,
        ClockEventType.BREAK_END,
        ClockEventType.LUNCH_END,
      ],
      [ClockEventType.LUNCH_END]: [ClockEventType.LUNCH_START],
    } as any;

    const validPrevious = validSequences[eventType];
    if (validPrevious && !validPrevious.includes(lastEntry.eventType)) {
      throw new BadRequestException(
        `Invalid break sequence. Cannot ${eventType} after ${lastEntry.eventType}`,
      );
    }
  }

  private async updateSessionBreaks(
    session: TimeClockSession,
    eventType: ClockEventType,
  ): Promise<void> {
    const now = new Date();
    session.breakPeriods = session.breakPeriods || [];

    if (eventType === ClockEventType.BREAK_START || eventType === ClockEventType.LUNCH_START) {
      // Start a new break period
      session.breakPeriods.push({
        startTime: now,
        type: eventType === ClockEventType.BREAK_START ? 'break' : 'lunch',
        minutes: 0,
      });
    } else {
      // End the current break period
      const currentBreak = session.breakPeriods.find((b) => !b.endTime);
      if (currentBreak) {
        currentBreak.endTime = now;
        currentBreak.minutes = differenceInMinutes(now, currentBreak.startTime);
        
        // Update session totals
        if (currentBreak.type === 'break') {
          session.breakMinutes += currentBreak.minutes;
        } else {
          session.lunchMinutes += currentBreak.minutes;
        }
      }
    }

    await this.sessionRepository.save(session);
  }

  private async updateSessionFromManualEntry(entry: TimeClockEntry): Promise<void> {
    const session = await this.getOrCreateSession(entry.workerId, entry.shiftAssignmentId);

    if (entry.eventType === ClockEventType.CLOCK_IN) {
      session.clockInTime = entry.clockedAt;
      session.status = 'open';
    } else if (entry.eventType === ClockEventType.CLOCK_OUT) {
      session.clockOutTime = entry.clockedAt;
      session.status = 'closed';
    }

    await this.sessionRepository.save(session);
  }

  private async getActiveRules(): Promise<TimeClockRule | null> {
    return this.ruleRepository.findOne({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  private roundTime(time: Date, minutes: number, direction: string): Date {
    const totalMinutes = time.getHours() * 60 + time.getMinutes();
    const remainder = totalMinutes % minutes;

    if (remainder === 0) {
      return time;
    }

    let roundedMinutes: number;
    if (direction === 'up') {
      roundedMinutes = totalMinutes + (minutes - remainder);
    } else if (direction === 'down') {
      roundedMinutes = totalMinutes - remainder;
    } else {
      // nearest
      if (remainder < minutes / 2) {
        roundedMinutes = totalMinutes - remainder;
      } else {
        roundedMinutes = totalMinutes + (minutes - remainder);
      }
    }

    const rounded = new Date(time);
    rounded.setHours(Math.floor(roundedMinutes / 60));
    rounded.setMinutes(roundedMinutes % 60);
    rounded.setSeconds(0);
    rounded.setMilliseconds(0);

    return rounded;
  }
}