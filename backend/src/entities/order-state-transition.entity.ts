import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { CustomerOrder, CustomerOrderStatus } from './customer-order.entity';
import { User } from './user.entity';

@Entity('order_state_transitions')
@Index(['tenantId', 'customerOrderId'])
@Index(['tenantId', 'createdAt'])
export class OrderStateTransition extends TenantBaseEntity {
  @Column({ name: 'customer_order_id', type: 'uuid' })
  customerOrderId!: string;

  @ManyToOne(() => CustomerOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_order_id' })
  customerOrder!: CustomerOrder;

  @Column({
    name: 'from_state',
    type: 'enum',
    enum: CustomerOrderStatus,
  })
  fromState!: CustomerOrderStatus;

  @Column({
    name: 'to_state',
    type: 'enum',
    enum: CustomerOrderStatus,
  })
  toState!: CustomerOrderStatus;

  @Column({ type: 'varchar', length: 50 })
  event!: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'jsonb', nullable: true, name: 'transition_metadata' })
  transitionMetadata?: Record<string, any>;

  @CreateDateColumn({ name: 'transitioned_at' })
  transitionedAt!: Date;

  @Column({ type: 'boolean', default: true })
  success!: boolean;

  @Column({ type: 'text', nullable: true, name: 'error_message' })
  errorMessage?: string;
}