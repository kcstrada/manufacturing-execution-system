import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsUUID,
  IsArray,
  IsObject,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  WasteType,
  WasteCategory,
  DisposalMethod,
} from '../../../entities/waste-record.entity';

class MaterialDetailsDto {
  @ApiProperty({ description: 'Material code', required: false })
  @IsOptional()
  @IsString()
  materialCode?: string;

  @ApiProperty({ description: 'Material name', required: false })
  @IsOptional()
  @IsString()
  materialName?: string;

  @ApiProperty({ description: 'Supplier name', required: false })
  @IsOptional()
  @IsString()
  supplier?: string;

  @ApiProperty({ description: 'Lot number', required: false })
  @IsOptional()
  @IsString()
  lot?: string;

  @ApiProperty({ description: 'Material specifications', required: false })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;
}

class EnvironmentalImpactDto {
  @ApiProperty({ description: 'CO2 equivalent in kg', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  co2Equivalent?: number;

  @ApiProperty({ description: 'Is hazardous waste', required: false })
  @IsOptional()
  @IsBoolean()
  hazardousWaste?: boolean;

  @ApiProperty({ description: 'Waste classification code', required: false })
  @IsOptional()
  @IsString()
  wasteCode?: string;

  @ApiProperty({ description: 'Treatment required', required: false })
  @IsOptional()
  @IsBoolean()
  treatmentRequired?: boolean;

  @ApiProperty({ description: 'Compliance notes', required: false })
  @IsOptional()
  @IsString()
  complianceNotes?: string;
}

export class CreateWasteRecordDto {
  @ApiProperty({ description: 'Record date' })
  @IsDateString()
  recordDate!: string;

  @ApiProperty({ enum: WasteType, default: WasteType.SCRAP })
  @IsEnum(WasteType)
  type!: WasteType;

  @ApiProperty({ enum: WasteCategory, default: WasteCategory.PRODUCTION })
  @IsEnum(WasteCategory)
  category!: WasteCategory;

  @ApiProperty({ description: 'Product ID', required: false })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ description: 'Work order ID', required: false })
  @IsOptional()
  @IsUUID()
  workOrderId?: string;

  @ApiProperty({ description: 'Equipment ID', required: false })
  @IsOptional()
  @IsUUID()
  equipmentId?: string;

  @ApiProperty({ description: 'Reported by worker ID', required: false })
  @IsOptional()
  @IsUUID()
  reportedById?: string;

  @ApiProperty({ description: 'Batch number', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  batchNumber?: string;

  @ApiProperty({ description: 'Waste quantity' })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiProperty({ description: 'Unit of measurement', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @ApiProperty({ description: 'Material cost', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  materialCost?: number;

  @ApiProperty({ description: 'Labor cost', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  laborCost?: number;

  @ApiProperty({ description: 'Overhead cost', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overheadCost?: number;

  @ApiProperty({ description: 'Disposal cost', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  disposalCost?: number;

  @ApiProperty({ description: 'Reason for waste' })
  @IsString()
  reason!: string;

  @ApiProperty({ description: 'Root cause', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  rootCause?: string;

  @ApiProperty({ description: 'Corrective action taken', required: false })
  @IsOptional()
  @IsString()
  correctiveAction?: string;

  @ApiProperty({ description: 'Preventive action for future', required: false })
  @IsOptional()
  @IsString()
  preventiveAction?: string;

  @ApiProperty({ enum: DisposalMethod, required: false })
  @IsOptional()
  @IsEnum(DisposalMethod)
  disposalMethod?: DisposalMethod;

  @ApiProperty({ description: 'Disposal date', required: false })
  @IsOptional()
  @IsDateString()
  disposalDate?: string;

  @ApiProperty({ description: 'Disposal reference number', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  disposalReference?: string;

  @ApiProperty({ description: 'Recovered value from waste', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  recoveredValue?: number;

  @ApiProperty({ description: 'Work center', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  workCenter?: string;

  @ApiProperty({ description: 'Shift', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  shift?: string;

  @ApiProperty({ description: 'Process step', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  processStep?: string;

  @ApiProperty({ description: 'Is recurring issue', default: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({ description: 'Quality inspection ID', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  qualityInspectionId?: string;

  @ApiProperty({ description: 'NCR number', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ncrNumber?: string;

  @ApiProperty({ description: 'Material details', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => MaterialDetailsDto)
  materialDetails?: MaterialDetailsDto;

  @ApiProperty({ description: 'Environmental impact', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => EnvironmentalImpactDto)
  environmentalImpact?: EnvironmentalImpactDto;

  @ApiProperty({ description: 'Image URLs', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'Attachment URLs', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordDisposalDto {
  @ApiProperty({ enum: DisposalMethod })
  @IsEnum(DisposalMethod)
  disposalMethod!: DisposalMethod;

  @ApiProperty({ description: 'Disposal date' })
  @IsDateString()
  disposalDate!: string;

  @ApiProperty({ description: 'Disposal reference number', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  disposalReference?: string;

  @ApiProperty({ description: 'Disposal cost' })
  @IsNumber()
  @Min(0)
  disposalCost!: number;

  @ApiProperty({ description: 'Recovered value', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  recoveredValue?: number;

  @ApiProperty({ description: 'Disposal notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
