import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { WorkCenter } from './work-center.entity';
import { Department } from './department.entity';
import { Supplier } from './supplier.entity';

export enum EquipmentStatus {
  OPERATIONAL = 'operational',
  IN_USE = 'in_use',
  IDLE = 'idle',
  MAINTENANCE = 'maintenance',
  REPAIR = 'repair',
  OUT_OF_SERVICE = 'out_of_service',
  DECOMMISSIONED = 'decommissioned',
}

export enum EquipmentType {
  MACHINE = 'machine',
  TOOL = 'tool',
  VEHICLE = 'vehicle',
  COMPUTER = 'computer',
  MEASURING = 'measuring',
  SAFETY = 'safety',
  AUXILIARY = 'auxiliary',
}

export enum MaintenanceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  PREDICTIVE = 'predictive',
  EMERGENCY = 'emergency',
  CALIBRATION = 'calibration',
}

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Entity('equipment')
@Unique(['tenantId', 'equipmentCode'])
@Unique(['tenantId', 'serialNumber'])
@Index(['tenantId', 'equipmentCode'])
@Index(['tenantId', 'workCenterId'])
@Index(['tenantId', 'departmentId'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'type'])
export class Equipment extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  equipmentCode!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: EquipmentType,
    default: EquipmentType.MACHINE,
  })
  type!: EquipmentType;

  @Column({
    type: 'enum',
    enum: EquipmentStatus,
    default: EquipmentStatus.OPERATIONAL,
  })
  status!: EquipmentStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturer?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  serialNumber?: string;

  @Column({ type: 'date', nullable: true })
  purchaseDate?: Date;

  @Column({ type: 'date', nullable: true })
  installationDate?: Date;

  @Column({ type: 'date', nullable: true })
  warrantyExpiry?: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  purchaseCost!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentValue!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hourlyOperatingCost!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @Column({ type: 'jsonb', nullable: true })
  specifications?: {
    capacity?: string;
    power?: string;
    dimensions?: string;
    weight?: string;
    voltage?: string;
    frequency?: string;
    [key: string]: any;
  };

  @Column({ type: 'int', default: 0 })
  totalOperatingHours!: number;

  @Column({ type: 'int', default: 0 })
  maintenanceIntervalHours!: number;

  @Column({ type: 'int', default: 0 })
  hoursSinceLastMaintenance!: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastMaintenanceDate?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  nextMaintenanceDate?: Date;

  @Column({ type: 'int', default: 0 })
  totalMaintenanceCount!: number;

  @Column({ type: 'int', default: 0 })
  totalBreakdownCount!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  availability!: number; // percentage

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  performance!: number; // percentage

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  quality!: number; // percentage

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  oee!: number; // Overall Equipment Effectiveness

  @Column({ type: 'jsonb', nullable: true })
  documents?: {
    manuals?: string[];
    certificates?: string[];
    inspectionReports?: string[];
    maintenanceRecords?: string[];
  };

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: false })
  isCritical!: boolean;

  @Column({ type: 'boolean', default: false })
  requiresCalibration!: boolean;

  @Column({ type: 'date', nullable: true })
  lastCalibrationDate?: Date;

  @Column({ type: 'date', nullable: true })
  nextCalibrationDate?: Date;

  // Relations
  @ManyToOne(() => WorkCenter, { nullable: true })
  @JoinColumn({ name: 'work_center_id' })
  workCenter?: WorkCenter;

  @Column({ type: 'uuid', nullable: true })
  workCenterId?: string;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @Column({ type: 'uuid', nullable: true })
  departmentId?: string;

  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier?: Supplier;

  @Column({ type: 'uuid', nullable: true })
  supplierId?: string;

  @OneToMany(() => MaintenanceSchedule, (schedule) => schedule.equipment)
  maintenanceSchedules!: MaintenanceSchedule[];

  @OneToMany(() => MaintenanceRecord, (record) => record.equipment)
  maintenanceRecords!: MaintenanceRecord[];
}

@Entity('maintenance_schedules')
@Index(['tenantId', 'equipmentId'])
@Index(['tenantId', 'scheduledDate'])
@Index(['tenantId', 'status'])
export class MaintenanceSchedule extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: MaintenanceType,
    default: MaintenanceType.PREVENTIVE,
  })
  type!: MaintenanceType;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.SCHEDULED,
  })
  status!: MaintenanceStatus;

  @Column({ type: 'date' })
  scheduledDate!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  estimatedDuration!: number; // in hours

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  estimatedCost!: number;

  @Column({ type: 'jsonb', nullable: true })
  tasks?: {
    id: string;
    description: string;
    completed: boolean;
    completedBy?: string;
    completedAt?: Date;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  requiredParts?: {
    name: string;
    quantity: number;
    partNumber?: string;
  }[];

  @Column({ type: 'uuid', nullable: true })
  assignedToId?: string;

  @Column({ type: 'boolean', default: false })
  isRecurring!: boolean;

  @Column({ type: 'int', nullable: true })
  recurringIntervalDays?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Relations
  @ManyToOne(() => Equipment, (equipment) => equipment.maintenanceSchedules)
  @JoinColumn({ name: 'equipment_id' })
  equipment!: Equipment;

  @Column({ type: 'uuid' })
  equipmentId!: string;
}

@Entity('maintenance_records')
@Index(['tenantId', 'equipmentId'])
@Index(['tenantId', 'startDate'])
@Index(['tenantId', 'type'])
export class MaintenanceRecord extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  recordNumber!: string;

  @Column({
    type: 'enum',
    enum: MaintenanceType,
  })
  type!: MaintenanceType;

  @Column({ type: 'timestamp with time zone' })
  startDate!: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  endDate?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  duration!: number; // in hours

  @Column({ type: 'text', nullable: true })
  workPerformed?: string;

  @Column({ type: 'jsonb', nullable: true })
  partsReplaced?: {
    name: string;
    quantity: number;
    partNumber?: string;
    cost?: number;
  }[];

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  laborCost!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  partsCost!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCost!: number;

  @Column({ type: 'uuid', nullable: true })
  performedById?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  performedBy?: string;

  @Column({ type: 'text', nullable: true })
  findings?: string;

  @Column({ type: 'text', nullable: true })
  recommendations?: string;

  @Column({ type: 'int', nullable: true })
  meterReading?: number;

  @Column({ type: 'boolean', default: false })
  wasBreakdown!: boolean;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: string[];

  // Relations
  @ManyToOne(() => Equipment, (equipment) => equipment.maintenanceRecords)
  @JoinColumn({ name: 'equipment_id' })
  equipment!: Equipment;

  @Column({ type: 'uuid' })
  equipmentId!: string;

  @Column({ type: 'uuid', nullable: true })
  scheduleId?: string;
}