import {
  Entity,
  Column,
  Index,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
  Unique,
} from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { User } from './user.entity';
import { Department } from './department.entity';
import { WorkCenter } from './work-center.entity';

export enum WorkerStatus {
  AVAILABLE = 'available',
  WORKING = 'working',
  BREAK = 'break',
  OFF_DUTY = 'off_duty',
  SICK_LEAVE = 'sick_leave',
  VACATION = 'vacation',
  TRAINING = 'training',
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export enum ShiftType {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  NIGHT = 'night',
  ROTATING = 'rotating',
  FLEXIBLE = 'flexible',
}

@Entity('workers')
@Unique(['tenantId', 'employeeId'])
@Index(['tenantId', 'employeeId'])
@Index(['tenantId', 'userId'])
@Index(['tenantId', 'departmentId'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'shiftType'])
export class Worker extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  employeeId!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  position?: string;

  @Column({
    type: 'enum',
    enum: WorkerStatus,
    default: WorkerStatus.AVAILABLE,
  })
  status!: WorkerStatus;

  @Column({
    type: 'enum',
    enum: ShiftType,
    default: ShiftType.MORNING,
  })
  shiftType!: ShiftType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hourlyRate!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  overtimeRate!: number;

  @Column({ type: 'date', nullable: true })
  hireDate?: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emergencyContact?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  emergencyPhone?: string;

  @Column({ type: 'jsonb', nullable: true })
  skills?: {
    name: string;
    level: SkillLevel;
    certifiedDate?: Date;
    expiryDate?: Date;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  certifications?: {
    name: string;
    issuer: string;
    issueDate: Date;
    expiryDate?: Date;
    certificateNumber?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  trainingHistory?: {
    name: string;
    date: Date;
    duration: number;
    trainer?: string;
    result?: string;
  }[];

  @Column({ type: 'int', default: 40 })
  weeklyHoursLimit!: number;

  @Column({ type: 'int', default: 8 })
  dailyHoursLimit!: number;

  @Column({ type: 'jsonb', nullable: true })
  availability?: {
    monday?: { start?: string; end?: string; available?: boolean };
    tuesday?: { start?: string; end?: string; available?: boolean };
    wednesday?: { start?: string; end?: string; available?: boolean };
    thursday?: { start?: string; end?: string; available?: boolean };
    friday?: { start?: string; end?: string; available?: boolean };
    saturday?: { start?: string; end?: string; available?: boolean };
    sunday?: { start?: string; end?: string; available?: boolean };
  };

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  efficiency!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  qualityScore!: number;

  @Column({ type: 'int', default: 0 })
  totalTasksCompleted!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalHoursWorked!: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastClockIn?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastClockOut?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @Column({ type: 'uuid', nullable: true })
  departmentId?: string;

  @ManyToOne(() => Worker, { nullable: true })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor?: Worker;

  @Column({ type: 'uuid', nullable: true })
  supervisorId?: string;

  @ManyToMany(() => WorkCenter)
  @JoinTable({
    name: 'worker_work_centers',
    joinColumn: {
      name: 'worker_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'work_center_id',
      referencedColumnName: 'id',
    },
  })
  workCenters!: WorkCenter[];

  @OneToMany(() => WorkerSchedule, (schedule) => schedule.worker)
  schedules!: WorkerSchedule[];

  @OneToMany(() => TimeClockEntry, (entry) => entry.worker)
  timeClockEntries!: TimeClockEntry[];

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

@Entity('worker_schedules')
@Index(['tenantId', 'workerId'])
@Index(['tenantId', 'shiftId'])
@Index(['tenantId', 'date'])
export class WorkerSchedule extends TenantBaseEntity {
  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'time' })
  startTime!: string;

  @Column({ type: 'time' })
  endTime!: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  scheduledHours!: number;

  @Column({ type: 'boolean', default: false })
  isOvertime!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  shiftName?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Relations
  @ManyToOne(() => Worker, (worker) => worker.schedules)
  @JoinColumn({ name: 'worker_id' })
  worker!: Worker;

  @Column({ type: 'uuid' })
  workerId!: string;

  @Column({ type: 'uuid', nullable: true })
  shiftId?: string;
}

@Entity('time_clock_entries')
@Index(['tenantId', 'workerId'])
@Index(['tenantId', 'clockIn'])
@Index(['tenantId', 'clockOut'])
export class TimeClockEntry extends TenantBaseEntity {
  @Column({ type: 'timestamp with time zone' })
  clockIn!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  clockOut?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hoursWorked!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  regularHours!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  overtimeHours!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  breakMinutes!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  shiftName?: string;

  @Column({ type: 'boolean', default: false })
  isManualEntry!: boolean;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  clockInLocation?: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  clockOutLocation?: string;

  // Relations
  @ManyToOne(() => Worker, (worker) => worker.timeClockEntries)
  @JoinColumn({ name: 'worker_id' })
  worker!: Worker;

  @Column({ type: 'uuid' })
  workerId!: string;
}