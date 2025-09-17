import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { QUEUE_NAMES, JOB_NAMES } from '../constants/queue-names';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor(QUEUE_NAMES.QUALITY)
export class QualityProcessor {
  private readonly logger = new Logger(QualityProcessor.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  @Process(JOB_NAMES.PROCESS_INSPECTION)
  async processInspection(job: Job) {
    this.logger.log(`Processing quality inspection - Job ${job.id}`);
    const { inspectionId, productId, criteria, samples } = job.data;

    try {
      await this.simulateProcessing(3000);

      const inspectionResult = {
        inspectionId,
        productId,
        passed: Math.random() > 0.15, // 85% pass rate
        defectsFound: this.generateDefects(),
        score: Math.random() * 30 + 70, // 70-100 score
        inspectedSamples: samples,
        completedAt: new Date(),
      };

      this.logger.log(
        `Inspection ${inspectionId} completed: ${inspectionResult.passed ? 'PASSED' : 'FAILED'}`,
      );

      // Emit inspection result
      if (!inspectionResult.passed) {
        this.eventEmitter.emit('quality.inspection.failed', {
          inspection: inspectionResult,
          timestamp: new Date(),
        });
      }

      return inspectionResult;
    } catch (error) {
      this.logger.error(`Failed to process inspection: ${error.message}`);
      throw error;
    }
  }

  @Process(JOB_NAMES.CALCULATE_QUALITY_METRICS)
  async calculateQualityMetrics(job: Job) {
    this.logger.log(`Calculating quality metrics - Job ${job.id}`);
    const {
      productId = 'PROD-DEMO',
      period = 'daily',
      data = {},
    } = job.data || {};

    try {
      await this.simulateProcessing(2000);

      const metrics = {
        productId,
        period,
        defectRate: Math.random() * 5, // 0-5%
        firstPassYield: Math.random() * 10 + 90, // 90-100%
        scrapRate: Math.random() * 3, // 0-3%
        reworkRate: Math.random() * 5, // 0-5%
        customerComplaints: Math.floor(Math.random() * 10),
        processCapability: Math.random() * 0.5 + 1.0, // 1.0-1.5 Cpk
        calculatedAt: new Date(),
      };

      this.logger.log(`Quality metrics calculated for product ${productId}`);

      // Emit metrics update
      this.eventEmitter.emit('quality.metrics.updated', {
        productId,
        metrics,
        timestamp: new Date(),
      });

      return metrics;
    } catch (error) {
      this.logger.error(
        `Failed to calculate quality metrics: ${error.message}`,
      );
      throw error;
    }
  }

  @Process(JOB_NAMES.CHECK_QUALITY_ALERTS)
  async checkQualityAlerts(job: Job) {
    this.logger.log(`Checking quality alerts - Job ${job.id}`);
    const { tenantId, thresholds } = job.data;

    try {
      const alerts = [];

      // Check various quality thresholds
      if (Math.random() > 0.8) {
        alerts.push({
          type: 'defect_rate_high',
          severity: 'high',
          message: 'Defect rate exceeds threshold',
          value: Math.random() * 10,
          threshold: thresholds.defectRate || 5,
        });
      }

      if (Math.random() > 0.9) {
        alerts.push({
          type: 'scrap_rate_high',
          severity: 'medium',
          message: 'Scrap rate above acceptable level',
          value: Math.random() * 5,
          threshold: thresholds.scrapRate || 3,
        });
      }

      if (alerts.length > 0) {
        this.logger.warn(`Found ${alerts.length} quality alerts`);

        // Emit quality alerts
        alerts.forEach((alert) => {
          this.eventEmitter.emit('quality.alert', {
            tenantId,
            alert,
            timestamp: new Date(),
          });
        });
      }

      return {
        success: true,
        tenantId,
        alertsFound: alerts.length,
        alerts,
        checkedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to check quality alerts: ${error.message}`);
      throw error;
    }
  }

  private async simulateProcessing(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateDefects(): any[] {
    const defectTypes = [
      'dimensional',
      'surface',
      'functional',
      'cosmetic',
      'packaging',
    ];
    const defectCount = Math.floor(Math.random() * 3);
    const defects = [];

    for (let i = 0; i < defectCount; i++) {
      defects.push({
        type: defectTypes[Math.floor(Math.random() * defectTypes.length)],
        severity: ['minor', 'major', 'critical'][Math.floor(Math.random() * 3)],
        location: `Zone ${Math.floor(Math.random() * 5) + 1}`,
      });
    }

    return defects;
  }
}
