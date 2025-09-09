import {
  Entity,
  Column,
  Index,
  OneToMany,
  Unique,
} from 'typeorm';
import { TenantBaseEntity } from './base.entity';

@Entity('roles')
@Unique(['tenantId', 'code'])
@Index(['tenantId', 'code'])
@Index(['tenantId', 'name'])
@Index(['tenantId', 'isSystem'])
export class Role extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  permissions?: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isSystem!: boolean;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles!: UserRole[];
}

// Import UserRole after it's defined to avoid circular dependency
import { UserRole } from './user-role.entity';