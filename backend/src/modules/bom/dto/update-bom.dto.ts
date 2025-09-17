import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateBOMDto, CreateBOMComponentDto } from './create-bom.dto';

export class UpdateBOMDto extends PartialType(
  OmitType(CreateBOMDto, ['productId', 'components'] as const),
) {}

export class UpdateBOMComponentDto extends PartialType(
  OmitType(CreateBOMComponentDto, ['componentId'] as const),
) {}
