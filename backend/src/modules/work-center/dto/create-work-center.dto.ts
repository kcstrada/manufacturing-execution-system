import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsObject,
  IsArray,
  MaxLength,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum WorkCenterType {
  MACHINE = 'machine',
  WORKSTATION = 'workstation',
  ASSEMBLY_LINE = 'assembly_line',
  INSPECTION = 'inspection',
  PACKING = 'packing',
  EXTERNAL = 'external',
}

export enum WorkCenterStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  BREAKDOWN = 'breakdown',
}

export class WorkCenterCapabilityDto {
  @ApiProperty({ description: 'Capability name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Capability description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Capability parameters' })
  @IsObject()
  @IsOptional()
  parameters?: Record<string, any>;
}

export class CreateWorkCenterDto {
  @ApiProperty({ description: 'Work center code', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ description: 'Work center name', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Work center description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Work center type',
    enum: WorkCenterType,
    default: WorkCenterType.WORKSTATION,
  })
  @IsEnum(WorkCenterType)
  type!: WorkCenterType;

  @ApiPropertyOptional({
    description: 'Work center status',
    enum: WorkCenterStatus,
    default: WorkCenterStatus.ACTIVE,
  })
  @IsEnum(WorkCenterStatus)
  @IsOptional()
  status?: WorkCenterStatus = WorkCenterStatus.ACTIVE;

  @ApiPropertyOptional({ description: 'Department ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Capacity per hour', minimum: 0 })
  @IsNumber()
  @Min(0)
  capacityPerHour!: number;

  @ApiPropertyOptional({
    description: 'Efficiency percentage',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  efficiencyPercentage?: number = 100;

  @ApiPropertyOptional({
    description: 'Utilization target percentage',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  utilizationTarget?: number = 85;

  @ApiPropertyOptional({ description: 'Setup cost', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  setupCost?: number;

  @ApiPropertyOptional({ description: 'Hourly rate', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  hourlyRate?: number;

  @ApiPropertyOptional({ description: 'Labor cost per hour', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  laborCostPerHour?: number;

  @ApiPropertyOptional({ description: 'Overhead cost per hour', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  overheadCostPerHour?: number;

  @ApiPropertyOptional({ description: 'Number of operators required', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  operatorsRequired?: number = 1;

  @ApiPropertyOptional({ description: 'Capabilities', type: [WorkCenterCapabilityDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkCenterCapabilityDto)
  @IsOptional()
  capabilities?: WorkCenterCapabilityDto[];

  @ApiPropertyOptional({ description: 'Required skills', type: [String] })
  @IsArray()
  @IsOptional()
  requiredSkills?: string[];

  @ApiPropertyOptional({ description: 'Supported operations', type: [String] })
  @IsArray()
  @IsOptional()
  supportedOperations?: string[];

  @ApiPropertyOptional({ description: 'Maintenance schedule' })
  @IsObject()
  @IsOptional()
  maintenanceSchedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    lastMaintenance?: Date;
    nextMaintenance?: Date;
    maintenanceHours?: number;
  };

  @ApiPropertyOptional({ description: 'Operating hours' })
  @IsObject()
  @IsOptional()
  operatingHours?: {
    monday?: { start: string; end: string };
    tuesday?: { start: string; end: string };
    wednesday?: { start: string; end: string };
    thursday?: { start: string; end: string };
    friday?: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  };

  @ApiPropertyOptional({ description: 'Equipment IDs associated with this work center' })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  equipmentIds?: string[];

  @ApiPropertyOptional({ description: 'Is bottleneck resource' })
  @IsBoolean()
  @IsOptional()
  isBottleneck?: boolean = false;

  @ApiPropertyOptional({ description: 'Allows parallel operations' })
  @IsBoolean()
  @IsOptional()
  allowsParallelOperations?: boolean = false;

  @ApiPropertyOptional({ description: 'Maximum batch size', minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxBatchSize?: number;

  @ApiPropertyOptional({ description: 'Minimum batch size', minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  minBatchSize?: number = 1;

  @ApiPropertyOptional({ description: 'Quality control checkpoint' })
  @IsBoolean()
  @IsOptional()
  isQualityCheckpoint?: boolean = false;

  @ApiPropertyOptional({ description: 'Performance metrics' })
  @IsObject()
  @IsOptional()
  performanceMetrics?: {
    oee?: number; // Overall Equipment Effectiveness
    availability?: number;
    performance?: number;
    quality?: number;
    mtbf?: number; // Mean Time Between Failures
    mttr?: number; // Mean Time To Repair
  };

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}