import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsObject,
  IsArray,
  IsUUID,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  MetricType,
  InspectionResult,
  DefectSeverity,
  InspectionType,
} from '../../../entities/quality-metric.entity';

export class CreateQualityMetricDto {
  @ApiProperty({ description: 'Unique metric code' })
  @IsString()
  @MaxLength(50)
  metricCode!: string;

  @ApiProperty({ description: 'Metric name' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'Metric description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: MetricType, default: MetricType.DIMENSION })
  @IsEnum(MetricType)
  type!: MetricType;

  @ApiProperty({ description: 'Unit of measurement', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @ApiProperty({ description: 'Target value', required: false })
  @IsOptional()
  @IsNumber()
  targetValue?: number;

  @ApiProperty({ description: 'Minimum acceptable value', required: false })
  @IsOptional()
  @IsNumber()
  minValue?: number;

  @ApiProperty({ description: 'Maximum acceptable value', required: false })
  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @ApiProperty({ description: 'Tolerance', required: false })
  @IsOptional()
  @IsNumber()
  tolerance?: number;

  @ApiProperty({ description: 'Is critical metric', default: true })
  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;

  @ApiProperty({ description: 'Product ID', required: false })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ description: 'Inspection method details', required: false })
  @IsOptional()
  @IsObject()
  inspectionMethod?: {
    tools?: string[];
    procedure?: string[];
    frequency?: string;
    sampleSize?: number;
  };

  @ApiProperty({ description: 'Acceptance criteria', required: false })
  @IsOptional()
  @IsObject()
  acceptanceCriteria?: {
    visualDefects?: string[];
    functionalTests?: string[];
    measurements?: {
      parameter: string;
      min: number;
      max: number;
      unit: string;
    }[];
  };

  @ApiProperty({
    description: 'Sampling frequency (1 = every item)',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  samplingFrequency?: number;

  @ApiProperty({ description: 'Reference standard', required: false })
  @IsOptional()
  @IsString()
  referenceStandard?: string;
}

class MeasurementDto {
  @ApiProperty({ description: 'Metric ID' })
  @IsUUID()
  metricId!: string;

  @ApiProperty({ description: 'Metric name' })
  @IsString()
  metricName!: string;

  @ApiProperty({ description: 'Target value', required: false })
  @IsOptional()
  @IsNumber()
  targetValue?: number;

  @ApiProperty({ description: 'Actual measured value' })
  @IsNumber()
  actualValue!: number;

  @ApiProperty({ description: 'Unit of measurement', required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ description: 'Pass/fail status' })
  @IsBoolean()
  passed!: boolean;
}

class DefectDto {
  @ApiProperty({ description: 'Defect code' })
  @IsString()
  code!: string;

  @ApiProperty({ description: 'Defect description' })
  @IsString()
  description!: string;

  @ApiProperty({ enum: DefectSeverity })
  @IsEnum(DefectSeverity)
  severity!: DefectSeverity;

  @ApiProperty({ description: 'Quantity of defects' })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiProperty({ description: 'Location of defect', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Image URLs', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class CreateQualityInspectionDto {
  @ApiProperty({ description: 'Inspection number' })
  @IsString()
  @MaxLength(50)
  inspectionNumber!: string;

  @ApiProperty({ enum: InspectionType, default: InspectionType.IN_PROCESS })
  @IsEnum(InspectionType)
  type!: InspectionType;

  @ApiProperty({ description: 'Inspection date' })
  @IsDateString()
  inspectionDate!: string;

  @ApiProperty({ description: 'Metric ID' })
  @IsUUID()
  metricId!: string;

  @ApiProperty({ description: 'Work order ID', required: false })
  @IsOptional()
  @IsUUID()
  workOrderId?: string;

  @ApiProperty({ description: 'Production order ID', required: false })
  @IsOptional()
  @IsUUID()
  productionOrderId?: string;

  @ApiProperty({ description: 'Product ID', required: false })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ description: 'Work center ID', required: false })
  @IsOptional()
  @IsUUID()
  workCenterId?: string;

  @ApiProperty({ description: 'Inspector ID' })
  @IsUUID()
  inspectorId!: string;

  @ApiProperty({ description: 'Batch number', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  batchNumber?: string;

  @ApiProperty({ description: 'Sample size', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  sampleSize?: number;

  @ApiProperty({ description: 'Number of defective items', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defectiveQuantity?: number;

  @ApiProperty({ enum: InspectionResult, default: InspectionResult.PASS })
  @IsEnum(InspectionResult)
  result!: InspectionResult;

  @ApiProperty({ description: 'Measurements', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeasurementDto)
  measurements?: MeasurementDto[];

  @ApiProperty({ description: 'Defects found', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DefectDto)
  defects?: DefectDto[];

  @ApiProperty({ description: 'Inspection notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Corrective action taken', required: false })
  @IsOptional()
  @IsString()
  correctiveAction?: string;

  @ApiProperty({ description: 'Image URLs', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'Requires review', default: false })
  @IsOptional()
  @IsBoolean()
  requiresReview?: boolean;
}

export class CreateQualityControlPlanDto {
  @ApiProperty({ description: 'Plan code' })
  @IsString()
  @MaxLength(50)
  planCode!: string;

  @ApiProperty({ description: 'Plan name' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'Plan description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Version number' })
  @IsNumber()
  @Min(1)
  version!: number;

  @ApiProperty({ description: 'Effective date' })
  @IsDateString()
  effectiveDate!: string;

  @ApiProperty({ description: 'Expiry date', required: false })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Inspection points', required: false })
  @IsOptional()
  @IsArray()
  inspectionPoints?: {
    stage: string;
    description: string;
    metrics: string[];
    frequency: string;
    responsibility: string;
  }[];

  @ApiProperty({ description: 'Sampling plan', required: false })
  @IsOptional()
  @IsArray()
  samplingPlan?: {
    lotSize: { min: number; max: number };
    sampleSize: number;
    acceptanceNumber: number;
    rejectionNumber: number;
  }[];

  @ApiProperty({ description: 'Documentation references', required: false })
  @IsOptional()
  @IsObject()
  documentation?: {
    procedures?: string[];
    workInstructions?: string[];
    forms?: string[];
    standards?: string[];
  };
}

export class CreateNonConformanceReportDto {
  @ApiProperty({ description: 'Report number' })
  @IsString()
  @MaxLength(50)
  reportNumber!: string;

  @ApiProperty({ description: 'Report date' })
  @IsDateString()
  reportDate!: string;

  @ApiProperty({ description: 'Report title' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ description: 'Detailed description' })
  @IsString()
  description!: string;

  @ApiProperty({ enum: DefectSeverity, default: DefectSeverity.MAJOR })
  @IsEnum(DefectSeverity)
  severity!: DefectSeverity;

  @ApiProperty({ description: 'Source of non-conformance', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  source?: string;

  @ApiProperty({ description: 'Affected items', required: false })
  @IsOptional()
  @IsArray()
  affectedItems?: {
    type: 'product' | 'material' | 'process';
    id: string;
    name: string;
    quantity?: number;
    batchNumbers?: string[];
  }[];

  @ApiProperty({ description: 'Reported by user ID', required: false })
  @IsOptional()
  @IsUUID()
  reportedById?: string;

  @ApiProperty({ description: 'Assigned to user ID', required: false })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiProperty({ description: 'Target close date', required: false })
  @IsOptional()
  @IsDateString()
  targetCloseDate?: string;

  @ApiProperty({ description: 'Immediate action taken', required: false })
  @IsOptional()
  @IsString()
  immediateAction?: string;

  @ApiProperty({ description: 'Estimated cost', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @ApiProperty({ description: 'Attachments', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class ReviewInspectionDto {
  @ApiProperty({ description: 'Review notes' })
  @IsString()
  reviewNotes!: string;

  @ApiProperty({ description: 'Reviewer ID' })
  @IsUUID()
  reviewedBy!: string;
}

export class CloseNonConformanceDto {
  @ApiProperty({ description: 'Root cause analysis' })
  @IsString()
  rootCause!: string;

  @ApiProperty({ description: 'Corrective action taken' })
  @IsString()
  correctiveAction!: string;

  @ApiProperty({ description: 'Preventive action for future' })
  @IsString()
  preventiveAction!: string;

  @ApiProperty({ description: 'Actual cost incurred' })
  @IsNumber()
  @Min(0)
  actualCost!: number;

  @ApiProperty({ description: 'Closure notes' })
  @IsString()
  closureNotes!: string;

  @ApiProperty({ description: 'Closed by user ID' })
  @IsUUID()
  closedById!: string;
}
