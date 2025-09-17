import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ClsModule } from 'nestjs-cls';
import { AuthModule } from '../../auth/auth.module';
import { EquipmentService } from './equipment.service';
import { EquipmentController } from './equipment.controller';
import {
  Equipment,
  MaintenanceSchedule,
  MaintenanceRecord,
} from '../../entities/equipment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Equipment,
      MaintenanceSchedule,
      MaintenanceRecord,
    ]),
    EventEmitterModule,
    ClsModule,
    AuthModule,
  ],
  controllers: [EquipmentController],
  providers: [EquipmentService],
  exports: [EquipmentService],
})
export class EquipmentModule {}
