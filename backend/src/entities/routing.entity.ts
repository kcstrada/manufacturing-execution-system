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
import { ProductionStep } from './production-step.entity';

export enum RoutingStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  OBSOLETE = 'obsolete',
  PENDING = 'pending',
}

@Entity('routings')
@Unique(['tenantId', 'productId', 'version'])
@Index(['tenantId', 'productId'])
@Index(['tenantId', 'isActive'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'effectiveDate'])
export class Routing extends TenantBaseEntity {

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: RoutingStatus,
    default: RoutingStatus.DRAFT,
  })
  status!: RoutingStatus;


  @Column({ type: 'date' })
  effectiveDate!: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'int', default: 0 })
  totalSetupTimeMinutes!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalRunTimePerUnitMinutes!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCostPerUnit!: number;

  @Column({ type: 'jsonb', nullable: true })
  notes?: Record<string, any>;

  // Relations
  @ManyToOne(() => Product, (product) => product.routings)
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

  @OneToMany(() => ProductionStep, (step) => step.routing)
  steps!: ProductionStep[];
}