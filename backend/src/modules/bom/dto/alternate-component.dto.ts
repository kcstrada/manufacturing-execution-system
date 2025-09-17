import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';

export class CreateAlternateComponentDto {
  @ApiProperty({ description: 'BOM ID', format: 'uuid' })
  @IsUUID()
  bomId!: string;

  @ApiProperty({ description: 'Primary component ID', format: 'uuid' })
  @IsUUID()
  primaryComponentId!: string;

  @ApiProperty({ description: 'Alternate component ID', format: 'uuid' })
  @IsUUID()
  alternateComponentId!: string;

  @ApiProperty({ description: 'Preference order', minimum: 1 })
  @IsNumber()
  @Min(1)
  preferenceOrder!: number;

  @ApiProperty({ description: 'Conversion factor', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  conversionFactor!: number;

  @ApiPropertyOptional({ description: 'Notes', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Conditions for use', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  conditions?: string;

  @ApiPropertyOptional({ description: 'Cost difference' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  costDifference?: number;

  @ApiPropertyOptional({ description: 'Lead time difference in days' })
  @IsNumber()
  @IsOptional()
  leadTimeDifference?: number;

  @ApiPropertyOptional({ description: 'Quality notes', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  qualityNotes?: string;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

export class UpdateAlternateComponentDto {
  @ApiPropertyOptional({ description: 'Preference order', minimum: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  preferenceOrder?: number;

  @ApiPropertyOptional({ description: 'Conversion factor', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  @IsOptional()
  conversionFactor?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Conditions for use' })
  @IsString()
  @IsOptional()
  conditions?: string;

  @ApiPropertyOptional({ description: 'Cost difference' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  costDifference?: number;

  @ApiPropertyOptional({ description: 'Lead time difference in days' })
  @IsNumber()
  @IsOptional()
  leadTimeDifference?: number;

  @ApiPropertyOptional({ description: 'Quality notes' })
  @IsString()
  @IsOptional()
  qualityNotes?: string;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}