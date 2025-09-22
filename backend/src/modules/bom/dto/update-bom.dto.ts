import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateBOMDto, CreateBOMComponentDto } from './create-bom.dto';
import { IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBOMDto extends PartialType(
  OmitType(CreateBOMDto, ['productId'] as const),
) {
  @ApiPropertyOptional({
    description: 'BOM components',
    type: [CreateBOMComponentDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBOMComponentDto)
  @IsOptional()
  override components?: CreateBOMComponentDto[];
}

export class UpdateBOMComponentDto extends PartialType(
  OmitType(CreateBOMComponentDto, ['componentId'] as const),
) {}
