import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { TaskPriority } from '../../../entities/task.entity';

export class GenerateTasksDto {
  @ApiPropertyOptional({
    description: 'Priority for generated tasks',
    enum: TaskPriority,
    default: TaskPriority.NORMAL,
  })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Automatically assign tasks to work centers',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  assignToWorkCenter?: boolean;

  @ApiPropertyOptional({
    description: 'Automatically schedule tasks based on routing',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  autoSchedule?: boolean;

  @ApiPropertyOptional({
    description: 'Include quality check tasks',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeQualityChecks?: boolean;

  @ApiPropertyOptional({
    description: 'Include setup tasks for work centers',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeSetupTasks?: boolean;
}

export class TaskGenerationResultDto {
  @ApiProperty({ description: 'Number of production orders created' })
  productionOrdersCount!: number;

  @ApiProperty({ description: 'Number of work orders created' })
  workOrdersCount!: number;

  @ApiProperty({ description: 'Number of tasks created' })
  tasksCount!: number;

  @ApiProperty({ description: 'Production order IDs', type: [String] })
  productionOrderIds!: string[];

  @ApiProperty({ description: 'Work order IDs', type: [String] })
  workOrderIds!: string[];

  @ApiProperty({ description: 'Task IDs', type: [String] })
  taskIds!: string[];

  @ApiProperty({
    description: 'Warnings encountered during generation',
    type: [String],
  })
  warnings!: string[];
}

export class GenerateTasksForProductionOrderDto {
  @ApiProperty({
    description: 'Production order ID',
    format: 'uuid',
  })
  @IsUUID()
  productionOrderId!: string;

  @ApiPropertyOptional({
    description: 'Priority for generated tasks',
    enum: TaskPriority,
    default: TaskPriority.NORMAL,
  })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Include quality check tasks',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeQualityChecks?: boolean;

  @ApiPropertyOptional({
    description: 'Include setup tasks',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeSetupTasks?: boolean;
}
