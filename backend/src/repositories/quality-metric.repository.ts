import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QualityMetric } from '../entities/quality-metric.entity';
import { TenantAwareRepository } from '../common/repositories/tenant-aware.repository';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class QualityMetricRepository extends TenantAwareRepository<QualityMetric> {
  constructor(
    @InjectRepository(QualityMetric)
    qualityMetricRepository: Repository<QualityMetric>,
    protected override readonly clsService: ClsService,
  ) {
    super(qualityMetricRepository, 'QualityMetric', clsService);
  }

  async findByMetricCode(metricCode: string): Promise<QualityMetric | null> {
    const tenantId = this.getTenantId();
    return this.repository.findOne({
      where: { metricCode, tenantId },
      relations: ['product', 'inspections'],
    });
  }

  async findByProduct(productId: string): Promise<QualityMetric[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { productId, tenantId },
      relations: ['inspections'],
    });
  }

  async findCriticalMetrics(): Promise<QualityMetric[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { isCritical: true, tenantId },
      relations: ['product'],
    });
  }

  async findActiveMetrics(): Promise<QualityMetric[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { isActive: true, tenantId },
      relations: ['product'],
    });
  }

  async updateTargetValues(
    metricId: string,
    targetValue: number,
    minValue: number,
    maxValue: number,
    tolerance: number,
  ): Promise<QualityMetric> {
    const tenantId = this.getTenantId();
    await this.repository.update(
      { id: metricId, tenantId },
      { targetValue, minValue, maxValue, tolerance },
    );
    
    const updated = await this.repository.findOne({
      where: { id: metricId, tenantId },
    });
    if (!updated) {
      throw new Error('QualityMetric not found');
    }
    return updated;
  }
}