import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job, JobOptions, JobStatus } from 'bull';
import { QUEUE_NAMES, QueueName, JobName } from '../constants/queue-names';

@Injectable()
export class QueueManagementService {
  private readonly logger = new Logger(QueueManagementService.name);
  private readonly queues = new Map<string, Queue>();

  constructor(
    @InjectQueue(QUEUE_NAMES.ORDERS) private ordersQueue: Queue,
    @InjectQueue(QUEUE_NAMES.INVENTORY) private inventoryQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS) private notificationsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.REPORTS) private reportsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.MAINTENANCE) private maintenanceQueue: Queue,
    @InjectQueue(QUEUE_NAMES.QUALITY) private qualityQueue: Queue,
  ) {
    // Register all queues
    this.queues.set(QUEUE_NAMES.ORDERS, ordersQueue);
    this.queues.set(QUEUE_NAMES.INVENTORY, inventoryQueue);
    this.queues.set(QUEUE_NAMES.NOTIFICATIONS, notificationsQueue);
    this.queues.set(QUEUE_NAMES.REPORTS, reportsQueue);
    this.queues.set(QUEUE_NAMES.MAINTENANCE, maintenanceQueue);
    this.queues.set(QUEUE_NAMES.QUALITY, qualityQueue);
  }

  /**
   * Add a job to a queue
   */
  async addJob<T = any>(
    queueName: QueueName,
    jobName: JobName,
    data: T,
    options?: JobOptions,
  ): Promise<Job<T>> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      const job = await queue.add(jobName, data, {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        ...options,
      });

      this.logger.log(`Job ${jobName} added to queue ${queueName}, ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to add job to queue ${queueName}:`, error);
      throw error;
    }
  }

  /**
   * Add a delayed job
   */
  async addDelayedJob<T = any>(
    queueName: QueueName,
    jobName: JobName,
    data: T,
    delay: number,
    options?: JobOptions,
  ): Promise<Job<T>> {
    return this.addJob(queueName, jobName, data, { ...options, delay });
  }

  /**
   * Add a repeating job
   */
  async addRepeatingJob<T = any>(
    queueName: QueueName,
    jobName: JobName,
    data: T,
    cron: string,
    options?: JobOptions,
  ): Promise<Job<T>> {
    return this.addJob(queueName, jobName, data, { 
      ...options, 
      repeat: { cron } 
    });
  }

  /**
   * Add a priority job
   */
  async addPriorityJob<T = any>(
    queueName: QueueName,
    jobName: JobName,
    data: T,
    priority: number,
    options?: JobOptions,
  ): Promise<Job<T>> {
    return this.addJob(queueName, jobName, data, { ...options, priority });
  }

  /**
   * Get job by ID
   */
  async getJob(queueName: QueueName, jobId: string): Promise<Job | null> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.getJob(jobId);
  }

  /**
   * Get jobs by status
   */
  async getJobsByStatus(
    queueName: QueueName,
    status: JobStatus | JobStatus[],
    start = 0,
    end = -1,
  ): Promise<Job[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const statuses = Array.isArray(status) ? status : [status];
    const jobs: Job[] = [];

    for (const s of statuses) {
      const jobsForStatus = await queue.getJobs([s], start, end);
      jobs.push(...jobsForStatus);
    }

    return jobs;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: QueueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
    ] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.isPaused(),
    ]);

    return {
      name: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
      total: waiting + active + completed + failed + delayed,
    };
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats() {
    const stats = [];
    for (const [name] of this.queues) {
      const queueStats = await this.getQueueStats(name as QueueName);
      stats.push(queueStats);
    }
    return stats;
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueName: QueueName, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.retry();
      this.logger.log(`Job ${jobId} retried in queue ${queueName}`);
    }
  }

  /**
   * Remove a job
   */
  async removeJob(queueName: QueueName, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      this.logger.log(`Job ${jobId} removed from queue ${queueName}`);
    }
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: QueueName): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    this.logger.log(`Queue ${queueName} paused`);
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: QueueName): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    this.logger.log(`Queue ${queueName} resumed`);
  }

  /**
   * Clean completed jobs
   */
  async cleanCompleted(queueName: QueueName, grace = 0): Promise<Job[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const removed = await queue.clean(grace, 'completed');
    this.logger.log(`Cleaned ${removed.length} completed jobs from queue ${queueName}`);
    return removed;
  }

  /**
   * Clean failed jobs
   */
  async cleanFailed(queueName: QueueName, grace = 0): Promise<Job[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const removed = await queue.clean(grace, 'failed');
    this.logger.log(`Cleaned ${removed.length} failed jobs from queue ${queueName}`);
    return removed;
  }

  /**
   * Empty a queue
   */
  async emptyQueue(queueName: QueueName): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.empty();
    this.logger.warn(`Queue ${queueName} has been emptied`);
  }

  /**
   * Get repeatable jobs
   */
  async getRepeatableJobs(queueName: QueueName): Promise<any[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.getRepeatableJobs();
  }

  /**
   * Remove repeatable job
   */
  async removeRepeatableJob(
    queueName: QueueName,
    name: string,
    repeat: any,
  ): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.removeRepeatableByKey(`${name}:${repeat.key}`);
    this.logger.log(`Repeatable job ${name} removed from queue ${queueName}`);
  }
}