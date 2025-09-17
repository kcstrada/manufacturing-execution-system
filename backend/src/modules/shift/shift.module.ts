import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from '../../auth/auth.module';
import { WorkerModule } from '../worker/worker.module';
import { ShiftSchedulingController } from './shift-scheduling.controller';
import { ShiftSchedulingService } from './shift-scheduling.service';
import {
  Shift,
  ShiftAssignment,
  ShiftException,
  ProductionCalendar,
} from '../../entities/shift.entity';
import { Worker } from '../../entities/worker.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shift,
      ShiftAssignment,
      ShiftException,
      ProductionCalendar,
      Worker,
    ]),
    EventEmitterModule.forRoot(),
    AuthModule,
    WorkerModule,
  ],
  controllers: [ShiftSchedulingController],
  providers: [ShiftSchedulingService],
  exports: [ShiftSchedulingService],
})
export class ShiftModule {}
