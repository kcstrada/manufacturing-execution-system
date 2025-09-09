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
import { User } from './user.entity';
import { UnitOfMeasure } from './unit-of-measure.entity';

export enum BOMStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  OBSOLETE = 'obsolete',
  PENDING = 'pending',
}

@Entity('bills_of_materials')
@Unique(['tenantId', 'productId', 'version'])
@Index(['tenantId', 'productId'])
@Index(['tenantId', 'isActive'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'effectiveDate'])
export class BillOfMaterials extends TenantBaseEntity {
  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: BOMStatus,
    default: BOMStatus.DRAFT,
  })
  status!: BOMStatus;

  @Column({ type: 'boolean', default: false })
  isActive!: boolean;

  @Column({ type: 'date' })
  effectiveDate!: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 1 })
  yieldQuantity!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  scrapPercentage!: number;

  @Column({ type: 'jsonb', nullable: true })
  notes?: Record<string, any>;

  // Relations
  @ManyToOne(() => Product, (product) => product.billsOfMaterials)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy?: User;

  @Column({ type: 'uuid', nullable: true })
  createdById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy?: User;

  @Column({ type: 'uuid', nullable: true })
  approvedById?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  approvedAt?: Date;

  @OneToMany(() => BOMComponent, (component) => component.billOfMaterials)
  components!: BOMComponent[];
}

@Entity('bom_components')
@Unique(['billOfMaterialsId', 'componentId'])
@Index(['tenantId', 'billOfMaterialsId'])
@Index(['tenantId', 'componentId'])
@Index(['tenantId', 'sequence'])
export class BOMComponent extends TenantBaseEntity {
  @Column({ type: 'int' })
  sequence!: number;

  @Column({ type: 'decimal', precision: 15, scale: 6 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  scrapPercentage!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referenceDesignator?: string;

  @Column({ type: 'boolean', default: false })
  isPhantom!: boolean;

  @Column({ type: 'boolean', default: true })
  isRequired!: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Relations
  @ManyToOne(() => BillOfMaterials, (bom) => bom.components)
  @JoinColumn({ name: 'bill_of_materials_id' })
  billOfMaterials!: BillOfMaterials;

  @Column({ type: 'uuid' })
  billOfMaterialsId!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'component_id' })
  component!: Product;

  @Column({ type: 'uuid' })
  componentId!: string;

  @ManyToOne(() => UnitOfMeasure)
  @JoinColumn({ name: 'unit_of_measure_id' })
  unitOfMeasure!: UnitOfMeasure;

  @Column({ type: 'uuid' })
  unitOfMeasureId!: string;
}