import {
  IsUUID,
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '../../../entities/task.entity';

export class SubtaskConfigDto {
  @ApiProperty({ description: 'Name of the subtask' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Description of the subtask' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Estimated hours for the subtask' })
  @IsNumber()
  @Min(0)
  estimatedHours!: number;

  @ApiProperty({ description: 'Target quantity for the subtask' })
  @IsNumber()
  @Min(0)
  targetQuantity!: number;

  @ApiPropertyOptional({ description: 'User ID to assign the subtask to' })
  @IsOptional()
  @IsUUID()
  assignToUserId?: string;

  @ApiPropertyOptional({
    description: 'Priority for the subtask',
    enum: TaskPriority,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
}

export class TaskSplitConfigDto {
  @ApiProperty({ description: 'ID of the task to split' })
  @IsUUID()
  taskId!: string;

  @ApiProperty({
    description: 'Subtasks to create',
    type: [SubtaskConfigDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubtaskConfigDto)
  subtasks!: SubtaskConfigDto[];

  @ApiPropertyOptional({
    description: 'Whether to preserve original task dependencies',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  preserveDependencies?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to auto-assign subtasks',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoAssign?: boolean;

  @ApiPropertyOptional({ description: 'Reason for splitting the task' })
  @IsOptional()
  @IsString()
  splitReason?: string;
}

export class BulkReassignConfigDto {
  @ApiProperty({
    description: 'IDs of tasks to reassign',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  taskIds!: string[];

  @ApiPropertyOptional({ description: 'ID of the user to reassign from' })
  @IsOptional()
  @IsUUID()
  fromUserId?: string;

  @ApiProperty({ description: 'ID of the user to reassign to' })
  @IsUUID()
  toUserId!: string;

  @ApiProperty({ description: 'Reason for reassignment' })
  @IsString()
  reason!: string;

  @ApiProperty({ description: 'ID of the user performing the reassignment' })
  @IsUUID()
  reassignedBy!: string;

  @ApiPropertyOptional({ description: 'Priority for the reassigned tasks' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;
}

export class WorkerUnavailabilityDto {
  @ApiProperty({ description: 'ID of the unavailable worker' })
  @IsUUID()
  workerId!: string;

  @ApiProperty({ description: 'Reason for unavailability' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({
    description: 'Strategy for redistributing tasks',
    enum: ['workload', 'skills', 'priority'],
    default: 'workload',
  })
  @IsOptional()
  @IsEnum(['workload', 'skills', 'priority'])
  redistributionStrategy?: 'workload' | 'skills' | 'priority';
}

export class TimeWindowDto {
  @ApiProperty({ description: 'Start date/time' })
  @IsDateString()
  start!: string;

  @ApiProperty({ description: 'End date/time' })
  @IsDateString()
  end!: string;
}

export class WorkloadBalanceConfigDto {
  @ApiPropertyOptional({ description: 'ID of the work center to balance' })
  @IsOptional()
  @IsUUID()
  workCenterId?: string;

  @ApiPropertyOptional({
    description: 'Maximum tasks per worker',
    default: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTasksPerWorker?: number;

  @ApiPropertyOptional({
    description: 'Consider worker skills when balancing',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  considerSkills?: boolean;

  @ApiPropertyOptional({ description: 'Time window for balancing' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TimeWindowDto)
  timeWindow?: TimeWindowDto;
}

export class EmergencyRedistributionDto {
  @ApiPropertyOptional({
    description: 'Priority level to filter tasks',
    enum: TaskPriority,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Tasks due within this many hours' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  dueWithinHours?: number;

  @ApiPropertyOptional({ description: 'Work center ID to filter tasks' })
  @IsOptional()
  @IsUUID()
  workCenterId?: string;
}

export class TaskReassignmentResultDto {
  @ApiProperty({ description: 'Task ID' })
  taskId!: string;

  @ApiProperty({ description: 'Previous assignee', required: false })
  previousAssignee?: any;

  @ApiProperty({ description: 'New assignee' })
  newAssignee!: any;

  @ApiProperty({ description: 'Reason for reassignment' })
  reason!: string;

  @ApiProperty({ description: 'Whether the reassignment was successful' })
  success!: boolean;

  @ApiPropertyOptional({ description: 'Error message if reassignment failed' })
  error?: string;
}

export class SingleTaskReassignDto {
  @ApiProperty({ description: 'ID of the user to reassign to' })
  @IsUUID()
  toUserId!: string;

  @ApiProperty({ description: 'Reason for reassignment' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ description: 'Priority for the reassigned task' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priority?: number;
}
