import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  WasteRecord,
  WasteType,
  WasteCategory,
  DisposalMethod,
  WasteSummary,
} from '../../entities/waste-record.entity';
import {
  CreateWasteRecordDto,
  RecordDisposalDto,
} from './dto/create-waste-record.dto';
import { UpdateWasteRecordDto } from './dto/update-waste-record.dto';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export interface WasteMetrics {
  totalWasteQuantity: number;
  totalWasteCost: number;
  wasteRate: number; // waste / total production
  recyclingRate: number; // recycled / total waste
  scrapRate: number; // scrap / total production
  reworkRate: number; // rework / total production
  averageWastePerOrder: number;
  averageWastePerDay: number;
  mostWastedProduct: {
    productId: string;
    productName: string;
    totalWaste: number;
    totalCost: number;
  } | null;
  topWasteCauses: Array<{
    cause: string;
    occurrences: number;
    totalCost: number;
    percentage: number;
  }>;
  wasteByType: Record<WasteType, {
    quantity: number;
    cost: number;
    percentage: number;
  }>;
  wasteByCategory: Record<WasteCategory, {
    quantity: number;
    cost: number;
    percentage: number;
  }>;
  environmentalImpact: {
    totalCO2Equivalent: number;
    hazardousWasteQuantity: number;
    recycledQuantity: number;
    landfillQuantity: number;
  };
  costBreakdown: {
    materialCost: number;
    laborCost: number;
    overheadCost: number;
    disposalCost: number;
    recoveredValue: number;
    netCost: number;
  };
  trends: {
    daily: Array<{ date: Date; quantity: number; cost: number }>;
    weekly: Array<{ week: string; quantity: number; cost: number }>;
    monthly: Array<{ month: string; quantity: number; cost: number }>;
  };
}

export interface WasteTrend {
  period: string;
  quantity: number;
  cost: number;
  change: number; // percentage change from previous period
}

@Injectable()
export class WasteService {
  private readonly logger = new Logger(WasteService.name);

