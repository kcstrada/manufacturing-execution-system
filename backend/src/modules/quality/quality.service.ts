import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, Not } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  QualityMetric,
  QualityInspection,
  QualityControlPlan,
  NonConformanceReport,
  MetricType,
  InspectionResult,
  DefectSeverity,
  InspectionType,
} from '../../entities/quality-metric.entity';
import {
  CreateQualityMetricDto,
  CreateQualityInspectionDto,
  CreateQualityControlPlanDto,
  CreateNonConformanceReportDto,
  ReviewInspectionDto,
  CloseNonConformanceDto,
} from './dto/create-quality.dto';
import {
  UpdateQualityMetricDto,
  UpdateQualityInspectionDto,
  UpdateNonConformanceReportDto,
} from './dto/update-quality.dto';
import { subDays, startOfDay, endOfDay, differenceInDays } from 'date-fns';

export interface QualityMetrics {
  totalInspections: number;
  passRate: number;
  failRate: number;
  reworkRate: number;
  scrapRate: number;
  averageDefectsPerUnit: number;
  criticalDefects: number;
  majorDefects: number;
  minorDefects: number;
  firstPassYield: number;
  overallYield: number;
  costOfQuality: number;
  nonConformanceCount: number;
  openNCRs: number;
  averageNCRClosureTime: number;
}

export interface InspectionSummary {
  productId: string;
  productName: string;
  totalInspected: number;
  totalPassed: number;
  totalFailed: number;
  passRate: number;
  commonDefects: Array<{
    code: string;
    description: string;
    count: number;
    severity: DefectSeverity;
  }>;
}

export interface ControlChartData {
  metric: string;
  data: Array<{
    date: Date;
    value: number;
    ucl: number; // Upper Control Limit
    lcl: number; // Lower Control Limit
    mean: number;
  }>;
  outOfControl: boolean;
}

@Injectable()
export class QualityService {
  private readonly logger = new Logger(QualityService.name);

