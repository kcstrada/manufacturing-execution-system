import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantAwareResponseDto } from '../../../common/dto/base.dto';
import { ProductType, ProductStatus } from '../../../entities/product.entity';

export class ProductResponseDto extends TenantAwareResponseDto {
  @ApiProperty({ description: 'Product SKU' })
  sku!: string;

  @ApiProperty({ description: 'Product name' })
  name!: string;

  @ApiPropertyOptional({ description: 'Product description' })
  description?: string;

  @ApiProperty({ description: 'Product type', enum: ProductType })
  type!: ProductType;

  @ApiProperty({ description: 'Product status', enum: ProductStatus })
  status!: ProductStatus;

  @ApiPropertyOptional({ description: 'Category ID' })
  categoryId?: string;

  @ApiProperty({ description: 'Unit of measure ID' })
  unitOfMeasureId!: string;

  @ApiPropertyOptional({ description: 'Barcode' })
  barcode?: string;

  @ApiProperty({ description: 'Product cost' })
  cost!: number;

  @ApiProperty({ description: 'Product price' })
  price!: number;

  @ApiPropertyOptional({ description: 'Weight in kg' })
  weight?: number;

  @ApiPropertyOptional({ description: 'Length in cm' })
  length?: number;

  @ApiPropertyOptional({ description: 'Width in cm' })
  width?: number;

  @ApiPropertyOptional({ description: 'Height in cm' })
  height?: number;

  @ApiProperty({ description: 'Minimum stock level' })
  minStockLevel!: number;

  @ApiPropertyOptional({ description: 'Maximum stock level' })
  maxStockLevel?: number;

  @ApiPropertyOptional({ description: 'Reorder point' })
  reorderPoint?: number;

  @ApiProperty({ description: 'Lead time in days' })
  leadTimeDays!: number;

  @ApiPropertyOptional({ description: 'Shelf life in days' })
  shelfLifeDays?: number;

  @ApiProperty({ description: 'Is perishable' })
  isPerishable!: boolean;

  @ApiProperty({ description: 'Requires quality check' })
  requiresQualityCheck!: boolean;

  @ApiProperty({ description: 'Is lot tracked' })
  isLotTracked!: boolean;

  @ApiProperty({ description: 'Is serialized' })
  isSerialized!: boolean;

  @ApiPropertyOptional({ description: 'Product specifications' })
  specifications?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Manufacturing instructions' })
  manufacturingInstructions?: string;

  @ApiPropertyOptional({ description: 'Quality standards' })
  qualityStandards?: string;

  @ApiPropertyOptional({ description: 'Image URLs' })
  imageUrls?: string[];

  @ApiProperty({ description: 'Current stock on hand' })
  currentStock!: number;

  @ApiProperty({ description: 'Available stock' })
  availableStock!: number;

  @ApiProperty({ description: 'Reserved stock' })
  reservedStock!: number;
}
