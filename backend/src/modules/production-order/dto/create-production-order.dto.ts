import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';
import {
  ProductionOrderStatus,
  ProductionOrderPriority,
} from '../../../entities/production-order.entity';

export class CreateProductionOrderDto {
  @ApiProperty({ description: 'Order number', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  orderNumber!: string;

  @ApiProperty({ description: 'Product ID', format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Quantity ordered', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantityOrdered!: number;

  @ApiPropertyOptional({ description: 'Customer order ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  customerOrderId?: string;

  @ApiProperty({ description: 'Planned start date' })
  @IsDateString()
  plannedStartDate!: Date;

  @ApiProperty({ description: 'Planned end date' })
  @IsDateString()
  plannedEndDate!: Date;

  @ApiPropertyOptional({
    description: 'Priority',
    enum: ProductionOrderPriority,
    default: ProductionOrderPriority.NORMAL,
  })
  @IsEnum(ProductionOrderPriority)
  @IsOptional()
  priority?: ProductionOrderPriority = ProductionOrderPriority.NORMAL;

  @ApiPropertyOptional({
    description: 'Status',
    enum: ProductionOrderStatus,
    default: ProductionOrderStatus.DRAFT,
  })
  @IsEnum(ProductionOrderStatus)
  @IsOptional()
  status?: ProductionOrderStatus = ProductionOrderStatus.DRAFT;

  @ApiPropertyOptional({ description: 'BOM ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  bomId?: string;

  @ApiPropertyOptional({ description: 'Routing ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  routingId?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsDateString()
  @IsOptional()
  dueDate?: Date;
}

export class UpdateProductionOrderStatusDto {
  @ApiProperty({
    description: 'New status',
    enum: ProductionOrderStatus,
  })
  @IsEnum(ProductionOrderStatus)
  status!: ProductionOrderStatus;

  @ApiPropertyOptional({ description: 'Status change reason' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ProductionOrderProgressDto {
  @ApiProperty({ description: 'Quantity completed', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantityCompleted!: number;

  @ApiPropertyOptional({ description: 'Quantity rejected', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @IsOptional()
  quantityRejected?: number;

  @ApiPropertyOptional({ description: 'Scrap quantity', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @IsOptional()
  scrapQuantity?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReleaseProductionOrderDto {
  @ApiPropertyOptional({ description: 'Override material availability check' })
  @IsOptional()
  overrideMaterialCheck?: boolean;

  @ApiPropertyOptional({ description: 'Override capacity check' })
  @IsOptional()
  overrideCapacityCheck?: boolean;

  @ApiPropertyOptional({ description: 'Release notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