  constructor(
    @InjectRepository(QualityMetric)
    private readonly metricRepository: Repository<QualityMetric>,
    @InjectRepository(QualityInspection)
    private readonly inspectionRepository: Repository<QualityInspection>,
    @InjectRepository(QualityControlPlan)
    private readonly planRepository: Repository<QualityControlPlan>,
    @InjectRepository(NonConformanceReport)
    private readonly ncrRepository: Repository<NonConformanceReport>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Quality Metrics Management
  async createMetric(dto: CreateQualityMetricDto): Promise<QualityMetric> {
    const existing = await this.metricRepository.findOne({
      where: { metricCode: dto.metricCode },
    });

    if (existing) {
      throw new ConflictException(`Metric with code ${dto.metricCode} already exists`);
    }

    const metric = this.metricRepository.create(dto);
    const saved = await this.metricRepository.save(metric);

    this.eventEmitter.emit('quality.metric.created', saved);
    this.logger.log(`Created quality metric: ${saved.metricCode}`);

    return saved;
  }

  async findAllMetrics(filters?: {
    type?: MetricType;
    productId?: string;
    isCritical?: boolean;
    isActive?: boolean;
  }): Promise<QualityMetric[]> {
    const where: any = {};

    if (filters?.type) where.type = filters.type;
    if (filters?.productId) where.productId = filters.productId;
    if (filters?.isCritical !== undefined) where.isCritical = filters.isCritical;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return this.metricRepository.find({
      where,
      relations: ['product'],
      order: { metricCode: 'ASC' },
    });
  }

  async findMetricById(id: string): Promise<QualityMetric> {
    const metric = await this.metricRepository.findOne({
      where: { id },
      relations: ['product', 'inspections'],
    });

    if (!metric) {
      throw new NotFoundException(`Quality metric not found: ${id}`);
    }

    return metric;
  }

  async updateMetric(id: string, dto: UpdateQualityMetricDto): Promise<QualityMetric> {
    const metric = await this.findMetricById(id);
    Object.assign(metric, dto);
    
    const updated = await this.metricRepository.save(metric);
    this.eventEmitter.emit('quality.metric.updated', updated);
    
    return updated;
  }

  // Quality Inspections
  async createInspection(dto: CreateQualityInspectionDto): Promise<QualityInspection> {
    const metric = await this.findMetricById(dto.metricId);

    // Check if inspection passes based on measurements
    if (dto.measurements && dto.measurements.length > 0) {
      const failedMeasurements = dto.measurements.filter(m => !m.passed);
      if (failedMeasurements.length > 0 && dto.result === InspectionResult.PASS) {
        throw new BadRequestException('Inspection cannot pass with failed measurements');
      }
    }

    const inspection = this.inspectionRepository.create({
      ...dto,
      inspectionDate: new Date(dto.inspectionDate),
      metric,
    });

    const saved = await this.inspectionRepository.save(inspection);

    // Update product quality status if needed
    if (dto.result === InspectionResult.FAIL || dto.result === InspectionResult.SCRAP) {
      this.eventEmitter.emit('quality.inspection.failed', saved);
    }

    // Check if non-conformance report is needed
    if (dto.result === InspectionResult.FAIL && metric.isCritical) {
      this.eventEmitter.emit('quality.ncr.required', {
        inspection: saved,
        metric,
      });
    }

    this.logger.log(`Created inspection ${saved.inspectionNumber} with result: ${saved.result}`);
    return saved;
  }

  async findAllInspections(filters?: {
    type?: InspectionType;
    result?: InspectionResult;
    productId?: string;
    workOrderId?: string;
    startDate?: Date;
    endDate?: Date;
    requiresReview?: boolean;
  }): Promise<QualityInspection[]> {
    const where: any = {};

    if (filters?.type) where.type = filters.type;
    if (filters?.result) where.result = filters.result;
    if (filters?.productId) where.productId = filters.productId;
    if (filters?.workOrderId) where.workOrderId = filters.workOrderId;
    if (filters?.requiresReview !== undefined) where.requiresReview = filters.requiresReview;

    if (filters?.startDate && filters?.endDate) {
      where.inspectionDate = Between(
        startOfDay(filters.startDate),
        endOfDay(filters.endDate),
      );
    }

    return this.inspectionRepository.find({
      where,
      relations: ['metric', 'product', 'workOrder', 'inspector'],
      order: { inspectionDate: 'DESC' },
    });
  }

  async findInspectionById(id: string): Promise<QualityInspection> {
    const inspection = await this.inspectionRepository.findOne({
      where: { id },
      relations: ['metric', 'product', 'workOrder', 'productionOrder', 'workCenter', 'inspector'],
    });

    if (!inspection) {
      throw new NotFoundException(`Quality inspection not found: ${id}`);
    }

    return inspection;
  }

  async updateInspection(id: string, dto: UpdateQualityInspectionDto): Promise<QualityInspection> {
    const inspection = await this.findInspectionById(id);
    
    if (inspection.reviewedAt) {
      throw new BadRequestException('Cannot update reviewed inspection');
    }

    Object.assign(inspection, dto);
    if (dto.inspectionDate) {
      inspection.inspectionDate = new Date(dto.inspectionDate);
    }

    const updated = await this.inspectionRepository.save(inspection);
    this.eventEmitter.emit('quality.inspection.updated', updated);
    
    return updated;
  }

  async reviewInspection(id: string, dto: ReviewInspectionDto): Promise<QualityInspection> {
    const inspection = await this.findInspectionById(id);

    if (inspection.reviewedAt) {
      throw new BadRequestException('Inspection already reviewed');
    }

    inspection.reviewedBy = dto.reviewedBy;
    inspection.reviewedAt = new Date();
    inspection.reviewNotes = dto.reviewNotes;
    inspection.requiresReview = false;

    const updated = await this.inspectionRepository.save(inspection);
    this.eventEmitter.emit('quality.inspection.reviewed', updated);
    
    return updated;
  }

  // Quality Control Plans
  async createControlPlan(dto: CreateQualityControlPlanDto): Promise<QualityControlPlan> {
    const existing = await this.planRepository.findOne({
      where: { 
        planCode: dto.planCode,
        productId: dto.productId,
      },
    });

    if (existing) {
      throw new ConflictException(`Control plan ${dto.planCode} already exists for this product`);
    }

    const plan = this.planRepository.create({
      ...dto,
      effectiveDate: new Date(dto.effectiveDate),
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
    });

    const saved = await this.planRepository.save(plan);
    this.eventEmitter.emit('quality.plan.created', saved);
    
    return saved;
  }

  async findAllControlPlans(productId?: string): Promise<QualityControlPlan[]> {
    const where: any = { isActive: true };
    if (productId) where.productId = productId;

    return this.planRepository.find({
      where,
      relations: ['product'],
      order: { effectiveDate: 'DESC' },
    });
  }

  async findControlPlanById(id: string): Promise<QualityControlPlan> {
    const plan = await this.planRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!plan) {
      throw new NotFoundException(`Quality control plan not found: ${id}`);
    }

    return plan;
  }

