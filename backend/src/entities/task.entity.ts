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
import { WorkOrder } from './work-order.entity';
import { User } from './user.entity';
import { WorkCenter } from './work-center.entity';
import { Product } from './product.entity';

export enum TaskStatus {
  PENDING = 'pending',
  READY = 'ready',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum TaskPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical',
}

export enum TaskType {
  SETUP = 'setup',
  PRODUCTION = 'production',
  QUALITY_CHECK = 'quality_check',
  MAINTENANCE = 'maintenance',
  CLEANING = 'cleaning',
  PACKAGING = 'packaging',
  INSPECTION = 'inspection',
}

@Entity('tasks')
@Unique(['tenantId', 'taskNumber'])
@Index(['tenantId', 'taskNumber'])
@Index(['tenantId', 'workOrderId'])
@Index(['tenantId', 'assignedToId'])
@Index(['tenantId', 'workCenterId'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'priority'])
@Index(['tenantId', 'type'])
@Index(['tenantId', 'scheduledStartDate'])
@Index(['tenantId', 'dueDate'])
export class Task extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  taskNumber!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: TaskType,
    default: TaskType.PRODUCTION,
  })
  type!: TaskType;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status!: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.NORMAL,
  })
  priority!: TaskPriority;

  @Column({ type: 'int' })
  sequenceNumber!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  estimatedHours!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  actualHours!: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  targetQuantity!: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  completedQuantity!: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  rejectedQuantity!: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  scheduledStartDate?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  scheduledEndDate?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  actualStartDate?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  actualEndDate?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  dueDate?: Date;

  @Column({ type: 'int', default: 0 })
  progressPercentage!: number;

  @Column({ type: 'jsonb', nullable: true })
  instructions?: {
    setup?: string[];
    operation?: string[];
    qualityChecks?: string[];
    safety?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  requiredSkills?: string[];

  @Column({ type: 'jsonb', nullable: true })
  requiredTools?: string[];

  @Column({ type: 'jsonb', nullable: true })
  checklistItems?: {
    id: string;
    description: string;
    completed: boolean;
    completedAt?: Date;
    completedBy?: string;
  }[];

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @Column({ type: 'boolean', default: false })
  requiresSignOff!: boolean;

  @Column({ type: 'uuid', nullable: true })
  signedOffBy?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  signedOffAt?: Date;

  // Relations
  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.tasks)
  @JoinColumn({ name: 'work_order_id' })
  workOrder!: WorkOrder;

  @Column({ type: 'uuid' })
  workOrderId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo?: User;

  @Column({ type: 'uuid', nullable: true })
  assignedToId?: string;

  @ManyToOne(() => WorkCenter, { nullable: true })
  @JoinColumn({ name: 'work_center_id' })
  workCenter?: WorkCenter;

  @Column({ type: 'uuid', nullable: true })
  workCenterId?: string;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ type: 'uuid', nullable: true })
  productId?: string;

  // Self-referencing for task dependencies
  @ManyToMany(() => Task)
  @JoinTable({
    name: 'task_dependencies',
    joinColumn: {
      name: 'task_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'depends_on_task_id',
      referencedColumnName: 'id',
    },
  })
  dependencies!: Task[];

  @OneToMany(() => TaskTimeLog, (timeLog) => timeLog.task)
  timeLogs!: TaskTimeLog[];
}

@Entity('task_time_logs')
@Index(['tenantId', 'taskId'])
@Index(['tenantId', 'userId'])
@Index(['tenantId', 'startTime'])
export class TaskTimeLog extends TenantBaseEntity {
  @Column({ type: 'timestamp with time zone' })
  startTime!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  endTime?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  duration!: number; // in hours

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Relations
  @ManyToOne(() => Task, (task) => task.timeLogs)
  @JoinColumn({ name: 'task_id' })
  task!: Task;

  @Column({ type: 'uuid' })
  taskId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid' })
  userId!: string;
}
