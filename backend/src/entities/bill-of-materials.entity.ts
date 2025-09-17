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

  // New fields for task 2.24
  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  totalCost?: number;

  @Column({ type: 'jsonb', nullable: true })
  alternateComponents?: Array<{
    primaryComponentId: string;
    alternateComponentId: string;
    alternateComponentName: string;
    alternateComponentSku: string;
    preferenceOrder: number;
    conversionFactor: number; // Quantity multiplier if units differ
    notes?: string;
    conditions?: string; // When to use this alternate
    costDifference?: number;
    leadTimeDifference?: number; // in days
    qualityNotes?: string;
    approvedBy?: string;
    approvedDate?: Date;
    isActive: boolean;
  }>;

  // Relations
  @ManyToOne(() => Product, (product) => product.billsOfMaterials)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'uuid' })
  productId!: string;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy?: User;

  @Column({ type: 'uuid', nullable: true })
  approvedById?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  approvedAt?: Date;

  @OneToMany(() => BOMComponent, (component) => component.billOfMaterials)
  components!: BOMComponent[];

  // Helper methods
  calculateTotalCost(componentCosts: Map<string, number>): number {
    let total = 0;
    for (const component of this.components) {
      const componentCost = componentCosts.get(component.componentId) || 0;
      const quantityWithScrap =
        component.quantity * (1 + component.scrapPercentage / 100);
      total += componentCost * quantityWithScrap;
    }
    return total;
  }

  getAlternatesForComponent(componentId: string): any[] {
    if (!this.alternateComponents) return [];
    return this.alternateComponents
      .filter((alt) => alt.primaryComponentId === componentId && alt.isActive)
      .sort((a, b) => a.preferenceOrder - b.preferenceOrder);
  }

  hasAlternates(): boolean {
    return this.alternateComponents
      ? this.alternateComponents.length > 0
      : false;
  }
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

  // Additional fields for cost tracking
  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  unitCost?: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  extendedCost?: number;

  @Column({ type: 'boolean', default: false })
  isAlternateAllowed!: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  supplyType?: string; // 'stock', 'purchase', 'manufacture', 'phantom'

  @Column({ type: 'int', nullable: true })
  leadTimeDays?: number;

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
