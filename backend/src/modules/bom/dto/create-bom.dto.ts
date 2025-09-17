import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsArray,
  ValidateNested,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BOMStatus } from '../../../entities/bill-of-materials.entity';

export class CreateBOMComponentDto {
  @ApiProperty({ description: 'Component product ID', format: 'uuid' })
  @IsUUID()
  componentId!: string;

  @ApiProperty({ description: 'Quantity required', minimum: 0 })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiProperty({ description: 'Unit of measure', maxLength: 20 })
  @IsString()
  @MaxLength(20)
  unit!: string;

  @ApiPropertyOptional({ description: 'Component sequence number' })
  @IsNumber()
  @IsOptional()
  sequence?: number;

  @ApiPropertyOptional({ description: 'Reference designator' })
  @IsString()
  @IsOptional()
  referenceDesignator?: string;

  @ApiPropertyOptional({ description: 'Is component required' })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean = true;

  @ApiPropertyOptional({ description: 'Is phantom component' })
  @IsBoolean()
  @IsOptional()
  isPhantom?: boolean = false;

  @ApiPropertyOptional({ description: 'Scrap percentage', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  scrapPercentage?: number = 0;

  @ApiPropertyOptional({ description: 'Supply type' })
  @IsString()
  @IsOptional()
  supplyType?: string;

  @ApiPropertyOptional({ description: 'Lead time offset in days' })
  @IsNumber()
  @IsOptional()
  leadTimeOffset?: number = 0;

  @ApiPropertyOptional({ description: 'Component notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Unit cost', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitCost?: number;

  @ApiPropertyOptional({ description: 'Total cost', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalCost?: number;
}

export class CreateBOMDto {
  @ApiProperty({ description: 'Product ID for this BOM', format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'BOM name', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ description: 'BOM description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'BOM version', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  version!: string;

  @ApiPropertyOptional({
    description: 'BOM status',
    enum: BOMStatus,
    default: BOMStatus.DRAFT,
  })
  @IsEnum(BOMStatus)
  @IsOptional()
  status?: BOMStatus = BOMStatus.DRAFT;

  @ApiProperty({ description: 'Effective date' })
  @IsDateString()
  effectiveDate!: Date;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsDateString()
  @IsOptional()
  expiryDate?: Date;

  @ApiPropertyOptional({ description: 'Is this the default BOM' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean = false;

  @ApiPropertyOptional({ description: 'Is BOM active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiPropertyOptional({ description: 'Total cost', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalCost?: number;

  @ApiPropertyOptional({
    description: 'BOM components',
    type: [CreateBOMComponentDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBOMComponentDto)
  @IsOptional()
  components?: CreateBOMComponentDto[];

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
