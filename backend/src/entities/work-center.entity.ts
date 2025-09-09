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
import { WorkOrder } from './work-order.entity';

export enum WorkCenterType {
  PRODUCTION = 'production',
  ASSEMBLY = 'assembly',
  PACKAGING = 'packaging',
  QUALITY = 'quality',
  MAINTENANCE = 'maintenance',
}

@Entity('work_centers')
@Unique(['tenantId', 'code'])
@Index(['tenantId', 'code'])
@Index(['tenantId', 'name'])
@Index(['tenantId', 'departmentId'])
@Index(['tenantId', 'type'])
@Index(['tenantId', 'isActive'])
export class WorkCenter extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: WorkCenterType,
    default: WorkCenterType.PRODUCTION,
  })
  type!: WorkCenterType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  capacityPerHour!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  setupCostPerHour!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  runCostPerHour!: number;

  @Column({ type: 'int', default: 1 })
  numberOfMachines!: number;

  @Column({ type: 'int', default: 1 })
  numberOfOperators!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  efficiency!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  utilization!: number;


  @Column({ type: 'jsonb', nullable: true })
  operatingHours?: {
    monday?: { start?: string; end?: string };
    tuesday?: { start?: string; end?: string };
    wednesday?: { start?: string; end?: string };
    thursday?: { start?: string; end?: string };
    friday?: { start?: string; end?: string };
    saturday?: { start?: string; end?: string };
    sunday?: { start?: string; end?: string };
  };

  // Relations
  @ManyToOne(() => Department, (department) => department.workCenters)
  @JoinColumn({ name: 'department_id' })
  department!: Department;

  @Column({ type: 'uuid' })
  departmentId!: string;

  @OneToMany(() => WorkOrder, (workOrder) => workOrder.workCenter)
  workOrders!: WorkOrder[];
}