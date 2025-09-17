import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  Min,
  IsObject,
} from 'class-validator';
import { InventoryStatus } from '../../../entities/inventory.entity';
import { InventoryTransactionType } from '../../../entities/inventory-transaction.entity';

export class CreateInventoryDto {
  @ApiProperty({ description: 'Product ID', format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Warehouse code' })
  @IsString()
  warehouseCode!: string;

  @ApiProperty({ description: 'Location code within warehouse' })
  @IsString()
  locationCode!: string;

  @ApiPropertyOptional({ description: 'Lot number' })
  @IsString()
  @IsOptional()
  lotNumber?: string;

  @ApiPropertyOptional({ description: 'Serial number' })
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiProperty({ description: 'Quantity on hand', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantityOnHand!: number;

  @ApiPropertyOptional({ description: 'Quantity available', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @IsOptional()
  quantityAvailable?: number;

  @ApiPropertyOptional({
    description: 'Quantity reserved',
    minimum: 0,
    default: 0,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @IsOptional()
  quantityReserved?: number;

  @ApiPropertyOptional({
    description: 'Quantity in transit',
    minimum: 0,
    default: 0,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @IsOptional()
  quantityInTransit?: number;

  @ApiPropertyOptional({
    description: 'Inventory status',
    enum: InventoryStatus,
    default: InventoryStatus.AVAILABLE,
  })
  @IsEnum(InventoryStatus)
  @IsOptional()
  status?: InventoryStatus = InventoryStatus.AVAILABLE;

  @ApiPropertyOptional({ description: 'Unit cost', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @IsOptional()
  unitCost?: number;

  @ApiPropertyOptional({ description: 'Received date' })
  @IsDateString()
  @IsOptional()
  receivedDate?: string;

  @ApiPropertyOptional({ description: 'Expiration date' })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiPropertyOptional({ description: 'Manufacture date' })
  @IsDateString()
  @IsOptional()
  manufactureDate?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Additional attributes' })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, any>;
}

export class CreateInventoryTransactionDto {
  @ApiProperty({ description: 'Product ID', format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Warehouse code' })
  @IsString()
  warehouseCode!: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: InventoryTransactionType,
  })
  @IsEnum(InventoryTransactionType)
  transactionType!: InventoryTransactionType;

  @ApiProperty({ description: 'Quantity', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional({
    description: 'Reference type (e.g., work_order, purchase_order)',
  })
  @IsString()
  @IsOptional()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Reference ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Reference number' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'From location' })
  @IsString()
  @IsOptional()
  fromLocation?: string;

  @ApiPropertyOptional({ description: 'To location' })
  @IsString()
  @IsOptional()
  toLocation?: string;

  @ApiPropertyOptional({ description: 'Lot number' })
  @IsString()
  @IsOptional()
  lotNumber?: string;

  @ApiPropertyOptional({ description: 'Unit cost', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  unitCost?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class AdjustInventoryDto {
  @ApiProperty({ description: 'Adjustment quantity (positive or negative)' })
  @IsNumber({ maxDecimalPlaces: 3 })
  adjustmentQuantity!: number;

  @ApiProperty({ description: 'Reason for adjustment' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ description: 'Lot number' })
  @IsString()
  @IsOptional()
  lotNumber?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class TransferInventoryDto {
  @ApiProperty({ description: 'From warehouse code' })
  @IsString()
  fromWarehouseCode!: string;

  @ApiProperty({ description: 'To warehouse code' })
  @IsString()
  toWarehouseCode!: string;

  @ApiProperty({ description: 'Product ID', format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Quantity to transfer', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional({ description: 'From location' })
  @IsString()
  @IsOptional()
  fromLocation?: string;

  @ApiPropertyOptional({ description: 'To location' })
  @IsString()
  @IsOptional()
  toLocation?: string;

  @ApiPropertyOptional({ description: 'Lot number' })
  @IsString()
  @IsOptional()
  lotNumber?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
