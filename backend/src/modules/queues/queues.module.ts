import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Queue Names
import { QUEUE_NAMES } from './constants/queue-names';

// Processors
import { OrderProcessor } from './processors/order.processor';
import { InventoryProcessor } from './processors/inventory.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { ReportProcessor } from './processors/report.processor';
import { MaintenanceProcessor } from './processors/maintenance.processor';
import { QualityProcessor } from './processors/quality.processor';

// Services
import { QueueManagementService } from './services/queue-management.service';
import { JobSchedulingService } from './services/job-scheduling.service';

// Controller
import { QueuesController } from './queues.controller';

@Global()
@Module({
  imports: [
    // Register Bull module with Redis configuration
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          removeOnComplete: configService.get('BULL_REMOVE_ON_COMPLETE', 100),
          removeOnFail: configService.get('BULL_REMOVE_ON_FAIL', 50),
          attempts: configService.get('BULL_RETRY_ATTEMPTS', 3),
          backoff: {
            type: 'exponential',
            delay: configService.get('BULL_RETRY_DELAY', 5000),
          },
        },
      }),
      inject: [ConfigService],
    }),

    // Register individual queues
    BullModule.registerQueue(
      { name: QUEUE_NAMES.ORDERS },
      { name: QUEUE_NAMES.INVENTORY },
      { name: QUEUE_NAMES.NOTIFICATIONS },
      { name: QUEUE_NAMES.REPORTS },
      { name: QUEUE_NAMES.MAINTENANCE },
      { name: QUEUE_NAMES.QUALITY },
    ),
  ],
  providers: [
    // Processors
    OrderProcessor,
    InventoryProcessor,
    NotificationProcessor,
    ReportProcessor,
    MaintenanceProcessor,
    QualityProcessor,
    
    // Services
    QueueManagementService,
    JobSchedulingService,
  ],
  controllers: [QueuesController],
  exports: [QueueManagementService, JobSchedulingService],
})
export class QueuesModule {}