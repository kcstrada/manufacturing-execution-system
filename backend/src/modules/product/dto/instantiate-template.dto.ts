import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class InstantiateTemplateDto {
  @ApiProperty({ description: 'Template ID to instantiate from' })
  @IsUUID()
  templateId!: string;

  @ApiPropertyOptional({ 
    description: 'Override product name (if not provided, uses template pattern)',
    maxLength: 255 
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ 
    description: 'Override SKU (if not provided, uses template pattern)',
    maxLength: 100 
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Override description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Override cost', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @ApiPropertyOptional({ description: 'Override price', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: 'Override category ID' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Override unit of measure ID' })
  @IsUUID()
  @IsOptional()
  unitOfMeasureId?: string;

  @ApiPropertyOptional({ description: 'Override specifications' })
  @IsObject()
  @IsOptional()
  specifications?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Custom fields to merge with template defaults' })
  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;

  @ApiPropertyOptional({ 
    description: 'Skip template validation rules',
    default: false 
  })
  @IsBoolean()
  @IsOptional()
  skipValidation?: boolean = false;

  @ApiPropertyOptional({ 
    description: 'Auto-approve product creation (if template requires approval)',
    default: false 
  })
  @IsBoolean()
  @IsOptional()
  autoApprove?: boolean = false;

  @ApiPropertyOptional({ description: 'Variables for pattern substitution' })
  @IsObject()
  @IsOptional()
  variables?: Record<string, string>;
}