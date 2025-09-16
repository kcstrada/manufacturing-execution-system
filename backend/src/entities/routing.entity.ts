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
import { Product } from './product.entity';
import { User } from './user.entity';
import { ProductionStep } from './production-step.entity';

export enum RoutingStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  OBSOLETE = 'obsolete',
  PENDING = 'pending',
}

@Entity('routings')
@Unique(['tenantId', 'productId', 'version'])
@Index(['tenantId', 'productId'])
@Index(['tenantId', 'isActive'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'effectiveDate'])
export class Routing extends TenantBaseEntity {

  @Column({ type: 'varchar', length: 255, nullable: true })
  name?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: RoutingStatus,
    default: RoutingStatus.DRAFT,
  })
  status!: RoutingStatus;


  @Column({ type: 'date' })
  effectiveDate!: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'int', default: 0 })
  totalSetupTimeMinutes!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalRunTimePerUnitMinutes!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCostPerUnit!: number;

  @Column({ type: 'jsonb', nullable: true })
  notes?: Record<string, any>;

  // New fields for task 2.25
  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
  expectedYield!: number; // Percentage (0-100)

  @Column({ type: 'jsonb', nullable: true })
  alternateRoutes?: Array<{
    alternateRoutingId: string;
    alternateRoutingName: string;
    reason: string; // Why use this alternate (e.g., "Machine breakdown", "Capacity constraint")
    preferenceOrder: number;
    conditions?: string; // When to use this alternate
    setupTimeMinutes: number;
    runTimePerUnitMinutes: number;
    costPerUnit: number;
    yieldPercentage: number;
    requiredWorkCenters?: string[];
    requiredSkills?: string[];
    capacityRequired?: number;
    approvedBy?: string;
    approvedDate?: Date;
    lastUsedDate?: Date;
    usageCount?: number;
    performanceMetrics?: {
      averageYield?: number;
      averageQuality?: number;
      averageCycleTime?: number;
    };
    notes?: string;
    isActive: boolean;
  }>;

  // Relations
  @ManyToOne(() => Product, (product) => product.routings)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'uuid' })
  productId!: string;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy?: User;

  @Column({ type: 'uuid', nullable: true })
  approvedById?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  approvedAt?: Date;

  @OneToMany(() => ProductionStep, (step) => step.routing)
  steps!: ProductionStep[];

  // Helper methods
  calculateActualYield(inputQuantity: number, outputQuantity: number): number {
    if (inputQuantity === 0) return 0;
    return (outputQuantity / inputQuantity) * 100;
  }

  getExpectedOutput(inputQuantity: number): number {
    return inputQuantity * (this.expectedYield / 100);
  }

  getActiveAlternates(): any[] {
    if (!this.alternateRoutes) return [];
    return this.alternateRoutes
      .filter(route => route.isActive)
      .sort((a, b) => a.preferenceOrder - b.preferenceOrder);
  }

  getBestAlternate(conditions?: string[]): any | null {
    const activeAlternates = this.getActiveAlternates();
    if (activeAlternates.length === 0) return null;

    if (conditions && conditions.length > 0) {
      // Find alternates matching any of the conditions
      const matchingAlternates = activeAlternates.filter(route =>
        conditions.some(condition =>
          route.reason?.toLowerCase().includes(condition.toLowerCase()) ||
          route.conditions?.toLowerCase().includes(condition.toLowerCase())
        )
      );
      if (matchingAlternates.length > 0) {
        return matchingAlternates[0];
      }
    }

    // Return the first (highest preference) alternate
    return activeAlternates[0];
  }

  hasAlternates(): boolean {
    return this.alternateRoutes ? this.alternateRoutes.length > 0 : false;
  }

  getTotalProcessTime(): number {
    return this.totalSetupTimeMinutes + this.totalRunTimePerUnitMinutes;
  }

  updatePerformanceMetrics(alternateRoutingId: string, metrics: any): void {
    if (!this.alternateRoutes) return;

    const alternate = this.alternateRoutes.find(r => r.alternateRoutingId === alternateRoutingId);
    if (alternate) {
      alternate.performanceMetrics = {
        ...alternate.performanceMetrics,
        ...metrics
      };
      alternate.lastUsedDate = new Date();
      alternate.usageCount = (alternate.usageCount || 0) + 1;
    }
  }
}