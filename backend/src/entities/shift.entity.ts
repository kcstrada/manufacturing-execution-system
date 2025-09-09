import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Unique,
} from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { Department } from './department.entity';
import { WorkCenter } from './work-center.entity';

export enum ShiftType {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night',
  ROTATING = 'rotating',
  SPLIT = 'split',
  FLEXIBLE = 'flexible',
  WEEKEND = 'weekend',
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

@Entity('shifts')
@Unique(['tenantId', 'shiftCode'])
@Index(['tenantId', 'shiftCode'])
@Index(['tenantId', 'type'])
@Index(['tenantId', 'departmentId'])
@Index(['tenantId', 'isActive'])
export class Shift extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  shiftCode!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ShiftType,
    default: ShiftType.MORNING,
  })
  type!: ShiftType;

  @Column({ type: 'time' })
  startTime!: string;

  @Column({ type: 'time' })
  endTime!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  duration!: number; // in hours

  @Column({ type: 'jsonb', nullable: true })
  breakTimes?: {
    start: string;
    end: string;
    paid: boolean;
    description?: string;
  }[];

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  totalBreakTime!: number; // in minutes

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  workingHours!: number; // duration minus breaks

  @Column({
    type: 'simple-array',
    default: 'monday,tuesday,wednesday,thursday,friday',
  })
  workDays!: string[];

  @Column({ type: 'boolean', default: false })
  isOvernight!: boolean;

  @Column({ type: 'boolean', default: false })
  isRotating!: boolean;

  @Column({ type: 'int', nullable: true })
  rotationPeriodDays?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
  overtimeMultiplier!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
  weekendMultiplier!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1 })
  holidayMultiplier!: number;

  @Column({ type: 'int', default: 0 })
  minWorkers!: number;

  @Column({ type: 'int', default: 0 })
  maxWorkers!: number;

  @Column({ type: 'int', default: 0 })
  targetWorkers!: number;

  @Column({ type: 'jsonb', nullable: true })
  skillRequirements?: {
    skill: string;
    minCount: number;
    level?: string;
  }[];

  @Column({ type: 'date', nullable: true })
  effectiveFrom?: Date;

  @Column({ type: 'date', nullable: true })
  effectiveUntil?: Date;

  @Column({ type: 'int', default: 1 })
  priority!: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Relations
  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @Column({ type: 'uuid', nullable: true })
  departmentId?: string;

  @ManyToMany(() => WorkCenter)
  @JoinTable({
    name: 'shift_work_centers',
    joinColumn: {
      name: 'shift_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'work_center_id',
      referencedColumnName: 'id',
    },
  })
  workCenters!: WorkCenter[];

  @OneToMany(() => ShiftAssignment, (assignment) => assignment.shift)
  assignments!: ShiftAssignment[];

  @OneToMany(() => ShiftException, (exception) => exception.shift)
  exceptions!: ShiftException[];

  // Helper methods
  isActiveOnDay(day: DayOfWeek): boolean {
    return this.workDays.includes(day);
  }

  getNetWorkingHours(): number {
    return this.duration - (this.totalBreakTime / 60);
  }
}

@Entity('shift_assignments')
@Index(['tenantId', 'shiftId'])
@Index(['tenantId', 'workerId'])
@Index(['tenantId', 'date'])
@Index(['tenantId', 'status'])
export class ShiftAssignment extends TenantBaseEntity {
  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'time', nullable: true })
  actualStartTime?: string;

  @Column({ type: 'time', nullable: true })
  actualEndTime?: string;

  @Column({ type: 'varchar', length: 50, default: 'scheduled' })
  status!: string; // scheduled, confirmed, in_progress, completed, absent, cancelled

  @Column({ type: 'boolean', default: false })
  isOvertime!: boolean;

  @Column({ type: 'boolean', default: false })
  isTemporary!: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true })
  replacementForId?: string;

  @Column({ type: 'uuid', nullable: true })
  approvedById?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  approvedAt?: Date;

  // Relations
  @ManyToOne(() => Shift, (shift) => shift.assignments)
  @JoinColumn({ name: 'shift_id' })
  shift!: Shift;

  @Column({ type: 'uuid' })
  shiftId!: string;

  @Column({ type: 'uuid' })
  workerId!: string;

  @ManyToOne(() => WorkCenter, { nullable: true })
  @JoinColumn({ name: 'work_center_id' })
  workCenter?: WorkCenter;

  @Column({ type: 'uuid', nullable: true })
  workCenterId?: string;
}

@Entity('shift_exceptions')
@Index(['tenantId', 'shiftId'])
@Index(['tenantId', 'date'])
@Index(['tenantId', 'type'])
export class ShiftException extends TenantBaseEntity {
  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'varchar', length: 50 })
  type!: string; // holiday, maintenance, emergency, special_event

  @Column({ type: 'varchar', length: 255 })
  reason!: string;

  @Column({ type: 'time', nullable: true })
  alternateStartTime?: string;

  @Column({ type: 'time', nullable: true })
  alternateEndTime?: string;

  @Column({ type: 'boolean', default: false })
  isCancelled!: boolean;

  @Column({ type: 'int', nullable: true })
  reducedCapacity?: number; // percentage

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid', nullable: true })
  createdById?: string;

  // Relations
  @ManyToOne(() => Shift, (shift) => shift.exceptions)
  @JoinColumn({ name: 'shift_id' })
  shift!: Shift;

  @Column({ type: 'uuid' })
  shiftId!: string;
}

@Entity('production_calendar')
@Index(['tenantId', 'date'])
@Index(['tenantId', 'isWorkingDay'])
@Index(['tenantId', 'isHoliday'])
export class ProductionCalendar extends TenantBaseEntity {
  @Column({ type: 'date', unique: true })
  date!: Date;

  @Column({
    type: 'enum',
    enum: DayOfWeek,
  })
  dayOfWeek!: DayOfWeek;

  @Column({ type: 'boolean', default: true })
  isWorkingDay!: boolean;

  @Column({ type: 'boolean', default: false })
  isHoliday!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  holidayName?: string;

  @Column({ type: 'boolean', default: false })
  isPlannedMaintenance!: boolean;

  @Column({ type: 'int', default: 100 })
  capacityPercentage!: number;

  @Column({ type: 'jsonb', nullable: true })
  shiftOverrides?: {
    shiftId: string;
    startTime?: string;
    endTime?: string;
    cancelled?: boolean;
    minWorkers?: number;
    maxWorkers?: number;
  }[];

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'int' })
  year!: number;

  @Column({ type: 'int' })
  month!: number;

  @Column({ type: 'int' })
  week!: number;

  @Column({ type: 'int' })
  quarter!: number;
}