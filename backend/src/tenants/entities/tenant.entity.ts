import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from '../../entities/user.entity';

/**
 * Tenant entity for managing multi-tenant organizations
 */
@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  @Index()
  slug!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  logo?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true })
  subdomain?: string;

  @Column({ nullable: true, name: 'custom_domain' })
  customDomain?: string;

  @Column({ type: 'jsonb', nullable: true })
  settings?: {
    theme?: string;
    locale?: string;
    timezone?: string;
    dateFormat?: string;
    currency?: string;
    features?: string[];
    limits?: {
      maxUsers?: number;
      maxOrders?: number;
      maxStorage?: number;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  billing?: {
    plan?: 'free' | 'starter' | 'professional' | 'enterprise';
    status?: 'active' | 'suspended' | 'cancelled';
    billingEmail?: string;
    billingAddress?: any;
    subscriptionId?: string;
    nextBillingDate?: Date;
  };

  @Column({ default: true, name: 'is_active' })
  isActive!: boolean;

  @Column({ nullable: true, name: 'suspended_at' })
  suspendedAt?: Date;

  @Column({ nullable: true, name: 'suspended_reason' })
  suspendedReason?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ nullable: true, name: 'expires_at' })
  expiresAt?: Date;

  // Statistics (could be computed fields)
  @Column({ default: 0, name: 'user_count' })
  userCount!: number;

  @Column({ default: 0, name: 'order_count' })
  orderCount!: number;

  @Column({ default: 0, name: 'storage_used' })
  storageUsed!: number; // in bytes

  @Column({ nullable: true, name: 'last_activity_at' })
  lastActivityAt?: Date;

  /**
   * Check if tenant is expired
   */
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  /**
   * Check if tenant is suspended
   */
  isSuspended(): boolean {
    return !this.isActive || this.suspendedAt !== null;
  }

  /**
   * Check if tenant can be accessed
   */
  canAccess(): boolean {
    return this.isActive && !this.isExpired() && !this.isSuspended();
  }

  /**
   * Get tenant status
   */
  getStatus(): 'active' | 'suspended' | 'expired' | 'inactive' {
    if (!this.isActive) return 'inactive';
    if (this.isExpired()) return 'expired';
    if (this.isSuspended()) return 'suspended';
    return 'active';
  }

  // Relations
  @OneToMany(() => User, (user) => user.tenant)
  users!: User[];
}