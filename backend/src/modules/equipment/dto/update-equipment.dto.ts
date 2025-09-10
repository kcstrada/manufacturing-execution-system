import { PartialType } from '@nestjs/swagger';
import { CreateEquipmentDto, CreateMaintenanceScheduleDto } from './create-equipment.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { EquipmentStatus, MaintenanceStatus } from '../../../entities/equipment.entity';

export class UpdateEquipmentDto extends PartialType(CreateEquipmentDto) {
  @ApiProperty({ enum: EquipmentStatus, required: false })
  @IsOptional()
  @IsEnum(EquipmentStatus)
  override status?: EquipmentStatus;
}

export class UpdateMaintenanceScheduleDto extends PartialType(CreateMaintenanceScheduleDto) {
  @ApiProperty({ enum: MaintenanceStatus, required: false })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;
}