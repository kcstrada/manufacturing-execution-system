import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Update Product DTO
 * All fields are optional, including SKU (which can be changed with validation)
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({ description: 'Product SKU', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  override sku?: string;
}
