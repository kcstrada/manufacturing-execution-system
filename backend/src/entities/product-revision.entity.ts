import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { Product, ProductType, ProductStatus } from './product.entity';
import { User } from './user.entity';

export enum RevisionType {
  CREATE = 'create',
  UPDATE = 'update',
  MAJOR_CHANGE = 'major_change',
  MINOR_CHANGE = 'minor_change',
  BOM_CHANGE = 'bom_change',
  ROUTING_CHANGE = 'routing_change',
  PRICE_CHANGE = 'price_change',
  SPECIFICATION_CHANGE = 'specification_change',
  STATUS_CHANGE = 'status_change',
  ROLLBACK = 'rollback',
}

export enum RevisionStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  SUPERSEDED = 'superseded',
  ARCHIVED = 'archived',
}

@Entity('product_revisions')
@Index(['tenantId', 'productId', 'revisionNumber'])
@Index(['tenantId', 'productId', 'status'])
@Index(['tenantId', 'productId', 'createdAt'])
@Index(['tenantId', 'revisionType'])
@Index(['tenantId', 'isActive'])
export class ProductRevision extends TenantBaseEntity {
  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'int' })
  revisionNumber!: number;

  @Column({ type: 'varchar', length: 20 })
  revisionCode!: string; // e.g., "v1.0", "v2.1", "REV-001"

  @Column({
    type: 'enum',
    enum: RevisionType,
    default: RevisionType.UPDATE,
  })
  revisionType!: RevisionType;

  @Column({
    type: 'enum',
    enum: RevisionStatus,
    default: RevisionStatus.DRAFT,
  })
  status!: RevisionStatus;

  @Column({ type: 'text', nullable: true })
  changeDescription?: string;

  @Column({ type: 'text', nullable: true })
  changeReason?: string;

  // Snapshot of product data at this revision
  @Column({ type: 'varchar', length: 100 })
  sku!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ProductType,
  })
  type!: ProductType;

  @Column({ type: 'jsonb', nullable: true })
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  specifications?: Record<string, any>;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  cost?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  price?: number;

  @Column({ type: 'int', nullable: true })
  leadTimeDays?: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  minStockLevel?: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  maxStockLevel?: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  reorderPoint?: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  reorderQuantity?: number;

  @Column({ type: 'boolean', default: true })
  isManufacturable!: boolean;

  @Column({ type: 'boolean', default: false })
  isPurchasable!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcode?: string;

  // References to related entities at time of revision
  @Column({ type: 'uuid', nullable: true })
  bomId?: string;

  @Column({ type: 'uuid', nullable: true })
  routingId?: string;

  @Column({ type: 'uuid', nullable: true })
  categoryId?: string;

  @Column({ type: 'uuid' })
  unitOfMeasureId!: string;

  // Change tracking
  @Column({ type: 'jsonb', nullable: true })
  changedFields?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  bomSnapshot?: Record<string, any>; // Snapshot of BOM structure

  @Column({ type: 'jsonb', nullable: true })
  routingSnapshot?: Record<string, any>; // Snapshot of routing

  // Approval workflow
  @Column({ type: 'uuid', nullable: true })
  createdBy!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approver?: User;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'text', nullable: true })
  approvalNotes?: string;

  @Column({ type: 'uuid', nullable: true })
  rejectedBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'rejected_by' })
  rejector?: User;

  @Column({ type: 'timestamp', nullable: true })
  rejectedAt?: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  // Activation tracking
  @Column({ type: 'timestamp', nullable: true })
  activatedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deactivatedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  supersededByRevisionId?: string;

  @ManyToOne(() => ProductRevision, { nullable: true })
  @JoinColumn({ name: 'superseded_by_revision_id' })
  supersededByRevision?: ProductRevision;

  // Engineering change order reference
  @Column({ type: 'varchar', length: 100, nullable: true })
  ecoNumber?: string; // Engineering Change Order number

  @Column({ type: 'varchar', length: 100, nullable: true })
  ecoReference?: string; // External ECO system reference

  // Document attachments
  @Column({ type: 'jsonb', nullable: true })
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: Date;
  }>;

  // Compliance and quality
  @Column({ type: 'jsonb', nullable: true })
  complianceData?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  qualitySpecs?: Record<string, any>;

  // Impact analysis
  @Column({ type: 'jsonb', nullable: true })
  impactAnalysis?: {
    affectedOrders?: number;
    affectedInventory?: number;
    costImpact?: number;
    notes?: string;
  };

  // Rollback information
  @Column({ type: 'uuid', nullable: true })
  rollbackFromRevisionId?: string;

  @ManyToOne(() => ProductRevision, { nullable: true })
  @JoinColumn({ name: 'rollback_from_revision_id' })
  rollbackFromRevision?: ProductRevision;

  @Column({ type: 'text', nullable: true })
  rollbackReason?: string;

  // Effectiveness dates
  @Column({ type: 'date', nullable: true })
  effectiveFrom?: Date;

  @Column({ type: 'date', nullable: true })
  effectiveTo?: Date;

  // Additional metadata
  @Column({ type: 'jsonb', nullable: true })
  customFields?: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: false })
  isCurrentRevision!: boolean; // Marks the current active revision

  @Column({ type: 'boolean', default: false })
  isEffective!: boolean; // Whether this revision is currently in effect
}