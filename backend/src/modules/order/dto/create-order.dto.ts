import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerOrderStatus, OrderPriority } from '../../../entities/customer-order.entity';

export class ShippingAddressDto {
  @ApiPropertyOptional({ description: 'Street address line 1' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  street1?: string;

  @ApiPropertyOptional({ description: 'Street address line 2' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  street2?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'State or province' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ description: 'Postal code' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;
}

export class CreateOrderLineDto {
  @ApiProperty({ description: 'Line number', minimum: 1 })
  @IsNumber()
  @Min(1)
  lineNumber!: number;

  @ApiProperty({ description: 'Product ID', format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiPropertyOptional({ description: 'Line description', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ description: 'Quantity', minimum: 0.001 })
  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @ApiProperty({ description: 'Unit price', minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional({ description: 'Discount percentage', minimum: 0, maximum: 100 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Tax amount', minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Required date' })
  @IsDateString()
  @IsOptional()
  requiredDate?: Date;

  @ApiPropertyOptional({ description: 'Promised date' })
  @IsDateString()
  @IsOptional()
  promisedDate?: Date;

  @ApiPropertyOptional({ description: 'Notes', maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Order number', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  orderNumber!: string;

  @ApiPropertyOptional({ description: 'Customer PO number', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  customerPONumber?: string;

  @ApiProperty({ description: 'Customer ID', format: 'uuid' })
  @IsUUID()
  customerId!: string;

  @ApiProperty({ description: 'Order date' })
  @IsDateString()
  orderDate!: Date;

  @ApiProperty({ description: 'Required date' })
  @IsDateString()
  requiredDate!: Date;

  @ApiPropertyOptional({ description: 'Promised date' })
  @IsDateString()
  @IsOptional()
  promisedDate?: Date;

  @ApiPropertyOptional({
    description: 'Order status',
    enum: CustomerOrderStatus,
    default: CustomerOrderStatus.DRAFT,
  })
  @IsEnum(CustomerOrderStatus)
  @IsOptional()
  status?: CustomerOrderStatus;

  @ApiPropertyOptional({
    description: 'Order priority',
    enum: OrderPriority,
    default: OrderPriority.NORMAL,
  })
  @IsEnum(OrderPriority)
  @IsOptional()
  priority?: OrderPriority;

  @ApiPropertyOptional({ description: 'Shipping address', type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  @IsOptional()
  shippingAddress?: ShippingAddressDto;

  @ApiPropertyOptional({ description: 'Shipping method', maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  shippingMethod?: string;

  @ApiPropertyOptional({ description: 'Shipping cost', minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  shippingCost?: number;

  @ApiPropertyOptional({ description: 'Discount percentage', minimum: 0, maximum: 100 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Discount amount', minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Tax amount', minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Sales representative ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  salesRepId?: string;

  @ApiPropertyOptional({ description: 'Notes', maxLength: 2000 })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Internal notes', maxLength: 2000 })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  internalNotes?: string;

  @ApiProperty({ description: 'Order lines', type: [CreateOrderLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderLineDto)
  orderLines!: CreateOrderLineDto[];
}