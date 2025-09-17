import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QueueManagementService } from './queue-management.service';
import { QUEUE_NAMES, JOB_NAMES } from '../constants/queue-names';

@Injectable()
export class JobSchedulingService implements OnModuleInit {
  private readonly logger = new Logger(JobSchedulingService.name);

  constructor(private readonly queueManagement: QueueManagementService) {}

  async onModuleInit() {
    this.logger.log('Initializing scheduled jobs...');
    await this.initializeScheduledJobs();
  }

  /**
   * Initialize recurring scheduled jobs
   */
  private async initializeScheduledJobs() {
    try {
      // Daily report generation - Every day at 2 AM
      await this.queueManagement.addRepeatingJob(
        QUEUE_NAMES.REPORTS,
        JOB_NAMES.GENERATE_DAILY_REPORT,
        {
          tenantId: 'all',
          reportType: 'daily',
          date: new Date(),
        },
        '0 2 * * *', // 2 AM every day
      );

      // Stock level check - Every 4 hours
      await this.queueManagement.addRepeatingJob(
        QUEUE_NAMES.INVENTORY,
        JOB_NAMES.CHECK_STOCK_LEVELS,
        {
          warehouseId: 'all',
          checkType: 'scheduled',
        },
        '0 */4 * * *', // Every 4 hours
      );

      // Maintenance due check - Every day at 6 AM
      await this.queueManagement.addRepeatingJob(
        QUEUE_NAMES.MAINTENANCE,
        JOB_NAMES.CHECK_MAINTENANCE_DUE,
        {
          checkType: 'scheduled',
        },
        '0 6 * * *', // 6 AM every day
      );

      // Quality metrics calculation - Every 8 hours
      await this.queueManagement.addRepeatingJob(
        QUEUE_NAMES.QUALITY,
        JOB_NAMES.CALCULATE_QUALITY_METRICS,
        {
          period: 'daily',
          checkType: 'scheduled',
        },
        '0 */8 * * *', // Every 8 hours
      );

      // Data cleanup - Every Sunday at 3 AM
      await this.queueManagement.addRepeatingJob(
        QUEUE_NAMES.REPORTS,
        JOB_NAMES.CLEANUP_OLD_DATA,
        {
          retentionDays: 90,
        },
        '0 3 * * 0', // Sunday at 3 AM
      );

      this.logger.log('Scheduled jobs initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize scheduled jobs:', error);
    }
  }

  /**
   * Check order delays every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkOrderDelays() {
    this.logger.debug('Running scheduled order delay check');

    await this.queueManagement.addJob(
      QUEUE_NAMES.ORDERS,
      JOB_NAMES.CHECK_ORDER_DELAYS,
      {
        orderIds: [], // Will be populated by the processor
        threshold: 24, // hours
        timestamp: new Date(),
      },
    );
  }

  /**
   * Update inventory forecast every 6 hours
   */
  @Cron('0 */6 * * *')
  async updateInventoryForecasts() {
    this.logger.debug('Running scheduled inventory forecast update');

    await this.queueManagement.addJob(
      QUEUE_NAMES.INVENTORY,
      JOB_NAMES.UPDATE_INVENTORY_FORECAST,
      {
        productId: 'all',
        forecastPeriod: 30, // days
        timestamp: new Date(),
      },
    );
  }

  /**
   * Check quality alerts every 2 hours
   */
  @Cron('0 */2 * * *')
  async checkQualityAlerts() {
    this.logger.debug('Running scheduled quality alert check');

    await this.queueManagement.addJob(
      QUEUE_NAMES.QUALITY,
      JOB_NAMES.CHECK_QUALITY_ALERTS,
      {
        tenantId: 'all',
        thresholds: {
          defectRate: 5,
          scrapRate: 3,
          reworkRate: 5,
        },
        timestamp: new Date(),
      },
    );
  }

  /**
   * Clean completed jobs every day at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanCompletedJobs() {
    this.logger.debug('Cleaning completed jobs');

    const grace = 24 * 60 * 60 * 1000; // 24 hours

    for (const queueName of Object.values(QUEUE_NAMES)) {
      try {
        await this.queueManagement.cleanCompleted(queueName, grace);
      } catch (error) {
        this.logger.error(
          `Failed to clean completed jobs in ${queueName}:`,
          error,
        );
      }
    }
  }

  /**
   * Clean failed jobs every week
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanFailedJobs() {
    this.logger.debug('Cleaning failed jobs');

    const grace = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const queueName of Object.values(QUEUE_NAMES)) {
      try {
        await this.queueManagement.cleanFailed(queueName, grace);
      } catch (error) {
        this.logger.error(
          `Failed to clean failed jobs in ${queueName}:`,
          error,
        );
      }
    }
  }

  /**
   * Schedule a one-time job
   */
  async scheduleJob(
    queueName: (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES],
    jobName: (typeof JOB_NAMES)[keyof typeof JOB_NAMES],
    data: any,
    scheduledTime: Date,
  ) {
    const delay = scheduledTime.getTime() - Date.now();

    if (delay <= 0) {
      throw new Error('Scheduled time must be in the future');
    }

    const job = await this.queueManagement.addDelayedJob(
      queueName,
      jobName,
      data,
      delay,
    );

    this.logger.log(
      `Job ${jobName} scheduled for ${scheduledTime}, ID: ${job.id}`,
    );
    return job;
  }

  /**
   * Schedule a recurring job
   */
  async scheduleRecurringJob(
    queueName: (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES],
    jobName: (typeof JOB_NAMES)[keyof typeof JOB_NAMES],
    data: any,
    cronExpression: string,
  ) {
    const job = await this.queueManagement.addRepeatingJob(
      queueName,
      jobName,
      data,
      cronExpression,
    );

    this.logger.log(
      `Recurring job ${jobName} scheduled with cron ${cronExpression}, ID: ${job.id}`,
    );
    return job;
  }

  /**
   * Cancel a scheduled job
   */
  async cancelScheduledJob(
    queueName: (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES],
    jobId: string,
  ) {
    await this.queueManagement.removeJob(queueName, jobId);
    this.logger.log(`Scheduled job ${jobId} cancelled from queue ${queueName}`);
  }

  /**
   * Get scheduled jobs
   */
  async getScheduledJobs(
    queueName: (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES],
  ) {
    const delayed = await this.queueManagement.getJobsByStatus(
      queueName,
      'delayed',
    );
    const repeatable = await this.queueManagement.getRepeatableJobs(queueName);

    return {
      delayed,
      repeatable,
    };
  }
}
