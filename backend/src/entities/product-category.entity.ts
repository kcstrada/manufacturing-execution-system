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

@Entity('product_categories')
@Unique(['tenantId', 'code'])
@Index(['tenantId', 'code'])
@Index(['tenantId', 'name'])
@Index(['tenantId', 'parentCategoryId'])
@Index(['tenantId', 'isActive'])
export class ProductCategory extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imagePath?: string;

  @Column({ type: 'jsonb', nullable: true })
  attributes?: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  // Relations
  @ManyToOne(() => ProductCategory, { nullable: true })
  @JoinColumn({ name: 'parent_category_id' })
  parentCategory?: ProductCategory;

  @Column({ type: 'uuid', nullable: true })
  parentCategoryId?: string;

  @OneToMany(() => ProductCategory, (category) => category.parentCategory)
  subCategories!: ProductCategory[];

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}