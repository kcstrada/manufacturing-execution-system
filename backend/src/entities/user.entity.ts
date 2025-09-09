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
import { Department } from './department.entity';
import { UserRole } from './user-role.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
@Unique(['tenantId', 'email'])
@Unique(['tenantId', 'username'])
@Unique(['tenantId', 'employeeId'])
@Index(['tenantId', 'email'])
@Index(['tenantId', 'username'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'departmentId'])
export class User extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 100 })
  username!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  position?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  employeeId?: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: Record<string, any>;

  // Relations
  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department?: Department;

  @Column({ type: 'uuid', nullable: true })
  departmentId?: string;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles!: UserRole[];
}