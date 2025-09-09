import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { TenantBaseEntity } from './base.entity';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity('user_roles')
@Unique(['userId', 'roleId'])
@Index(['tenantId', 'userId'])
@Index(['tenantId', 'roleId'])
export class UserRole extends TenantBaseEntity {
  @ManyToOne(() => User, (user) => user.userRoles)
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => Role, (role) => role.userRoles)
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @Column({ type: 'uuid' })
  roleId!: string;

  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt!: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_by' })
  assignedBy?: User;

  @Column({ type: 'uuid', nullable: true })
  assignedById?: string;
}