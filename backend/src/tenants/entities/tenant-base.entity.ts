import {
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

/**
 * Base entity class with tenant isolation
 * All tenant-specific entities should extend this class
 */
export abstract class TenantBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', nullable: false })
  tenantId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;

  @Column({ name: 'is_deleted', default: false })
  isDeleted!: boolean;

  @Column({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy?: string;

  /**
   * Hook to set audit fields before insert
   */
  @BeforeInsert()
  setCreateAuditFields() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.isDeleted = false;
  }

  /**
   * Hook to update audit fields before update
   */
  @BeforeUpdate()
  setUpdateAuditFields() {
    this.updatedAt = new Date();
  }

  /**
   * Soft delete the entity
   */
  softDelete(userId?: string) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = userId;
  }

  /**
   * Restore a soft-deleted entity
   */
  restore() {
    this.isDeleted = false;
    this.deletedAt = undefined;
    this.deletedBy = undefined;
  }
}