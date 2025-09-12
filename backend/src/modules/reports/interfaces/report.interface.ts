export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ReportFilters extends DateRange {
  productId?: string;
  workerId?: string;
  departmentId?: string;
  equipmentId?: string;
  customerId?: string;
  status?: string[];
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface ProductionEfficiencyReport {
  period: string;
  plannedQuantity: number;
  actualQuantity: number;
  efficiencyRate: number;
  utilizationRate: number;
  oeeScore: number; // Overall Equipment Effectiveness
  downtime: number;
  setupTime: number;
  cycleTime: number;
  defectRate: number;
  byProduct: ProductEfficiency[];
  byWorkCenter: WorkCenterEfficiency[];
  trends: EfficiencyTrend[];
}

export interface ProductEfficiency {
  productId: string;
  productName: string;
  plannedQuantity: number;
  actualQuantity: number;
  efficiency: number;
  defectRate: number;
  averageCycleTime: number;
}

export interface WorkCenterEfficiency {
  workCenterId: string;
  workCenterName: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  totalProduction: number;
}

export interface EfficiencyTrend {
  date: string;
  efficiency: number;
  production: number;
  downtime: number;
}

export interface InventoryTurnoverReport {
  period: string;
  turnoverRatio: number;
  averageInventoryValue: number;
  costOfGoodsSold: number;
  daysInventoryOutstanding: number;
  stockoutEvents: number;
  excessInventoryValue: number;
  byProduct: ProductTurnover[];
  byCategory: CategoryTurnover[];
  trends: TurnoverTrend[];
}

export interface ProductTurnover {
  productId: string;
  productName: string;
  turnoverRatio: number;
  averageStock: number;
  consumption: number;
  stockouts: number;
  daysOnHand: number;
}

export interface CategoryTurnover {
  category: string;
  turnoverRatio: number;
  inventoryValue: number;
  movement: number;
}

export interface TurnoverTrend {
  date: string;
  turnoverRatio: number;
  inventoryValue: number;
}

export interface WorkerProductivityReport {
  period: string;
  totalWorkers: number;
  averageProductivity: number;
  totalTasksCompleted: number;
  averageTaskTime: number;
  utilizationRate: number;
  overtimeHours: number;
  byWorker: WorkerMetrics[];
  byDepartment: DepartmentProductivity[];
  byShift: ShiftProductivity[];
  trends: ProductivityTrend[];
}

export interface WorkerMetrics {
  workerId: string;
  workerName: string;
  tasksCompleted: number;
  averageTaskTime: number;
  productivity: number;
  efficiency: number;
  qualityScore: number;
  attendance: number;
  overtimeHours: number;
}

export interface DepartmentProductivity {
  departmentId: string;
  departmentName: string;
  workerCount: number;
  averageProductivity: number;
  totalOutput: number;
  efficiency: number;
}

export interface ShiftProductivity {
  shiftName: string;
  productivity: number;
  efficiency: number;
  workerCount: number;
  output: number;
}

export interface ProductivityTrend {
  date: string;
  productivity: number;
  efficiency: number;
  workerCount: number;
}

export interface QualityControlReport {
  period: string;
  totalInspections: number;
  passRate: number;
  defectRate: number;
  reworkRate: number;
  scrapRate: number;
  costOfQuality: number;
  byProduct: ProductQuality[];
  byDefectType: DefectAnalysis[];
  byInspectionPoint: InspectionPointMetrics[];
  trends: QualityTrend[];
  paretoAnalysis: ParetoItem[];
}

export interface ProductQuality {
  productId: string;
  productName: string;
  inspections: number;
  passRate: number;
  defects: number;
  reworks: number;
  scraps: number;
}

export interface DefectAnalysis {
  defectType: string;
  count: number;
  percentage: number;
  cost: number;
  rootCause?: string;
}

export interface InspectionPointMetrics {
  inspectionPoint: string;
  inspections: number;
  passRate: number;
  averageScore: number;
}

export interface QualityTrend {
  date: string;
  passRate: number;
  defectRate: number;
  inspections: number;
}

export interface ParetoItem {
  category: string;
  value: number;
  percentage: number;
  cumulativePercentage: number;
}

export interface DashboardMetrics {
  realTimeMetrics: {
    activeOrders: number;
    productionRate: number;
    currentOEE: number;
    activeWorkers: number;
    pendingTasks: number;
    completedToday: number;
  };
  kpis: {
    monthlyEfficiency: number;
    qualityRate: number;
    onTimeDelivery: number;
    inventoryAccuracy: number;
    customerSatisfaction: number;
    safetyIncidents: number;
  };
  alerts: DashboardAlert[];
  recentEvents: DashboardEvent[];
  charts: {
    productionTrend: ChartData[];
    qualityTrend: ChartData[];
    inventoryLevels: ChartData[];
    workerUtilization: ChartData[];
  };
}

export interface DashboardAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  actionRequired: boolean;
}

export interface DashboardEvent {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  user?: string;
}

export interface ChartData {
  label: string;
  value: number;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface CustomReport {
  reportType: string;
  filters: ReportFilters;
  groupBy: string[];
  metrics: string[];
  data: any[];
  summary: Record<string, any>;
  generatedAt: Date;
}

export interface ReportExport {
  format: 'pdf' | 'excel' | 'csv';
  filename: string;
  content: Buffer | string;
  mimeType: string;
}