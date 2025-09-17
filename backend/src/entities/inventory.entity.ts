import { Entity, Column, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { Product } from './product.entity';

export enum InventoryStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  QUARANTINE = 'quarantine',
  DAMAGED = 'damaged',
  EXPIRED = 'expired',
}

@Entity('inventory')
@Unique(['tenantId', 'productId', 'warehouseCode', 'locationCode', 'lotNumber'])
@Index(['tenantId', 'productId'])
@Index(['tenantId', 'warehouseCode'])
@Index(['tenantId', 'locationCode'])
@Index(['tenantId', 'lotNumber'])
@Index(['tenantId', 'status'])
export class Inventory extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  warehouseCode!: string;

  @Column({ type: 'varchar', length: 50 })
  locationCode!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lotNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  serialNumber?: string;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  quantityOnHand!: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  quantityAvailable!: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  quantityReserved!: number;

  @Column({ type: 'decimal', precision: 15, scale: 3, default: 0 })
  quantityInTransit!: number;

  @Column({
    type: 'enum',
    enum: InventoryStatus,
    default: InventoryStatus.AVAILABLE,
  })
  status!: InventoryStatus;

  @Column({ type: 'date', nullable: true })
  expirationDate?: Date;

  @Column({ type: 'date', nullable: true })
  manufactureDate?: Date;

  @Column({ type: 'date', nullable: true })
  receivedDate?: Date;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  unitCost?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  attributes?: Record<string, any>;

  // Relations
  @ManyToOne(() => Product, (product) => product.inventoryItems)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'uuid' })
  productId!: string;
}