  async approveControlPlan(id: string, approvedBy: string): Promise<QualityControlPlan> {
    const plan = await this.findControlPlanById(id);

    if (plan.approvedAt) {
      throw new BadRequestException('Plan already approved');
    }

    plan.approvedBy = approvedBy;
    plan.approvedAt = new Date();

    const updated = await this.planRepository.save(plan);
    this.eventEmitter.emit('quality.plan.approved', updated);
    
    return updated;
  }

  // Non-Conformance Reports
  async createNCR(dto: CreateNonConformanceReportDto): Promise<NonConformanceReport> {
    const existing = await this.ncrRepository.findOne({
      where: { reportNumber: dto.reportNumber },
    });

    if (existing) {
      throw new ConflictException(`NCR ${dto.reportNumber} already exists`);
    }

    const ncr = this.ncrRepository.create({
      ...dto,
      reportDate: new Date(dto.reportDate),
      targetCloseDate: dto.targetCloseDate ? new Date(dto.targetCloseDate) : undefined,
      status: 'open',
    });

    const saved = await this.ncrRepository.save(ncr);

    // Alert relevant parties based on severity
    if (saved.severity === DefectSeverity.CRITICAL) {
      this.eventEmitter.emit('quality.ncr.critical', saved);
    }

    this.logger.log(`Created NCR ${saved.reportNumber} with severity: ${saved.severity}`);
    return saved;
  }

  async findAllNCRs(filters?: {
    status?: string;
    severity?: DefectSeverity;
    startDate?: Date;
    endDate?: Date;
  }): Promise<NonConformanceReport[]> {
    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.severity) where.severity = filters.severity;

    if (filters?.startDate && filters?.endDate) {
      where.reportDate = Between(
        startOfDay(filters.startDate),
        endOfDay(filters.endDate),
      );
    }

