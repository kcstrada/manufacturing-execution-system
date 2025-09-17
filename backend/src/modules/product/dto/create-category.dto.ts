import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsObject,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category code', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  code!: string;

  @ApiProperty({ description: 'Category name', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Category image path', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  imagePath?: string;

  @ApiPropertyOptional({ description: 'Parent category ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  parentCategoryId?: string;

  @ApiPropertyOptional({ description: 'Custom attributes' })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Sort order', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number = 0;
}