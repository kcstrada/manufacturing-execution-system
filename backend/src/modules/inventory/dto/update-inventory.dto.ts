import { PartialType, OmitType } from '@nestjs/swagger';
import { IsNumber, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateInventoryDto } from './create-inventory.dto';
import { InventoryStatus } from '../../../entities/inventory.entity';

export class UpdateInventoryDto extends PartialType(
  OmitType(CreateInventoryDto, [
    'productId',
    'warehouseCode',
    'locationCode',
  ] as const),
) {}

export class UpdateInventoryQuantitiesDto {
  @ApiPropertyOptional({ description: 'Quantity on hand' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantityOnHand?: number;

  @ApiPropertyOptional({ description: 'Quantity available' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantityAvailable?: number;

  @ApiPropertyOptional({ description: 'Quantity reserved' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantityReserved?: number;

  @ApiPropertyOptional({ description: 'Quantity in transit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantityInTransit?: number;
}

export class UpdateInventoryStatusDto {
  @ApiPropertyOptional({
    description: 'Inventory status',
    enum: InventoryStatus,
  })
  @IsEnum(InventoryStatus)
  status!: InventoryStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReserveInventoryDto {
  @ApiPropertyOptional({ description: 'Quantity to reserve' })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional({ description: 'Reference type' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Reference ID' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReleaseInventoryDto {
  @ApiPropertyOptional({ description: 'Quantity to release' })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional({ description: 'Reference type' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Reference ID' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
