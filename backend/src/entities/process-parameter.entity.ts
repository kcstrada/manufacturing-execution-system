import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { ProductionStep } from './production-step.entity';
import { Product } from './product.entity';
import { WorkCenter } from './work-center.entity';

export enum ParameterType {
  NUMERIC = 'numeric',
  TEXT = 'text',
  BOOLEAN = 'boolean',
  DATE = 'date',
  TIME = 'time',
  DATETIME = 'datetime',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  RANGE = 'range',
  FILE = 'file',
  JSON = 'json',
}

export enum ParameterCategory {
  MACHINE_SETTING = 'machine_setting',
  PROCESS_CONTROL = 'process_control',
  QUALITY_SPEC = 'quality_spec',
  SAFETY_REQUIREMENT = 'safety_requirement',
  ENVIRONMENTAL = 'environmental',
  MATERIAL_SPEC = 'material_spec',
  TOOL_SETTING = 'tool_setting',
  INSPECTION = 'inspection',
  DOCUMENTATION = 'documentation',
}

export enum ParameterFrequency {
  ONCE_PER_BATCH = 'once_per_batch',
  ONCE_PER_SHIFT = 'once_per_shift',
  HOURLY = 'hourly',
  EVERY_PIECE = 'every_piece',
  RANDOM_SAMPLE = 'random_sample',
  START_OF_RUN = 'start_of_run',
  END_OF_RUN = 'end_of_run',
  CONTINUOUS = 'continuous',
}

export enum ParameterPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  OPTIONAL = 'optional',
}

