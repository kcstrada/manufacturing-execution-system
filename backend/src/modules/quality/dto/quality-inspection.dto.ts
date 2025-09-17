import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  InspectionType,
  InspectionResult,
  DefectSeverity,
} from '../../../entities/quality-metric.entity';

export class MeasurementDto {
  @ApiProperty({ description: 'Measurement name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Measured value' })
  @IsNumber()
  value!: number;

  @ApiProperty({ description: 'Unit of measurement' })
  @IsString()
  unit!: string;

  @ApiPropertyOptional({ description: 'Target value' })
  @IsNumber()
  @IsOptional()
  targetValue?: number;

  @ApiPropertyOptional({ description: 'Minimum acceptable value' })
  @IsNumber()
  @IsOptional()
  minValue?: number;

  @ApiPropertyOptional({ description: 'Maximum acceptable value' })
  @IsNumber()
  @IsOptional()
  maxValue?: number;

  @ApiProperty({ description: 'Pass/Fail status' })
  @IsBoolean()
  passed!: boolean;
}

export class DefectDto {
  @ApiProperty({ description: 'Defect code' })
  @IsString()
  code!: string;

  @ApiProperty({ description: 'Defect description' })
  @IsString()
  description!: string;

  @ApiProperty({ description: 'Quantity affected', minimum: 0 })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiProperty({
    description: 'Severity',
    enum: DefectSeverity,
  })
  @IsEnum(DefectSeverity)
  severity!: DefectSeverity;

  @ApiPropertyOptional({ description: 'Location of defect' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Corrective action taken' })
  @IsString()
  @IsOptional()
  correctiveAction?: string;
}

export class CreateQualityInspectionDto {
  @ApiProperty({ description: 'Inspection number', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  inspectionNumber!: string;

  @ApiProperty({
    description: 'Inspection type',
    enum: InspectionType,
  })
  @IsEnum(InspectionType)
  type!: InspectionType;

  @ApiProperty({ description: 'Product ID', format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional({ description: 'Work order ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  workOrderId?: string;

  @ApiPropertyOptional({ description: 'Production order ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  productionOrderId?: string;

  @ApiPropertyOptional({ description: 'Lot number' })
  @IsString()
  @IsOptional()
  lotNumber?: string;

  @ApiProperty({ description: 'Sample size', minimum: 1 })
  @IsNumber()
  @Min(1)
  sampleSize!: number;

  @ApiProperty({ description: 'Batch size', minimum: 1 })
  @IsNumber()
  @Min(1)
  batchSize!: number;

  @ApiProperty({ description: 'Inspection date' })
  @IsDateString()
  inspectionDate!: Date;

  @ApiProperty({ description: 'Inspector ID', format: 'uuid' })
  @IsUUID()
  inspectorId!: string;

  @ApiPropertyOptional({ description: 'Inspection checklist' })
  @IsArray()
  @IsOptional()
  checklist?: string[];

  @ApiPropertyOptional({ description: 'Measurements', type: [MeasurementDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeasurementDto)
  @IsOptional()
  measurements?: MeasurementDto[];

  @ApiPropertyOptional({ description: 'Defects found', type: [DefectDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DefectDto)
  @IsOptional()
  defects?: DefectDto[];

  @ApiPropertyOptional({ description: 'Comments' })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiPropertyOptional({ description: 'Attachments' })
  @IsArray()
  @IsOptional()
  attachments?: string[];
}

export class UpdateInspectionResultDto {
  @ApiProperty({
    description: 'Inspection result',
    enum: InspectionResult,
  })
  @IsEnum(InspectionResult)
  result!: InspectionResult;

  @ApiProperty({ description: 'Quantity passed', minimum: 0 })
  @IsNumber()
  @Min(0)
  quantityPassed!: number;

  @ApiProperty({ description: 'Quantity failed', minimum: 0 })
  @IsNumber()
  @Min(0)
  quantityFailed!: number;

  @ApiPropertyOptional({ description: 'Defects found', type: [DefectDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DefectDto)
  @IsOptional()
  defects?: DefectDto[];

  @ApiPropertyOptional({ description: 'Corrective actions' })
  @IsString()
  @IsOptional()
  correctiveActions?: string;

  @ApiPropertyOptional({ description: 'Follow-up required' })
  @IsBoolean()
  @IsOptional()
  followUpRequired?: boolean;

  @ApiPropertyOptional({ description: 'Comments' })
  @IsString()
  @IsOptional()
  comments?: string;
}

export class QualityMetricsDto {
  @ApiProperty({ description: 'Time period start' })
  @IsDateString()
  startDate!: Date;

  @ApiProperty({ description: 'Time period end' })
  @IsDateString()
  endDate!: Date;

  @ApiPropertyOptional({ description: 'Product ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ description: 'Work center ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  workCenterId?: string;

  @ApiPropertyOptional({ description: 'Group by field' })
  @IsString()
  @IsOptional()
  groupBy?: string;
}
