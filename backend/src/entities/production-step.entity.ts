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
import { Product } from './product.entity';
import { WorkCenter } from './work-center.entity';
import { Routing } from './routing.entity';
import { ProcessParameter } from './process-parameter.entity';
import { WorkInstruction } from './work-instruction.entity';

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

  // New fields for task 2.26
  @Column({ type: 'jsonb', nullable: true })
  validationRules?: Array<{
    ruleId: string;
    ruleName: string;
    ruleType:
      | 'range'
      | 'list'
      | 'pattern'
      | 'custom'
      | 'comparison'
      | 'calculation';
    parameter: string; // Parameter to validate
    condition: string; // Validation condition
    expectedValue?: any;
    minValue?: number;
    maxValue?: number;
    allowedValues?: any[];
    pattern?: string; // Regex pattern
    formula?: string; // Calculation formula
    severity: 'error' | 'warning' | 'info';
    errorMessage: string;
    correctionHint?: string;
    requiresSignOff?: boolean;
    autoStop?: boolean; // Stop production if validation fails
    notificationGroups?: string[];
    isActive: boolean;
    sequence?: number;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  mediaFiles?: Array<{
    fileId: string;
    fileName: string;
    fileType:
      | 'image'
      | 'video'
      | 'pdf'
      | 'cad'
      | '3d-model'
      | 'document'
      | 'spreadsheet';
    fileUrl: string;
    thumbnailUrl?: string;
    fileSize: number;
    mimeType: string;
    purpose:
      | 'instruction'
      | 'reference'
      | 'quality'
      | 'safety'
      | 'training'
      | 'troubleshooting';
    description?: string;
    tags?: string[];
    language?: string;
    version?: string;
    uploadedBy: string;
    uploadedAt: Date;
    lastAccessedAt?: Date;
    accessCount?: number;
    duration?: number; // For videos in seconds
    dimensions?: {
      width: number;
      height: number;
    };
    metadata?: Record<string, any>;
    isRequired?: boolean;
    displayOrder?: number;
  }>;

  @Column({ type: 'uuid', nullable: true })
  alternateWorkCenterId?: string;

  @ManyToOne(() => WorkCenter, { nullable: true })
  @JoinColumn({ name: 'alternate_work_center_id' })
  alternateWorkCenter?: WorkCenter;

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

  // Process parameters for this step
  @OneToMany(() => ProcessParameter, (parameter) => parameter.productionStep)
  processParameters!: ProcessParameter[];

  // Work instructions for this step
  @OneToMany(() => WorkInstruction, (instruction) => instruction.productionStep)
  workInstructions!: WorkInstruction[];

  // Calculate total time for the step
  getTotalTime(): number {
    return this.setupTime + this.runTime + this.waitTime + this.moveTime;
  }

  // Calculate labor cost for the step
  getLaborCost(hourlyRate: number): number {
    const totalHours = this.getTotalTime() / 60;
    return totalHours * hourlyRate * this.crewSize;
  }

  // Helper methods for task 2.26
  getActiveValidationRules(): any[] {
    if (!this.validationRules) return [];
    return this.validationRules
      .filter((rule) => rule.isActive)
      .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  }

  getCriticalValidationRules(): any[] {
    return this.getActiveValidationRules().filter(
      (rule) => rule.severity === 'error' || rule.autoStop === true,
    );
  }

  validateParameter(
    parameterName: string,
    value: any,
  ): { valid: boolean; errors: any[] } {
    const errors: any[] = [];
    const rules = this.getActiveValidationRules().filter(
      (rule) => rule.parameter === parameterName,
    );

    for (const rule of rules) {
      let isValid = true;

      switch (rule.ruleType) {
        case 'range':
          if (rule.minValue !== undefined && value < rule.minValue)
            isValid = false;
          if (rule.maxValue !== undefined && value > rule.maxValue)
            isValid = false;
          break;
        case 'list':
          if (rule.allowedValues && !rule.allowedValues.includes(value))
            isValid = false;
          break;
        case 'pattern':
          if (rule.pattern && !new RegExp(rule.pattern).test(value))
            isValid = false;
          break;
        case 'comparison':
          // This would need runtime context for comparison
          break;
      }

      if (!isValid) {
        errors.push({
          rule: rule.ruleName,
          severity: rule.severity,
          message: rule.errorMessage,
          hint: rule.correctionHint,
        });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  getMediaFilesByPurpose(purpose: string): any[] {
    if (!this.mediaFiles) return [];
    return this.mediaFiles
      .filter((file) => file.purpose === purpose)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  getRequiredMediaFiles(): any[] {
    if (!this.mediaFiles) return [];
    return this.mediaFiles.filter((file) => file.isRequired === true);
  }

  hasAlternateWorkCenter(): boolean {
    return (
      this.alternateWorkCenterId !== null &&
      this.alternateWorkCenterId !== undefined
    );
  }

  getPreferredWorkCenter(): string | undefined {
    return this.workCenterId || this.alternateWorkCenterId;
  }

  updateMediaFileAccess(fileId: string): void {
    if (!this.mediaFiles) return;

    const file = this.mediaFiles.find((f) => f.fileId === fileId);
    if (file) {
      file.lastAccessedAt = new Date();
      file.accessCount = (file.accessCount || 0) + 1;
    }
  }
}
