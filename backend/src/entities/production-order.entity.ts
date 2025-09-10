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
import { UnitOfMeasure } from './unit-of-measure.entity';
import { WorkOrder } from './work-order.entity';
import { User } from './user.entity';
import { CustomerOrder } from './customer-order.entity';

export enum ProductionOrderStatus {
  DRAFT = 'draft',
  PLANNED = 'planned',
  RELEASED = 'released',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum ProductionOrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('production_orders')
@Unique(['tenantId', 'orderNumber'])
@Index(['tenantId', 'orderNumber'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'plannedStartDate', 'plannedEndDate'])
@Index(['tenantId', 'priority'])
export class ProductionOrder extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  orderNumber!: string;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  quantityOrdered!: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  quantityProduced!: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  quantityScrapped!: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  plannedStartDate?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  plannedEndDate?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  actualStartDate?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  actualEndDate?: Date;

  @Column({
    type: 'enum',
    enum: ProductionOrderStatus,
    default: ProductionOrderStatus.DRAFT,
  })
  status!: ProductionOrderStatus;

  @Column({ type: 'int', default: 0 })
  priority!: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Relations
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => UnitOfMeasure)
  @JoinColumn({ name: 'unit_of_measure_id' })
  unitOfMeasure!: UnitOfMeasure;

  @Column({ type: 'uuid' })
  unitOfMeasureId!: string;

  @ManyToOne(() => CustomerOrder, { nullable: true })
  @JoinColumn({ name: 'customer_order_id' })
  customerOrder?: CustomerOrder;

  @Column({ type: 'uuid', nullable: true })
  customerOrderId?: string;

  @Column({ type: 'uuid' })
  createdBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdByUser!: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy?: User;

  @Column({ type: 'uuid', nullable: true })
  approvedById?: string;

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.productionOrder)
  workOrders!: WorkOrder[];
}