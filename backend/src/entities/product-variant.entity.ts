import { Entity, Column, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { Product } from './product.entity';

@Entity('product_variants')
@Unique(['tenantId', 'variantSku'])
@Index(['tenantId', 'productId'])
@Index(['tenantId', 'variantSku'])
@Index(['tenantId', 'isActive'])
export class ProductVariant extends TenantBaseEntity {
  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'varchar', length: 100 })
  variantSku!: string;

  @Column({ type: 'varchar', length: 255 })
  variantName!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  barcode?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight?: number;

  @Column({ type: 'jsonb', nullable: true })
  attributes?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  specifications?: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  override isActive!: boolean;

  @Column({ type: 'int', nullable: true })
  sortOrder?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl?: string;
}
