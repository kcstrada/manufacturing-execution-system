import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType } from '../../../entities/product.entity';
import { TemplateStatus } from '../../../entities/product-template.entity';

export class TemplateQueryDto {
  @ApiPropertyOptional({ description: 'Search query for template name or code' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by product type', enum: ProductType })
  @IsEnum(ProductType)
  @IsOptional()
  productType?: ProductType;

  @ApiPropertyOptional({ description: 'Filter by template status', enum: TemplateStatus })
  @IsEnum(TemplateStatus)
  @IsOptional()
  status?: TemplateStatus;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Include only manufacturable templates' })
  @IsBoolean()
  @IsOptional()
  isManufacturable?: boolean;

  @ApiPropertyOptional({ description: 'Include only purchasable templates' })
  @IsBoolean()
  @IsOptional()
  isPurchasable?: boolean;

  @ApiPropertyOptional({ description: 'Include usage statistics' })
  @IsBoolean()
  @IsOptional()
  includeStats?: boolean = false;

  @ApiPropertyOptional({ 
    description: 'Sort field',
    enum: ['templateName', 'templateCode', 'usageCount', 'lastUsedAt', 'createdAt', 'updatedAt']
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'templateName';

  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: ['ASC', 'DESC']
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'ASC';

  @ApiPropertyOptional({ description: 'Page number', minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Page size',
    minimum: 1,
    maximum: 100 
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number = 20;
}