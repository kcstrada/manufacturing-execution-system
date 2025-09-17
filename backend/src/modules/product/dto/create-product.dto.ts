import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
  IsObject,
  IsUUID,
} from 'class-validator';
import { ProductType, ProductStatus } from '../../../entities/product.entity';

export class CreateProductDto {
  @ApiProperty({ description: 'Product SKU', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  sku!: string;

  @ApiProperty({ description: 'Product name', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Product type',
    enum: ProductType,
    default: ProductType.FINISHED_GOOD,
  })
  @IsEnum(ProductType)
  type!: ProductType;

  @ApiPropertyOptional({
    description: 'Product status',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus = ProductStatus.ACTIVE;

  @ApiPropertyOptional({ description: 'Category ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ description: 'Unit of measure ID', format: 'uuid' })
  @IsUUID()
  unitOfMeasureId!: string;

  @ApiPropertyOptional({ description: 'Barcode' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({ description: 'Product cost', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost!: number;

  @ApiProperty({ description: 'Product price', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ description: 'Weight in kg', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ description: 'Length in cm', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  length?: number;

  @ApiPropertyOptional({ description: 'Width in cm', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  width?: number;

  @ApiPropertyOptional({ description: 'Height in cm', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  height?: number;

  @ApiPropertyOptional({ description: 'Minimum stock level', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStockLevel?: number = 0;

  @ApiPropertyOptional({ description: 'Maximum stock level', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxStockLevel?: number;

  @ApiPropertyOptional({ description: 'Reorder point', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderPoint?: number;

  @ApiPropertyOptional({ description: 'Lead time in days', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  leadTimeDays?: number = 0;

  @ApiPropertyOptional({ description: 'Shelf life in days', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  shelfLifeDays?: number;

  @ApiPropertyOptional({ description: 'Is perishable' })
  @IsBoolean()
  @IsOptional()
  isPerishable?: boolean = false;

  @ApiPropertyOptional({ description: 'Requires quality check' })
  @IsBoolean()
  @IsOptional()
  requiresQualityCheck?: boolean = false;

  @ApiPropertyOptional({ description: 'Is lot tracked' })
  @IsBoolean()
  @IsOptional()
  isLotTracked?: boolean = false;

  @ApiPropertyOptional({ description: 'Is serialized' })
  @IsBoolean()
  @IsOptional()
  isSerialized?: boolean = false;

  @ApiPropertyOptional({ description: 'Product specifications' })
  @IsObject()
  @IsOptional()
  specifications?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Manufacturing instructions' })
  @IsString()
  @IsOptional()
  manufacturingInstructions?: string;

  @ApiPropertyOptional({ description: 'Quality standards' })
  @IsString()
  @IsOptional()
  qualityStandards?: string;

  @ApiPropertyOptional({ description: 'Image URLs', type: [String] })
  @IsOptional()
  imageUrls?: string[];

  @ApiPropertyOptional({ description: 'Is product manufacturable' })
  @IsBoolean()
  @IsOptional()
  isManufacturable?: boolean = false;

  @ApiPropertyOptional({ description: 'Is product purchasable' })
  @IsBoolean()
  @IsOptional()
  isPurchasable?: boolean = true;

  @ApiPropertyOptional({ description: 'Default BOM ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  defaultBomId?: string;

  @ApiPropertyOptional({ description: 'Default Routing ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  defaultRoutingId?: string;
}
