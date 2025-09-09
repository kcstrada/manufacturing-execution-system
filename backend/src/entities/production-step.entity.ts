import {
  Entity,
  Column,
  Index,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Unique,
} from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { Product } from './product.entity';
import { WorkCenter } from './work-center.entity';
import { Routing } from './routing.entity';

export enum StepType {
  SETUP = 'setup',
  OPERATION = 'operation',
  INSPECTION = 'inspection',
  MOVE = 'move',
  WAIT = 'wait',
  OUTSOURCE = 'outsource',
}

export enum StepStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  OBSOLETE = 'obsolete',
}

@Entity('production_steps')
@Unique(['tenantId', 'stepCode'])
@Index(['tenantId', 'stepCode'])
@Index(['tenantId', 'routingId'])
@Index(['tenantId', 'workCenterId'])
@Index(['tenantId', 'sequenceNumber'])
@Index(['tenantId', 'type'])
@Index(['tenantId', 'status'])
export class ProductionStep extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  stepCode!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: StepType,
    default: StepType.OPERATION,
  })
  type!: StepType;

  @Column({
    type: 'enum',
    enum: StepStatus,
    default: StepStatus.DRAFT,
  })
  status!: StepStatus;

  @Column({ type: 'int' })
  sequenceNumber!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  setupTime!: number; // in minutes

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  runTime!: number; // in minutes per unit

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  waitTime!: number; // in minutes

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  moveTime!: number; // in minutes

  @Column({ type: 'int', default: 1 })
  batchSize!: number;

  @Column({ type: 'int', default: 1 })
  crewSize!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  yieldPercentage!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  scrapPercentage!: number;

  @Column({ type: 'jsonb', nullable: true })
  instructions?: {
    setup?: string[];
    operation?: string[];
    safety?: string[];
    quality?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  requiredTools?: {
    name: string;
    quantity: number;
    specifications?: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  requiredSkills?: {
    skill: string;
    level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  }[];

  @Column({ type: 'jsonb', nullable: true })
  materials?: {
    materialId: string;
    name: string;
    quantity: number;
    unit: string;
    stage: 'start' | 'during' | 'end';
  }[];

  @Column({ type: 'jsonb', nullable: true })
  qualityChecks?: {
    parameter: string;
    method: string;
    frequency: string;
    acceptance: string;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  parameters?: {
    name: string;
    value: string;
    unit?: string;
    min?: number;
    max?: number;
  }[];

  @Column({ type: 'boolean', default: false })
  isCritical!: boolean;

  @Column({ type: 'boolean', default: false })
  isBottleneck!: boolean;

  @Column({ type: 'boolean', default: false })
  canBeParallel!: boolean;

  @Column({ type: 'boolean', default: false })
  requiresApproval!: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  documents?: {
    workInstructions?: string[];
    drawings?: string[];
    videos?: string[];
    sops?: string[];
  };

  @Column({ type: 'int', default: 1 })
  override version!: number;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  approvedAt?: Date;

  // Relations
  @ManyToOne(() => Routing, (routing) => routing.steps)
  @JoinColumn({ name: 'routing_id' })
  routing!: Routing;

  @Column({ type: 'uuid' })
  routingId!: string;

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

  // Self-referencing for step dependencies
  @ManyToMany(() => ProductionStep)
  @JoinTable({
    name: 'production_step_dependencies',
    joinColumn: {
      name: 'step_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'depends_on_step_id',
      referencedColumnName: 'id',
    },
  })
  dependencies!: ProductionStep[];

  // Calculate total time for the step
  getTotalTime(): number {
    return this.setupTime + this.runTime + this.waitTime + this.moveTime;
  }

  // Calculate labor cost for the step
  getLaborCost(hourlyRate: number): number {
    const totalHours = this.getTotalTime() / 60;
    return totalHours * hourlyRate * this.crewSize;
  }
}