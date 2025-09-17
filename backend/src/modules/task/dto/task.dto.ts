import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDate,
  IsArray,
  IsUUID,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  TaskStatus,
  TaskPriority,
  TaskType,
} from '../../../entities/task.entity';

export class CreateTaskDto {
  @ApiProperty({ description: 'Task name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Task description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TaskType, description: 'Task type' })
  @IsEnum(TaskType)
  type!: TaskType;

  @ApiProperty({ enum: TaskPriority, description: 'Task priority' })
  @IsEnum(TaskPriority)
  priority!: TaskPriority;

  @ApiProperty({ description: 'Work order ID' })
  @IsUUID()
  workOrderId!: string;

  @ApiPropertyOptional({ description: 'Work center ID' })
  @IsOptional()
  @IsUUID()
  workCenterId?: string;

  @ApiPropertyOptional({ description: 'Product ID' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ description: 'Sequence number' })
  @IsNumber()
  @Min(1)
  sequenceNumber!: number;

  @ApiProperty({ description: 'Estimated hours' })
  @IsNumber()
  @Min(0)
  estimatedHours!: number;

  @ApiProperty({ description: 'Target quantity' })
  @IsNumber()
  @Min(0)
  targetQuantity!: number;

  @ApiPropertyOptional({ description: 'Scheduled start date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledStartDate?: Date;

  @ApiPropertyOptional({ description: 'Scheduled end date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledEndDate?: Date;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Required skills' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredSkills?: string[];

  @ApiPropertyOptional({ description: 'Required tools' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredTools?: string[];

  @ApiPropertyOptional({ description: 'Instructions' })
  @IsOptional()
  @IsObject()
  instructions?: {
    setup?: string[];
    operation?: string[];
    qualityChecks?: string[];
    safety?: string[];
  };

  @ApiPropertyOptional({ description: 'Checklist items' })
  @IsOptional()
  @IsArray()
  checklistItems?: Array<{
    id: string;
    description: string;
    completed: boolean;
  }>;

  @ApiPropertyOptional({ description: 'Requires sign-off' })
  @IsOptional()
  @IsBoolean()
  requiresSignOff?: boolean;

  @ApiPropertyOptional({ description: 'Auto-assign task' })
  @IsOptional()
  @IsBoolean()
  autoAssign?: boolean;

  @ApiPropertyOptional({ description: 'Assigned to user ID' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Dependency task IDs' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  dependencyIds?: string[];
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'Task name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Task description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TaskStatus, description: 'Task status' })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: TaskPriority, description: 'Task priority' })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: 'Estimated hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @ApiPropertyOptional({ description: 'Actual hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualHours?: number;

  @ApiPropertyOptional({ description: 'Target quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetQuantity?: number;

  @ApiPropertyOptional({ description: 'Completed quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  completedQuantity?: number;

  @ApiPropertyOptional({ description: 'Rejected quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;

  @ApiPropertyOptional({ description: 'Progress percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage?: number;

  @ApiPropertyOptional({ description: 'Scheduled start date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledStartDate?: Date;

  @ApiPropertyOptional({ description: 'Scheduled end date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledEndDate?: Date;

  @ApiPropertyOptional({ description: 'Due date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Failure reason' })
  @IsOptional()
  @IsString()
  failureReason?: string;

  @ApiPropertyOptional({ description: 'Checklist items' })
  @IsOptional()
  @IsArray()
  checklistItems?: Array<{
    id: string;
    description: string;
    completed: boolean;
    completedAt?: Date;
    completedBy?: string;
  }>;
}

export class AssignTaskDto {
  @ApiProperty({ description: 'User ID to assign task to' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ description: 'Assigned by user ID' })
  @IsOptional()
  @IsUUID()
  assignedById?: string;

  @ApiPropertyOptional({ description: 'Assignment priority' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  priority?: number;

  @ApiPropertyOptional({ description: 'Assignment notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Force assignment even if user lacks skills',
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export class ReassignTaskDto {
  @ApiProperty({ description: 'New user ID' })
  @IsUUID()
  newUserId!: string;

  @ApiProperty({ description: 'Reason for reassignment' })
  @IsString()
  reason!: string;

  @ApiProperty({ description: 'Reassigned by user ID' })
  @IsUUID()
  reassignedBy!: string;
}

export class UpdateProgressDto {
  @ApiProperty({ description: 'Completed quantity' })
  @IsNumber()
  @Min(0)
  completedQuantity!: number;

  @ApiPropertyOptional({ description: 'Rejected quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteTaskDto {
  @ApiProperty({ description: 'User ID completing the task' })
  @IsUUID()
  userId!: string;

  @ApiPropertyOptional({ description: 'Completion notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Final completed quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  completedQuantity?: number;

  @ApiPropertyOptional({ description: 'Final rejected quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;
}

export class TaskFilterDto {
  @ApiPropertyOptional({ enum: TaskStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({
    enum: TaskPriority,
    description: 'Filter by priority',
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ enum: TaskType, description: 'Filter by type' })
  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @ApiPropertyOptional({ description: 'Filter by work order ID' })
  @IsOptional()
  @IsUUID()
  workOrderId?: string;

  @ApiPropertyOptional({ description: 'Filter by assigned user ID' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Filter by work center ID' })
  @IsOptional()
  @IsUUID()
  workCenterId?: string;

  @ApiPropertyOptional({ description: 'Filter overdue tasks' })
  @IsOptional()
  @IsBoolean()
  overdue?: boolean;

  @ApiPropertyOptional({ description: 'Include completed tasks' })
  @IsOptional()
  @IsBoolean()
  includeCompleted?: boolean;
}

export class ChecklistItemDto {
  @ApiProperty({ description: 'Checklist item ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Mark as completed' })
  @IsBoolean()
  completed!: boolean;

  @ApiPropertyOptional({ description: 'Completed by user ID' })
  @IsOptional()
  @IsUUID()
  completedBy?: string;
}
