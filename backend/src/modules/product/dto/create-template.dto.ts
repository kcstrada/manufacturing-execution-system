import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  IsEnum,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType } from '../../../entities/product.entity';
import { TemplateStatus } from '../../../entities/product-template.entity';

class DimensionsDto {
  @ApiPropertyOptional({ description: 'Length' })
  @IsNumber()
  @IsOptional()
  length?: number;

  @ApiPropertyOptional({ description: 'Width' })
  @IsNumber()
  @IsOptional()
  width?: number;

  @ApiPropertyOptional({ description: 'Height' })
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional({ description: 'Unit of measurement' })
  @IsString()
  @IsOptional()
  unit?: string;
}

class ValidationRuleDto {
  @ApiProperty({ description: 'Field name to validate' })
  @IsString()
  field!: string;

  @ApiProperty({ description: 'Validation rule expression' })
  @IsString()
  rule!: string;

  @ApiProperty({ description: 'Error message' })
  @IsString()
  message!: string;
}

class TemplateRulesDto {
  @ApiPropertyOptional({ description: 'Auto generate SKU' })
  @IsBoolean()
  @IsOptional()
  autoGenerateSku?: boolean;

  @ApiPropertyOptional({ description: 'Auto generate barcode' })
  @IsBoolean()
  @IsOptional()
  autoGenerateBarcode?: boolean;

  @ApiPropertyOptional({ description: 'Require approval for products created from template' })
  @IsBoolean()
  @IsOptional()
  requireApproval?: boolean;

  @ApiPropertyOptional({ description: 'Validation rules', type: [ValidationRuleDto] })
  @ValidateNested({ each: true })
  @Type(() => ValidationRuleDto)
  @IsOptional()
  validationRules?: ValidationRuleDto[];
}

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template code', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  templateCode!: string;

  @ApiProperty({ description: 'Template name', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  templateName!: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsString()
  @IsOptional()
  templateDescription?: string;

  // Pattern fields
  @ApiPropertyOptional({ 
    description: 'Name pattern (e.g., "{PREFIX}-{SEQUENCE}-{SUFFIX}")',
    maxLength: 255 
  })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  namePattern?: string;

  @ApiPropertyOptional({ 
    description: 'SKU pattern (e.g., "PROD-{YYYY}-{0000}")',
    maxLength: 100 
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  skuPattern?: string;

  @ApiPropertyOptional({ description: 'SKU prefix', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  skuPrefix?: string;

  @ApiPropertyOptional({ description: 'SKU suffix', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  skuSuffix?: string;

  @ApiPropertyOptional({ 
    description: 'Barcode pattern (e.g., "EAN-{CATEGORY}-{SEQUENCE}")',
    maxLength: 100 
  })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  barcodePattern?: string;

  // Default product fields
  @ApiPropertyOptional({ description: 'Default product description' })
  @IsString()
  @IsOptional()
  defaultDescription?: string;

  @ApiPropertyOptional({ description: 'Product type', enum: ProductType })
  @IsEnum(ProductType)
  @IsOptional()
  productType?: ProductType;

  @ApiPropertyOptional({ description: 'Default dimensions' })
  @ValidateNested()
  @Type(() => DimensionsDto)
  @IsOptional()
  defaultDimensions?: DimensionsDto;

  @ApiPropertyOptional({ description: 'Default specifications' })
  @IsObject()
  @IsOptional()
  defaultSpecifications?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Default cost', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultCost?: number;

  @ApiPropertyOptional({ description: 'Default price', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultPrice?: number;

  @ApiPropertyOptional({ description: 'Default lead time in days', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultLeadTimeDays?: number;

  // Stock levels
  @ApiPropertyOptional({ description: 'Default minimum stock level', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultMinStockLevel?: number;

  @ApiPropertyOptional({ description: 'Default maximum stock level', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultMaxStockLevel?: number;

  @ApiPropertyOptional({ description: 'Default reorder point', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultReorderPoint?: number;

  @ApiPropertyOptional({ description: 'Default reorder quantity', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultReorderQuantity?: number;

  @ApiPropertyOptional({ description: 'Default weight', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  defaultWeight?: number;

  // Manufacturing flags
  @ApiPropertyOptional({ description: 'Default is manufacturable' })
  @IsBoolean()
  @IsOptional()
  defaultIsManufacturable?: boolean = true;

  @ApiPropertyOptional({ description: 'Default is purchasable' })
  @IsBoolean()
  @IsOptional()
  defaultIsPurchasable?: boolean = false;

  // Relations
  @ApiPropertyOptional({ description: 'Default category ID' })
  @IsUUID()
  @IsOptional()
  defaultCategoryId?: string;

  @ApiPropertyOptional({ description: 'Default unit of measure ID' })
  @IsUUID()
  @IsOptional()
  defaultUnitOfMeasureId?: string;

  @ApiPropertyOptional({ description: 'Default BOM template ID' })
  @IsUUID()
  @IsOptional()
  defaultBomTemplateId?: string;

  @ApiPropertyOptional({ description: 'Default routing template ID' })
  @IsUUID()
  @IsOptional()
  defaultRoutingTemplateId?: string;

  // Template configuration
  @ApiPropertyOptional({ description: 'Template rules' })
  @ValidateNested()
  @Type(() => TemplateRulesDto)
  @IsOptional()
  templateRules?: TemplateRulesDto;

  @ApiPropertyOptional({ description: 'Custom fields' })
  @IsObject()
  @IsOptional()
  customFields?: Record<string, any>;

  @ApiPropertyOptional({ 
    description: 'Template status',
    enum: TemplateStatus,
    default: TemplateStatus.ACTIVE 
  })
  @IsEnum(TemplateStatus)
  @IsOptional()
  status?: TemplateStatus = TemplateStatus.ACTIVE;
}