import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { 
  ProductionEfficiencyReport,
  InventoryTurnoverReport,
  WorkerProductivityReport,
  QualityControlReport,
  DashboardMetrics,
  CustomReport,
  ReportFilters,
  ProductEfficiency,
  WorkCenterEfficiency,
  WorkerMetrics,
  ProductQuality,
  DefectAnalysis,
  ParetoItem,
  DashboardAlert,
  ReportExport,
} from './interfaces/report.interface';
import { CustomerOrder } from '../../entities/customer-order.entity';
import { Task, TaskStatus } from '../../entities/task.entity';
import { Inventory } from '../../entities/inventory.entity';
import { QualityMetric } from '../../entities/quality-metric.entity';
import { WasteRecord } from '../../entities/waste-record.entity';
import { TimeClockSession } from '../../entities/time-clock.entity';
import { ProductionOrder } from '../../entities/production-order.entity';

@Injectable()
export class ReportsService {

  constructor(
    @InjectRepository(CustomerOrder)
    private readonly customerOrderRepository: Repository<CustomerOrder>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(QualityMetric)
    private readonly qualityMetricRepository: Repository<QualityMetric>,
    @InjectRepository(WasteRecord)
    private readonly wasteRecordRepository: Repository<WasteRecord>,
    @InjectRepository(TimeClockSession)
    private readonly timeClockSessionRepository: Repository<TimeClockSession>,
    @InjectRepository(ProductionOrder)
    private readonly productionOrderRepository: Repository<ProductionOrder>,
    private readonly cls: ClsService,
  ) {}

  private getTenantId(): string {
    const tenantId = this.cls.get('tenantId');
    if (!tenantId) {
      throw new Error('Tenant ID not found in context');
    }
    return tenantId;
  }

