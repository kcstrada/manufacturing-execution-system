import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { QueueManagementService } from './services/queue-management.service';
import { JobSchedulingService } from './services/job-scheduling.service';
import { QUEUE_NAMES, JOB_NAMES, QueueName, JobName } from './constants/queue-names';

@ApiTags('Queues')
@Controller('queues')
export class QueuesController {
  constructor(
    private readonly queueManagement: QueueManagementService,
    private readonly jobScheduling: JobSchedulingService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get statistics for all queues' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Queue statistics retrieved successfully',
  })
  async getAllQueueStats() {
    return this.queueManagement.getAllQueueStats();
  }

  @Get(':queueName/stats')
  @ApiOperation({ summary: 'Get statistics for a specific queue' })
  @ApiParam({ name: 'queueName', enum: Object.values(QUEUE_NAMES) })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Queue statistics retrieved successfully',
  })
  async getQueueStats(@Param('queueName') queueName: QueueName) {
    return this.queueManagement.getQueueStats(queueName);
  }

  @Get(':queueName/jobs')
  @ApiOperation({ summary: 'Get jobs by status from a queue' })
  @ApiParam({ name: 'queueName', enum: Object.values(QUEUE_NAMES) })
  @ApiQuery({ name: 'status', enum: ['waiting', 'active', 'completed', 'failed', 'delayed'] })
  @ApiQuery({ name: 'start', required: false, type: Number })
  @ApiQuery({ name: 'end', required: false, type: Number })
  async getJobsByStatus(
    @Param('queueName') queueName: QueueName,
    @Query('status') status: any,
    @Query('start') start?: number,
    @Query('end') end?: number,
  ) {
    return this.queueManagement.getJobsByStatus(
      queueName,
      status,
      start || 0,
      end || -1,
    );
  }

  @Get(':queueName/jobs/:jobId')
  @ApiOperation({ summary: 'Get a specific job' })
  @ApiParam({ name: 'queueName', enum: Object.values(QUEUE_NAMES) })
  @ApiParam({ name: 'jobId', type: String })
  async getJob(
    @Param('queueName') queueName: QueueName,
    @Param('jobId') jobId: string,
  ) {
    const job = await this.queueManagement.getJob(queueName, jobId);
    if (!job) {
      return { error: 'Job not found' };
    }

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      opts: job.opts,
      progress: job.progress(),
      delay: (job as any).delay,
      timestamp: job.timestamp,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      returnvalue: job.returnvalue,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
    };
  }

  @Post(':queueName/jobs')
  @ApiOperation({ summary: 'Add a job to a queue' })
  @ApiParam({ name: 'queueName', enum: Object.values(QUEUE_NAMES) })
  async addJob(
    @Param('queueName') queueName: QueueName,
    @Body() body: {
      jobName: JobName;
      data: any;
      options?: any;
    },
  ) {
    const job = await this.queueManagement.addJob(
      queueName,
      body.jobName,
      body.data,
      body.options,
    );

    return {
      success: true,
      jobId: job.id,
      queue: queueName,
      jobName: body.jobName,
    };
  }

  @Post(':queueName/jobs/delayed')
  @ApiOperation({ summary: 'Add a delayed job to a queue' })
  @ApiParam({ name: 'queueName', enum: Object.values(QUEUE_NAMES) })
  async addDelayedJob(
    @Param('queueName') queueName: QueueName,
    @Body() body: {
      jobName: JobName;
      data: any;
      delay: number;
      options?: any;
    },
  ) {
    const job = await this.queueManagement.addDelayedJob(
      queueName,
      body.jobName,
      body.data,
      body.delay,
      body.options,
    );

    return {
      success: true,
      jobId: job.id,
      queue: queueName,
      jobName: body.jobName,
      scheduledFor: new Date(Date.now() + body.delay),
    };
  }

  @Post(':queueName/jobs/recurring')
  @ApiOperation({ summary: 'Add a recurring job to a queue' })
  @ApiParam({ name: 'queueName', enum: Object.values(QUEUE_NAMES) })
  async addRecurringJob(
    @Param('queueName') queueName: QueueName,
    @Body() body: {
      jobName: JobName;
      data: any;
      cron: string;
      options?: any;
    },
  ) {
    const job = await this.queueManagement.addRepeatingJob(
      queueName,
      body.jobName,
      body.data,
      body.cron,
      body.options,
    );

    return {
      success: true,
      jobId: job.id,
      queue: queueName,
      jobName: body.jobName,
      cronExpression: body.cron,
    };
  }

  @Post(':queueName/jobs/:jobId/retry')
  @ApiOperation({ summary: 'Retry a failed job' })
  @ApiParam({ name: 'queueName', enum: Object.values(QUEUE_NAMES) })
  @ApiParam({ name: 'jobId', type: String })
  async retryJob(
    @Param('queueName') queueName: QueueName,
    @Param('jobId') jobId: string,
  ) {
    await this.queueManagement.retryJob(queueName, jobId);
    return {
      success: true,
      message: `Job ${jobId} retried successfully`,
    };
  }

  @Delete(':queueName/jobs/:jobId')
  @ApiOperation({ summary: 'Remove a job from a queue' })
  @ApiParam({ name: 'queueName', enum: Object.values(QUEUE_NAMES) })
  @ApiParam({ name: 'jobId', type: String })
  async removeJob(
    @Param('queueName') queueName: QueueName,
    @Param('jobId') jobId: string,
  ) {
    await this.queueManagement.removeJob(queueName, jobId);
    return {
      success: true,
      message: `Job ${jobId} removed successfully`,
    };
  }

  @Post(':queueName/pause')
  @ApiOperation({ summary: 'Pause a queue' })
  @ApiParam({ name: 'queueName', enum: Object.values(QUEUE_NAMES) })
  async pauseQueue(@Param('queueName') queueName: QueueName) {
    await this.queueManagement.pauseQueue(queueName);
    return {
      success: true,
      message: `Queue ${queueName} paused successfully`,
    };
  }

  @Post(':queueName/resume')
  @ApiOperation({ summary: 'Resume a paused queue' })
  @ApiParam({ name: 'queueName', enum: Object.values(QUEUE_NAMES) })
  async resumeQueue(@Param('queueName') queueName: QueueName) {
    await this.queueManagement.resumeQueue(queueName);
    return {
      success: true,
      message: `Queue ${queueName} resumed successfully`,
    };
  }

  @Post(':queueName/clean/completed')
  @ApiOperation({ summary: 'Clean completed jobs from a queue' })
  @ApiParam({ name: 'queueName', enum: Object.values(QUEUE_NAMES) })
  @ApiQuery({ name: 'grace', required: false, type: Number })
  async cleanCompleted(
    @Param('queueName') queueName: QueueName,
    @Query('grace') grace?: number,
  ) {
    const removed = await this.queueManagement.cleanCompleted(queueName, grace || 0);
    return {
      success: true,
      message: `Cleaned ${removed.length} completed jobs from ${queueName}`,
      count: removed.length,
    };
  }

  @Post(':queueName/clean/failed')
  @ApiOperation({ summary: 'Clean failed jobs from a queue' })
  @ApiParam({ name: 'queueName', enum: Object.values(QUEUE_NAMES) })
  @ApiQuery({ name: 'grace', required: false, type: Number })
  async cleanFailed(
    @Param('queueName') queueName: QueueName,
    @Query('grace') grace?: number,
  ) {
    const removed = await this.queueManagement.cleanFailed(queueName, grace || 0);
    return {
      success: true,
      message: `Cleaned ${removed.length} failed jobs from ${queueName}`,
      count: removed.length,
    };
  }

  @Delete(':queueName/empty')
  @ApiOperation({ summary: 'Empty a queue (remove all jobs)' })
  @ApiParam({ name: 'queueName', enum: Object.values(QUEUE_NAMES) })
  async emptyQueue(@Param('queueName') queueName: QueueName) {
    await this.queueManagement.emptyQueue(queueName);
    return {
      success: true,
      message: `Queue ${queueName} has been emptied`,
    };
  }

  @Get(':queueName/scheduled')
  @ApiOperation({ summary: 'Get scheduled jobs for a queue' })
  @ApiParam({ name: 'queueName', enum: Object.values(QUEUE_NAMES) })
  async getScheduledJobs(@Param('queueName') queueName: QueueName) {
    return this.jobScheduling.getScheduledJobs(
      queueName as typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES],
    );
  }

  @Post('schedule')
  @ApiOperation({ summary: 'Schedule a one-time job' })
  async scheduleJob(
    @Body() body: {
      queueName: typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];
      jobName: typeof JOB_NAMES[keyof typeof JOB_NAMES];
      data: any;
      scheduledTime: string;
    },
  ) {
    const job = await this.jobScheduling.scheduleJob(
      body.queueName,
      body.jobName,
      body.data,
      new Date(body.scheduledTime),
    );

    return {
      success: true,
      jobId: job.id,
      queue: body.queueName,
      jobName: body.jobName,
      scheduledTime: body.scheduledTime,
    };
  }

  @Post('schedule/recurring')
  @ApiOperation({ summary: 'Schedule a recurring job' })
  async scheduleRecurringJob(
    @Body() body: {
      queueName: typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];
      jobName: typeof JOB_NAMES[keyof typeof JOB_NAMES];
      data: any;
      cronExpression: string;
    },
  ) {
    const job = await this.jobScheduling.scheduleRecurringJob(
      body.queueName,
      body.jobName,
      body.data,
      body.cronExpression,
    );

    return {
      success: true,
      jobId: job.id,
      queue: body.queueName,
      jobName: body.jobName,
      cronExpression: body.cronExpression,
    };
  }

  @Delete('schedule/:queueName/:jobId')
  @ApiOperation({ summary: 'Cancel a scheduled job' })
  @ApiParam({ name: 'queueName', enum: Object.values(QUEUE_NAMES) })
  @ApiParam({ name: 'jobId', type: String })
  async cancelScheduledJob(
    @Param('queueName') queueName: typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES],
    @Param('jobId') jobId: string,
  ) {
    await this.jobScheduling.cancelScheduledJob(queueName, jobId);
    return {
      success: true,
      message: `Scheduled job ${jobId} cancelled successfully`,
    };
  }
}