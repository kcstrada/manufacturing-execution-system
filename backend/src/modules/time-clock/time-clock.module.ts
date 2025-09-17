import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from '../../auth/auth.module';
import { TimeClockController } from './time-clock.controller';
import { TimeClockService } from './time-clock.service';
import {
  TimeClockEntry,
  TimeClockSession,
  TimeClockRule,
} from '../../entities/time-clock.entity';
import { Worker } from '../../entities/worker.entity';
import { ShiftAssignment } from '../../entities/shift.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TimeClockEntry,
      TimeClockSession,
      TimeClockRule,
      Worker,
      ShiftAssignment,
    ]),
    EventEmitterModule.forRoot(),
    AuthModule,
  ],
  controllers: [TimeClockController],
  providers: [TimeClockService],
  exports: [TimeClockService],
})
export class TimeClockModule {}
