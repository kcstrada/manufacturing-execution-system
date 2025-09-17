import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { Product } from './product.entity';
import { User } from './user.entity';

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  EXPIRED = 'expired',
}

export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  WARNING = 'warning',
  LOW = 'low',
}

@Entity('stock_alerts')
@Index(['tenantId', 'productId', 'status'])
@Index(['tenantId', 'warehouseCode', 'status'])
@Index(['tenantId', 'severity', 'status'])
@Index(['tenantId', 'alertedAt'])
export class StockAlert extends TenantBaseEntity {
  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'varchar', length: 50, nullable: true })
  warehouseCode?: string;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.WARNING,
  })
  severity!: AlertSeverity;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE,
  })
  status!: AlertStatus;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  currentStock!: number;

  @Column({ type: 'decimal', precision: 15, scale: 3 })
  minStockLevel!: number;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'timestamp' })
  alertedAt!: Date;

  // Acknowledgement fields
  @Column({ type: 'uuid', nullable: true })
  acknowledgedById?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'acknowledged_by_id' })
  acknowledgedBy?: User;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt?: Date;

  // Resolution fields
  @Column({ type: 'uuid', nullable: true })
  resolvedById?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'resolved_by_id' })
  resolvedBy?: User;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  override metadata?: Record<string, any>;
}
