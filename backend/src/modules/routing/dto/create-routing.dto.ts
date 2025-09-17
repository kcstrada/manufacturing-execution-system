import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsArray,
  ValidateNested,
  IsDateString,
  Min,
  Max,
  MaxLength,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RoutingStatus } from '../../../entities/routing.entity';
import { StepType, StepStatus } from '../../../entities/production-step.entity';

export class CreateProductionStepDto {
  @ApiProperty({ description: 'Step code', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  stepCode!: string;

  @ApiProperty({ description: 'Step name', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Step description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Step type',
    enum: StepType,
    default: StepType.OPERATION,
  })
  @IsEnum(StepType)
  @IsOptional()
  type?: StepType = StepType.OPERATION;

  @ApiPropertyOptional({
    description: 'Step status',
    enum: StepStatus,
    default: StepStatus.DRAFT,
  })
  @IsEnum(StepStatus)
  @IsOptional()
  status?: StepStatus = StepStatus.DRAFT;

  @ApiProperty({ description: 'Sequence number' })
  @IsNumber()
  sequenceNumber!: number;

  @ApiPropertyOptional({ description: 'Work center ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  workCenterId?: string;

  @ApiPropertyOptional({
    description: 'Alternate work center ID',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  alternateWorkCenterId?: string;

  @ApiProperty({ description: 'Setup time in minutes', minimum: 0 })
  @IsNumber()
  @Min(0)
  setupTime!: number;

  @ApiProperty({ description: 'Run time per unit in minutes', minimum: 0 })
  @IsNumber()
  @Min(0)
  runTime!: number;

  @ApiPropertyOptional({ description: 'Wait time in minutes', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  waitTime?: number = 0;

  @ApiPropertyOptional({ description: 'Move time in minutes', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  moveTime?: number = 0;

  @ApiPropertyOptional({ description: 'Batch size', minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  batchSize?: number = 1;

  @ApiPropertyOptional({ description: 'Crew size', minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  crewSize?: number = 1;

  @ApiPropertyOptional({
    description: 'Yield percentage',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  yieldPercentage?: number = 100;

  @ApiPropertyOptional({
    description: 'Scrap percentage',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  scrapPercentage?: number = 0;

  @ApiPropertyOptional({ description: 'Instructions as JSON' })
  @IsObject()
  @IsOptional()
  instructions?: {
    setup?: string[];
    operation?: string[];
    safety?: string[];
    quality?: string[];
  };

  @ApiPropertyOptional({ description: 'Required tools' })
  @IsArray()
  @IsOptional()
  requiredTools?: any[];

  @ApiPropertyOptional({ description: 'Required skills' })
  @IsArray()
  @IsOptional()
  requiredSkills?: any[];

  @ApiPropertyOptional({ description: 'Materials' })
  @IsArray()
  @IsOptional()
  materials?: any[];

  @ApiPropertyOptional({ description: 'Quality checks' })
  @IsArray()
  @IsOptional()
  qualityChecks?: any[];

  @ApiPropertyOptional({ description: 'Parameters' })
  @IsArray()
  @IsOptional()
  parameters?: any[];

  @ApiPropertyOptional({ description: 'Validation rules' })
  @IsArray()
  @IsOptional()
  validationRules?: any[];

  @ApiPropertyOptional({ description: 'Media files' })
  @IsArray()
  @IsOptional()
  mediaFiles?: any[];

  @ApiPropertyOptional({ description: 'Is critical step' })
  @IsBoolean()
  @IsOptional()
  isCritical?: boolean = false;

  @ApiPropertyOptional({ description: 'Is bottleneck' })
  @IsBoolean()
  @IsOptional()
  isBottleneck?: boolean = false;

  @ApiPropertyOptional({ description: 'Can be parallel' })
  @IsBoolean()
  @IsOptional()
  canBeParallel?: boolean = false;

  @ApiPropertyOptional({ description: 'Requires approval' })
  @IsBoolean()
  @IsOptional()
  requiresApproval?: boolean = false;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Documents' })
  @IsObject()
  @IsOptional()
  documents?: {
    workInstructions?: string[];
    drawings?: string[];
    videos?: string[];
    sops?: string[];
  };
}

export class CreateRoutingDto {
  @ApiProperty({ description: 'Product ID for this routing', format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Routing name', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Routing description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Routing status',
    enum: RoutingStatus,
    default: RoutingStatus.DRAFT,
  })
  @IsEnum(RoutingStatus)
  @IsOptional()
  status?: RoutingStatus = RoutingStatus.DRAFT;

  @ApiProperty({ description: 'Effective date' })
  @IsDateString()
  effectiveDate!: Date;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsDateString()
  @IsOptional()
  expiryDate?: Date;

  @ApiPropertyOptional({ description: 'Is this the default routing' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean = false;

  @ApiPropertyOptional({
    description: 'Expected yield percentage',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  expectedYield?: number = 100;

  @ApiPropertyOptional({
    description: 'Total setup time in minutes',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalSetupTimeMinutes?: number = 0;

  @ApiPropertyOptional({
    description: 'Total run time per unit in minutes',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalRunTimePerUnitMinutes?: number = 0;

  @ApiPropertyOptional({ description: 'Total cost per unit', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalCostPerUnit?: number = 0;

  @ApiPropertyOptional({
    description: 'Production steps',
    type: [CreateProductionStepDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductionStepDto)
  @IsOptional()
  steps?: CreateProductionStepDto[];

  @ApiPropertyOptional({ description: 'Alternate routes' })
  @IsArray()
  @IsOptional()
  alternateRoutes?: any[];

  @ApiPropertyOptional({ description: 'Notes' })
  @IsObject()
  @IsOptional()
  notes?: Record<string, any>;
}
