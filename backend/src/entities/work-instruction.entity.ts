import { Entity, Column, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { ProductionStep } from './production-step.entity';
import { Product } from './product.entity';
import { WorkCenter } from './work-center.entity';

export enum InstructionType {
  SETUP = 'setup',
  OPERATION = 'operation',
  QUALITY = 'quality',
  SAFETY = 'safety',
  MAINTENANCE = 'maintenance',
  TROUBLESHOOTING = 'troubleshooting',
  CHANGEOVER = 'changeover',
  CLEANING = 'cleaning',
}

export enum InstructionFormat {
  TEXT = 'text',
  HTML = 'html',
  MARKDOWN = 'markdown',
  PDF = 'pdf',
  VIDEO = 'video',
  IMAGE = 'image',
  INTERACTIVE = 'interactive',
}

export enum InstructionStatus {
  DRAFT = 'draft',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  OBSOLETE = 'obsolete',
  ARCHIVED = 'archived',
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export enum InstructionPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  OPTIONAL = 'optional',
}

@Entity('work_instructions')
@Unique(['tenantId', 'instructionCode'])
@Index(['tenantId', 'instructionCode'])
@Index(['tenantId', 'productionStepId'])
@Index(['tenantId', 'type'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'isActive'])
@Index(['tenantId', 'priority'])
export class WorkInstruction extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  instructionCode!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({
    type: 'enum',
    enum: InstructionType,
    default: InstructionType.OPERATION,
  })
  type!: InstructionType;

  @Column({
    type: 'enum',
    enum: InstructionFormat,
    default: InstructionFormat.TEXT,
  })
  format!: InstructionFormat;

  @Column({
    type: 'enum',
    enum: InstructionStatus,
    default: InstructionStatus.DRAFT,
  })
  status!: InstructionStatus;

  @Column({
    type: 'enum',
    enum: InstructionPriority,
    default: InstructionPriority.MEDIUM,
  })
  priority!: InstructionPriority;

  @Column({ type: 'int', default: 0 })
  sequenceNumber!: number;

  // Main instruction content
  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ type: 'jsonb', nullable: true })
  steps?: {
    stepNumber: number;
    title: string;
    description: string;
    expectedResult?: string;
    warningMessage?: string;
    safetyPrecaution?: string;
    images?: string[];
    videos?: string[];
    duration?: number; // in seconds
    tools?: string[];
    materials?: string[];
    checkpoints?: Array<{
      parameter: string;
      expectedValue: string;
      tolerance?: string;
    }>;
  }[];

  // Media and attachments
  @Column({ type: 'jsonb', nullable: true })
  media?: {
    images?: Array<{
      url: string;
      caption?: string;
      sequence?: number;
    }>;
    videos?: Array<{
      url: string;
      caption?: string;
      duration?: number;
    }>;
    documents?: Array<{
      url: string;
      name: string;
      type: string;
      size?: number;
    }>;
    diagrams?: Array<{
      url: string;
      caption?: string;
      type?: string;
    }>;
  };

  // Prerequisites and requirements
  @Column({ type: 'jsonb', nullable: true })
  prerequisites?: {
    skills?: Array<{
      skill: string;
      level: SkillLevel;
      certification?: string;
    }>;
    tools?: Array<{
      name: string;
      specification?: string;
      quantity?: number;
      calibrationRequired?: boolean;
    }>;
    materials?: Array<{
      name: string;
      specification?: string;
      quantity?: string;
      unit?: string;
    }>;
    ppe?: Array<{
      item: string;
      standard?: string;
      mandatory: boolean;
    }>;
    training?: string[];
    certifications?: string[];
  };

  // Safety information
  @Column({ type: 'jsonb', nullable: true })
  safetyInfo?: {
    hazards?: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      mitigation: string;
    }>;
    lockoutTagout?: Array<{
      equipment: string;
      procedure: string;
      verificationSteps: string[];
    }>;
    emergencyProcedures?: Array<{
      situation: string;
      response: string;
      contacts: string[];
    }>;
    sds?: string[]; // Safety Data Sheet references
  };

  // Quality checkpoints
  @Column({ type: 'jsonb', nullable: true })
  qualityCheckpoints?: Array<{
    sequence: number;
    checkpoint: string;
    method: string;
    acceptanceCriteria: string;
    frequency?: string;
    tools?: string[];
    recordRequired: boolean;
    criticalToQuality: boolean;
  }>;

  // Troubleshooting guide
  @Column({ type: 'jsonb', nullable: true })
  troubleshooting?: Array<{
    problem: string;
    possibleCauses: string[];
    solutions: Array<{
      description: string;
      steps: string[];
      estimatedTime?: number;
      skillRequired?: SkillLevel;
    }>;
    preventiveMeasures?: string[];
  }>;

  // Time estimates
  @Column({ type: 'int', nullable: true })
  estimatedDuration?: number; // in minutes

  @Column({ type: 'int', nullable: true })
  setupTime?: number; // in minutes

  @Column({ type: 'int', nullable: true })
  cleanupTime?: number; // in minutes

  // Skill requirements
  @Column({
    type: 'enum',
    enum: SkillLevel,
    default: SkillLevel.INTERMEDIATE,
  })
  requiredSkillLevel!: SkillLevel;

  @Column({ type: 'int', default: 1 })
  requiredOperators!: number;

  @Column({ type: 'jsonb', nullable: true })
  requiredCertifications?: string[];

  // Languages and localization
  @Column({ type: 'varchar', length: 10, default: 'en' })
  language!: string;

  @Column({ type: 'jsonb', nullable: true })
  translations?: Record<
    string,
    {
      title: string;
      summary?: string;
      content?: string;
      steps?: any[];
    }
  >;

  // Warnings and alerts
  @Column({ type: 'jsonb', nullable: true })
  warnings?: Array<{
    type: 'safety' | 'quality' | 'equipment' | 'process' | 'environmental';
    severity: 'info' | 'warning' | 'danger' | 'critical';
    message: string;
    icon?: string;
    color?: string;
  }>;

  // Interactive elements
  @Column({ type: 'jsonb', nullable: true })
  interactiveElements?: {
    checkboxes?: Array<{
      id: string;
      label: string;
      required: boolean;
      sequence?: number;
    }>;
    inputs?: Array<{
      id: string;
      label: string;
      type: string;
      required: boolean;
      validation?: string;
    }>;
    confirmations?: Array<{
      id: string;
      text: string;
      type: 'acknowledgment' | 'signature' | 'timestamp';
    }>;
  };

  // References and standards
  @Column({ type: 'jsonb', nullable: true })
  references?: {
    standards?: Array<{
      standard: string;
      section?: string;
      requirement?: string;
    }>;
    sops?: string[];
    regulations?: string[];
    bestPractices?: string[];
    relatedInstructions?: string[];
  };

  // Training and learning
  @Column({ type: 'jsonb', nullable: true })
  trainingInfo?: {
    learningObjectives?: string[];
    assessmentQuestions?: Array<{
      question: string;
      type: 'multiple_choice' | 'true_false' | 'text';
      options?: string[];
      correctAnswer?: string;
      explanation?: string;
    }>;
    passingScore?: number;
    certificationRequired?: boolean;
    recertificationPeriod?: number; // in days
  };

  // Version control
  @Column({ type: 'varchar', length: 20, default: '1.0.0' })
  versionNumber!: string;

  @Column({ type: 'text', nullable: true })
  changeDescription?: string;

  @Column({ type: 'uuid', nullable: true })
  previousVersionId?: string;

  @Column({ type: 'timestamp', nullable: true })
  effectiveDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiryDate?: Date;

  // Review and approval
  @Column({ type: 'uuid', nullable: true })
  authorId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  authorName?: string;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'text', nullable: true })
  reviewComments?: string;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'text', nullable: true })
  approvalNotes?: string;

  // Usage tracking
  @Column({ type: 'int', default: 0 })
  viewCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastViewedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  lastViewedBy?: string;

  @Column({ type: 'jsonb', nullable: true })
  usageStatistics?: {
    totalViews?: number;
    uniqueViewers?: number;
    averageTimeSpent?: number;
    completionRate?: number;
    feedbackScore?: number;
  };

  // Feedback and improvements
  @Column({ type: 'jsonb', nullable: true })
  feedback?: Array<{
    userId: string;
    userName?: string;
    rating?: number;
    comment?: string;
    suggestions?: string[];
    reportedIssues?: string[];
    timestamp: Date;
  }>;

  // Access control
  @Column({ type: 'jsonb', nullable: true })
  accessControl?: {
    roles?: string[];
    departments?: string[];
    users?: string[];
    restrictions?: string[];
  };

  // Search and discovery
  @Column({ type: 'jsonb', nullable: true })
  tags?: string[];

  @Column({ type: 'tsvector', nullable: true })
  searchVector?: string;

  // Compliance and audit
  @Column({ type: 'boolean', default: false })
  requiresSignOff!: boolean;

  @Column({ type: 'boolean', default: false })
  requiresWitnessing!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  signOffs?: Array<{
    userId: string;
    userName: string;
    role?: string;
    signedAt: Date;
    comments?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  auditTrail?: Array<{
    action: string;
    userId: string;
    userName?: string;
    timestamp: Date;
    details?: Record<string, any>;
  }>;

  // Relations
  @Column({ type: 'uuid', nullable: true })
  productionStepId?: string;

  @ManyToOne(() => ProductionStep, { nullable: true })
  @JoinColumn({ name: 'production_step_id' })
  productionStep?: ProductionStep;

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

  // Machine/Equipment specific
  @Column({ type: 'varchar', length: 100, nullable: true })
  equipmentId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  equipmentType?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  equipmentModel?: string;

  // Additional metadata
  @Column({ type: 'jsonb', nullable: true })
  customFields?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Helper methods
  isEffective(): boolean {
    const now = new Date();
    if (this.effectiveDate && this.effectiveDate > now) return false;
    if (this.expiryDate && this.expiryDate < now) return false;
    return this.status === InstructionStatus.APPROVED;
  }

  requiresUpdate(): boolean {
    if (!this.expiryDate) return false;
    const daysUntilExpiry = Math.ceil(
      (this.expiryDate.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return daysUntilExpiry <= 30; // Alert 30 days before expiry
  }
}
