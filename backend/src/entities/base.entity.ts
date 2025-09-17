import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
  VersionColumn,
  Index,
} from 'typeorm';

/**
 * Base entity with comprehensive audit fields
 * All entities should extend this class for consistent audit tracking
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  @VersionColumn()
  version!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @BeforeInsert()
  protected beforeInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.isActive = this.isActive ?? true;
    this.version = 1;
  }

  @BeforeUpdate()
  protected beforeUpdate() {
    this.updatedAt = new Date();
  }
}

/**
 * Base entity for multi-tenant entities
 * Includes tenant isolation field for row-level security
 */
export abstract class TenantBaseEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  tenantId!: string;
}

/**
 * Base entity for audit log entries
 * Used for tracking changes and maintaining audit trail
 */
export abstract class AuditableEntity extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50, nullable: true })
  auditAction?: string;

  @Column({ type: 'jsonb', nullable: true })
  auditChanges?: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  auditReason?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  auditTimestamp?: Date;
}
