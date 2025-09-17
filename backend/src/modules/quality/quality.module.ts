import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClsModule } from 'nestjs-cls';
import { AuthModule } from '../../auth/auth.module';
import { QualityService } from './quality.service';
import { QualityController } from './quality.controller';
import {
  QualityMetric,
  QualityInspection,
  QualityControlPlan,
  NonConformanceReport,
} from '../../entities/quality-metric.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QualityMetric,
      QualityInspection,
      QualityControlPlan,
      NonConformanceReport,
    ]),
    EventEmitterModule,
    ClsModule,
    AuthModule,
  ],
  controllers: [QualityController],
  providers: [QualityService],
  exports: [QualityService],
})
export class QualityModule {}
