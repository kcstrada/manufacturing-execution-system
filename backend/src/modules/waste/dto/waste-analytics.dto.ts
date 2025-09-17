import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import {
  WasteType,
  WasteCategory,
} from '../../../entities/waste-record.entity';

export class WasteAnalyticsDto {
  @IsDateString()
  startDate!: Date;

  @IsDateString()
  endDate!: Date;

  @IsOptional()
  @IsEnum(['type', 'category', 'product', 'equipment', 'shift'])
  groupBy?: string;

  @IsOptional()
  @IsEnum(WasteType)
  type?: WasteType;

  @IsOptional()
  @IsEnum(WasteCategory)
  category?: WasteCategory;

  @IsOptional()
  productId?: string;

  @IsOptional()
  equipmentId?: string;

  @IsOptional()
  shift?: string;
}
