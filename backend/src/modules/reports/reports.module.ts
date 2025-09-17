import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { AuthModule } from '../../auth/auth.module';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { CustomerOrder } from '../../entities/customer-order.entity';
import { WorkOrder } from '../../entities/work-order.entity';
import { Task } from '../../entities/task.entity';
import { Worker } from '../../entities/worker.entity';
import { Product } from '../../entities/product.entity';
import { Inventory } from '../../entities/inventory.entity';
import { QualityMetric } from '../../entities/quality-metric.entity';
import { Equipment } from '../../entities/equipment.entity';
import { WasteRecord } from '../../entities/waste-record.entity';
import { TimeClockSession } from '../../entities/time-clock.entity';
import { ProductionOrder } from '../../entities/production-order.entity';

@Module({
  imports: [
    AuthModule,
    ClsModule,
    TypeOrmModule.forFeature([
      CustomerOrder,
      WorkOrder,
      Task,
      Worker,
      Product,
      Inventory,
      QualityMetric,
      Equipment,
      WasteRecord,
      TimeClockSession,
      ProductionOrder,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
