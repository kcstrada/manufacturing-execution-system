import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';

export class CreateProductFromTemplateDto {
  @ApiProperty({ description: 'Template ID to create from' })
  @IsUUID()
  templateId!: string;

  @ApiProperty({ description: 'New product SKU' })
  @IsString()
  sku!: string;

  @ApiProperty({ description: 'New product name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Override description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Override cost' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @ApiPropertyOptional({ description: 'Override price' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: 'Override category ID' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Copy BOM from template' })
  @IsBoolean()
  @IsOptional()
  copyBOM?: boolean = true;

  @ApiPropertyOptional({ description: 'Copy Routing from template' })
  @IsBoolean()
  @IsOptional()
  copyRouting?: boolean = true;

  @ApiPropertyOptional({ description: 'Copy specifications' })
  @IsBoolean()
  @IsOptional()
  copySpecifications?: boolean = true;
}
