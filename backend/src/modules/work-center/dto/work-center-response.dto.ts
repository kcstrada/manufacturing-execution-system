import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkCenterType, WorkCenterStatus } from './create-work-center.dto';

export class WorkCenterResponseDto {
  @ApiProperty({ description: 'Work center ID' })
  id!: string;

  @ApiProperty({ description: 'Work center code' })
  code!: string;

  @ApiProperty({ description: 'Work center name' })
  name!: string;

  @ApiPropertyOptional({ description: 'Work center description' })
  description?: string;

  @ApiProperty({ description: 'Work center type' })
  type!: WorkCenterType;

  @ApiProperty({ description: 'Work center status' })
  status!: WorkCenterStatus;

  @ApiPropertyOptional({ description: 'Department' })
  department?: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional({ description: 'Location' })
  location?: string;

  @ApiProperty({ description: 'Capacity per hour' })
  capacityPerHour!: number;

  @ApiPropertyOptional({ description: 'Efficiency percentage' })
  efficiencyPercentage?: number;

  @ApiPropertyOptional({ description: 'Utilization target percentage' })
  utilizationTarget?: number;

  @ApiPropertyOptional({ description: 'Current utilization percentage' })
  currentUtilization?: number;

  @ApiPropertyOptional({ description: 'Setup cost' })
  setupCost?: number;

  @ApiPropertyOptional({ description: 'Hourly rate' })
  hourlyRate?: number;

  @ApiPropertyOptional({ description: 'Labor cost per hour' })
  laborCostPerHour?: number;

  @ApiPropertyOptional({ description: 'Overhead cost per hour' })
  overheadCostPerHour?: number;

  @ApiPropertyOptional({ description: 'Number of operators required' })
  operatorsRequired?: number;

  @ApiPropertyOptional({ description: 'Capabilities' })
  capabilities?: Array<{
    name: string;
    description?: string;
    parameters?: Record<string, any>;
  }>;

  @ApiPropertyOptional({ description: 'Required skills' })
  requiredSkills?: string[];

  @ApiPropertyOptional({ description: 'Supported operations' })
  supportedOperations?: string[];

  @ApiPropertyOptional({ description: 'Maintenance schedule' })
  maintenanceSchedule?: {
    frequency: string;
    lastMaintenance?: Date;
    nextMaintenance?: Date;
    maintenanceHours?: number;
  };

  @ApiPropertyOptional({ description: 'Operating hours' })
  operatingHours?: Record<string, { start: string; end: string }>;

  @ApiPropertyOptional({ description: 'Associated equipment' })
  equipment?: Array<{
    id: string;
    name: string;
    status: string;
  }>;

  @ApiPropertyOptional({ description: 'Active production steps' })
  activeProductionSteps?: Array<{
    id: string;
    stepCode: string;
    productName: string;
    status: string;
  }>;

  @ApiPropertyOptional({ description: 'Performance metrics' })
  performanceMetrics?: {
    oee?: number;
    availability?: number;
    performance?: number;
    quality?: number;
    mtbf?: number;
    mttr?: number;
  };

  @ApiPropertyOptional({ description: 'Current workload' })
  currentWorkload?: {
    scheduledHours: number;
    availableHours: number;
    queuedJobs: number;
    activeJobs: number;
  };

  @ApiProperty({ description: 'Is bottleneck resource' })
  isBottleneck!: boolean;

  @ApiProperty({ description: 'Allows parallel operations' })
  allowsParallelOperations!: boolean;

  @ApiPropertyOptional({ description: 'Maximum batch size' })
  maxBatchSize?: number;

  @ApiPropertyOptional({ description: 'Minimum batch size' })
  minBatchSize?: number;

  @ApiProperty({ description: 'Quality control checkpoint' })
  isQualityCheckpoint!: boolean;

  @ApiProperty({ description: 'Is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Created at' })
  createdAt!: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt!: Date;
}

export class WorkCenterListResponseDto {
  @ApiProperty({ description: 'Work centers', type: [WorkCenterResponseDto] })
  items!: WorkCenterResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total!: number;

  @ApiProperty({ description: 'Page number' })
  page!: number;

  @ApiProperty({ description: 'Page size' })
  pageSize!: number;
}