@Entity('process_parameters')
@Unique(['tenantId', 'parameterCode'])
@Index(['tenantId', 'parameterCode'])
@Index(['tenantId', 'productionStepId'])
@Index(['tenantId', 'category'])
@Index(['tenantId', 'isRequired'])
@Index(['tenantId', 'priority'])
export class ProcessParameter extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  parameterCode!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ParameterType,
    default: ParameterType.NUMERIC,
  })
  type!: ParameterType;

  @Column({
    type: 'enum',
    enum: ParameterCategory,
    default: ParameterCategory.PROCESS_CONTROL,
  })
  category!: ParameterCategory;

  @Column({
    type: 'enum',
    enum: ParameterFrequency,
    default: ParameterFrequency.ONCE_PER_BATCH,
  })
  frequency!: ParameterFrequency;

  @Column({
    type: 'enum',
    enum: ParameterPriority,
    default: ParameterPriority.MEDIUM,
  })
  priority!: ParameterPriority;

  // Value constraints
  @Column({ type: 'jsonb', nullable: true })
  valueConstraints?: {
    min?: number;
    max?: number;
    target?: number;
    tolerance?: number;
    precision?: number;
    unit?: string;
    options?: string[]; // For select/multiselect
    pattern?: string; // Regex for text validation
    fileTypes?: string[]; // For file uploads
    maxFileSize?: number;
  };

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit?: string;

  @Column({ type: 'jsonb', nullable: true })
  defaultValue?: any;

  @Column({ type: 'jsonb', nullable: true })
  targetValue?: any;

  @Column({ type: 'decimal', precision: 15, scale: 6, nullable: true })
  nominalValue?: number;

  @Column({ type: 'decimal', precision: 15, scale: 6, nullable: true })
  minValue?: number;

  @Column({ type: 'decimal', precision: 15, scale: 6, nullable: true })
  maxValue?: number;

  @Column({ type: 'decimal', precision: 15, scale: 6, nullable: true })
  tolerancePlus?: number;

  @Column({ type: 'decimal', precision: 15, scale: 6, nullable: true })
  toleranceMinus?: number;

  // Control limits for statistical process control
  @Column({ type: 'decimal', precision: 15, scale: 6, nullable: true })
  upperControlLimit?: number;

  @Column({ type: 'decimal', precision: 15, scale: 6, nullable: true })
  lowerControlLimit?: number;

  @Column({ type: 'decimal', precision: 15, scale: 6, nullable: true })
  upperWarningLimit?: number;

  @Column({ type: 'decimal', precision: 15, scale: 6, nullable: true })
  lowerWarningLimit?: number;

  // Configuration
  @Column({ type: 'boolean', default: true })
  isRequired!: boolean;

  @Column({ type: 'boolean', default: false })
  isControlParameter!: boolean; // Key parameter for process control

  @Column({ type: 'boolean', default: false })
  isCriticalToQuality!: boolean; // CTQ parameter

  @Column({ type: 'boolean', default: false })
  requiresValidation!: boolean;

  @Column({ type: 'boolean', default: false })
  requiresApproval!: boolean;

  @Column({ type: 'boolean', default: true })
  isMonitored!: boolean;

  @Column({ type: 'boolean', default: false })
  isCalculated!: boolean;

  // Calculation formula if isCalculated is true
  @Column({ type: 'text', nullable: true })
  calculationFormula?: string;

  @Column({ type: 'jsonb', nullable: true })
  calculationDependencies?: string[]; // Other parameter codes this depends on

  // Display configuration
  @Column({ type: 'int', default: 0 })
  displayOrder!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  displayGroup?: string;

  @Column({ type: 'jsonb', nullable: true })
  displayConditions?: {
    showIf?: Record<string, any>;
    hideIf?: Record<string, any>;
    enableIf?: Record<string, any>;
    disableIf?: Record<string, any>;
  };

  // Instructions and help
  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @Column({ type: 'text', nullable: true })
  helpText?: string;

  @Column({ type: 'jsonb', nullable: true })
  warningMessages?: {
    condition: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }[];

  // Validation rules
  @Column({ type: 'jsonb', nullable: true })
  validationRules?: {
    rule: string;
    message: string;
    type: 'error' | 'warning';
  }[];

  // Data collection
  @Column({ type: 'varchar', length: 100, nullable: true })
  dataSource?: string; // e.g., "manual", "sensor", "plc", "scada"

  @Column({ type: 'varchar', length: 255, nullable: true })
  sensorId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  plcTag?: string;

  @Column({ type: 'int', nullable: true })
  samplingRate?: number; // in seconds for continuous monitoring

  @Column({ type: 'int', nullable: true })
  retentionDays?: number; // How long to keep historical data

  // Alarm configuration
  @Column({ type: 'jsonb', nullable: true })
  alarmConfig?: {
    enabled: boolean;
    conditions: Array<{
      type: 'high' | 'low' | 'out_of_range' | 'rate_of_change';
      threshold: number;
      severity: 'info' | 'warning' | 'critical';
      message: string;
      notificationGroups?: string[];
    }>;
  };

  // Reporting
  @Column({ type: 'boolean', default: false })
  includeInReport!: boolean;

  @Column({ type: 'boolean', default: false })
  includeInCertificate!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reportLabel?: string;

  // Compliance and standards
  @Column({ type: 'jsonb', nullable: true })
  complianceStandards?: string[]; // e.g., ["ISO 9001", "FDA 21 CFR Part 11"]

  @Column({ type: 'jsonb', nullable: true })
  regulatoryRequirements?: Record<string, any>;

  // Historical tracking
  @Column({ type: 'boolean', default: true })
  trackHistory!: boolean;

  @Column({ type: 'boolean', default: false })
  requiresSignature!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  changeControl?: {
    requiresChangeRequest: boolean;
    approvalLevels: string[];
    notifyOnChange: string[];
  };

  // Relations
  @Column({ type: 'uuid' })
  productionStepId!: string;

  @ManyToOne(() => ProductionStep, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'production_step_id' })
  productionStep!: ProductionStep;

  @Column({ type: 'uuid', nullable: true })
  productId?: string;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ type: 'uuid', nullable: true })
  workCenterId?: string;

  @ManyToOne(() => WorkCenter, { nullable: true })
  @JoinColumn({ name: 'work_center_id' })
  workCenter?: WorkCenter;

  // Machine/Equipment specific parameters
  @Column({ type: 'varchar', length: 100, nullable: true })
  equipmentId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  equipmentType?: string;

  // Version control
  @Column({ type: 'int', default: 1 })
  versionNumber!: number;

  @Column({ type: 'timestamp', nullable: true })
  effectiveFrom?: Date;

  @Column({ type: 'timestamp', nullable: true })
  effectiveTo?: Date;

  // Additional metadata
  @Column({ type: 'jsonb', nullable: true })
  customFields?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}