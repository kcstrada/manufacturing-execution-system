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
import { Customer } from './customer.entity';
import { User } from './user.entity';
import { ProductionOrder } from './production-order.entity';
import { Product } from './product.entity';

export enum CustomerOrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  IN_PRODUCTION = 'in_production',
  PARTIALLY_SHIPPED = 'partially_shipped',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum OrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('customer_orders')
@Unique(['tenantId', 'orderNumber'])
@Index(['tenantId', 'orderNumber'])
@Index(['tenantId', 'customerId'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'orderDate'])
@Index(['tenantId', 'requiredDate'])
export class CustomerOrder extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  orderNumber!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  customerPONumber?: string;

  @Column({ type: 'date' })
  orderDate!: Date;

  @Column({ type: 'date' })
  requiredDate!: Date;

  @Column({ type: 'date', nullable: true })
  promisedDate?: Date;

  @Column({ type: 'date', nullable: true })
  shippedDate?: Date;

  @Column({
    type: 'enum',
    enum: CustomerOrderStatus,
    default: CustomerOrderStatus.DRAFT,
  })
  status!: CustomerOrderStatus;

  @Column({
    type: 'enum',
    enum: OrderPriority,
    default: OrderPriority.NORMAL,
  })
  priority!: OrderPriority;

  @Column({ type: 'jsonb', nullable: true })
  shippingAddress?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  @Column({ type: 'varchar', length: 100, nullable: true })
  shippingMethod?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  shippingCost!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  subtotal!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxAmount!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercent!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount!: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  internalNotes?: string;

  // Relations
  @ManyToOne(() => Customer, (customer) => customer.orders)
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ type: 'uuid' })
  customerId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'sales_rep_id' })
  salesRep?: User;

  @Column({ type: 'uuid', nullable: true })
  salesRepId?: string;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser?: User;

  @OneToMany(() => CustomerOrderLine, (line) => line.customerOrder)
  orderLines!: CustomerOrderLine[];

  @OneToMany(() => ProductionOrder, (order) => order.customerOrder)
  productionOrders!: ProductionOrder[];
}

@Entity('customer_order_lines')
@Unique(['customerOrderId', 'lineNumber'])
@Index(['tenantId', 'customerOrderId'])
@Index(['tenantId', 'productId'])
export class CustomerOrderLine extends TenantBaseEntity {
  @Column({ type: 'int' })
  lineNumber!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  shippedQuantity!: number;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercent!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  taxAmount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalAmount!: number;

  @Column({ type: 'date', nullable: true })
  requiredDate?: Date;

  @Column({ type: 'date', nullable: true })
  promisedDate?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Relations
  @ManyToOne(() => CustomerOrder, (order) => order.orderLines)
  @JoinColumn({ name: 'customer_order_id' })
  customerOrder!: CustomerOrder;

  @Column({ type: 'uuid' })
  customerOrderId!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'uuid' })
  productId!: string;
}