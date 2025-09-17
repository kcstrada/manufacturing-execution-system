import { Entity, Column, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { Task } from './task.entity';
import { User } from './user.entity';
import { WorkCenter } from './work-center.entity';

export enum AssignmentStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REASSIGNED = 'reassigned',
}

export enum AssignmentMethod {
  MANUAL = 'manual',
  AUTO_SKILL_BASED = 'auto_skill_based',
  AUTO_WORKLOAD = 'auto_workload',
  AUTO_ROUND_ROBIN = 'auto_round_robin',
  AUTO_PRIORITY = 'auto_priority',
  AUTO_LOCATION = 'auto_location',
}

@Entity('task_assignments')
@Unique(['tenantId', 'taskId', 'userId', 'assignedAt'])
@Index(['tenantId', 'taskId'])
@Index(['tenantId', 'userId'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'assignedAt'])
@Index(['tenantId', 'priority'])
export class TaskAssignment extends TenantBaseEntity {
  @Column({ type: 'uuid' })
  taskId!: string;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'task_id' })
  task!: Task;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({
    type: 'enum',
    enum: AssignmentStatus,
    default: AssignmentStatus.PENDING,
  })
  status!: AssignmentStatus;

  @Column({
    type: 'enum',
    enum: AssignmentMethod,
    default: AssignmentMethod.MANUAL,
  })
  assignmentMethod!: AssignmentMethod;

  @Column({ type: 'int', default: 0 })
  priority!: number;

  @Column({ type: 'timestamp with time zone' })
  assignedAt!: Date;

  @Column({ type: 'uuid', nullable: true })
  assignedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_by_id' })
  assignedBy?: User;

  @Column({ type: 'timestamp with time zone', nullable: true })
  acceptedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  declinedAt?: Date;

  @Column({ type: 'text', nullable: true })
  declineReason?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedHours?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  actualHours?: number;

  @Column({ type: 'int', default: 0 })
  completionPercentage!: number;

  // Skill matching score (0-100)
  @Column({ type: 'int', nullable: true })
  skillMatchScore?: number;

  // Current workload of the user at assignment time
  @Column({ type: 'int', nullable: true })
  userWorkload?: number;

  // Distance from work center (in meters)
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  distanceFromWorkCenter?: number;

  @Column({ type: 'uuid', nullable: true })
  workCenterId?: string;

  @ManyToOne(() => WorkCenter, { nullable: true })
  @JoinColumn({ name: 'work_center_id' })
  workCenter?: WorkCenter;

  @Column({ type: 'jsonb', nullable: true })
  assignmentCriteria?: {
    requiredSkills?: string[];
    matchedSkills?: string[];
    workloadThreshold?: number;
    maxDistance?: number;
    priorityScore?: number;
  };

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  performanceMetrics?: {
    tasksCompleted?: number;
    averageCompletionTime?: number;
    qualityScore?: number;
    onTimeRate?: number;
  };

  @Column({ type: 'timestamp with time zone', nullable: true })
  dueDate?: Date;

  @Column({ type: 'boolean', default: false })
  isOverdue!: boolean;

  @Column({ type: 'boolean', default: false })
  isUrgent!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  reassignmentHistory?: Array<{
    fromUserId: string;
    toUserId: string;
    reassignedAt: Date;
    reassignedBy: string;
    reason: string;
  }>;
}
