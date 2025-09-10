import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { Worker } from './worker.entity';
import { WorkCenter } from './work-center.entity';
import { ShiftAssignment } from './shift.entity';
import { Task } from './task.entity';

export enum ClockEventType {
  CLOCK_IN = 'clock_in',
  CLOCK_OUT = 'clock_out',
  BREAK_START = 'break_start',
  BREAK_END = 'break_end',
  LUNCH_START = 'lunch_start',
  LUNCH_END = 'lunch_end',
  OVERTIME_START = 'overtime_start',
  OVERTIME_END = 'overtime_end',
}

export enum ClockMethod {
  MANUAL = 'manual',
  BIOMETRIC = 'biometric',
  CARD = 'card',
  MOBILE = 'mobile',
  WEB = 'web',
  KIOSK = 'kiosk',
}

@Entity('time_clock_entries')
@Index(['tenantId', 'workerId', 'clockedAt'])
@Index(['tenantId', 'eventType', 'clockedAt'])
@Index(['tenantId', 'workCenterId', 'clockedAt'])
@Index(['tenantId', 'shiftAssignmentId'])
export class TimeClockEntry extends TenantBaseEntity {
  @Column({ type: 'uuid' })
  workerId!: string;

  @ManyToOne(() => Worker)
  @JoinColumn({ name: 'workerId' })
  worker!: Worker;

  @Column({
    type: 'enum',
    enum: ClockEventType,
  })
  eventType!: ClockEventType;

  @Column({ type: 'timestamp with time zone' })
  clockedAt!: Date;

  @Column({
    type: 'enum',
    enum: ClockMethod,
    default: ClockMethod.MANUAL,
  })
  method!: ClockMethod;

  @Column({ type: 'uuid', nullable: true })
  workCenterId?: string;

  @ManyToOne(() => WorkCenter, { nullable: true })
  @JoinColumn({ name: 'workCenterId' })
  workCenter?: WorkCenter;

  @Column({ type: 'uuid', nullable: true })
  shiftAssignmentId?: string;

  @ManyToOne(() => ShiftAssignment, { nullable: true })
  @JoinColumn({ name: 'shiftAssignmentId' })
  shiftAssignment?: ShiftAssignment;

  @Column({ type: 'uuid', nullable: true })
  taskId?: string;

  @ManyToOne(() => Task, { nullable: true })
  @JoinColumn({ name: 'taskId' })
  task?: Task;

  @Column({ type: 'point', nullable: true })
  gpsLocation?: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  deviceId?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: false })
  isManualEntry!: boolean;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  approvalNotes?: string;

  @Column({ type: 'boolean', default: false })
  isOvertime!: boolean;

  @Column({ type: 'boolean', default: false })
  isException!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  exceptionReason?: string;

  @BeforeInsert()
  @BeforeUpdate()
  validateClockEvent() {
    if (!this.clockedAt) {
      this.clockedAt = new Date();
    }

    // Set overtime flag for overtime events
    if (
      this.eventType === ClockEventType.OVERTIME_START ||
      this.eventType === ClockEventType.OVERTIME_END
    ) {
      this.isOvertime = true;
    }
  }
}

@Entity('time_clock_sessions')
@Index(['tenantId', 'workerId', 'sessionDate'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'shiftAssignmentId'])
export class TimeClockSession extends TenantBaseEntity {
  @Column({ type: 'uuid' })
  workerId!: string;

  @ManyToOne(() => Worker)
  @JoinColumn({ name: 'workerId' })
  worker!: Worker;

  @Column({ type: 'date' })
  sessionDate!: Date;

  @Column({ type: 'uuid', nullable: true })
  shiftAssignmentId?: string;

  @ManyToOne(() => ShiftAssignment, { nullable: true })
  @JoinColumn({ name: 'shiftAssignmentId' })
  shiftAssignment?: ShiftAssignment;

  @Column({ type: 'timestamp with time zone', nullable: true })
  clockInTime?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  clockOutTime?: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  regularHours!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  overtimeHours!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  breakMinutes!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  lunchMinutes!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalHours!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  productiveHours!: number;

