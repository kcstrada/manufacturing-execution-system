import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { Product } from './product.entity';
import { User } from './user.entity';

export enum InventoryTransactionType {
  RECEIPT = 'receipt',
  ISSUE = 'issue',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
  SCRAP = 'scrap',
  CYCLE_COUNT = 'cycle_count',
  RESERVATION = 'reservation',
  RELEASE = 'release',
}

@Entity('inventory_transactions')
@Index(['tenantId', 'productId'])
@Index(['tenantId', 'transactionType'])
@Index(['tenantId', 'transactionDate'])
@Index(['tenantId', 'referenceType', 'referenceId'])
export class InventoryTransaction extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  transactionNumber!: string;

  @Column({
    type: 'enum',
    enum: InventoryTransactionType,
  })
  transactionType!: InventoryTransactionType;

  @Column({ type: 'timestamp with time zone' })
  transactionDate!: Date;

  @Column({ type: 'varchar', length: 50 })
  warehouseCode!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  fromLocation?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  toLocation?: string;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  quantity!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  unitCost!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalCost!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lotNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  serialNumber?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  referenceType?: string;

  @Column({ type: 'uuid', nullable: true })
  referenceId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceNumber?: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Relations
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'performed_by' })
  performedBy?: User;

  @Column({ type: 'uuid', nullable: true })
  performedById?: string;
}
