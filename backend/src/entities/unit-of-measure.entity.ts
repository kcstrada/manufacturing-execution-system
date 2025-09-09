import {
  Entity,
  Column,
  Index,
  OneToMany,
  Unique,
} from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { Product } from './product.entity';
import { ProductionOrder } from './production-order.entity';

export enum UnitCategory {
  WEIGHT = 'weight',
  LENGTH = 'length',
  VOLUME = 'volume',
  AREA = 'area',
  TIME = 'time',
  QUANTITY = 'quantity',
  TEMPERATURE = 'temperature',
  CURRENCY = 'currency',
}

@Entity('units_of_measure')
@Unique(['tenantId', 'code'])
@Index(['tenantId', 'code'])
@Index(['tenantId', 'category'])
@Index(['tenantId', 'isActive'])
export class UnitOfMeasure extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 20 })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: UnitCategory,
    default: UnitCategory.QUANTITY,
  })
  category!: UnitCategory;

  @Column({ type: 'varchar', length: 20, nullable: true })
  symbol?: string;

  @Column({ type: 'decimal', precision: 20, scale: 10, default: 1 })
  conversionFactor!: number;

  @Column({ type: 'uuid', nullable: true })
  baseUnitId?: string;

  @Column({ type: 'int', default: 2 })
  decimalPlaces!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  // Relations
  @OneToMany(() => Product, (product) => product.unitOfMeasure)
  products!: Product[];

  @OneToMany(() => ProductionOrder, (order) => order.unitOfMeasure)
  productionOrders!: ProductionOrder[];
}