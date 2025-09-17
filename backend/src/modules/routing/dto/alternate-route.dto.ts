import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsObject,
  IsArray,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateAlternateRouteDto {
  @ApiProperty({ description: 'Routing ID', format: 'uuid' })
  @IsUUID()
  routingId!: string;

  @ApiProperty({ description: 'Alternate routing name', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  alternateRoutingName!: string;

  @ApiProperty({ description: 'Reason for alternate', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  reason!: string;

  @ApiProperty({ description: 'Preference order', minimum: 1 })
  @IsNumber()
  @Min(1)
  preferenceOrder!: number;

  @ApiPropertyOptional({ description: 'Conditions for use', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  conditions?: string;

  @ApiProperty({ description: 'Setup time in minutes', minimum: 0 })
  @IsNumber()
  @Min(0)
  setupTimeMinutes!: number;

  @ApiProperty({ description: 'Run time per unit in minutes', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  runTimePerUnitMinutes!: number;

  @ApiProperty({ description: 'Cost per unit', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPerUnit!: number;

  @ApiProperty({
    description: 'Yield percentage',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  yieldPercentage!: number;

  @ApiPropertyOptional({ description: 'Required work centers', type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  requiredWorkCenters?: string[];

  @ApiPropertyOptional({ description: 'Required skills', type: [String] })
  @IsArray()
  @IsOptional()
  requiredSkills?: string[];

  @ApiPropertyOptional({ description: 'Capacity required', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  capacityRequired?: number;

  @ApiPropertyOptional({ description: 'Notes', maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

export class UpdateAlternateRouteDto {
  @ApiPropertyOptional({ description: 'Alternate routing name' })
  @IsString()
  @IsOptional()
  alternateRoutingName?: string;

  @ApiPropertyOptional({ description: 'Reason for alternate' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: 'Preference order', minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  preferenceOrder?: number;

  @ApiPropertyOptional({ description: 'Conditions for use' })
  @IsString()
  @IsOptional()
  conditions?: string;

  @ApiPropertyOptional({ description: 'Setup time in minutes', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  setupTimeMinutes?: number;

  @ApiPropertyOptional({
    description: 'Run time per unit in minutes',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  runTimePerUnitMinutes?: number;

  @ApiPropertyOptional({ description: 'Cost per unit', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  costPerUnit?: number;

  @ApiPropertyOptional({
    description: 'Yield percentage',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @IsOptional()
  yieldPercentage?: number;

  @ApiPropertyOptional({ description: 'Required work centers' })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  requiredWorkCenters?: string[];

  @ApiPropertyOptional({ description: 'Required skills' })
  @IsArray()
  @IsOptional()
  requiredSkills?: string[];

  @ApiPropertyOptional({ description: 'Performance metrics' })
  @IsObject()
  @IsOptional()
  performanceMetrics?: {
    averageYield?: number;
    averageQuality?: number;
    averageCycleTime?: number;
  };

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}