    return this.ncrRepository.find({
      where,
      order: { reportDate: 'DESC' },
    });
  }

  async findNCRById(id: string): Promise<NonConformanceReport> {
    const ncr = await this.ncrRepository.findOne({ where: { id } });

    if (!ncr) {
      throw new NotFoundException(`Non-conformance report not found: ${id}`);
    }

    return ncr;
  }

  async updateNCR(id: string, dto: UpdateNonConformanceReportDto): Promise<NonConformanceReport> {
    const ncr = await this.findNCRById(id);

    if (ncr.status === 'closed') {
      throw new BadRequestException('Cannot update closed NCR');
    }

    Object.assign(ncr, dto);
    if (dto.targetCloseDate) {
      ncr.targetCloseDate = new Date(dto.targetCloseDate);
    }

    const updated = await this.ncrRepository.save(ncr);
    this.eventEmitter.emit('quality.ncr.updated', updated);
    
    return updated;
  }

  async closeNCR(id: string, dto: CloseNonConformanceDto): Promise<NonConformanceReport> {
    const ncr = await this.findNCRById(id);

    if (ncr.status === 'closed') {
      throw new BadRequestException('NCR already closed');
    }

    Object.assign(ncr, {
      ...dto,
      status: 'closed',
      actualCloseDate: new Date(),
    });

    const updated = await this.ncrRepository.save(ncr);
    this.eventEmitter.emit('quality.ncr.closed', updated);
    
    return updated;
  }

  // Quality Metrics and Analytics
  async getQualityMetrics(
    startDate?: Date,
    endDate?: Date,
    productId?: string,
  ): Promise<QualityMetrics> {
    const where: any = {};

    if (startDate && endDate) {
      where.inspectionDate = Between(startOfDay(startDate), endOfDay(endDate));
    }
    if (productId) where.productId = productId;

    const inspections = await this.inspectionRepository.find({ where });
    const ncrs = await this.ncrRepository.find({
      where: startDate && endDate ? {
        reportDate: Between(startOfDay(startDate), endOfDay(endDate)),
      } : {},
    });

    const totalInspections = inspections.length;
    const passedInspections = inspections.filter(i => i.result === InspectionResult.PASS).length;
    const failedInspections = inspections.filter(i => i.result === InspectionResult.FAIL).length;
    const reworkInspections = inspections.filter(i => i.result === InspectionResult.REWORK).length;
    const scrapInspections = inspections.filter(i => i.result === InspectionResult.SCRAP).length;

    const totalDefects = inspections.reduce((sum, i) => sum + (i.defectiveQuantity || 0), 0);
    const totalSamples = inspections.reduce((sum, i) => sum + (i.sampleSize || 0), 0);

    const defectsBySeverity = inspections.reduce((acc, inspection) => {
      if (inspection.defects) {
        inspection.defects.forEach(defect => {
          switch (defect.severity) {
            case DefectSeverity.CRITICAL:
              acc.critical += defect.quantity;
              break;
            case DefectSeverity.MAJOR:
              acc.major += defect.quantity;
              break;
            case DefectSeverity.MINOR:
              acc.minor += defect.quantity;
              break;
          }
        });
      }
      return acc;
    }, { critical: 0, major: 0, minor: 0 });

    const openNCRs = ncrs.filter(n => n.status !== 'closed').length;
    const closedNCRs = ncrs.filter(n => n.status === 'closed');
    
    const averageClosureTime = closedNCRs.length > 0
      ? closedNCRs.reduce((sum, ncr) => {
          if (ncr.actualCloseDate && ncr.reportDate) {
            return sum + differenceInDays(ncr.actualCloseDate, ncr.reportDate);
          }
          return sum;
        }, 0) / closedNCRs.length
      : 0;

    const costOfQuality = ncrs.reduce((sum, ncr) => sum + (ncr.actualCost || ncr.estimatedCost || 0), 0);

    return {
      totalInspections,
      passRate: totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0,
      failRate: totalInspections > 0 ? (failedInspections / totalInspections) * 100 : 0,
      reworkRate: totalInspections > 0 ? (reworkInspections / totalInspections) * 100 : 0,
      scrapRate: totalInspections > 0 ? (scrapInspections / totalInspections) * 100 : 0,
      averageDefectsPerUnit: totalSamples > 0 ? totalDefects / totalSamples : 0,
      criticalDefects: defectsBySeverity.critical,
      majorDefects: defectsBySeverity.major,
      minorDefects: defectsBySeverity.minor,
      firstPassYield: totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0,
      overallYield: totalInspections > 0 
        ? ((passedInspections + reworkInspections) / totalInspections) * 100 
        : 0,
      costOfQuality,
      nonConformanceCount: ncrs.length,
      openNCRs,
      averageNCRClosureTime: averageClosureTime,
    };
  }

  async getInspectionSummaryByProduct(
    startDate?: Date,
    endDate?: Date,
  ): Promise<InspectionSummary[]> {
    const where: any = {};

    if (startDate && endDate) {
      where.inspectionDate = Between(startOfDay(startDate), endOfDay(endDate));
    }

    const inspections = await this.inspectionRepository.find({
      where,
      relations: ['product'],
    });

    // Group by product
    const productMap = new Map<string, InspectionSummary>();

    inspections.forEach(inspection => {
      if (!inspection.productId) return;

      const productId = inspection.productId;
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          productId,
          productName: inspection.product?.name || 'Unknown',
          totalInspected: 0,
          totalPassed: 0,
          totalFailed: 0,
          passRate: 0,
          commonDefects: [],
        });
      }

      const summary = productMap.get(productId)!;
      summary.totalInspected++;

      if (inspection.result === InspectionResult.PASS) {
        summary.totalPassed++;
      } else if (inspection.result === InspectionResult.FAIL) {
        summary.totalFailed++;
      }

      // Collect defects
      if (inspection.defects) {
        inspection.defects.forEach(defect => {
          const existingDefect = summary.commonDefects.find(d => d.code === defect.code);
          if (existingDefect) {
            existingDefect.count += defect.quantity;
          } else {
            summary.commonDefects.push({
              code: defect.code,
              description: defect.description,
              count: defect.quantity,
              severity: defect.severity,
            });
          }
        });
      }
    });

    // Calculate pass rates and sort defects
    const summaries = Array.from(productMap.values());
    summaries.forEach(summary => {
      summary.passRate = summary.totalInspected > 0
        ? (summary.totalPassed / summary.totalInspected) * 100
        : 0;
      
      // Sort defects by count
      summary.commonDefects.sort((a, b) => b.count - a.count);
      // Keep only top 5 defects
      summary.commonDefects = summary.commonDefects.slice(0, 5);
    });

    return summaries;
  }

  async getControlChartData(
    metricId: string,
    days: number = 30,
  ): Promise<ControlChartData> {
    const metric = await this.findMetricById(metricId);
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const inspections = await this.inspectionRepository.find({
      where: {
        metricId,
        inspectionDate: Between(startDate, endDate),
      },
      order: { inspectionDate: 'ASC' },
    });

    // Extract measurement values
    const dataPoints: Array<{ date: Date; value: number }> = [];
    
    inspections.forEach(inspection => {
      if (inspection.measurements) {
        const measurement = inspection.measurements.find(m => m.metricId === metricId);
        if (measurement && measurement.actualValue !== undefined) {
          dataPoints.push({
            date: inspection.inspectionDate,
            value: measurement.actualValue,
          });
        }
      }
    });

    // Calculate control limits (simplified - using 3-sigma rule)
    const values = dataPoints.map(d => d.value);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const ucl = mean + (3 * stdDev);
    const lcl = mean - (3 * stdDev);

    // Check for out-of-control points
    const outOfControl = values.some(v => v > ucl || v < lcl);

    return {
      metric: metric.name,
      data: dataPoints.map(point => ({
        ...point,
        ucl,
        lcl,
        mean,
      })),
      outOfControl,
    };
  }

  async getDefectParetoAnalysis(
    startDate?: Date,
    endDate?: Date,
  ): Promise<Array<{ defectCode: string; description: string; count: number; percentage: number }>> {
    const where: any = {};

    if (startDate && endDate) {
      where.inspectionDate = Between(startOfDay(startDate), endOfDay(endDate));
    }

    const inspections = await this.inspectionRepository.find({ where });

    // Aggregate defects
    const defectMap = new Map<string, { description: string; count: number }>();
    let totalDefects = 0;

    inspections.forEach(inspection => {
      if (inspection.defects) {
        inspection.defects.forEach(defect => {
          const key = defect.code;
          if (defectMap.has(key)) {
            defectMap.get(key)!.count += defect.quantity;
          } else {
            defectMap.set(key, {
              description: defect.description,
              count: defect.quantity,
            });
          }
          totalDefects += defect.quantity;
        });
      }
    });

    // Convert to array and calculate percentages
    const defects = Array.from(defectMap.entries()).map(([code, data]) => ({
      defectCode: code,
      description: data.description,
      count: data.count,
      percentage: totalDefects > 0 ? (data.count / totalDefects) * 100 : 0,
    }));

    // Sort by count (descending) for Pareto
    defects.sort((a, b) => b.count - a.count);

    return defects;
  }

  async checkQualityAlerts(): Promise<Array<{ type: string; message: string; severity: string }>> {
    const alerts: Array<{ type: string; message: string; severity: string }> = [];

    // Check for overdue NCRs
    const overdueNCRs = await this.ncrRepository.find({
      where: {
        status: Not('closed'),
        targetCloseDate: LessThan(new Date()),
      },
    });

    if (overdueNCRs.length > 0) {
      alerts.push({
        type: 'NCR_OVERDUE',
        message: `${overdueNCRs.length} NCR(s) are overdue for closure`,
        severity: 'high',
      });
    }

    // Check for high failure rates in recent inspections
    const recentMetrics = await this.getQualityMetrics(
      subDays(new Date(), 7),
      new Date(),
    );

    if (recentMetrics.failRate > 10) {
      alerts.push({
        type: 'HIGH_FAILURE_RATE',
        message: `Failure rate is ${recentMetrics.failRate.toFixed(1)}% in the last 7 days`,
        severity: 'high',
      });
    }

    // Check for critical defects
    if (recentMetrics.criticalDefects > 0) {
      alerts.push({
        type: 'CRITICAL_DEFECTS',
        message: `${recentMetrics.criticalDefects} critical defect(s) found in the last 7 days`,
        severity: 'critical',
      });
    }

    // Check for inspections requiring review
    const pendingReviews = await this.inspectionRepository.count({
      where: { requiresReview: true },
    });

    if (pendingReviews > 0) {
      alerts.push({
        type: 'PENDING_REVIEWS',
        message: `${pendingReviews} inspection(s) require review`,
        severity: 'medium',
      });
    }

    return alerts;
  }
}