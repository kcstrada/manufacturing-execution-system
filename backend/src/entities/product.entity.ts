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
import { ProductCategory } from './product-category.entity';
import { UnitOfMeasure } from './unit-of-measure.entity';
import { BillOfMaterials } from './bill-of-materials.entity';
import { Inventory } from './inventory.entity';
import { ProductionOrder } from './production-order.entity';
import { Routing } from './routing.entity';

export enum ProductType {
  RAW_MATERIAL = 'raw_material',
  COMPONENT = 'component',
  FINISHED_GOOD = 'finished_good',
  CONSUMABLE = 'consumable',
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
  DRAFT = 'draft',
}

@Entity('products')
@Unique(['tenantId', 'sku'])
@Index(['tenantId', 'sku'])
@Index(['tenantId', 'name'])
@Index(['tenantId', 'type'])
@Index(['tenantId', 'isActive'])
@Index(['tenantId', 'barcode'])
@Index(['tenantId', 'isManufacturable'])
@Index(['tenantId', 'isPurchasable'])
export class Product extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 100 })
  sku!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ProductType,
    default: ProductType.FINISHED_GOOD,
  })
  type!: ProductType;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight?: number;

  @Column({ type: 'jsonb', nullable: true })
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  specifications?: Record<string, any>;

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

  @Column({ type: 'uuid', nullable: true })
  defaultBomId?: string;

  @Column({ type: 'uuid', nullable: true })
  defaultRoutingId?: string;

  // Relations
  @ManyToOne(() => ProductCategory, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: ProductCategory;

  @Column({ type: 'uuid', nullable: true })
  categoryId?: string;

  @ManyToOne(() => UnitOfMeasure)
  @JoinColumn({ name: 'unit_of_measure_id' })
  unitOfMeasure!: UnitOfMeasure;

  @Column({ type: 'uuid' })
  unitOfMeasureId!: string;

  @OneToMany(() => BillOfMaterials, (bom) => bom.product)
  billsOfMaterials!: BillOfMaterials[];

  @OneToMany(() => Inventory, (inventory) => inventory.product)
  inventoryItems!: Inventory[];

  @OneToMany(() => ProductionOrder, (order) => order.product)
  productionOrders!: ProductionOrder[];

  @OneToMany(() => Routing, (routing) => routing.product)
  routings!: Routing[];

  @ManyToOne(() => BillOfMaterials, { nullable: true })
  @JoinColumn({ name: 'default_bom_id' })
  defaultBom?: BillOfMaterials;

  @ManyToOne(() => Routing, { nullable: true })
  @JoinColumn({ name: 'default_routing_id' })
  defaultRouting?: Routing;

  // Revision tracking - will be linked via ProductRevision entity
  // @OneToMany(() => ProductRevision, (revision) => revision.product)
  // revisions!: ProductRevision[];

  @Column({ type: 'int', default: 0 })
  currentRevisionNumber!: number;

  @Column({ type: 'uuid', nullable: true })
  currentRevisionId?: string;
}