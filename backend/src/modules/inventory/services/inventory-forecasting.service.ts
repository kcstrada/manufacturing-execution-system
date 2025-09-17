import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { Inventory, InventoryStatus } from '../../../entities/inventory.entity';
import {
  CustomerOrder,
  CustomerOrderStatus,
} from '../../../entities/customer-order.entity';
import { Product } from '../../../entities/product.entity';
import {
  InventoryTransaction,
  InventoryTransactionType,
} from '../../../entities/inventory-transaction.entity';
import {
  ForecastDto,
  ForecastResultDto,
  ForecastItemDto,
  DemandAnalysisDto,
  ReorderPointDto,
  StockoutPredictionDto,
} from '../dto/forecast.dto';

interface HistoricalDemand {
  productId: string;
  date: Date;
  quantity: number;
  type: 'order' | 'consumption' | 'adjustment';
}

@Injectable()
export class InventoryForecastingService {
  private readonly logger = new Logger(InventoryForecastingService.name);

  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(CustomerOrder)
    private readonly orderRepository: Repository<CustomerOrder>,
    @InjectRepository(InventoryTransaction)
    private readonly transactionRepository: Repository<InventoryTransaction>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly clsService: ClsService,
  ) {}

  private getTenantId(): string {
    const tenantId = this.clsService.get('tenantId');
    if (!tenantId) {
      throw new Error('Tenant ID not found in context');
    }
    return tenantId;
  }

  /**
   * Generate inventory forecast based on historical orders and current trends
   */
  async generateForecast(forecastDto: ForecastDto): Promise<ForecastResultDto> {
    const {
      productIds,
      warehouseCode,
      forecastDays = 30,
      method = 'moving_average',
      includeSeasonality = false,
      confidenceLevel = 0.95,
    } = forecastDto;

    // Get historical data
    const historicalData = await this.getHistoricalDemand(
      productIds,
      warehouseCode,
      forecastDto.historicalDays || 90,
    );

    // Calculate forecast for each product
    const forecastItems: ForecastItemDto[] = [];

    for (const productId of productIds) {
      const productHistory = historicalData.filter(
        (d) => d.productId === productId,
      );

      if (productHistory.length === 0) {
        this.logger.warn(`No historical data found for product ${productId}`);
        continue;
      }

      // Get current inventory levels
      const currentInventory = await this.getCurrentInventory(
        productId,
        warehouseCode,
      );

      // Calculate forecast based on method
      let forecastedDemand: number;
      let confidence: number;

      switch (method) {
        case 'moving_average':
          forecastedDemand = this.calculateMovingAverage(
            productHistory,
            forecastDays,
          );
          confidence = this.calculateConfidence(
            productHistory,
            forecastedDemand,
            confidenceLevel,
          );
          break;
        case 'exponential_smoothing':
          forecastedDemand = this.calculateExponentialSmoothing(
            productHistory,
            forecastDays,
          );
          confidence = this.calculateConfidence(
            productHistory,
            forecastedDemand,
            confidenceLevel,
          );
          break;
        case 'linear_regression':
          forecastedDemand = this.calculateLinearRegression(
            productHistory,
            forecastDays,
          );
          confidence = this.calculateConfidence(
            productHistory,
            forecastedDemand,
            confidenceLevel,
          );
          break;
        default:
          forecastedDemand = this.calculateMovingAverage(
            productHistory,
            forecastDays,
          );
          confidence = this.calculateConfidence(
            productHistory,
            forecastedDemand,
            confidenceLevel,
          );
      }

      // Apply seasonality if requested
      if (includeSeasonality) {
        const seasonalFactor = this.calculateSeasonalFactor(
          productHistory,
          new Date(),
        );
        forecastedDemand *= seasonalFactor;
      }

      // Calculate reorder point
      const reorderPoint = await this.calculateReorderPoint(
        productId,
        forecastedDemand,
        forecastDto.leadTimeDays || 7,
        forecastDto.safetyStockDays || 3,
      );

      // Predict stockout risk
      const stockoutPrediction = this.predictStockout(
        currentInventory,
        forecastedDemand,
        forecastDays,
      );

      forecastItems.push({
        productId,
        currentStock: currentInventory,
        forecastedDemand: Math.round(forecastedDemand),
        reorderPoint: Math.round(reorderPoint),
        reorderQuantity: Math.round(forecastedDemand * 1.5), // 50% buffer
        daysUntilStockout: stockoutPrediction.daysUntilStockout,
        stockoutRisk: stockoutPrediction.risk,
        confidence,
        recommendations: this.generateRecommendations(
          productId,
          currentInventory,
          forecastedDemand,
          reorderPoint,
          stockoutPrediction,
        ),
      });
    }

    // Calculate aggregate metrics
    const totalForecastedDemand = forecastItems.reduce(
      (sum, item) => sum + item.forecastedDemand,
      0,
    );
    const averageConfidence =
      forecastItems.reduce((sum, item) => sum + item.confidence, 0) /
      forecastItems.length;
    const highRiskItems = forecastItems.filter(
      (item) => item.stockoutRisk === 'high',
    ).length;

    return {
      forecastPeriod: {
        startDate: new Date(),
        endDate: new Date(Date.now() + forecastDays * 24 * 60 * 60 * 1000),
        days: forecastDays,
      },
      method,
      items: forecastItems,
      summary: {
        totalProducts: forecastItems.length,
        totalForecastedDemand,
        averageConfidence,
        highRiskItems,
        criticalItems: forecastItems.filter(
          (item) =>
            item.daysUntilStockout !== null && item.daysUntilStockout <= 7,
        ).length,
      },
      generatedAt: new Date(),
    };
  }

  /**
   * Analyze demand patterns for products
   */
  async analyzeDemandPatterns(
    productId: string,
    days: number = 90,
  ): Promise<DemandAnalysisDto> {
    const tenantId = this.getTenantId();

    // Get historical transactions
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const transactions = await this.transactionRepository.find({
      where: {
        productId,
        tenantId,
        transactionDate: MoreThanOrEqual(startDate),
        transactionType: InventoryTransactionType.ISSUE,
      },
      order: { transactionDate: 'ASC' },
    });

    if (transactions.length === 0) {
      throw new NotFoundException(
        `No demand history found for product ${productId}`,
      );
    }

    // Calculate daily demand
    const dailyDemand = this.aggregateDailyDemand(transactions);

    // Calculate statistics
    const quantities = dailyDemand.map((d) => d.quantity);
    const averageDemand =
      quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
    const standardDeviation = this.calculateStandardDeviation(
      quantities,
      averageDemand,
    );
    const coefficientOfVariation = standardDeviation / averageDemand;

    // Determine demand pattern
    let pattern: 'stable' | 'trending' | 'seasonal' | 'erratic';
    if (coefficientOfVariation < 0.2) {
      pattern = 'stable';
    } else if (this.detectTrend(dailyDemand)) {
      pattern = 'trending';
    } else if (this.detectSeasonality(dailyDemand)) {
      pattern = 'seasonal';
    } else {
      pattern = 'erratic';
    }

    // Calculate trend
    const trend = this.calculateTrend(dailyDemand);

    // Find peak periods
    const peakPeriods = this.identifyPeakPeriods(dailyDemand);

    return {
      productId,
      analysisPeriod: {
        startDate,
        endDate: new Date(),
        days,
      },
      pattern,
      statistics: {
        averageDailyDemand: averageDemand,
        standardDeviation,
        coefficientOfVariation,
        minDemand: Math.min(...quantities),
        maxDemand: Math.max(...quantities),
        totalDemand: quantities.reduce((sum, q) => sum + q, 0),
      },
      trend: {
        direction: trend.direction,
        strength: trend.strength,
        growthRate: trend.growthRate,
      },
      seasonality: {
        detected: pattern === 'seasonal',
        peakMonths: peakPeriods.months,
        peakDaysOfWeek: peakPeriods.daysOfWeek,
      },
      forecastAccuracy: this.calculateForecastAccuracy(dailyDemand),
    };
  }

  /**
   * Calculate optimal reorder points for products
   */
  async calculateOptimalReorderPoints(
    productIds: string[],
    leadTimeDays: number = 7,
    serviceLevel: number = 0.95,
  ): Promise<ReorderPointDto[]> {
    const results: ReorderPointDto[] = [];

    for (const productId of productIds) {
      // Get product information
      const product = await this.productRepository.findOne({
        where: { id: productId, tenantId: this.getTenantId() },
      });

      if (!product) {
        this.logger.warn(`Product ${productId} not found`);
        continue;
      }

      // Get historical demand
      const historicalDemand = await this.getHistoricalDemand(
        [productId],
        undefined,
        90,
      );

      if (historicalDemand.length === 0) {
        continue;
      }

      // Calculate average daily demand
      const dailyQuantities = this.aggregateDailyDemand(
        historicalDemand.map(
          (h) =>
            ({
              quantity: h.quantity,
              transactionDate: h.date,
            }) as any,
        ),
      );

      const averageDailyDemand =
        dailyQuantities.reduce((sum, d) => sum + d.quantity, 0) /
        dailyQuantities.length;
      const standardDeviation = this.calculateStandardDeviation(
        dailyQuantities.map((d) => d.quantity),
        averageDailyDemand,
      );

      // Calculate safety stock based on service level
      const zScore = this.getZScore(serviceLevel);
      const safetyStock = zScore * standardDeviation * Math.sqrt(leadTimeDays);

      // Calculate reorder point
      const reorderPoint = averageDailyDemand * leadTimeDays + safetyStock;

      // Calculate economic order quantity (simplified)
      const annualDemand = averageDailyDemand * 365;
      const orderingCost = 50; // Default ordering cost
      const holdingCostRate = 0.25; // 25% of product value
      const unitCost = (product as any).standardCost || 10;
      const holdingCost = unitCost * holdingCostRate;

      const economicOrderQuantity = Math.sqrt(
        (2 * annualDemand * orderingCost) / holdingCost,
      );

      results.push({
        productId,
        productName: product.name,
        reorderPoint: Math.round(reorderPoint),
        safetyStock: Math.round(safetyStock),
        economicOrderQuantity: Math.round(economicOrderQuantity),
        averageDailyDemand,
        leadTimeDays,
        serviceLevel,
        calculatedAt: new Date(),
      });
    }

    return results;
  }

  /**
   * Predict potential stockouts
   */
  async predictStockouts(
    warehouseCode?: string,
    daysAhead: number = 14,
  ): Promise<StockoutPredictionDto[]> {
    const tenantId = this.getTenantId();

    // Get all inventory items
    const inventoryQuery = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.tenantId = :tenantId', { tenantId })
      .andWhere('inventory.status = :status', {
        status: InventoryStatus.AVAILABLE,
      });

    if (warehouseCode) {
      inventoryQuery.andWhere('inventory.warehouseCode = :warehouseCode', {
        warehouseCode,
      });
    }

    const inventoryItems = await inventoryQuery.getMany();
    const predictions: StockoutPredictionDto[] = [];

    for (const inventory of inventoryItems) {
      // Get historical demand for this product
      const historicalDemand = await this.getHistoricalDemand(
        [inventory.productId],
        warehouseCode,
        30,
      );

      if (historicalDemand.length === 0) {
        continue;
      }

      // Calculate average daily demand
      const totalDemand = historicalDemand.reduce(
        (sum, d) => sum + d.quantity,
        0,
      );
      const averageDailyDemand = totalDemand / 30;

      // Predict stockout
      const currentStock = Number(inventory.quantityAvailable);
      const projectedDemand = averageDailyDemand * daysAhead;
      const daysUntilStockout =
        averageDailyDemand > 0
          ? Math.floor(currentStock / averageDailyDemand)
          : null;

      let risk: 'low' | 'medium' | 'high' | 'critical';
      let probability: number;

      if (daysUntilStockout === null) {
        risk = 'low';
        probability = 0;
      } else if (daysUntilStockout <= 3) {
        risk = 'critical';
        probability = 0.9;
      } else if (daysUntilStockout <= 7) {
        risk = 'high';
        probability = 0.7;
      } else if (daysUntilStockout <= 14) {
        risk = 'medium';
        probability = 0.4;
      } else {
        risk = 'low';
        probability = 0.1;
      }

      // Get pending orders that might replenish stock
      const pendingOrders = await this.getPendingOrdersForProduct(
        inventory.productId,
        warehouseCode,
      );

      const expectedReplenishment = pendingOrders.reduce(
        (sum, order) => sum + order.quantity,
        0,
      );

      predictions.push({
        productId: inventory.productId,
        productName: inventory.product?.name || 'Unknown',
        warehouseCode: inventory.warehouseCode,
        currentStock,
        averageDailyDemand,
        projectedDemand,
        daysUntilStockout,
        stockoutDate:
          daysUntilStockout !== null
            ? new Date(Date.now() + daysUntilStockout * 24 * 60 * 60 * 1000)
            : null,
        risk,
        probability,
        expectedReplenishment,
        recommendedAction: this.getRecommendedAction(
          risk,
          currentStock,
          averageDailyDemand,
        ),
      });
    }

    // Sort by risk level and days until stockout
    predictions.sort((a, b) => {
      const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const riskDiff = riskOrder[a.risk] - riskOrder[b.risk];
      if (riskDiff !== 0) return riskDiff;

      if (a.daysUntilStockout === null && b.daysUntilStockout === null)
        return 0;
      if (a.daysUntilStockout === null) return 1;
      if (b.daysUntilStockout === null) return -1;
      return a.daysUntilStockout - b.daysUntilStockout;
    });

    return predictions;
  }

  // Helper methods

  private async getHistoricalDemand(
    productIds: string[],
    warehouseCode?: string,
    days: number = 90,
  ): Promise<HistoricalDemand[]> {
    const tenantId = this.getTenantId();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get orders containing these products
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderLines', 'orderLine')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('order.orderDate >= :startDate', { startDate })
      .andWhere('orderLine.productId IN (:...productIds)', { productIds })
      .andWhere('order.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [
          CustomerOrderStatus.CANCELLED,
          CustomerOrderStatus.DRAFT,
        ],
      })
      .getMany();

    const demand: HistoricalDemand[] = [];

    // Convert orders to demand data
    for (const order of orders) {
      for (const line of order.orderLines || []) {
        if (productIds.includes(line.productId)) {
          demand.push({
            productId: line.productId,
            date: order.orderDate,
            quantity: Number(line.quantity),
            type: 'order',
          });
        }
      }
    }

    // Get inventory transactions (consumption)
    const transactions = await this.transactionRepository.find({
      where: {
        productId: productIds.length === 1 ? productIds[0] : undefined,
        tenantId,
        transactionDate: MoreThanOrEqual(startDate),
        transactionType: InventoryTransactionType.ISSUE,
        ...(warehouseCode && { warehouseCode }),
      },
    });

    for (const transaction of transactions) {
      if (productIds.includes(transaction.productId)) {
        demand.push({
          productId: transaction.productId,
          date: transaction.transactionDate,
          quantity: Number(transaction.quantity),
          type: 'consumption',
        });
      }
    }

    return demand;
  }

  private async getCurrentInventory(
    productId: string,
    warehouseCode?: string,
  ): Promise<number> {
    const tenantId = this.getTenantId();

    const query = this.inventoryRepository
      .createQueryBuilder('inventory')
      .where('inventory.tenantId = :tenantId', { tenantId })
      .andWhere('inventory.productId = :productId', { productId })
      .andWhere('inventory.status = :status', {
        status: InventoryStatus.AVAILABLE,
      });

    if (warehouseCode) {
      query.andWhere('inventory.warehouseCode = :warehouseCode', {
        warehouseCode,
      });
    }

    const items = await query.getMany();
    return items.reduce((sum, item) => sum + Number(item.quantityAvailable), 0);
  }

  private calculateMovingAverage(
    history: HistoricalDemand[],
    forecastDays: number,
  ): number {
    if (history.length === 0) return 0;

    // Group by day and calculate daily totals
    const dailyTotals = this.aggregateDailyDemand(history);

    // Calculate average daily demand
    const averageDailyDemand =
      dailyTotals.reduce((sum, d) => sum + d.quantity, 0) / dailyTotals.length;

    // Project for forecast period
    return averageDailyDemand * forecastDays;
  }

  private calculateExponentialSmoothing(
    history: HistoricalDemand[],
    forecastDays: number,
    alpha: number = 0.3,
  ): number {
    const dailyTotals = this.aggregateDailyDemand(history);

    if (dailyTotals.length === 0) return 0;

    let forecast = dailyTotals[0]?.quantity || 0;

    for (let i = 1; i < dailyTotals.length; i++) {
      forecast =
        alpha * (dailyTotals[i]?.quantity || 0) + (1 - alpha) * forecast;
    }

    return forecast * forecastDays;
  }

  private calculateLinearRegression(
    history: HistoricalDemand[],
    forecastDays: number,
  ): number {
    const dailyTotals = this.aggregateDailyDemand(history);

    if (dailyTotals.length < 2) return 0;

    // Calculate linear regression
    const n = dailyTotals.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    dailyTotals.forEach((d, i) => {
      sumX += i;
      sumY += d.quantity;
      sumXY += i * d.quantity;
      sumX2 += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Project forward
    const projectedDailyDemand = slope * (n + forecastDays / 2) + intercept;

    return Math.max(0, projectedDailyDemand * forecastDays);
  }

  private calculateConfidence(
    history: HistoricalDemand[],
    _forecast: number,
    confidenceLevel: number,
  ): number {
    const dailyTotals = this.aggregateDailyDemand(history);

    if (dailyTotals.length < 2) return 0.5;

    const quantities = dailyTotals.map((d) => d.quantity);
    const mean = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
    const stdDev = this.calculateStandardDeviation(quantities, mean);

    // Calculate coefficient of variation
    const cv = stdDev / mean;

    // Convert to confidence score (lower CV = higher confidence)
    const confidence = Math.max(0, Math.min(1, 1 - cv));

    return confidence * confidenceLevel;
  }

  private calculateSeasonalFactor(
    history: HistoricalDemand[],
    targetDate: Date,
  ): number {
    // Group demand by month
    const monthlyDemand: Map<number, number[]> = new Map();

    history.forEach((h) => {
      const month = h.date.getMonth();
      if (!monthlyDemand.has(month)) {
        monthlyDemand.set(month, []);
      }
      monthlyDemand.get(month)!.push(h.quantity);
    });

    // Calculate average for each month
    const monthlyAverages: Map<number, number> = new Map();
    let overallAverage = 0;
    let totalMonths = 0;

    monthlyDemand.forEach((quantities, month) => {
      const avg = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
      monthlyAverages.set(month, avg);
      overallAverage += avg;
      totalMonths++;
    });

    if (totalMonths === 0) return 1;

    overallAverage /= totalMonths;

    // Calculate seasonal factor for target month
    const targetMonth = targetDate.getMonth();
    const monthAverage = monthlyAverages.get(targetMonth);

    if (!monthAverage || overallAverage === 0) return 1;

    return monthAverage / overallAverage;
  }

  private async calculateReorderPoint(
    _productId: string,
    forecastedDemand: number,
    leadTimeDays: number,
    safetyStockDays: number,
  ): Promise<number> {
    // Calculate daily demand rate
    const dailyDemand = forecastedDemand / 30; // Assuming 30-day forecast

    // Reorder point = (Lead time demand) + (Safety stock)
    const leadTimeDemand = dailyDemand * leadTimeDays;
    const safetyStock = dailyDemand * safetyStockDays;

    return leadTimeDemand + safetyStock;
  }

  private predictStockout(
    currentStock: number,
    forecastedDemand: number,
    forecastDays: number,
  ): {
    daysUntilStockout: number | null;
    risk: 'low' | 'medium' | 'high' | 'critical';
  } {
    const dailyDemand = forecastedDemand / forecastDays;

    if (dailyDemand === 0) {
      return { daysUntilStockout: null, risk: 'low' };
    }

    const daysUntilStockout = Math.floor(currentStock / dailyDemand);

    let risk: 'low' | 'medium' | 'high' | 'critical';
    if (daysUntilStockout <= 3) {
      risk = 'critical';
    } else if (daysUntilStockout <= 7) {
      risk = 'high';
    } else if (daysUntilStockout <= 14) {
      risk = 'medium';
    } else {
      risk = 'low';
    }

    return { daysUntilStockout, risk };
  }

  private generateRecommendations(
    _productId: string,
    currentStock: number,
    forecastedDemand: number,
    reorderPoint: number,
    stockoutPrediction: { daysUntilStockout: number | null; risk: string },
  ): string[] {
    const recommendations: string[] = [];

    if (currentStock < reorderPoint) {
      recommendations.push(
        `Immediate reorder required - current stock (${currentStock}) is below reorder point (${reorderPoint})`,
      );
    }

    if (stockoutPrediction.risk === 'critical') {
      recommendations.push(
        'Critical stockout risk - expedite orders or find alternative suppliers',
      );
    } else if (stockoutPrediction.risk === 'high') {
      recommendations.push('High stockout risk - place order within 48 hours');
    }

    if (forecastedDemand > currentStock * 2) {
      recommendations.push(
        'Forecasted demand significantly exceeds current stock - consider increasing safety stock levels',
      );
    }

    if (
      stockoutPrediction.daysUntilStockout !== null &&
      stockoutPrediction.daysUntilStockout < 7
    ) {
      recommendations.push(
        `Stock will be depleted in ${stockoutPrediction.daysUntilStockout} days - urgent action required`,
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Stock levels are adequate for the forecast period');
    }

    return recommendations;
  }

  private aggregateDailyDemand(
    data: any[],
  ): { date: Date; quantity: number }[] {
    const dailyMap = new Map<string, number>();

    data.forEach((d) => {
      const dateKey = d.date
        ? d.date.toISOString().split('T')[0]
        : d.transactionDate.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || 0;
      dailyMap.set(dateKey, existing + (d.quantity || 0));
    });

    return Array.from(dailyMap.entries()).map(([date, quantity]) => ({
      date: new Date(date),
      quantity,
    }));
  }

  private calculateStandardDeviation(values: number[], mean: number): number {
    if (values.length === 0) return 0;

    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const avgSquaredDiff =
      squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;

    return Math.sqrt(avgSquaredDiff);
  }

  private detectTrend(
    dailyDemand: { date: Date; quantity: number }[],
  ): boolean {
    if (dailyDemand.length < 7) return false;

    // Simple trend detection using linear regression slope
    const n = dailyDemand.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    dailyDemand.forEach((d, i) => {
      sumX += i;
      sumY += d.quantity;
      sumXY += i * d.quantity;
      sumX2 += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgQuantity = sumY / n;

    // Significant trend if slope is > 10% of average
    return Math.abs(slope) > avgQuantity * 0.1;
  }

  private detectSeasonality(
    dailyDemand: { date: Date; quantity: number }[],
  ): boolean {
    if (dailyDemand.length < 30) return false;

    // Group by day of week
    const dayOfWeekDemand: Map<number, number[]> = new Map();

    dailyDemand.forEach((d) => {
      const dayOfWeek = d.date.getDay();
      if (!dayOfWeekDemand.has(dayOfWeek)) {
        dayOfWeekDemand.set(dayOfWeek, []);
      }
      dayOfWeekDemand.get(dayOfWeek)!.push(d.quantity);
    });

    // Calculate variance between days
    const dayAverages: number[] = [];
    dayOfWeekDemand.forEach((quantities) => {
      if (quantities.length > 0) {
        dayAverages.push(
          quantities.reduce((sum, q) => sum + q, 0) / quantities.length,
        );
      }
    });

    if (dayAverages.length < 3) return false;

    const overallAvg =
      dayAverages.reduce((sum, a) => sum + a, 0) / dayAverages.length;
    const variance = this.calculateStandardDeviation(dayAverages, overallAvg);

    // Seasonality detected if variance is > 20% of average
    return variance > overallAvg * 0.2;
  }

  private calculateTrend(dailyDemand: { date: Date; quantity: number }[]): {
    direction: 'increasing' | 'decreasing' | 'stable';
    strength: number;
    growthRate: number;
  } {
    if (dailyDemand.length < 2) {
      return { direction: 'stable', strength: 0, growthRate: 0 };
    }

    // Calculate linear regression
    const n = dailyDemand.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0;

    dailyDemand.forEach((d, i) => {
      sumX += i;
      sumY += d.quantity;
      sumXY += i * d.quantity;
      sumX2 += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgQuantity = sumY / n;

    const growthRate = avgQuantity > 0 ? (slope / avgQuantity) * 100 : 0;
    const strength = Math.min(1, Math.abs(growthRate) / 10); // Normalize to 0-1

    let direction: 'increasing' | 'decreasing' | 'stable';
    if (growthRate > 5) {
      direction = 'increasing';
    } else if (growthRate < -5) {
      direction = 'decreasing';
    } else {
      direction = 'stable';
    }

    return { direction, strength, growthRate };
  }

  private identifyPeakPeriods(
    dailyDemand: { date: Date; quantity: number }[],
  ): { months: number[]; daysOfWeek: number[] } {
    // Group by month
    const monthlyDemand: Map<number, number> = new Map();
    const dayOfWeekDemand: Map<number, number> = new Map();

    dailyDemand.forEach((d) => {
      const month = d.date.getMonth();
      const dayOfWeek = d.date.getDay();

      monthlyDemand.set(month, (monthlyDemand.get(month) || 0) + d.quantity);
      dayOfWeekDemand.set(
        dayOfWeek,
        (dayOfWeekDemand.get(dayOfWeek) || 0) + d.quantity,
      );
    });

    // Find peak months (top 3)
    const monthEntries = Array.from(monthlyDemand.entries());
    monthEntries.sort((a, b) => b[1] - a[1]);
    const peakMonths = monthEntries.slice(0, 3).map((e) => e[0]);

    // Find peak days of week (top 2)
    const dayEntries = Array.from(dayOfWeekDemand.entries());
    dayEntries.sort((a, b) => b[1] - a[1]);
    const peakDaysOfWeek = dayEntries.slice(0, 2).map((e) => e[0]);

    return { months: peakMonths, daysOfWeek: peakDaysOfWeek };
  }

  private calculateForecastAccuracy(
    dailyDemand: { date: Date; quantity: number }[],
  ): number {
    // This would compare historical forecasts with actual demand
    // For now, return a placeholder based on demand stability
    const quantities = dailyDemand.map((d) => d.quantity);
    const mean = quantities.reduce((sum, q) => sum + q, 0) / quantities.length;
    const stdDev = this.calculateStandardDeviation(quantities, mean);
    const cv = mean > 0 ? stdDev / mean : 1;

    // Lower CV means more predictable, hence higher accuracy
    return Math.max(0, Math.min(1, 1 - cv)) * 100;
  }

  private getZScore(serviceLevel: number): number {
    // Simplified Z-score table for common service levels
    const zScores: { [key: number]: number } = {
      0.9: 1.28,
      0.95: 1.65,
      0.975: 1.96,
      0.99: 2.33,
    };

    // Find closest service level
    const levels = Object.keys(zScores).map(Number);
    const closest = levels.reduce((prev, curr) =>
      Math.abs(curr - serviceLevel) < Math.abs(prev - serviceLevel)
        ? curr
        : prev,
    );

    return zScores[closest] || 1.65;
  }

  private async getPendingOrdersForProduct(
    productId: string,
    _warehouseCode?: string,
  ): Promise<{ quantity: number; expectedDate: Date }[]> {
    const tenantId = this.getTenantId();

    // Get pending orders for this product
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderLines', 'orderLine')
      .where('order.tenantId = :tenantId', { tenantId })
      .andWhere('orderLine.productId = :productId', { productId })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [
          CustomerOrderStatus.PENDING,
          CustomerOrderStatus.CONFIRMED,
          CustomerOrderStatus.IN_PRODUCTION,
        ],
      })
      .getMany();

    return orders.map((order) => ({
      quantity:
        order.orderLines?.find((l) => l.productId === productId)?.quantity || 0,
      expectedDate: order.promisedDate || order.requiredDate || new Date(),
    }));
  }

  private getRecommendedAction(
    risk: 'low' | 'medium' | 'high' | 'critical',
    _currentStock: number,
    _averageDailyDemand: number,
  ): string {
    switch (risk) {
      case 'critical':
        return 'Expedite order immediately or find alternative suppliers';
      case 'high':
        return 'Place order within 24-48 hours';
      case 'medium':
        return 'Schedule order for next purchasing cycle';
      case 'low':
        return 'Monitor stock levels and maintain current ordering schedule';
      default:
        return 'No immediate action required';
    }
  }
}