  async getProductionEfficiencyReport(
    filters: ReportFilters,
  ): Promise<ProductionEfficiencyReport> {
    const tenantId = this.getTenantId();
    
    // Get production orders within date range
    const productionOrders = await this.productionOrderRepository
      .createQueryBuilder('po')
      .where('po.tenantId = :tenantId', { tenantId })
      .andWhere('po.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
      .leftJoinAndSelect('po.product', 'product')
      .leftJoinAndSelect('po.workOrders', 'workOrders')
      .getMany();

    // Calculate efficiency metrics
    const totalPlanned = productionOrders.reduce((sum, po) => sum + (po.quantityOrdered || 0), 0);
    const totalActual = productionOrders.reduce((sum, po) => sum + (po.quantityProduced || 0), 0);
    const efficiencyRate = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

    // Get equipment metrics for OEE calculation
    const equipmentMetrics = await this.calculateOEE(filters);

    // Calculate product-wise efficiency
    const byProduct = await this.calculateProductEfficiency(filters);

    // Calculate work center efficiency
    const byWorkCenter = await this.calculateWorkCenterEfficiency(filters);

    // Calculate trends
    const trends = await this.calculateEfficiencyTrends(filters);

    return {
      period: `${filters.startDate.toISOString()} - ${filters.endDate.toISOString()}`,
      plannedQuantity: totalPlanned,
      actualQuantity: totalActual,
      efficiencyRate,
      utilizationRate: equipmentMetrics.utilizationRate,
      oeeScore: equipmentMetrics.oee,
      downtime: equipmentMetrics.downtime,
      setupTime: equipmentMetrics.setupTime,
      cycleTime: equipmentMetrics.cycleTime,
      defectRate: equipmentMetrics.defectRate,
      byProduct,
      byWorkCenter,
      trends,
    };
  }

  async getInventoryTurnoverReport(
    filters: ReportFilters,
  ): Promise<InventoryTurnoverReport> {
    const tenantId = this.getTenantId();

    // Get inventory transactions
    const inventoryData = await this.inventoryRepository
      .createQueryBuilder('inv')
      .where('inv.tenantId = :tenantId', { tenantId })
      .andWhere('inv.updatedAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
      .leftJoinAndSelect('inv.product', 'product')
      .getMany();

    // Calculate average inventory value
    const averageInventoryValue = inventoryData.reduce(
      (sum, inv) => sum + (inv.quantityOnHand * (inv.unitCost || 0)),
      0,
    ) / (inventoryData.length || 1);

    // Get cost of goods sold from completed orders
    const costOfGoodsSold = await this.calculateCOGS(filters);

    // Calculate turnover ratio
    const turnoverRatio = averageInventoryValue > 0
      ? costOfGoodsSold / averageInventoryValue
      : 0;

    // Days inventory outstanding
    const daysInPeriod = Math.ceil(
      (filters.endDate.getTime() - filters.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysInventoryOutstanding = turnoverRatio > 0
      ? daysInPeriod / turnoverRatio
      : 0;

    // Count stockout events
    const stockoutEvents = inventoryData.filter(inv => inv.quantityOnHand <= 0).length;

    // Calculate excess inventory (using threshold instead of reorderPoint)
    const excessInventoryThreshold = 100; // Fixed threshold
    const excessInventoryValue = inventoryData
      .filter(inv => inv.quantityOnHand > excessInventoryThreshold)
      .reduce((sum, inv) => sum + ((inv.quantityOnHand - excessInventoryThreshold) * (inv.unitCost || 0)), 0);

    // Product-wise turnover
    const byProduct = await this.calculateProductTurnover(filters);

    // Category-wise turnover
    const byCategory = await this.calculateCategoryTurnover(filters);

    // Trends
    const trends = await this.calculateTurnoverTrends(filters);

    return {
      period: `${filters.startDate.toISOString()} - ${filters.endDate.toISOString()}`,
      turnoverRatio,
      averageInventoryValue,
      costOfGoodsSold,
      daysInventoryOutstanding,
      stockoutEvents,
      excessInventoryValue,
      byProduct,
      byCategory,
      trends,
    };
  }

  async getWorkerProductivityReport(
    filters: ReportFilters,
  ): Promise<WorkerProductivityReport> {
    const tenantId = this.getTenantId();

    // Get worker tasks
    const tasks = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.tenantId = :tenantId', { tenantId })
      .andWhere('task.completedAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
      .leftJoinAndSelect('task.assignedTo', 'worker')
      .getMany();

    // Get time clock sessions
    const timeEntries = await this.timeClockSessionRepository
      .createQueryBuilder('tc')
      .where('tc.tenantId = :tenantId', { tenantId })
      .andWhere('tc.clockInTime BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
      .leftJoinAndSelect('tc.worker', 'worker')
      .getMany();

    // Calculate metrics
    const totalWorkers = new Set(tasks.map(t => t.assignedToId)).size;
    const totalTasksCompleted = tasks.length;
    const averageTaskTime = tasks.reduce((sum, t) => {
      return sum + (t.estimatedHours || 0);
    }, 0) / (tasks.length || 1);

    // Calculate utilization rate
    const totalAvailableHours = timeEntries.reduce((sum, te) => sum + te.regularHours, 0);
    const totalProductiveHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const utilizationRate = totalAvailableHours > 0
      ? (totalProductiveHours / totalAvailableHours) * 100
      : 0;

    // Calculate overtime
    const overtimeHours = timeEntries.reduce((sum, te) => sum + te.overtimeHours, 0);

    // Worker-wise metrics
    const byWorker = await this.calculateWorkerMetrics(filters);

    // Department productivity
    const byDepartment = await this.calculateDepartmentProductivity(filters);

    // Shift productivity
    const byShift = await this.calculateShiftProductivity(filters);

    // Trends
    const trends = await this.calculateProductivityTrends(filters);

    const averageProductivity = byWorker.reduce((sum, w) => sum + w.productivity, 0) / (byWorker.length || 1);

    return {
      period: `${filters.startDate.toISOString()} - ${filters.endDate.toISOString()}`,
      totalWorkers,
      averageProductivity,
      totalTasksCompleted,
      averageTaskTime,
      utilizationRate,
      overtimeHours,
      byWorker,
      byDepartment,
      byShift,
      trends,
    };
  }

  async getQualityControlReport(
    filters: ReportFilters,
  ): Promise<QualityControlReport> {
    const tenantId = this.getTenantId();

    // Get quality metrics
    const inspections = await this.qualityMetricRepository
      .createQueryBuilder('qi')
      .where('qi.tenantId = :tenantId', { tenantId })
      .andWhere('qi.inspectionDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
      .leftJoinAndSelect('qi.product', 'product')
      .getMany();

    // Get waste records for quality issues
    const wasteRecords = await this.wasteRecordRepository
      .createQueryBuilder('wr')
      .where('wr.tenantId = :tenantId', { tenantId })
      .andWhere('wr.recordDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
      .andWhere('wr.category = :category', { category: 'quality' })
      .getMany();

    // Calculate metrics
    const totalInspections = inspections.length;
    const passedInspections = inspections.filter(i => (i as any).value >= ((i as any).targetValue || 0)).length;
    const passRate = totalInspections > 0 ? (passedInspections / totalInspections) * 100 : 0;
    const defectRate = 100 - passRate;

    // Calculate rework and scrap rates
    const reworkCount = wasteRecords.filter(w => w.type === 'rework').length;
    const scrapCount = wasteRecords.filter(w => w.type === 'scrap').length;
    const reworkRate = totalInspections > 0 ? (reworkCount / totalInspections) * 100 : 0;
    const scrapRate = totalInspections > 0 ? (scrapCount / totalInspections) * 100 : 0;

    // Calculate cost of quality
    const costOfQuality = wasteRecords.reduce((sum, w) => sum + w.totalCost, 0);

    // Product quality metrics
    const byProduct = await this.calculateProductQuality(filters);

    // Defect analysis
    const byDefectType = await this.calculateDefectAnalysis(filters);

    // Inspection point metrics
    const byInspectionPoint = await this.calculateInspectionPointMetrics(filters);

    // Quality trends
    const trends = await this.calculateQualityTrends(filters);

    // Pareto analysis
    const paretoAnalysis = this.generateParetoAnalysis(byDefectType);

    return {
      period: `${filters.startDate.toISOString()} - ${filters.endDate.toISOString()}`,
      totalInspections,
      passRate,
      defectRate,
      reworkRate,
      scrapRate,
      costOfQuality,
      byProduct,
      byDefectType,
      byInspectionPoint,
      trends,
      paretoAnalysis,
    };
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const tenantId = this.getTenantId();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Real-time metrics
    const activeOrders = await this.customerOrderRepository
      .createQueryBuilder('co')
      .where('co.tenantId = :tenantId', { tenantId })
      .andWhere('co.status = :status', { status: 'in_production' })
      .getCount();

    const activeWorkers = await this.timeClockSessionRepository
      .createQueryBuilder('tc')
      .where('tc.tenantId = :tenantId', { tenantId })
      .andWhere('tc.clockInTime >= :today', { today })
      .andWhere('tc.clockOutTime IS NULL')
      .getCount();

    const pendingTasks = await this.taskRepository.count({
      where: {
        tenantId,
        status: TaskStatus.PENDING,
      },
    });

    const completedToday = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.tenantId = :tenantId', { tenantId })
      .andWhere('task.status = :status', { status: TaskStatus.COMPLETED })
      .andWhere('task.completedAt BETWEEN :today AND :tomorrow', { today, tomorrow })
      .getCount();

    // Calculate current production rate
    const productionRate = await this.calculateCurrentProductionRate();

    // Calculate current OEE
    const currentOEE = await this.calculateCurrentOEE();

    // Monthly KPIs
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyEfficiency = await this.calculateMonthlyEfficiency(monthStart, today);
    const qualityRate = await this.calculateQualityRate(monthStart, today);
    const onTimeDelivery = await this.calculateOnTimeDelivery(monthStart, today);
    const inventoryAccuracy = await this.calculateInventoryAccuracy();

    // Get alerts
    const alerts = await this.generateAlerts();

    // Get recent events
    const recentEvents = await this.getRecentEvents();

    // Generate chart data
    const charts = await this.generateChartData();

    return {
      realTimeMetrics: {
        activeOrders,
        productionRate,
        currentOEE,
        activeWorkers,
        pendingTasks,
        completedToday,
      },
      kpis: {
        monthlyEfficiency,
        qualityRate,
        onTimeDelivery,
        inventoryAccuracy,
        customerSatisfaction: 0, // Placeholder - would need customer feedback data
        safetyIncidents: 0, // Placeholder - would need safety incident tracking
      },
      alerts,
      recentEvents,
      charts,
    };
  }

  async generateCustomReport(
    reportType: string,
    filters: ReportFilters,
    groupBy: string[],
    metrics: string[],
  ): Promise<CustomReport> {
    const tenantId = this.getTenantId();
    
    // Build dynamic query based on report type and filters
    let query: any;
    let data: any[] = [];
    
    switch (reportType) {
      case 'production':
        query = this.productionOrderRepository
          .createQueryBuilder('po')
          .where('po.tenantId = :tenantId', { tenantId })
          .andWhere('po.createdAt BETWEEN :startDate AND :endDate', {
            startDate: filters.startDate,
            endDate: filters.endDate,
          });
        break;
      
      case 'inventory':
        query = this.inventoryRepository
          .createQueryBuilder('inv')
          .where('inv.tenantId = :tenantId', { tenantId })
          .andWhere('inv.updatedAt BETWEEN :startDate AND :endDate', {
            startDate: filters.startDate,
            endDate: filters.endDate,
          });
        break;
      
      case 'quality':
        query = this.qualityMetricRepository
          .createQueryBuilder('qi')
          .where('qi.tenantId = :tenantId', { tenantId })
          .andWhere('qi.inspectionDate BETWEEN :startDate AND :endDate', {
            startDate: filters.startDate,
            endDate: filters.endDate,
          });
        break;
      
      case 'worker':
        query = this.taskRepository
          .createQueryBuilder('task')
          .where('task.tenantId = :tenantId', { tenantId })
          .andWhere('task.createdAt BETWEEN :startDate AND :endDate', {
            startDate: filters.startDate,
            endDate: filters.endDate,
          });
        break;
      
      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }

    // Apply additional filters
    if (filters.productId) {
      query.andWhere('productId = :productId', { productId: filters.productId });
    }
    if (filters.workerId) {
      query.andWhere('workerId = :workerId', { workerId: filters.workerId });
    }
    if (filters.status?.length) {
      query.andWhere('status IN (:...status)', { status: filters.status });
    }

    // Apply grouping
    groupBy.forEach(field => {
      query.addGroupBy(field);
    });

    // Select metrics
    metrics.forEach(metric => {
      switch (metric) {
        case 'count':
          query.addSelect('COUNT(*)', 'count');
          break;
        case 'sum':
          query.addSelect('SUM(quantity)', 'totalQuantity');
          break;
        case 'avg':
          query.addSelect('AVG(quantity)', 'averageQuantity');
          break;
        case 'min':
          query.addSelect('MIN(quantity)', 'minQuantity');
          break;
        case 'max':
          query.addSelect('MAX(quantity)', 'maxQuantity');
          break;
      }
    });

    data = await query.getRawMany();

    // Calculate summary
    const summary = this.calculateSummary(data, metrics);

    return {
      reportType,
      filters,
      groupBy,
      metrics,
      data,
      summary,
      generatedAt: new Date(),
    };
  }

  async exportReport(
    reportData: any,
    format: 'pdf' | 'excel' | 'csv',
  ): Promise<ReportExport> {
    let content: Buffer | string;
    let mimeType: string;
    let filename: string;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    switch (format) {
      case 'csv':
        content = this.convertToCSV(reportData);
        mimeType = 'text/csv';
        filename = `report-${timestamp}.csv`;
        break;
      
      case 'excel':
        content = await this.convertToExcel(reportData);
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `report-${timestamp}.xlsx`;
        break;
      
      case 'pdf':
        content = await this.convertToPDF(reportData);
        mimeType = 'application/pdf';
        filename = `report-${timestamp}.pdf`;
        break;
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    return {
      format,
      filename,
      content,
      mimeType,
    };
  }

  // Helper methods
  private async calculateOEE(_filters: ReportFilters): Promise<any> {
    // Simplified OEE calculation
    // OEE = Availability × Performance × Quality
    return {
      oee: 85, // Example value
      utilizationRate: 90,
      downtime: 120, // minutes
      setupTime: 60,
      cycleTime: 5,
      defectRate: 2,
    };
  }

  private async calculateProductEfficiency(filters: ReportFilters): Promise<ProductEfficiency[]> {
    const tenantId = this.getTenantId();
    
    const result = await this.productionOrderRepository
      .createQueryBuilder('po')
      .select('po.productId', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('SUM(po.quantity)', 'plannedQuantity')
      .addSelect('SUM(po.quantity)', 'actualQuantity')
      .where('po.tenantId = :tenantId', { tenantId })
      .andWhere('po.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
      .leftJoin('po.product', 'product')
      .groupBy('po.productId')
      .addGroupBy('product.name')
      .getRawMany();

    return result.map(r => ({
      productId: r.productId,
      productName: r.productName,
      plannedQuantity: parseFloat(r.plannedQuantity) || 0,
      actualQuantity: parseFloat(r.actualQuantity) || 0,
      efficiency: r.plannedQuantity > 0 ? (r.actualQuantity / r.plannedQuantity) * 100 : 0,
      defectRate: 2, // Placeholder
      averageCycleTime: 5, // Placeholder
    }));
  }

  private async calculateWorkCenterEfficiency(_filters: ReportFilters): Promise<WorkCenterEfficiency[]> {
    // Placeholder implementation
    return [];
  }

  private async calculateEfficiencyTrends(_filters: ReportFilters): Promise<any[]> {
    // Placeholder implementation
    return [];
  }

  private async calculateCOGS(_filters: ReportFilters): Promise<number> {
    // Placeholder implementation
    return 0;
  }

  private async calculateProductTurnover(_filters: ReportFilters): Promise<any[]> {
    // Placeholder implementation
    return [];
  }

  private async calculateCategoryTurnover(_filters: ReportFilters): Promise<any[]> {
    // Placeholder implementation
    return [];
  }

  private async calculateTurnoverTrends(_filters: ReportFilters): Promise<any[]> {
    // Placeholder implementation
    return [];
  }

  private async calculateWorkerMetrics(_filters: ReportFilters): Promise<WorkerMetrics[]> {
    // Placeholder implementation
    return [];
  }

  private async calculateDepartmentProductivity(_filters: ReportFilters): Promise<any[]> {
    // Placeholder implementation
    return [];
  }

  private async calculateShiftProductivity(_filters: ReportFilters): Promise<any[]> {
    // Placeholder implementation
    return [];
  }

  private async calculateProductivityTrends(_filters: ReportFilters): Promise<any[]> {
    // Placeholder implementation
    return [];
  }

  private async calculateProductQuality(_filters: ReportFilters): Promise<ProductQuality[]> {
    // Placeholder implementation
    return [];
  }

  private async calculateDefectAnalysis(_filters: ReportFilters): Promise<DefectAnalysis[]> {
    // Placeholder implementation
    return [];
  }

  private async calculateInspectionPointMetrics(_filters: ReportFilters): Promise<any[]> {
    // Placeholder implementation
    return [];
  }

  private async calculateQualityTrends(_filters: ReportFilters): Promise<any[]> {
    // Placeholder implementation
    return [];
  }

  private generateParetoAnalysis(defects: DefectAnalysis[]): ParetoItem[] {
    const sorted = defects.sort((a, b) => b.count - a.count);
    const total = sorted.reduce((sum, d) => sum + d.count, 0);
    let cumulative = 0;

    return sorted.map(d => {
      cumulative += d.count;
      return {
        category: d.defectType,
        value: d.count,
        percentage: total > 0 ? (d.count / total) * 100 : 0,
        cumulativePercentage: total > 0 ? (cumulative / total) * 100 : 0,
      };
    });
  }

  private async calculateCurrentProductionRate(): Promise<number> {
    // Placeholder implementation
    return 150; // units per hour
  }

  private async calculateCurrentOEE(): Promise<number> {
    // Placeholder implementation
    return 85; // percentage
  }

  private async calculateMonthlyEfficiency(_startDate: Date, _endDate: Date): Promise<number> {
    // Placeholder implementation
    return 92; // percentage
  }

  private async calculateQualityRate(_startDate: Date, _endDate: Date): Promise<number> {
    // Placeholder implementation
    return 98; // percentage
  }

  private async calculateOnTimeDelivery(_startDate: Date, _endDate: Date): Promise<number> {
    // Placeholder implementation
    return 95; // percentage
  }

  private async calculateInventoryAccuracy(): Promise<number> {
    // Placeholder implementation
    return 99; // percentage
  }

  private async generateAlerts(): Promise<DashboardAlert[]> {
    // Placeholder implementation
    return [];
  }

  private async getRecentEvents(): Promise<any[]> {
    // Placeholder implementation
    return [];
  }

  private async generateChartData(): Promise<any> {
    // Placeholder implementation
    return {
      productionTrend: [],
      qualityTrend: [],
      inventoryLevels: [],
      workerUtilization: [],
    };
  }

  private calculateSummary(_data: any[], _metrics: string[]): Record<string, any> {
    // Placeholder implementation
    return {};
  }

  private convertToCSV(_data: any): string {
    // Placeholder implementation
    return '';
  }

  private async convertToExcel(_data: any): Promise<Buffer> {
    // Placeholder implementation
    return Buffer.from('');
  }

  private async convertToPDF(_data: any): Promise<Buffer> {
    // Placeholder implementation
    return Buffer.from('');
  }
}