import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { User } from './user.entity';

export enum ActivityType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  EXPORT = 'export',
  IMPORT = 'import',
  LOGIN = 'login',
  LOGOUT = 'logout',
  APPROVE = 'approve',
  REJECT = 'reject',
  SUBMIT = 'submit',
  CANCEL = 'cancel',
  COMPLETE = 'complete',
  START = 'start',
  STOP = 'stop',
  PAUSE = 'pause',
  RESUME = 'resume',
  ASSIGN = 'assign',
  UNASSIGN = 'unassign',
  COMMENT = 'comment',
  ATTACHMENT = 'attachment',
  EMAIL = 'email',
  PRINT = 'print',
  SHARE = 'share',
  ARCHIVE = 'archive',
  RESTORE = 'restore',
  ERROR = 'error',
  WARNING = 'warning',
  SYSTEM = 'system',
}

export enum ActivityCategory {
  USER = 'user',
  ORDER = 'order',
  PRODUCTION = 'production',
  INVENTORY = 'inventory',
  QUALITY = 'quality',
  MAINTENANCE = 'maintenance',
  WORKER = 'worker',
  TASK = 'task',
  EQUIPMENT = 'equipment',
  REPORT = 'report',
  SETTINGS = 'settings',
  SECURITY = 'security',
  SYSTEM = 'system',
}

export enum ActivitySeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

@Entity('activity_logs')
@Index(['tenantId', 'timestamp'])
@Index(['tenantId', 'userId'])
@Index(['tenantId', 'entityType', 'entityId'])
@Index(['tenantId', 'type'])
@Index(['tenantId', 'category'])
@Index(['tenantId', 'severity'])
@Index(['tenantId', 'sessionId'])
export class ActivityLog extends TenantBaseEntity {
  @Column({ type: 'timestamp with time zone' })
  timestamp!: Date;

  @Column({
    type: 'enum',
    enum: ActivityType,
    default: ActivityType.VIEW,
  })
  type!: ActivityType;

  @Column({
    type: 'enum',
    enum: ActivityCategory,
    default: ActivityCategory.SYSTEM,
  })
  category!: ActivityCategory;

  @Column({
    type: 'enum',
    enum: ActivitySeverity,
    default: ActivitySeverity.INFO,
  })
  severity!: ActivitySeverity;

  @Column({ type: 'varchar', length: 100, nullable: true })
  entityType?: string; // e.g., 'Order', 'Task', 'Product'

  @Column({ type: 'uuid', nullable: true })
  entityId?: string;

  @Column({ type: 'varchar', length: 255 })
  action!: string; // Human-readable action description

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  override metadata?: {
    browser?: string;
    os?: string;
    device?: string;
    screen?: string;
    referrer?: string;
    userAgent?: string;
    [key: string]: any;
  };

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sessionId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  requestId?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  httpMethod?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  endpoint?: string;

  @Column({ type: 'int', nullable: true })
  statusCode?: number;

  @Column({ type: 'int', nullable: true })
  responseTime?: number; // in milliseconds

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'text', nullable: true })
  stackTrace?: string;

  @Column({ type: 'jsonb', nullable: true })
  requestBody?: any;

  @Column({ type: 'jsonb', nullable: true })
  responseBody?: any;

  @Column({ type: 'boolean', default: false })
  isSystemGenerated!: boolean;

  @Column({ type: 'boolean', default: false })
  isAnonymous!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[];

  @Column({ type: 'uuid', nullable: true })
  parentActivityId?: string;

  @Column({ type: 'int', default: 0 })
  duration?: number; // For tracking operation duration

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userName?: string; // Denormalized for performance

  @Column({ type: 'varchar', length: 100, nullable: true })
  userRole?: string; // Denormalized for performance

  // Helper methods
  isError(): boolean {
    return (
      this.severity === ActivitySeverity.ERROR ||
      this.severity === ActivitySeverity.CRITICAL
    );
  }

  isUserAction(): boolean {
    return !this.isSystemGenerated && !this.isAnonymous;
  }
}

@Entity('audit_trails')
@Index(['tenantId', 'tableName', 'recordId'])
@Index(['tenantId', 'operation'])
@Index(['tenantId', 'timestamp'])
@Index(['tenantId', 'userId'])
export class AuditTrail extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 100 })
  tableName!: string;

  @Column({ type: 'uuid' })
  recordId!: string;

  @Column({ type: 'varchar', length: 20 })
  operation!: string; // INSERT, UPDATE, DELETE

  @Column({ type: 'timestamp with time zone' })
  timestamp!: Date;

  @Column({ type: 'jsonb', nullable: true })
  oldValues?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  newValues?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  changedFields?: string[];

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userName?: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  sessionId?: string;

  @Column({ type: 'text', nullable: true })
  reason?: string; // Optional reason for the change

  @Column({ type: 'jsonb', nullable: true })
  override metadata?: Record<string, any>;

  @Column({ type: 'int' })
  override version!: number;

  @Column({ type: 'boolean', default: false })
  isSystemChange!: boolean;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}

@Entity('data_change_logs')
@Index(['tenantId', 'entityName', 'entityId'])
@Index(['tenantId', 'changedAt'])
@Index(['tenantId', 'changedBy'])
export class DataChangeLog extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 100 })
  entityName!: string;

  @Column({ type: 'uuid' })
  entityId!: string;

  @Column({ type: 'varchar', length: 100 })
  fieldName!: string;

  @Column({ type: 'text', nullable: true })
  oldValue?: string;

  @Column({ type: 'text', nullable: true })
  newValue?: string;

  @Column({ type: 'varchar', length: 50 })
  dataType!: string;

  @Column({ type: 'timestamp with time zone' })
  changedAt!: Date;

  @Column({ type: 'uuid', nullable: true })
  changedBy?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  changeReason?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  changeSource?: string; // UI, API, IMPORT, SYSTEM

  @Column({ type: 'varchar', length: 100, nullable: true })
  transactionId?: string;

  @Column({ type: 'boolean', default: false })
  isEncrypted!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  context?: Record<string, any>;
}
