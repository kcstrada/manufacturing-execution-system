import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { CreateOrderDto, CreateOrderLineDto } from './create-order.dto';
import {
  IsEnum,
  IsOptional,
  IsDateString,
  IsArray,
  ValidateNested,
  IsUUID,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerOrderStatus } from '../../../entities/customer-order.entity';

export class UpdateOrderLineDto extends PartialType(CreateOrderLineDto) {
  @ApiPropertyOptional({ description: 'Order line ID for existing lines', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  id?: string;
}

export class UpdateOrderDto extends PartialType(
  OmitType(CreateOrderDto, ['orderNumber', 'customerId', 'orderLines'] as const)
) {
  @ApiPropertyOptional({ description: 'Shipped date' })
  @IsDateString()
  @IsOptional()
  shippedDate?: Date;

  @ApiPropertyOptional({ description: 'Updated order lines', type: [UpdateOrderLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateOrderLineDto)
  @IsOptional()
  orderLines?: UpdateOrderLineDto[];
}

export class UpdateOrderStatusDto {
  @ApiProperty({ 
    description: 'New order status',
    enum: CustomerOrderStatus,
  })
  @IsEnum(CustomerOrderStatus)
  status!: CustomerOrderStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: 'Shipped date (for SHIPPED status)' })
  @IsDateString()
  @IsOptional()
  shippedDate?: Date;
}