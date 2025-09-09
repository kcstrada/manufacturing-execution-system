import {
  Entity,
  Column,
  Index,
  OneToMany,
  Unique,
} from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { CustomerOrder } from './customer-order.entity';

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PROSPECT = 'prospect',
}

export enum PaymentTerms {
  NET_30 = 'net_30',
  NET_60 = 'net_60',
  NET_90 = 'net_90',
  COD = 'cod',
  PREPAID = 'prepaid',
  CUSTOM = 'custom',
}

@Entity('customers')
@Unique(['tenantId', 'customerCode'])
@Index(['tenantId', 'customerCode'])
@Index(['tenantId', 'name'])
@Index(['tenantId', 'email'])
@Index(['tenantId', 'status'])
export class Customer extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  customerCode!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  legalName?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  fax?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @Column({ type: 'jsonb', nullable: true })
  billingAddress?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  shippingAddress?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  @Column({
    type: 'enum',
    enum: PaymentTerms,
    default: PaymentTerms.NET_30,
  })
  paymentTerms!: PaymentTerms;

  @Column({ type: 'int', nullable: true })
  customPaymentDays?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  creditLimit!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentBalance!: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: CustomerStatus,
    default: CustomerStatus.ACTIVE,
  })
  status!: CustomerStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  contacts?: Array<{
    name: string;
    position?: string;
    email?: string;
    phone?: string;
    isPrimary?: boolean;
  }>;

  // Relations
  @OneToMany(() => CustomerOrder, (order) => order.customer)
  orders!: CustomerOrder[];
}