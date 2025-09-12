import { Processor, Process, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { QUEUE_NAMES, JOB_NAMES } from '../constants/queue-names';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor(QUEUE_NAMES.INVENTORY)
export class InventoryProcessor {
  private readonly logger = new Logger(InventoryProcessor.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Process(JOB_NAMES.CHECK_STOCK_LEVELS)
  async checkStockLevels(job: Job) {
    this.logger.log(`Checking stock levels - Job ${job.id}`);
    const { warehouseId, products } = job.data;

    try {
      const lowStockItems = [];
      const criticalStockItems = [];

      for (const product of products) {
        await this.simulateProcessing(50);

        const currentStock = Math.floor(Math.random() * 1000);
        const minStock = product.minStock || 100;
        const criticalLevel = minStock * 0.5;

        if (currentStock < criticalLevel) {
          criticalStockItems.push({
            productId: product.id,
            productName: product.name,
            currentStock,
            minStock,
            deficit: minStock - currentStock,
          });

          // Emit critical stock alert
          this.eventEmitter.emit('inventory.critical_stock', {
            productId: product.id,
            currentStock,
            minStock,
            warehouseId,
            timestamp: new Date(),
          });
        } else if (currentStock < minStock) {
          lowStockItems.push({
            productId: product.id,
            productName: product.name,
            currentStock,
            minStock,
            deficit: minStock - currentStock,
          });

          // Emit low stock event
          this.eventEmitter.emit('inventory.low_stock', {
            productId: product.id,
            currentStock,
            minStock,
            warehouseId,
            timestamp: new Date(),
          });
        }
      }

      this.logger.log(`Stock check complete: ${lowStockItems.length} low, ${criticalStockItems.length} critical`);

      return {
        success: true,
        warehouseId,
        totalChecked: products.length,
        lowStockItems,
        criticalStockItems,
        checkedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to check stock levels: ${error.message}`);
      throw error;
    }
  }

  @Process(JOB_NAMES.REORDER_MATERIALS)
  async reorderMaterials(job: Job) {
    this.logger.log(`Processing material reorder - Job ${job.id}`);
    const { materials, supplierId, priority } = job.data;

    try {
      const reorderItems = [];

      for (const material of materials) {
        await this.simulateProcessing(100);

        const reorderQuantity = this.calculateReorderQuantity(material);
        const estimatedCost = reorderQuantity * (material.unitCost || 10);

        reorderItems.push({
          materialId: material.id,
          quantity: reorderQuantity,
          estimatedCost,
          supplierId,
          priority,
        });
      }

      // Create purchase order
      const purchaseOrder = {
        id: `PO-${Date.now()}`,
        supplierId,
        items: reorderItems,
        totalCost: reorderItems.reduce((sum, item) => sum + item.estimatedCost, 0),
        status: 'pending',
        createdAt: new Date(),
      };

      this.logger.log(`Purchase order created: ${purchaseOrder.id}`);

      // Emit purchase order created event
      this.eventEmitter.emit('inventory.purchase_order_created', purchaseOrder);

      return {
        success: true,
        purchaseOrder,
        itemCount: reorderItems.length,
        totalCost: purchaseOrder.totalCost,
      };
    } catch (error) {
      this.logger.error(`Failed to reorder materials: ${error.message}`);
      throw error;
    }
  }

  @Process(JOB_NAMES.UPDATE_INVENTORY_FORECAST)
  async updateInventoryForecast(job: Job) {
    this.logger.log(`Updating inventory forecast - Job ${job.id}`);
    const { productId, historicalData, forecastPeriod } = job.data;

    try {
      await this.simulateProcessing(3000);

      // Simulate forecast calculation
      const forecast = {
        productId,
        period: forecastPeriod,
        predictedDemand: this.calculatePredictedDemand(historicalData),
        safetyStock: this.calculateSafetyStock(historicalData),
        reorderPoint: this.calculateReorderPoint(historicalData),
        economicOrderQuantity: this.calculateEOQ(historicalData),
        leadTime: Math.floor(Math.random() * 7) + 3, // 3-10 days
        confidence: Math.random() * 20 + 80, // 80-100%
      };

      this.logger.log(`Forecast updated for product ${productId}:`, forecast);

      // Emit forecast updated event
      this.eventEmitter.emit('inventory.forecast_updated', {
        productId,
        forecast,
        timestamp: new Date(),
      });

      return {
        success: true,
        productId,
        forecast,
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to update forecast: ${error.message}`);
      throw error;
    }
  }

  @Process(JOB_NAMES.SYNC_INVENTORY)
  async syncInventory(job: Job) {
    this.logger.log(`Syncing inventory data - Job ${job.id}`);
    const { source, destination, products } = job.data;

    try {
      const syncResults = [];
      let successCount = 0;
      let failureCount = 0;

      for (const product of products) {
        await this.simulateProcessing(200);

        const success = Math.random() > 0.1; // 90% success rate

        if (success) {
          successCount++;
          syncResults.push({
            productId: product.id,
            status: 'synced',
            syncedAt: new Date(),
          });
        } else {
          failureCount++;
          syncResults.push({
            productId: product.id,
            status: 'failed',
            error: 'Connection timeout',
          });
        }
      }

      this.logger.log(`Inventory sync complete: ${successCount} success, ${failureCount} failed`);

      return {
        success: true,
        source,
        destination,
        totalProducts: products.length,
        successCount,
        failureCount,
        syncResults,
        completedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to sync inventory: ${error.message}`);
      throw error;
    }
  }

  // Event handlers
  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onComplete(job: Job, result: any) {
    this.logger.debug(`Job ${job.id} completed successfully`);
  }

  @OnQueueFailed()
  onError(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }

  // Helper methods
  private async simulateProcessing(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateReorderQuantity(material: any): number {
    const baseQuantity = material.reorderQuantity || 100;
    const variability = Math.random() * 0.2 - 0.1; // ±10% variability
    return Math.floor(baseQuantity * (1 + variability));
  }

  private calculatePredictedDemand(historicalData: any): number {
    // Simplified demand prediction
    return Math.floor(Math.random() * 500) + 100;
  }

  private calculateSafetyStock(historicalData: any): number {
    // Simplified safety stock calculation
    return Math.floor(Math.random() * 50) + 20;
  }

  private calculateReorderPoint(historicalData: any): number {
    // Simplified reorder point calculation
    const averageDailyDemand = 10;
    const leadTime = 5;
    const safetyStock = 30;
    return (averageDailyDemand * leadTime) + safetyStock;
  }

  private calculateEOQ(historicalData: any): number {
    // Simplified Economic Order Quantity calculation
    const annualDemand = 1000;
    const orderCost = 50;
    const holdingCost = 2;
    return Math.sqrt((2 * annualDemand * orderCost) / holdingCost);
  }
}