  @Column({
    type: 'enum',
    enum: ['open', 'closed', 'approved', 'disputed', 'corrected'],
    default: 'open',
  })
  status!: string;

  @Column({ type: 'boolean', default: false })
  isLateArrival!: boolean;

  @Column({ type: 'boolean', default: false })
  isEarlyDeparture!: boolean;

  @Column({ type: 'boolean', default: false })
  isAbsent!: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  lateMinutes!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  earlyDepartureMinutes!: number;

  @Column({ type: 'jsonb', nullable: true })
  breakPeriods?: Array<{
    startTime: Date;
    endTime?: Date;
    type: 'break' | 'lunch';
    minutes: number;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  overtimePeriods?: Array<{
    startTime: Date;
    endTime?: Date;
    reason: string;
    approvedBy?: string;
    hours: number;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  exceptions?: Array<{
    type: string;
    time: Date;
    reason: string;
    approvedBy?: string;
  }>;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string;

  @BeforeInsert()
  @BeforeUpdate()
  calculateHours() {
    if (this.clockInTime && this.clockOutTime) {
      const diff = this.clockOutTime.getTime() - this.clockInTime.getTime();
      const totalMinutes = diff / (1000 * 60);
      
      // Calculate total hours
      this.totalHours = Number((totalMinutes / 60).toFixed(2));
      
      // Calculate productive hours (total - breaks - lunch)
      const nonProductiveMinutes = this.breakMinutes + this.lunchMinutes;
      this.productiveHours = Number(
        ((totalMinutes - nonProductiveMinutes) / 60).toFixed(2)
      );
      
      // Set regular hours (assuming 8 hour workday)
      const regularHoursLimit = 8;
      if (this.productiveHours > regularHoursLimit) {
        this.regularHours = regularHoursLimit;
        this.overtimeHours = Number(
          (this.productiveHours - regularHoursLimit).toFixed(2)
        );
      } else {
        this.regularHours = this.productiveHours;
        this.overtimeHours = 0;
      }
    }
  }
}

@Entity('time_clock_rules')
@Index(['tenantId', 'isActive'])
export class TimeClockRule extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: true })
  override isActive!: boolean;

  @Column({ type: 'integer', default: 15 })
  graceMinutesLate!: number;

  @Column({ type: 'integer', default: 5 })
  graceMinutesEarly!: number;

  @Column({ type: 'integer', default: 5 })
  roundingMinutes!: number;

  @Column({
    type: 'enum',
    enum: ['up', 'down', 'nearest'],
    default: 'nearest',
  })
  roundingDirection!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 8 })
  standardWorkHours!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 40 })
  standardWorkWeekHours!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.5 })
  overtimeMultiplier!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 2.0 })
  doubleTimeMultiplier!: number;

  @Column({ type: 'integer', default: 12 })
  doubleTimeThresholdHours!: number;

  @Column({ type: 'boolean', default: true })
  requireClockOutSameDay!: boolean;

  @Column({ type: 'boolean', default: true })
  requireManagerApprovalForManualEntry!: boolean;

  @Column({ type: 'boolean', default: true })
  requireManagerApprovalForOvertime!: boolean;

  @Column({ type: 'boolean', default: false })
  allowMobileClockIn!: boolean;

  @Column({ type: 'boolean', default: false })
  requireGpsForMobile!: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  maxGpsRadius?: number; // in meters

  @Column({ type: 'integer', default: 30 })
  minBreakMinutes!: number;

  @Column({ type: 'integer', default: 30 })
  minLunchMinutes!: number;

  @Column({ type: 'integer', default: 240 })
  maxConsecutiveWorkMinutes!: number;

  @Column({ type: 'jsonb', nullable: true })
  shiftRules?: Array<{
    shiftType: string;
    graceMinutesLate?: number;
    graceMinutesEarly?: number;
    overtimeThreshold?: number;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  departmentRules?: Array<{
    departmentId: string;
    rules: Record<string, any>;
  }>;
}