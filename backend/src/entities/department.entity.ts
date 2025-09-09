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
import { User } from './user.entity';
import { WorkCenter } from './work-center.entity';

@Entity('departments')
@Unique(['tenantId', 'code'])
@Index(['tenantId', 'code'])
@Index(['tenantId', 'name'])
@Index(['tenantId', 'parentDepartmentId'])
@Index(['tenantId', 'isActive'])
export class Department extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  costCenter?: string;


  // Relations
  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'parent_department_id' })
  parentDepartment?: Department;

  @Column({ type: 'uuid', nullable: true })
  parentDepartmentId?: string;

  @OneToMany(() => Department, (dept) => dept.parentDepartment)
  subDepartments!: Department[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager?: User;

  @Column({ type: 'uuid', nullable: true })
  managerId?: string;

  @OneToMany(() => User, (user) => user.department)
  users!: User[];

  @OneToMany(() => WorkCenter, (workCenter) => workCenter.department)
  workCenters!: WorkCenter[];
}