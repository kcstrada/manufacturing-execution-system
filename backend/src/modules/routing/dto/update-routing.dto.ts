import { PartialType, OmitType } from '@nestjs/swagger';
import {
  CreateRoutingDto,
  CreateProductionStepDto,
} from './create-routing.dto';

export class UpdateRoutingDto extends PartialType(
  OmitType(CreateRoutingDto, ['productId', 'steps'] as const),
) {}

export class UpdateProductionStepDto extends PartialType(
  OmitType(CreateProductionStepDto, ['stepCode'] as const),
) {}
