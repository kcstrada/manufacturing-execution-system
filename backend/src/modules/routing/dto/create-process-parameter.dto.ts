import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
} from 'class-validator';
import {
  ParameterCategory,
  ParameterType,
} from '../../../entities/process-parameter.entity';

export enum DataSource {
  MANUAL = 'manual',
  SENSOR = 'sensor',
  SYSTEM = 'system',
  CALCULATED = 'calculated',
  EXTERNAL = 'external',
}

export class CreateProcessParameterDto {
  @ApiProperty({ description: 'Parameter code' })
  @IsString()
  parameterCode!: string;

  @ApiProperty({ description: 'Parameter name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Parameter description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Parameter category', enum: ParameterCategory })
  @IsEnum(ParameterCategory)
  category!: ParameterCategory;

  @ApiProperty({ description: 'Parameter type', enum: ParameterType })
  @IsEnum(ParameterType)
  type!: ParameterType;

  @ApiPropertyOptional({ description: 'Unit of measure' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ description: 'Target value' })
  @IsNumber()
  @IsOptional()
  targetValue?: number;

  @ApiPropertyOptional({ description: 'Minimum value' })
  @IsNumber()
  @IsOptional()
  minValue?: number;

  @ApiPropertyOptional({ description: 'Maximum value' })
  @IsNumber()
  @IsOptional()
  maxValue?: number;

  @ApiPropertyOptional({ description: 'Tolerance' })
  @IsNumber()
  @IsOptional()
  tolerance?: number;

  @ApiPropertyOptional({ description: 'Is required' })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean = false;

  @ApiPropertyOptional({ description: 'Is critical to quality' })
  @IsBoolean()
  @IsOptional()
  isCriticalToQuality?: boolean = false;

  @ApiPropertyOptional({ description: 'Is control parameter' })
  @IsBoolean()
  @IsOptional()
  isControlParameter?: boolean = false;

  @ApiPropertyOptional({ description: 'Is monitored' })
  @IsBoolean()
  @IsOptional()
  isMonitored?: boolean = false;

  @ApiPropertyOptional({ description: 'Monitoring frequency' })
  @IsString()
  @IsOptional()
  frequency?: string;

  @ApiPropertyOptional({ description: 'Data source', enum: DataSource })
  @IsEnum(DataSource)
  @IsOptional()
  dataSource?: DataSource;

  @ApiPropertyOptional({ description: 'Priority' })
  @IsNumber()
  @IsOptional()
  priority?: number = 0;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiPropertyOptional({ description: 'Validation rules' })
  @IsObject()
  @IsOptional()
  validationRules?: any;
}
