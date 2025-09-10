import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClsService } from 'nestjs-cls';
import { Product } from '../../../entities/product.entity';
import { StockAlert, AlertStatus, AlertSeverity } from '../../../entities/stock-alert.entity';
import { InventoryService } from '../inventory.service';

export interface StockLevelAlert {
  productId: string;
  productName: string;
  sku: string;
  warehouseCode?: string;
  currentStock: number;
  minStockLevel: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  severity: AlertSeverity;
  message: string;
}

export interface StockAlertConfig {
  enableAlerts: boolean;
  checkInterval: string; // cron expression
  alertThresholds: {
    critical: number; // percentage of min stock (e.g., 0.5 = 50%)
    warning: number;  // percentage of min stock (e.g., 0.75 = 75%)
  };
  notificationChannels: ('email' | 'webhook' | 'dashboard')[];
}

@Injectable()
export class StockAlertService {
  private readonly logger = new Logger(StockAlertService.name);
  private readonly defaultConfig: StockAlertConfig = {
    enableAlerts: true,
    checkInterval: CronExpression.EVERY_HOUR,
    alertThresholds: {
      critical: 0.5,
      warning: 0.75,
    },
    notificationChannels: ['dashboard'],
  };

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(StockAlert)
    private readonly alertRepository: Repository<StockAlert>,
    private readonly inventoryService: InventoryService,
    private readonly eventEmitter: EventEmitter2,
    private readonly clsService: ClsService,
  ) {}

  /**
   * Check stock levels and generate alerts
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkStockLevels(): Promise<StockLevelAlert[]> {
    this.logger.log('Starting scheduled stock level check');
    
    try {
      const alerts = await this.performStockCheck();
      
      if (alerts.length > 0) {
        this.logger.warn(`Found ${alerts.length} products with low stock`);
        await this.processAlerts(alerts);
      } else {
        this.logger.log('All stock levels are within acceptable ranges');
      }
      
      return alerts;
    } catch (error) {
      this.logger.error('Error during stock level check', error);
      throw error;
    }
  }

  /**
   * Perform manual stock check for all products
   */
  async performStockCheck(warehouseCode?: string): Promise<StockLevelAlert[]> {
    const tenantId = this.getTenantId();
    
    // Get all products with minimum stock levels defined
    const products = await this.productRepository.find({
      where: {
        tenantId,
        minStockLevel: LessThan(999999), // Has min stock level defined
      },
      relations: ['inventoryItems'],
    });

    const alerts: StockLevelAlert[] = [];

    for (const product of products) {
      if (!product.minStockLevel) continue;

      // Get current stock level
      const currentStock = await this.inventoryService.getAvailableQuantity(
        product.id,
        warehouseCode
      );

      // Check if stock is below minimum
      if (currentStock < product.minStockLevel) {
        const severity = this.calculateSeverity(
          currentStock,
          product.minStockLevel
        );

        alerts.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          warehouseCode,
          currentStock,
          minStockLevel: product.minStockLevel,
          reorderPoint: product.reorderPoint,
          reorderQuantity: product.reorderQuantity,
          severity,
          message: this.generateAlertMessage(
            product,
            currentStock,
            product.minStockLevel,
            severity
          ),
        });
      }
    }

    return alerts;
  }

  /**
   * Check stock level for a specific product
   */
  async checkProductStock(
    productId: string,
    warehouseCode?: string
  ): Promise<StockLevelAlert | null> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product || !product.minStockLevel) {
      return null;
    }

    const currentStock = await this.inventoryService.getAvailableQuantity(
      productId,
      warehouseCode
    );

    if (currentStock < product.minStockLevel) {
      const severity = this.calculateSeverity(currentStock, product.minStockLevel);

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        warehouseCode,
        currentStock,
        minStockLevel: product.minStockLevel,
        reorderPoint: product.reorderPoint,
        reorderQuantity: product.reorderQuantity,
        severity,
        message: this.generateAlertMessage(
          product,
          currentStock,
          product.minStockLevel,
          severity
        ),
      };
    }

    return null;
  }

  /**
   * Process and store alerts
   */
  private async processAlerts(alerts: StockLevelAlert[]): Promise<void> {
    const tenantId = this.getTenantId();
    
    for (const alert of alerts) {
      // Check if alert already exists and is active
      const existingAlert = await this.alertRepository.findOne({
        where: {
          tenantId,
          productId: alert.productId,
          warehouseCode: alert.warehouseCode || IsNull(),
          status: AlertStatus.ACTIVE,
        },
      });

      if (existingAlert) {
        // Update existing alert if severity changed
        if (existingAlert.severity !== alert.severity) {
          existingAlert.severity = alert.severity;
          existingAlert.currentStock = alert.currentStock;
          existingAlert.message = alert.message;
          await this.alertRepository.save(existingAlert);
          
          this.logger.log(
            `Updated alert for product ${alert.sku} - severity: ${alert.severity}`
          );
        }
      } else {
        // Create new alert
        const newAlert = this.alertRepository.create({
          tenantId,
          productId: alert.productId,
          warehouseCode: alert.warehouseCode,
          severity: alert.severity,
          status: AlertStatus.ACTIVE,
          currentStock: alert.currentStock,
          minStockLevel: alert.minStockLevel,
          message: alert.message,
          alertedAt: new Date(),
        });
        
        await this.alertRepository.save(newAlert);
        
        this.logger.log(
          `Created new alert for product ${alert.sku} - severity: ${alert.severity}`
        );

        // Emit event for notifications
        this.eventEmitter.emit('stock.alert.created', {
          alert: newAlert,
          product: alert,
        });
      }
    }
  }

  /**
   * Calculate alert severity based on stock level
   */
  private calculateSeverity(
    currentStock: number,
    minStockLevel: number
  ): AlertSeverity {
    const percentage = currentStock / minStockLevel;

    if (percentage <= this.defaultConfig.alertThresholds.critical) {
      return AlertSeverity.CRITICAL;
    } else if (percentage <= this.defaultConfig.alertThresholds.warning) {
      return AlertSeverity.WARNING;
    } else {
      return AlertSeverity.LOW;
    }
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(
    product: Product,
    currentStock: number,
    minStockLevel: number,
    severity: AlertSeverity
  ): string {
    const stockPercentage = ((currentStock / minStockLevel) * 100).toFixed(1);
    
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return `CRITICAL: ${product.name} (${product.sku}) stock is critically low at ${currentStock} units (${stockPercentage}% of minimum). Immediate action required!`;
      case AlertSeverity.WARNING:
        return `WARNING: ${product.name} (${product.sku}) stock is low at ${currentStock} units (${stockPercentage}% of minimum). Consider reordering soon.`;
      case AlertSeverity.LOW:
        return `INFO: ${product.name} (${product.sku}) stock is approaching minimum at ${currentStock} units (${stockPercentage}% of minimum).`;
      default:
        return `Stock alert for ${product.name} (${product.sku}): ${currentStock} units remaining.`;
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(warehouseCode?: string): Promise<StockAlert[]> {
    const tenantId = this.getTenantId();
    
    const query = this.alertRepository
      .createQueryBuilder('alert')
      .leftJoinAndSelect('alert.product', 'product')
      .where('alert.tenantId = :tenantId', { tenantId })
      .andWhere('alert.status = :status', { status: AlertStatus.ACTIVE });

    if (warehouseCode) {
      query.andWhere('alert.warehouseCode = :warehouseCode', { warehouseCode });
    }

    return query.orderBy('alert.severity', 'ASC').getMany();
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string,
    notes?: string
  ): Promise<StockAlert> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId },
    });

    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedById = acknowledgedBy;
    alert.acknowledgedAt = new Date();
    if (notes) {
      alert.notes = notes;
    }

    return this.alertRepository.save(alert);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(
    alertId: string,
    resolvedBy: string,
    resolution: string
  ): Promise<StockAlert> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId },
    });

    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedById = resolvedBy;
    alert.resolvedAt = new Date();
    alert.resolution = resolution;

    return this.alertRepository.save(alert);
  }

  /**
   * Auto-resolve alerts when stock is replenished
   */
  async checkAndResolveAlerts(productId: string, warehouseCode?: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product || !product.minStockLevel) {
      return;
    }

    const currentStock = await this.inventoryService.getAvailableQuantity(
      productId,
      warehouseCode
    );

    // If stock is now above minimum, resolve active alerts
    if (currentStock >= product.minStockLevel) {
      const alerts = await this.alertRepository.find({
        where: {
          productId,
          warehouseCode: warehouseCode || IsNull(),
          status: AlertStatus.ACTIVE,
        },
      });

      for (const alert of alerts) {
        alert.status = AlertStatus.RESOLVED;
        alert.resolvedById = 'system';
        alert.resolvedAt = new Date();
        alert.resolution = `Stock replenished to ${currentStock} units`;
        await this.alertRepository.save(alert);
        
        this.logger.log(
          `Auto-resolved alert for product ${product.sku} - stock replenished`
        );
      }
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStatistics(): Promise<{
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    bySeverity: Record<AlertSeverity, number>;
  }> {
    const tenantId = this.getTenantId();
    
    const stats = await this.alertRepository
      .createQueryBuilder('alert')
      .select('alert.status', 'status')
      .addSelect('alert.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .where('alert.tenantId = :tenantId', { tenantId })
      .groupBy('alert.status, alert.severity')
      .getRawMany();

    const result = {
      total: 0,
      active: 0,
      acknowledged: 0,
      resolved: 0,
      bySeverity: {
        [AlertSeverity.CRITICAL]: 0,
        [AlertSeverity.HIGH]: 0,
        [AlertSeverity.MEDIUM]: 0,
        [AlertSeverity.WARNING]: 0,
        [AlertSeverity.LOW]: 0,
      },
    };

    stats.forEach(stat => {
      const count = parseInt(stat.count);
      result.total += count;
      
      switch (stat.status) {
        case AlertStatus.ACTIVE:
          result.active += count;
          break;
        case AlertStatus.ACKNOWLEDGED:
          result.acknowledged += count;
          break;
        case AlertStatus.RESOLVED:
          result.resolved += count;
          break;
      }
      
      if (stat.severity) {
        result.bySeverity[stat.severity as AlertSeverity] = 
          (result.bySeverity[stat.severity as AlertSeverity] || 0) + count;
      }
    });

    return result;
  }

  private getTenantId(): string {
    const tenantId = this.clsService.get('tenantId');
    if (!tenantId) {
      return 'default'; // Fallback for scheduled jobs
    }
    return tenantId;
  }
}