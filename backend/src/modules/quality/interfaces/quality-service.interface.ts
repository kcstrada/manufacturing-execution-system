import { ITenantAwareService } from '../../../common/interfaces/base-service.interface';
import { QualityInspection } from '../../../entities/quality-metric.entity';
import {
  UpdateInspectionResultDto,
  QualityMetricsDto,
} from '../dto/quality-inspection.dto';

/**
 * Quality service interface
 */
export interface IQualityService extends ITenantAwareService<QualityInspection> {
  /**
   * Create inspection from work order completion
   */
  createFromWorkOrder(
    workOrderId: string,
    sampleSize: number,
  ): Promise<QualityInspection>;

  /**
   * Record inspection results
   */
  recordResults(
    inspectionId: string,
    results: UpdateInspectionResultDto,
  ): Promise<QualityInspection>;

  /**
   * Approve inspection
   */
  approve(
    inspectionId: string,
    approverId: string,
    comments?: string,
  ): Promise<QualityInspection>;

  /**
   * Reject inspection
   */
  reject(
    inspectionId: string,
    rejectedBy: string,
    reason: string,
  ): Promise<QualityInspection>;

  /**
   * Request re-inspection
   */
  requestReinspection(
    inspectionId: string,
    reason: string,
  ): Promise<QualityInspection>;

  /**
   * Get inspections by product
   */
  getByProduct(
    productId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<QualityInspection[]>;

  /**
   * Get inspections by work order
   */
  getByWorkOrder(workOrderId: string): Promise<QualityInspection[]>;

  /**
   * Get failed inspections
   */
  getFailedInspections(
    startDate: Date,
    endDate: Date,
  ): Promise<QualityInspection[]>;

  /**
   * Calculate quality metrics
   */
  calculateMetrics(params: QualityMetricsDto): Promise<{
    totalInspections: number;
    passRate: number;
    failRate: number;
    defectRate: number;
    firstPassYield: number;
    averageSampleSize: number;
    topDefects: Array<{
      code: string;
      description: string;
      count: number;
      percentage: number;
    }>;
    trendsOverTime: Array<{
      date: Date;
      passRate: number;
      defectRate: number;
    }>;
  }>;

  /**
   * Get defect pareto analysis
   */
  getDefectPareto(
    productId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    defects: Array<{
      code: string;
      description: string;
      count: number;
      percentage: number;
      cumulativePercentage: number;
    }>;
  }>;

  /**
   * Calculate process capability (Cp, Cpk)
   */
  calculateProcessCapability(
    productId: string,
    measurementName: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    mean: number;
    standardDeviation: number;
    cp: number;
    cpk: number;
    upperLimit: number;
    lowerLimit: number;
    outOfSpec: number;
  }>;

  /**
   * Get control chart data
   */
  getControlChartData(
    productId: string,
    measurementName: string,
    points: number,
  ): Promise<{
    values: number[];
    mean: number;
    ucl: number; // Upper Control Limit
    lcl: number; // Lower Control Limit
    outOfControl: number[];
  }>;

  /**
   * Generate quality certificate
   */
  generateCertificate(
    inspectionIds: string[],
  ): Promise<{
    certificateNumber: string;
    generatedAt: Date;
    documentUrl: string;
  }>;

  /**
   * Get quality trends
   */
  getQualityTrends(
    period: 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date,
  ): Promise<{
    trends: Array<{
      period: string;
      passRate: number;
      defectRate: number;
      inspectionCount: number;
    }>;
  }>;

  /**
   * Create corrective action
   */
  createCorrectiveAction(
    inspectionId: string,
    action: {
      description: string;
      assignedTo: string;
      dueDate: Date;
      priority: 'low' | 'medium' | 'high';
    },
  ): Promise<any>;

  /**
   * Get inspection checklist template
   */
  getChecklistTemplate(
    productId: string,
    inspectionType: string,
  ): Promise<string[]>;
}