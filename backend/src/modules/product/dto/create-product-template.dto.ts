import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsObject,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType } from '../../../entities/product.entity';

export class CreateProductTemplateDto {
  @ApiProperty({ description: 'Template name', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Product type for this template',
    enum: ProductType,
  })
  @IsEnum(ProductType)
  productType!: ProductType;

  @ApiPropertyOptional({ description: 'Default category ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  defaultCategoryId?: string;

  @ApiPropertyOptional({
    description: 'Default unit of measure ID',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  defaultUnitOfMeasureId?: string;

  @ApiPropertyOptional({ description: 'Default specifications' })
  @IsObject()
  @IsOptional()
  defaultSpecifications?: Record<string, any>;

  @ApiPropertyOptional({ description: 'BOM template' })
  @IsObject()
  @IsOptional()
  bomTemplate?: {
    components: Array<{
      componentId?: string;
      componentSku?: string;
      quantity: number;
      unit: string;
      scrapPercentage?: number;
    }>;
    scrapPercentage?: number;
    notes?: string;
  };

  @ApiPropertyOptional({ description: 'Routing template' })
  @IsObject()
  @IsOptional()
  routingTemplate?: {
    steps: Array<{
      stepCode: string;
      name: string;
      workCenterId?: string;
      setupTime: number;
      runTime: number;
      sequenceNumber: number;
    }>;
    expectedYield?: number;
  };

  @ApiPropertyOptional({ description: 'Quality standards template' })
  @IsObject()
  @IsOptional()
  qualityStandards?: {
    inspectionPoints: string[];
    acceptanceCriteria: Record<string, any>;
    samplingPlan?: string;
  };

  @ApiPropertyOptional({ description: 'Default cost', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  defaultCost?: number;

  @ApiPropertyOptional({ description: 'Default price', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  defaultPrice?: number;

  @ApiPropertyOptional({ description: 'Default lead time in days', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultLeadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Is manufacturable by default' })
  @IsBoolean()
  @IsOptional()
  isManufacturable?: boolean = false;

  @ApiPropertyOptional({ description: 'Is purchasable by default' })
  @IsBoolean()
  @IsOptional()
  isPurchasable?: boolean = true;

  @ApiPropertyOptional({ description: 'Template is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiPropertyOptional({ description: 'Custom fields definition' })
  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Validation rules for products created from this template' })
  @IsObject()
  @IsOptional()
  validationRules?: {
    requiredFields?: string[];
    minStockLevel?: number;
    maxStockLevel?: number;
    requiresBom?: boolean;
    requiresRouting?: boolean;
    requiresQualityCheck?: boolean;
  };

  @ApiPropertyOptional({ description: 'Template tags', type: [String] })
  @IsOptional()
  tags?: string[];
}