  constructor(
    @InjectRepository(WasteRecord)
    private readonly wasteRepository: Repository<WasteRecord>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(dto: CreateWasteRecordDto): Promise<WasteRecord> {
    const wasteRecord = this.wasteRepository.create({
      ...dto,
      recordDate: new Date(dto.recordDate),
      disposalDate: dto.disposalDate ? new Date(dto.disposalDate) : undefined,
    });

    const saved = await this.wasteRepository.save(wasteRecord);

    // Emit events for critical waste situations
    if (dto.type === WasteType.SCRAP && (dto.materialCost || 0) > 1000) {
      this.eventEmitter.emit('waste.high-value-scrap', saved);
    }

    if (dto.isRecurring) {
      this.eventEmitter.emit('waste.recurring-issue', saved);
    }

    if (dto.environmentalImpact?.hazardousWaste) {
      this.eventEmitter.emit('waste.hazardous-recorded', saved);
    }

    this.logger.log(`Waste record created: ${saved.recordNumber}`);
    return saved;
  }

  async findAll(filters?: {
    type?: WasteType;
    category?: WasteCategory;
    productId?: string;
    workOrderId?: string;
    equipmentId?: string;
    startDate?: Date;
    endDate?: Date;
    isRecurring?: boolean;
    disposalMethod?: DisposalMethod;
  }): Promise<WasteRecord[]> {
    const query = this.wasteRepository.createQueryBuilder('waste')
      .leftJoinAndSelect('waste.product', 'product')
      .leftJoinAndSelect('waste.workOrder', 'workOrder')
      .leftJoinAndSelect('waste.equipment', 'equipment')
      .leftJoinAndSelect('waste.reportedBy', 'reportedBy');

    if (filters?.type) {
      query.andWhere('waste.type = :type', { type: filters.type });
    }

    if (filters?.category) {
      query.andWhere('waste.category = :category', { category: filters.category });
    }

    if (filters?.productId) {
      query.andWhere('waste.productId = :productId', { productId: filters.productId });
    }

    if (filters?.workOrderId) {
      query.andWhere('waste.workOrderId = :workOrderId', { workOrderId: filters.workOrderId });
    }

    if (filters?.equipmentId) {
      query.andWhere('waste.equipmentId = :equipmentId', { equipmentId: filters.equipmentId });
    }

    if (filters?.startDate && filters?.endDate) {
      query.andWhere('waste.recordDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    if (filters?.isRecurring !== undefined) {
      query.andWhere('waste.isRecurring = :isRecurring', { isRecurring: filters.isRecurring });
    }

    if (filters?.disposalMethod) {
      query.andWhere('waste.disposalMethod = :disposalMethod', { disposalMethod: filters.disposalMethod });
    }

    query.orderBy('waste.recordDate', 'DESC');

    return query.getMany();
  }

  async findOne(id: string): Promise<WasteRecord> {
    const wasteRecord = await this.wasteRepository.findOne({
      where: { id },
      relations: ['product', 'workOrder', 'equipment', 'reportedBy'],
    });

    if (!wasteRecord) {
      throw new NotFoundException(`Waste record with ID ${id} not found`);
    }

    return wasteRecord;
  }

  async findByRecordNumber(recordNumber: string): Promise<WasteRecord> {
    const wasteRecord = await this.wasteRepository.findOne({
      where: { recordNumber },
      relations: ['product', 'workOrder', 'equipment', 'reportedBy'],
    });

    if (!wasteRecord) {
      throw new NotFoundException(`Waste record ${recordNumber} not found`);
    }

    return wasteRecord;
  }

  async update(id: string, dto: UpdateWasteRecordDto): Promise<WasteRecord> {
    const wasteRecord = await this.findOne(id);

    Object.assign(wasteRecord, {
      ...dto,
      recordDate: dto.recordDate ? new Date(dto.recordDate) : wasteRecord.recordDate,
      disposalDate: dto.disposalDate ? new Date(dto.disposalDate) : wasteRecord.disposalDate,
    });

    const updated = await this.wasteRepository.save(wasteRecord);
    
    this.logger.log(`Waste record updated: ${updated.recordNumber}`);
    return updated;
  }

  async recordDisposal(id: string, dto: RecordDisposalDto): Promise<WasteRecord> {
    const wasteRecord = await this.findOne(id);

    if (wasteRecord.disposalDate) {
      throw new BadRequestException('Waste record already has disposal information');
    }

    wasteRecord.disposalMethod = dto.disposalMethod;
    wasteRecord.disposalDate = new Date(dto.disposalDate);
    wasteRecord.disposalReference = dto.disposalReference;
    wasteRecord.disposalCost = dto.disposalCost;
    wasteRecord.recoveredValue = dto.recoveredValue;

    const updated = await this.wasteRepository.save(wasteRecord);

    this.eventEmitter.emit('waste.disposed', updated);
    this.logger.log(`Disposal recorded for waste: ${updated.recordNumber}`);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const wasteRecord = await this.findOne(id);
    await this.wasteRepository.remove(wasteRecord);
    this.logger.log(`Waste record deleted: ${wasteRecord.recordNumber}`);
  }

  // Analytics and Reporting Methods

  async getWasteMetrics(
    startDate?: Date,
    endDate?: Date,
    productId?: string,
  ): Promise<WasteMetrics> {
    const start = startDate || subDays(new Date(), 30);
    const end = endDate || new Date();

    const query = this.wasteRepository.createQueryBuilder('waste')
      .leftJoinAndSelect('waste.product', 'product')
      .where('waste.recordDate BETWEEN :start AND :end', {
        start: startOfDay(start),
        end: endOfDay(end),
      });

    if (productId) {
      query.andWhere('waste.productId = :productId', { productId });
    }

    const records = await query.getMany();

    // Calculate basic metrics
    const totalWasteQuantity = records.reduce((sum, r) => sum + Number(r.quantity), 0);
    const totalWasteCost = records.reduce((sum, r) => sum + Number(r.totalCost), 0);

    // Calculate recycling rate
    const recycledRecords = records.filter(r => r.disposalMethod === DisposalMethod.RECYCLE);
    const recyclingRate = records.length > 0 
      ? (recycledRecords.length / records.length) * 100 
      : 0;

    // Calculate scrap and rework rates
    const scrapRecords = records.filter(r => r.type === WasteType.SCRAP);
    const reworkRecords = records.filter(r => r.type === WasteType.REWORK);
    const scrapRate = records.length > 0 
      ? (scrapRecords.length / records.length) * 100 
      : 0;
    const reworkRate = records.length > 0 
      ? (reworkRecords.length / records.length) * 100 
      : 0;

    // Calculate averages
    const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const averageWastePerDay = totalWasteQuantity / daysDiff;

    const uniqueOrders = new Set(records.map(r => r.workOrderId).filter(Boolean));
    const averageWastePerOrder = uniqueOrders.size > 0 
      ? totalWasteQuantity / uniqueOrders.size 
      : 0;

    // Find most wasted product
    const productWaste = new Map<string, { name: string; quantity: number; cost: number }>();
    records.forEach(record => {
      if (record.productId && record.product) {
        const existing = productWaste.get(record.productId) || {
          name: record.product.name,
          quantity: 0,
          cost: 0,
        };
        existing.quantity += Number(record.quantity);
        existing.cost += Number(record.totalCost);
        productWaste.set(record.productId, existing);
      }
    });

    let mostWastedProduct = null;
    if (productWaste.size > 0) {
      const sorted = Array.from(productWaste.entries()).sort((a, b) => b[1].cost - a[1].cost);
      const [productId, data] = sorted[0] || ['', { name: '', quantity: 0, cost: 0 }];
      mostWastedProduct = {
        productId,
        productName: data.name,
        totalWaste: data.quantity,
        totalCost: data.cost,
      };
    }

    // Calculate top waste causes
    const causesMap = new Map<string, { count: number; cost: number }>();
    records.forEach(record => {
      if (record.rootCause) {
        const existing = causesMap.get(record.rootCause) || { count: 0, cost: 0 };
        existing.count++;
        existing.cost += Number(record.totalCost);
        causesMap.set(record.rootCause, existing);
      }
    });

    const topWasteCauses = Array.from(causesMap.entries())
      .map(([cause, data]) => ({
        cause,
        occurrences: data.count,
        totalCost: data.cost,
        percentage: totalWasteCost > 0 ? (data.cost / totalWasteCost) * 100 : 0,
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10);

    // Calculate waste by type
    const wasteByType = {} as Record<WasteType, { quantity: number; cost: number; percentage: number }>;
    Object.values(WasteType).forEach(type => {
      const typeRecords = records.filter(r => r.type === type);
      const quantity = typeRecords.reduce((sum, r) => sum + Number(r.quantity), 0);
      const cost = typeRecords.reduce((sum, r) => sum + Number(r.totalCost), 0);
      wasteByType[type] = {
        quantity,
        cost,
        percentage: totalWasteCost > 0 ? (cost / totalWasteCost) * 100 : 0,
      };
    });

    // Calculate waste by category
    const wasteByCategory = {} as Record<WasteCategory, { quantity: number; cost: number; percentage: number }>;
    Object.values(WasteCategory).forEach(category => {
      const categoryRecords = records.filter(r => r.category === category);
      const quantity = categoryRecords.reduce((sum, r) => sum + Number(r.quantity), 0);
      const cost = categoryRecords.reduce((sum, r) => sum + Number(r.totalCost), 0);
      wasteByCategory[category] = {
        quantity,
        cost,
        percentage: totalWasteCost > 0 ? (cost / totalWasteCost) * 100 : 0,
      };
    });

    // Calculate environmental impact
    const environmentalImpact = {
      totalCO2Equivalent: records.reduce((sum, r) => 
        sum + (r.environmentalImpact?.co2Equivalent || 0), 0),
      hazardousWasteQuantity: records
        .filter(r => r.environmentalImpact?.hazardousWaste)
        .reduce((sum, r) => sum + Number(r.quantity), 0),
      recycledQuantity: recycledRecords.reduce((sum, r) => sum + Number(r.quantity), 0),
      landfillQuantity: records
        .filter(r => r.disposalMethod === DisposalMethod.LANDFILL)
        .reduce((sum, r) => sum + Number(r.quantity), 0),
    };

    // Calculate cost breakdown
    const costBreakdown = {
      materialCost: records.reduce((sum, r) => sum + Number(r.materialCost || 0), 0),
      laborCost: records.reduce((sum, r) => sum + Number(r.laborCost || 0), 0),
      overheadCost: records.reduce((sum, r) => sum + Number(r.overheadCost || 0), 0),
      disposalCost: records.reduce((sum, r) => sum + Number(r.disposalCost || 0), 0),
      recoveredValue: records.reduce((sum, r) => sum + Number(r.recoveredValue || 0), 0),
      netCost: totalWasteCost,
    };

    // Calculate trends (simplified - daily for now)
    const dailyTrends = new Map<string, { quantity: number; cost: number }>();
    records.forEach(record => {
      const dateKey = record.recordDate.toISOString().split('T')[0];
      if (dateKey) {
        const existing = dailyTrends.get(dateKey) || { quantity: 0, cost: 0 };
        existing.quantity += Number(record.quantity);
        existing.cost += Number(record.totalCost);
        dailyTrends.set(dateKey, existing);
      }
    });

    const trends = {
      daily: Array.from(dailyTrends.entries())
        .map(([date, data]) => ({
          date: new Date(date),
          quantity: data.quantity,
          cost: data.cost,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
      weekly: [],
      monthly: [],
    };

    // TODO: Calculate actual waste rate based on total production
    const wasteRate = 0; // This would need production data

    return {
      totalWasteQuantity,
      totalWasteCost,
      wasteRate,
      recyclingRate,
      scrapRate,
      reworkRate,
      averageWastePerOrder,
      averageWastePerDay,
      mostWastedProduct,
      topWasteCauses,
      wasteByType,
      wasteByCategory,
      environmentalImpact,
      costBreakdown,
      trends,
    };
  }

  async getWasteSummary(
    startDate?: Date,
    endDate?: Date,
  ): Promise<WasteSummary> {
    const metrics = await this.getWasteMetrics(startDate, endDate);

    const byType = {} as Record<WasteType, { quantity: number; cost: number }>;
    Object.entries(metrics.wasteByType).forEach(([type, data]) => {
      byType[type as WasteType] = {
        quantity: data.quantity,
        cost: data.cost,
      };
    });

    const byCategory = {} as Record<WasteCategory, { quantity: number; cost: number }>;
    Object.entries(metrics.wasteByCategory).forEach(([category, data]) => {
      byCategory[category as WasteCategory] = {
        quantity: data.quantity,
        cost: data.cost,
      };
    });

    const byProduct = metrics.mostWastedProduct 
      ? [{
          productId: metrics.mostWastedProduct.productId,
          productName: metrics.mostWastedProduct.productName,
          quantity: metrics.mostWastedProduct.totalWaste,
          cost: metrics.mostWastedProduct.totalCost,
        }]
      : [];

    return {
      totalQuantity: metrics.totalWasteQuantity,
      totalCost: metrics.totalWasteCost,
      byType,
      byCategory,
      byProduct,
      wasteRate: metrics.wasteRate,
      recyclingRate: metrics.recyclingRate,
      topCauses: metrics.topWasteCauses.slice(0, 5).map(c => ({
        cause: c.cause,
        count: c.occurrences,
        totalCost: c.totalCost,
      })),
    };
  }

  async getRecurringIssues(): Promise<WasteRecord[]> {
    return this.wasteRepository.find({
      where: { isRecurring: true },
      relations: ['product', 'equipment', 'workOrder'],
      order: { recordDate: 'DESC' },
      take: 20,
    });
  }

  async getPendingDisposals(): Promise<WasteRecord[]> {
    return this.wasteRepository.find({
      where: { disposalDate: IsNull() },
      relations: ['product', 'equipment'],
      order: { recordDate: 'ASC' },
    });
  }

  async getHazardousWaste(): Promise<WasteRecord[]> {
    const records = await this.wasteRepository
      .createQueryBuilder('waste')
      .leftJoinAndSelect('waste.product', 'product')
      .leftJoinAndSelect('waste.equipment', 'equipment')
      .where(`waste.environmentalImpact->>'hazardousWaste' = 'true'`)
      .orderBy('waste.recordDate', 'DESC')
      .getMany();

    return records;
  }

  async getWasteTrends(
    period: 'daily' | 'weekly' | 'monthly' = 'daily',
    days: number = 30,
  ): Promise<WasteTrend[]> {
    const startDate = subDays(new Date(), days);
    const records = await this.wasteRepository.find({
      where: {
        recordDate: Between(startDate, new Date()),
      },
      order: { recordDate: 'ASC' },
    });

    const trends = new Map<string, { quantity: number; cost: number }>();

    records.forEach(record => {
      let periodKey: string = '';
      const date = record.recordDate;

      if (period === 'daily') {
        periodKey = date.toISOString().split('T')[0] || '';
      } else if (period === 'weekly') {
        const weekNumber = Math.floor((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        periodKey = `Week ${weekNumber + 1}`;
      } else {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      const existing = trends.get(periodKey) || { quantity: 0, cost: 0 };
      existing.quantity += Number(record.quantity);
      existing.cost += Number(record.totalCost);
      trends.set(periodKey, existing);
    });

    const result: WasteTrend[] = [];
    let previousCost = 0;

    Array.from(trends.entries()).forEach(([period, data], index) => {
      const change = index > 0 && previousCost > 0
        ? ((data.cost - previousCost) / previousCost) * 100
        : 0;

      result.push({
        period,
        quantity: data.quantity,
        cost: data.cost,
        change,
      });

      previousCost = data.cost;
    });

    return result;
  }

  async checkWasteAlerts(): Promise<Array<{
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    data?: any;
  }>> {
    const alerts = [];
    const last7Days = subDays(new Date(), 7);

    // Check for high waste cost in recent period
    const recentHighCost = await this.wasteRepository
      .createQueryBuilder('waste')
      .where('waste.recordDate >= :date', { date: last7Days })
      .andWhere('waste.totalCost > :cost', { cost: 5000 })
      .getCount();

    if (recentHighCost > 0) {
      alerts.push({
        type: 'high_waste_cost',
        message: `${recentHighCost} high-cost waste incidents in the last 7 days`,
        severity: 'high' as const,
        data: { count: recentHighCost },
      });
    }

    // Check for recurring issues
    const recurringCount = await this.wasteRepository.count({
      where: { isRecurring: true },
    });

    if (recurringCount > 5) {
      alerts.push({
        type: 'recurring_issues',
        message: `${recurringCount} recurring waste issues require attention`,
        severity: 'medium' as const,
        data: { count: recurringCount },
      });
    }

    // Check for pending disposals
    const pendingDisposals = await this.wasteRepository.count({
      where: { disposalDate: IsNull() },
    });

    if (pendingDisposals > 20) {
      alerts.push({
        type: 'pending_disposals',
        message: `${pendingDisposals} waste records pending disposal`,
        severity: 'low' as const,
        data: { count: pendingDisposals },
      });
    }

    // Check for hazardous waste
    const hazardousCount = await this.getHazardousWaste();
    if (hazardousCount.length > 0) {
      alerts.push({
        type: 'hazardous_waste',
        message: `${hazardousCount.length} hazardous waste items require special handling`,
        severity: 'critical' as const,
        data: { count: hazardousCount.length },
      });
    }

    return alerts;
  }
}