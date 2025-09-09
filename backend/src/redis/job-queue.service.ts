import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue, Job, JobOptions, JobStatus } from 'bull';
import { ConfigService } from '@nestjs/config';

/**
 * Service for managing job queues
 */
@Injectable()
export class JobQueueService implements OnModuleInit {
  private readonly logger = new Logger(JobQueueService.name);
  private queues: Map<string, Queue> = new Map();

  constructor(
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Initialize default queues
    await this.registerQueue('default');
    await this.registerQueue('email');
    await this.registerQueue('notifications');
    await this.registerQueue('data-processing');
    await this.registerQueue('reports');
  }

  /**
   * Register a new queue
   */
  async registerQueue(name: string): Promise<Queue> {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    try {
      // Note: In a real implementation, you would use @InjectQueue
      // This is a simplified version for demonstration
      this.logger.log(`Registered queue: ${name}`);
      // Store a placeholder for now
      this.queues.set(name, {} as Queue);
      return this.queues.get(name)!;
    } catch (error) {
      this.logger.error(`Failed to register queue ${name}:`, error);
      throw error;
    }
  }

  /**
   * Add a job to a queue
   */
  async addJob<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    options?: JobOptions,
  ): Promise<Job<T>> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      const job = await queue.add(jobName, data, {
        removeOnComplete: this.configService.get('BULL_REMOVE_ON_COMPLETE', true),
        removeOnFail: this.configService.get('BULL_REMOVE_ON_FAIL', false),
        attempts: this.configService.get('BULL_RETRY_ATTEMPTS', 3),
        backoff: {
          type: 'exponential',
          delay: this.configService.get('BULL_RETRY_DELAY', 5000),
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
    queueName: string,
    jobName: string,
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
    queueName: string,
    jobName: string,
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
   * Get job by ID
   */
  async getJob(queueName: string, jobId: string): Promise<Job | null> {
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
    queueName: string,
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
   * Remove a job
   */
  async removeJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.remove();
      this.logger.log(`Job ${jobId} removed from queue ${queueName}`);
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.getJob(queueName, jobId);
    if (job) {
      await job.retry();
      this.logger.log(`Job ${jobId} retried in queue ${queueName}`);
    }
  }

  /**
   * Clean completed jobs
   */
  async cleanCompleted(queueName: string, grace = 0): Promise<Job[]> {
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
  async cleanFailed(queueName: string, grace = 0): Promise<Job[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const removed = await queue.clean(grace, 'failed');
    this.logger.log(`Cleaned ${removed.length} failed jobs from queue ${queueName}`);
    return removed;
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: string): Promise<void> {
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
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    this.logger.log(`Queue ${queueName} resumed`);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(queueName: string) {
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
      const queueStats = await this.getQueueStats(name);
      stats.push(queueStats);
    }
    return stats;
  }

  /**
   * Empty a queue
   */
  async emptyQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.empty();
    this.logger.warn(`Queue ${queueName} has been emptied`);
  }

  /**
   * Close a queue
   */
  async closeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.close();
    this.queues.delete(queueName);
    this.logger.log(`Queue ${queueName} closed`);
  }

  /**
   * Close all queues
   */
  async closeAllQueues(): Promise<void> {
    for (const [name, queue] of this.queues) {
      await queue.close();
      this.logger.log(`Queue ${name} closed`);
    }
    this.queues.clear();
  }
}