import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;

  @BeforeInsert()
  protected beforeInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  protected beforeUpdate() {
    this.updatedAt = new Date();
  }
}

export abstract class TenantBaseEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  tenantId!: string;
}