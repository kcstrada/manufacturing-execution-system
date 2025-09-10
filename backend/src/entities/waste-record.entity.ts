import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { AuditableEntity } from './base.entity';
import { Product } from './product.entity';
import { CustomerOrder } from './customer-order.entity';
import { Equipment } from './equipment.entity';
import { Worker } from './worker.entity';

export enum WasteType {
  SCRAP = 'scrap',
  REWORK = 'rework',
  DEFECTIVE = 'defective',
  OVERPRODUCTION = 'overproduction',
  SPOILAGE = 'spoilage',
  TRIMMING = 'trimming',
  SPILLAGE = 'spillage',
  OTHER = 'other',
}

export enum WasteCategory {
  MATERIAL = 'material',
  PRODUCTION = 'production',
  QUALITY = 'quality',
  INVENTORY = 'inventory',
  PROCESS = 'process',
}

export enum DisposalMethod {
  RECYCLE = 'recycle',
  DISPOSE = 'dispose',
  REWORK = 'rework',
  RESELL = 'resell',
  RETURN_TO_VENDOR = 'return_to_vendor',
  INCINERATE = 'incinerate',
  LANDFILL = 'landfill',
}

@Entity('waste_records')
@Index(['recordDate', 'type'])
@Index(['productId', 'recordDate'])
@Index(['workOrderId'])
@Index(['equipmentId'])
export class WasteRecord extends AuditableEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  recordNumber!: string;

  @Column({ type: 'timestamp' })
  recordDate!: Date;

  @Column({
    type: 'enum',
    enum: WasteType,
    default: WasteType.SCRAP,
  })
  type!: WasteType;

  @Column({
    type: 'enum',
    enum: WasteCategory,
    default: WasteCategory.PRODUCTION,
  })
  category!: WasteCategory;

  @Column({ type: 'uuid', nullable: true })
  productId?: string;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @Column({ type: 'uuid', nullable: true })
  workOrderId?: string;

  @ManyToOne(() => CustomerOrder, { nullable: true })
  @JoinColumn({ name: 'workOrderId' })
  workOrder?: CustomerOrder;

  @Column({ type: 'uuid', nullable: true })
  equipmentId?: string;

  @ManyToOne(() => Equipment, { nullable: true })
  @JoinColumn({ name: 'equipmentId' })
  equipment?: Equipment;

  @Column({ type: 'uuid', nullable: true })
  reportedById?: string;

  @ManyToOne(() => Worker, { nullable: true })
  @JoinColumn({ name: 'reportedById' })
  reportedBy?: Worker;

  @Column({ type: 'varchar', length: 100, nullable: true })
  batchNumber?: string;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  materialCost?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  laborCost?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  overheadCost?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  disposalCost?: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalCost!: number;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  rootCause?: string;

  @Column({ type: 'text', nullable: true })
  correctiveAction?: string;

  @Column({ type: 'text', nullable: true })
  preventiveAction?: string;

  @Column({
    type: 'enum',
    enum: DisposalMethod,
    nullable: true,
  })
  disposalMethod?: DisposalMethod;

  @Column({ type: 'timestamp', nullable: true })
  disposalDate?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  disposalReference?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  recoveredValue?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  workCenter?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  shift?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  processStep?: string;

  @Column({ type: 'boolean', default: false })
  isRecurring!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  qualityInspectionId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ncrNumber?: string;

  @Column({ type: 'jsonb', nullable: true })
  materialDetails?: {
    materialCode?: string;
    materialName?: string;
    supplier?: string;
    lot?: string;
    specifications?: Record<string, any>;
  };

  @Column({ type: 'jsonb', nullable: true })
  environmentalImpact?: {
    co2Equivalent?: number;
    hazardousWaste?: boolean;
    wasteCode?: string;
    treatmentRequired?: boolean;
    complianceNotes?: string;
  };

  @Column({ type: 'simple-array', nullable: true })
  images?: string[];

  @Column({ type: 'simple-array', nullable: true })
  attachments?: string[];

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: true })
  override isActive!: boolean;

  @BeforeInsert()
  @BeforeUpdate()
  calculateTotalCost() {
    this.totalCost = 
      (this.materialCost || 0) +
      (this.laborCost || 0) +
      (this.overheadCost || 0) +
      (this.disposalCost || 0) -
      (this.recoveredValue || 0);
  }

  @BeforeInsert()
  generateRecordNumber() {
    if (!this.recordNumber) {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substring(2, 5);
      this.recordNumber = `WR-${timestamp}-${random}`.toUpperCase();
    }
  }
}

export interface WasteSummary {
  totalQuantity: number;
  totalCost: number;
  byType: Record<WasteType, { quantity: number; cost: number }>;
  byCategory: Record<WasteCategory, { quantity: number; cost: number }>;
  byProduct: Array<{
    productId: string;
    productName: string;
    quantity: number;
    cost: number;
  }>;
  wasteRate: number;
  recyclingRate: number;
  topCauses: Array<{
    cause: string;
    count: number;
    totalCost: number;
  }>;
}