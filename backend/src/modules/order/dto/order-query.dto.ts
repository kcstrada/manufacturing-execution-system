import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerOrderStatus, OrderPriority } from '../../../entities/customer-order.entity';

export class OrderQueryDto {
  @ApiPropertyOptional({ description: 'Filter by customer ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by order status',
    enum: CustomerOrderStatus,
  })
  @IsEnum(CustomerOrderStatus)
  @IsOptional()
  status?: CustomerOrderStatus;

  @ApiPropertyOptional({ 
    description: 'Filter by order priority',
    enum: OrderPriority,
  })
  @IsEnum(OrderPriority)
  @IsOptional()
  priority?: OrderPriority;

  @ApiPropertyOptional({ description: 'Filter by sales representative ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  salesRepId?: string;

  @ApiPropertyOptional({ description: 'Filter by order date from' })
  @IsDateString()
  @IsOptional()
  orderDateFrom?: Date;

  @ApiPropertyOptional({ description: 'Filter by order date to' })
  @IsDateString()
  @IsOptional()
  orderDateTo?: Date;

  @ApiPropertyOptional({ description: 'Filter by required date from' })
  @IsDateString()
  @IsOptional()
  requiredDateFrom?: Date;

  @ApiPropertyOptional({ description: 'Filter by required date to' })
  @IsDateString()
  @IsOptional()
  requiredDateTo?: Date;

  @ApiPropertyOptional({ description: 'Search by order number' })
  @IsString()
  @IsOptional()
  orderNumber?: string;

  @ApiPropertyOptional({ description: 'Search by customer PO number' })
  @IsString()
  @IsOptional()
  customerPONumber?: string;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ 
    description: 'Sort field',
    enum: ['orderNumber', 'orderDate', 'requiredDate', 'totalAmount', 'status', 'priority'],
    default: 'orderDate',
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'orderDate';

  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}