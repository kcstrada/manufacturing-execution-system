import {
  Entity,
  Column,
  Index,
  Unique,
} from 'typeorm';
import { TenantBaseEntity } from './base.entity';

export enum SupplierStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum SupplierType {
  MANUFACTURER = 'manufacturer',
  DISTRIBUTOR = 'distributor',
  WHOLESALER = 'wholesaler',
  SERVICE_PROVIDER = 'service_provider',
  OTHER = 'other',
}

@Entity('suppliers')
@Unique(['tenantId', 'supplierCode'])
@Index(['tenantId', 'supplierCode'])
@Index(['tenantId', 'name'])
@Index(['tenantId', 'email'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'type'])
export class Supplier extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  supplierCode!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  legalName?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxId?: string;

  @Column({
    type: 'enum',
    enum: SupplierType,
    default: SupplierType.DISTRIBUTOR,
  })
  type!: SupplierType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  fax?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website?: string;

  @Column({ type: 'jsonb', nullable: true })
  address?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  @Column({ type: 'int', default: 0 })
  leadTimeDays!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  minimumOrderValue!: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency!: string;

  @Column({ type: 'jsonb', nullable: true })
  paymentTerms?: {
    type: string;
    days?: number;
    discountPercent?: number;
    discountDays?: number;
  };

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  qualityRating?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  deliveryRating?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  priceRating?: number;

  @Column({
    type: 'enum',
    enum: SupplierStatus,
    default: SupplierStatus.ACTIVE,
  })
  status!: SupplierStatus;

  @Column({ type: 'jsonb', nullable: true })
  certifications?: Array<{
    name: string;
    issuer?: string;
    issueDate?: Date;
    expiryDate?: Date;
    documentPath?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  contacts?: Array<{
    name: string;
    position?: string;
    email?: string;
    phone?: string;
    isPrimary?: boolean;
  }>;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}