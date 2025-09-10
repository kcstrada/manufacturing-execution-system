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

  @ApiProperty({ description: 'Warehouse ID', format: 'uuid' })
  @IsUUID()
  warehouseId!: string;

  @ApiPropertyOptional({ description: 'Location within warehouse' })
  @IsString()
  @IsOptional()
  location?: string;

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

  @ApiPropertyOptional({
    description: 'Inventory status',
    enum: InventoryStatus,
    default: InventoryStatus.AVAILABLE,
  })
  @IsEnum(InventoryStatus)
  @IsOptional()
  status?: InventoryStatus = InventoryStatus.AVAILABLE;

  @ApiPropertyOptional({ description: 'Unit cost', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  unitCost?: number = 0;

  @ApiPropertyOptional({ description: 'Batch number' })
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Expiration date' })
  @IsDateString()
  @IsOptional()
  expirationDate?: Date;

  @ApiPropertyOptional({ description: 'Manufacture date' })
  @IsDateString()
  @IsOptional()
  manufactureDate?: Date;

  @ApiPropertyOptional({ description: 'Supplier ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Purchase order number' })
  @IsString()
  @IsOptional()
  purchaseOrderNumber?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Quality check status' })
  @IsString()
  @IsOptional()
  qualityCheckStatus?: string;

  @ApiPropertyOptional({ description: 'Quality check date' })
  @IsDateString()
  @IsOptional()
  qualityCheckDate?: Date;

  @ApiPropertyOptional({ description: 'Additional attributes' })
  @IsObject()
  @IsOptional()
  attributes?: Record<string, any>;
}

export class CreateInventoryTransactionDto {
  @ApiProperty({ description: 'Product ID', format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Warehouse ID', format: 'uuid' })
  @IsUUID()
  warehouseId!: string;

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

  @ApiPropertyOptional({ description: 'Reference type (e.g., work_order, purchase_order)' })
  @IsString()
  @IsOptional()
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Reference ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  referenceId?: string;

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

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class TransferInventoryDto {
  @ApiProperty({ description: 'From warehouse ID', format: 'uuid' })
  @IsUUID()
  fromWarehouseId!: string;

  @ApiProperty({ description: 'To warehouse ID', format: 'uuid' })
  @IsUUID()
  toWarehouseId!: string;

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