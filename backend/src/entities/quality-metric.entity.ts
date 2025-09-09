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
import { Product } from './product.entity';
import { WorkOrder } from './work-order.entity';
import { ProductionOrder } from './production-order.entity';
import { WorkCenter } from './work-center.entity';
import { User } from './user.entity';

export enum MetricType {
  DIMENSION = 'dimension',
  WEIGHT = 'weight',
  TEMPERATURE = 'temperature',
  PRESSURE = 'pressure',
  VISUAL = 'visual',
  FUNCTIONAL = 'functional',
  CHEMICAL = 'chemical',
  ELECTRICAL = 'electrical',
  MECHANICAL = 'mechanical',
}

export enum InspectionResult {
  PASS = 'pass',
  FAIL = 'fail',
  REWORK = 'rework',
  SCRAP = 'scrap',
  HOLD = 'hold',
}

export enum DefectSeverity {
  CRITICAL = 'critical',
  MAJOR = 'major',
  MINOR = 'minor',
  COSMETIC = 'cosmetic',
}

export enum InspectionType {
  INCOMING = 'incoming',
  IN_PROCESS = 'in_process',
  FINAL = 'final',
  RANDOM = 'random',
  CUSTOMER = 'customer',
}

@Entity('quality_metrics')
@Unique(['tenantId', 'metricCode'])
@Index(['tenantId', 'metricCode'])
@Index(['tenantId', 'productId'])
@Index(['tenantId', 'type'])
@Index(['tenantId', 'isActive'])
export class QualityMetric extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  metricCode!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: MetricType,
    default: MetricType.DIMENSION,
  })
  type!: MetricType;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit?: string;

  @Column({ type: 'decimal', precision: 20, scale: 6, nullable: true })
  targetValue?: number;

  @Column({ type: 'decimal', precision: 20, scale: 6, nullable: true })
  minValue?: number;

  @Column({ type: 'decimal', precision: 20, scale: 6, nullable: true })
  maxValue?: number;

  @Column({ type: 'decimal', precision: 20, scale: 6, nullable: true })
  tolerance?: number;

  @Column({ type: 'boolean', default: true })
  isCritical!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  inspectionMethod?: {
    tools?: string[];
    procedure?: string[];
    frequency?: string;
    sampleSize?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  acceptanceCriteria?: {
    visualDefects?: string[];
    functionalTests?: string[];
    measurements?: {
      parameter: string;
      min: number;
      max: number;
      unit: string;
    }[];
  };

  @Column({ type: 'int', default: 1 })
  samplingFrequency!: number; // 1 = every item, 10 = every 10th item, etc.

  @Column({ type: 'text', nullable: true })
  referenceStandard?: string;

  // Relations
  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ type: 'uuid', nullable: true })
  productId?: string;

  @OneToMany(() => QualityInspection, (inspection) => inspection.metric)
  inspections!: QualityInspection[];
}

