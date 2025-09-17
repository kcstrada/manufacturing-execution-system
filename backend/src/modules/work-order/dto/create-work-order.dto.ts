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
import { WorkOrderStatus } from '../../../entities/work-order.entity';

export class CreateWorkOrderDto {
  @ApiProperty({ description: 'Work order number', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  workOrderNumber!: string;

  @ApiProperty({ description: 'Production order ID', format: 'uuid' })
  @IsUUID()
  productionOrderId!: string;

  @ApiProperty({ description: 'Product ID', format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Work center ID', format: 'uuid' })
  @IsUUID()
  workCenterId!: string;

  @ApiProperty({ description: 'Sequence number', minimum: 1 })
  @IsNumber()
  @Min(1)
  sequence!: number;

  @ApiPropertyOptional({ description: 'Operation description' })
  @IsString()
  @IsOptional()
  operationDescription?: string;

  @ApiProperty({ description: 'Quantity ordered', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  quantityOrdered!: number;

  @ApiPropertyOptional({ description: 'Setup time in minutes', minimum: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  setupTimeMinutes?: number = 0;

  @ApiPropertyOptional({
    description: 'Run time per unit in minutes',
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  runTimePerUnitMinutes?: number = 0;

  @ApiPropertyOptional({ description: 'Scheduled start date' })
  @IsDateString()
  @IsOptional()
  scheduledStartDate?: Date;

  @ApiPropertyOptional({ description: 'Scheduled end date' })
  @IsDateString()
  @IsOptional()
  scheduledEndDate?: Date;

  @ApiPropertyOptional({
    description: 'Work order status',
    enum: WorkOrderStatus,
    default: WorkOrderStatus.PENDING,
  })
  @IsEnum(WorkOrderStatus)
  @IsOptional()
  status?: WorkOrderStatus = WorkOrderStatus.PENDING;

  @ApiPropertyOptional({ description: 'Assigned to user ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
