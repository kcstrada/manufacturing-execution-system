import { Entity, Column, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { ProductCategory } from './product-category.entity';
import { UnitOfMeasure } from './unit-of-measure.entity';
import { ProductType } from './product.entity';

export enum TemplateStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft',
}

@Entity('product_templates')
@Unique(['tenantId', 'templateCode'])
@Index(['tenantId', 'templateCode'])
@Index(['tenantId', 'templateName'])
@Index(['tenantId', 'isActive'])
@Index(['tenantId', 'productType'])
export class ProductTemplate extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  templateCode!: string;

  @Column({ type: 'varchar', length: 255 })
  templateName!: string;

  @Column({ type: 'text', nullable: true })
  templateDescription?: string;

  // Template for product fields
  @Column({ type: 'varchar', length: 255, nullable: true })
  namePattern?: string; // e.g., "{PREFIX}-{SEQUENCE}-{SUFFIX}"

  @Column({ type: 'varchar', length: 100, nullable: true })
  skuPattern?: string; // e.g., "PROD-{YYYY}-{0000}"

  @Column({ type: 'varchar', length: 50, nullable: true })
  skuPrefix?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  skuSuffix?: string;

  @Column({ type: 'int', default: 0 })
  lastSequenceNumber!: number;

  @Column({ type: 'text', nullable: true })
  defaultDescription?: string;

  @Column({
    type: 'enum',
    enum: ProductType,
    nullable: true,
  })
  productType?: ProductType;

  @Column({ type: 'jsonb', nullable: true })
  defaultDimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  defaultSpecifications?: Record<string, any>;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  defaultCost?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  defaultPrice?: number;

  @Column({ type: 'int', nullable: true })
  defaultLeadTimeDays?: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  defaultMinStockLevel?: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  defaultMaxStockLevel?: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  defaultReorderPoint?: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, nullable: true })
  defaultReorderQuantity?: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  defaultWeight?: number;

  @Column({ type: 'boolean', default: true })
  defaultIsManufacturable!: boolean;

  @Column({ type: 'boolean', default: false })
  defaultIsPurchasable!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  barcodePattern?: string; // e.g., "EAN-{CATEGORY}-{SEQUENCE}"

  // Template configuration
  @Column({ type: 'jsonb', nullable: true })
  templateRules?: {
    autoGenerateSku?: boolean;
    autoGenerateBarcode?: boolean;
    requireApproval?: boolean;
    validationRules?: Array<{
      field: string;
      rule: string;
      message: string;
    }>;
  };

  @Column({ type: 'jsonb', nullable: true })
  customFields?: Record<string, any>;

  @Column({
    type: 'enum',
    enum: TemplateStatus,
    default: TemplateStatus.ACTIVE,
  })
  status!: TemplateStatus;

  @Column({ type: 'int', default: 0 })
  usageCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  // BOM and Routing templates
  @Column({ type: 'uuid', nullable: true })
  defaultBomTemplateId?: string;

  @Column({ type: 'uuid', nullable: true })
  defaultRoutingTemplateId?: string;

  // Relations
  @ManyToOne(() => ProductCategory, { nullable: true })
  @JoinColumn({ name: 'default_category_id' })
  defaultCategory?: ProductCategory;

  @Column({ type: 'uuid', nullable: true })
  defaultCategoryId?: string;

  @ManyToOne(() => UnitOfMeasure, { nullable: true })
  @JoinColumn({ name: 'default_unit_of_measure_id' })
  defaultUnitOfMeasure?: UnitOfMeasure;

  @Column({ type: 'uuid', nullable: true })
  defaultUnitOfMeasureId?: string;
}
