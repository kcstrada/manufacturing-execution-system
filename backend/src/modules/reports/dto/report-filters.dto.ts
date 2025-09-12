import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID, IsArray, IsEnum, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class ReportFiltersDto {
  @ApiProperty({ description: 'Start date for the report' })
  @IsDateString()
  @Transform(({ value }) => new Date(value))
  startDate!: Date;

  @ApiProperty({ description: 'End date for the report' })
  @IsDateString()
  @Transform(({ value }) => new Date(value))
  endDate!: Date;

  @ApiPropertyOptional({ description: 'Product ID filter' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Worker ID filter' })
  @IsOptional()
  @IsUUID()
  workerId?: string;

  @ApiPropertyOptional({ description: 'Department ID filter' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Equipment ID filter' })
  @IsOptional()
  @IsUUID()
  equipmentId?: string;

  @ApiPropertyOptional({ description: 'Customer ID filter' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Status filter', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  status?: string[];

  @ApiPropertyOptional({ 
    description: 'Group results by time period',
    enum: ['day', 'week', 'month', 'quarter', 'year'],
  })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'quarter', 'year'])
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export class CustomReportDto extends ReportFiltersDto {
  @ApiProperty({ description: 'Type of report to generate' })
  @IsString()
  reportType!: string;

  @ApiProperty({ description: 'Fields to group by', type: [String] })
  @IsArray()
  @IsString({ each: true })
  groupByFields!: string[];

  @ApiProperty({ description: 'Metrics to calculate', type: [String] })
  @IsArray()
  @IsString({ each: true })
  metrics!: string[];
}

export class ExportReportDto {
  @ApiProperty({ 
    description: 'Export format',
    enum: ['pdf', 'excel', 'csv'],
  })
  @IsEnum(['pdf', 'excel', 'csv'])
  format!: 'pdf' | 'excel' | 'csv';
}