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
import { ProductionOrder } from './production-order.entity';
import { WorkCenter } from './work-center.entity';
import { Product } from './product.entity';
import { User } from './user.entity';
import { Task } from './task.entity';

export enum WorkOrderStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  RELEASED = 'released',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('work_orders')
@Unique(['tenantId', 'workOrderNumber'])
@Index(['tenantId', 'workOrderNumber'])
@Index(['tenantId', 'productionOrderId'])
@Index(['tenantId', 'workCenterId'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'scheduledStartDate'])
export class WorkOrder extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  workOrderNumber!: string;

  @Column({ type: 'int' })
  sequence!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  operationDescription?: string;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  quantityOrdered!: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  quantityCompleted!: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  quantityRejected!: number;

  @Column({ type: 'int', default: 0 })
  setupTimeMinutes!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  runTimePerUnitMinutes!: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  scheduledStartDate?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  scheduledEndDate?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  actualStartDate?: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  actualEndDate?: Date;

  @Column({
    type: 'enum',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.PENDING,
  })
  status!: WorkOrderStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Relations
  @ManyToOne(() => ProductionOrder, (order) => order.workOrders)
  @JoinColumn({ name: 'production_order_id' })
  productionOrder!: ProductionOrder;

  @Column({ type: 'uuid' })
  productionOrderId!: string;

  @ManyToOne(() => WorkCenter, (workCenter) => workCenter.workOrders)
  @JoinColumn({ name: 'work_center_id' })
  workCenter!: WorkCenter;

  @Column({ type: 'uuid' })
  workCenterId!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignedTo?: User;

  @Column({ type: 'uuid', nullable: true })
  assignedToId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'completed_by' })
  completedBy?: User;

  @Column({ type: 'uuid', nullable: true })
  completedById?: string;

  @OneToMany(() => Task, (task) => task.workOrder)
  tasks!: Task[];
}