@Entity('quality_inspections')
@Index(['tenantId', 'workOrderId'])
@Index(['tenantId', 'productionOrderId'])
@Index(['tenantId', 'inspectionDate'])
@Index(['tenantId', 'result'])
@Index(['tenantId', 'type'])
export class QualityInspection extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  inspectionNumber!: string;

  @Column({
    type: 'enum',
    enum: InspectionType,
    default: InspectionType.IN_PROCESS,
  })
  type!: InspectionType;

  @Column({ type: 'timestamp with time zone' })
  inspectionDate!: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  batchNumber?: string;

  @Column({ type: 'int', default: 1 })
  sampleSize!: number;

  @Column({ type: 'int', default: 0 })
  defectiveQuantity!: number;

  @Column({
    type: 'enum',
    enum: InspectionResult,
    default: InspectionResult.PASS,
  })
  result!: InspectionResult;

  @Column({ type: 'jsonb', nullable: true })
  measurements?: {
    metricId: string;
    metricName: string;
    targetValue?: number;
    actualValue: number;
    unit?: string;
    passed: boolean;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  defects?: {
    code: string;
    description: string;
    severity: DefectSeverity;
    quantity: number;
    location?: string;
    images?: string[];
  }[];

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  correctiveAction?: string;

  @Column({ type: 'jsonb', nullable: true })
  images?: string[];

  @Column({ type: 'boolean', default: false })
  requiresReview!: boolean;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'text', nullable: true })
  reviewNotes?: string;

  // Relations
  @ManyToOne(() => QualityMetric, (metric) => metric.inspections)
  @JoinColumn({ name: 'metric_id' })
  metric!: QualityMetric;

  @Column({ type: 'uuid' })
  metricId!: string;

  @ManyToOne(() => WorkOrder, { nullable: true })
  @JoinColumn({ name: 'work_order_id' })
  workOrder?: WorkOrder;

  @Column({ type: 'uuid', nullable: true })
  workOrderId?: string;

  @ManyToOne(() => ProductionOrder, { nullable: true })
  @JoinColumn({ name: 'production_order_id' })
  productionOrder?: ProductionOrder;

  @Column({ type: 'uuid', nullable: true })
  productionOrderId?: string;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ type: 'uuid', nullable: true })
  productId?: string;

  @ManyToOne(() => WorkCenter, { nullable: true })
  @JoinColumn({ name: 'work_center_id' })
  workCenter?: WorkCenter;

  @Column({ type: 'uuid', nullable: true })
  workCenterId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inspector_id' })
  inspector!: User;

  @Column({ type: 'uuid' })
  inspectorId!: string;
}

@Entity('quality_control_plans')
@Index(['tenantId', 'productId'])
@Index(['tenantId', 'isActive'])
export class QualityControlPlan extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  planCode!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int' })
  override version!: number;

  @Column({ type: 'date' })
  effectiveDate!: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  inspectionPoints?: {
    stage: string;
    description: string;
    metrics: string[];
    frequency: string;
    responsibility: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  samplingPlan?: {
    lotSize: { min: number; max: number };
    sampleSize: number;
    acceptanceNumber: number;
    rejectionNumber: number;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  documentation?: {
    procedures?: string[];
    workInstructions?: string[];
    forms?: string[];
    standards?: string[];
  };

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  approvedAt?: Date;

  // Relations
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'uuid' })
  productId!: string;
}

@Entity('non_conformance_reports')
@Index(['tenantId', 'reportNumber'])
@Index(['tenantId', 'reportDate'])
@Index(['tenantId', 'status'])
export class NonConformanceReport extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  reportNumber!: string;

  @Column({ type: 'timestamp with time zone' })
  reportDate!: Date;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({
    type: 'enum',
    enum: DefectSeverity,
    default: DefectSeverity.MAJOR,
  })
  severity!: DefectSeverity;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source?: string; // customer complaint, internal inspection, audit, etc.

  @Column({ type: 'jsonb', nullable: true })
  affectedItems?: {
    type: 'product' | 'material' | 'process';
    id: string;
    name: string;
    quantity?: number;
    batchNumbers?: string[];
  }[];

  @Column({ type: 'text', nullable: true })
  rootCause?: string;

  @Column({ type: 'text', nullable: true })
  immediateAction?: string;

  @Column({ type: 'text', nullable: true })
  correctiveAction?: string;

  @Column({ type: 'text', nullable: true })
  preventiveAction?: string;

  @Column({ type: 'varchar', length: 50, default: 'open' })
  status!: string; // open, investigating, resolved, closed

  @Column({ type: 'uuid', nullable: true })
  reportedById?: string;

  @Column({ type: 'uuid', nullable: true })
  assignedToId?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  targetCloseDate?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  actualCloseDate?: Date;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  estimatedCost!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  actualCost!: number;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: string[];

  @Column({ type: 'text', nullable: true })
  closureNotes?: string;

  @Column({ type: 'uuid', nullable: true })
  closedById?: string;
}