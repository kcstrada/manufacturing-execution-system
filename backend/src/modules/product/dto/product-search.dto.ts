import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType, ProductStatus } from '../../../entities/product.entity';

export class ProductSearchDto {
  @ApiPropertyOptional({ description: 'Search query for full-text search' })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiPropertyOptional({
    description: 'Category IDs to filter by',
    type: [String],
  })
  @IsArray()
  @IsOptional()
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Product types to filter by',
    enum: ProductType,
    isArray: true,
  })
  @IsArray()
  @IsEnum(ProductType, { each: true })
  @IsOptional()
  types?: ProductType[];

  @ApiPropertyOptional({
    description: 'Product status to filter by',
    enum: ProductStatus,
    isArray: true,
  })
  @IsOptional()
  status?: ProductStatus | ProductStatus[];

  @ApiPropertyOptional({ description: 'Minimum price' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  priceMax?: number;

  @ApiPropertyOptional({ description: 'Minimum cost' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  costMin?: number;

  @ApiPropertyOptional({ description: 'Maximum cost' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  costMax?: number;

  @ApiPropertyOptional({ description: 'Filter by in-stock status' })
  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @ApiPropertyOptional({ description: 'Filter by manufacturable status' })
  @IsBoolean()
  @IsOptional()
  isManufacturable?: boolean;

  @ApiPropertyOptional({ description: 'Filter by purchasable status' })
  @IsBoolean()
  @IsOptional()
  isPurchasable?: boolean;

  @ApiPropertyOptional({ description: 'Filter by products with default BOM' })
  @IsBoolean()
  @IsOptional()
  hasDefaultBom?: boolean;

  @ApiPropertyOptional({ description: 'Filter by products with default routing' })
  @IsBoolean()
  @IsOptional()
  hasDefaultRouting?: boolean;

  @ApiPropertyOptional({ description: 'Tags to filter by', type: [String] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Specifications to filter by' })
  @IsObject()
  @IsOptional()
  specifications?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['relevance', 'name', 'sku', 'price', 'cost', 'createdAt', 'updatedAt'],
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'relevance';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: 'Page number', minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Page size',
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: 'Include facets in response' })
  @IsBoolean()
  @IsOptional()
  includeFacets?: boolean = true;
}