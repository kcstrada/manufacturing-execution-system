import { IsUUID, IsBoolean, IsArray, IsNumber, IsString, IsOptional, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddDependencyDto {
  @ApiProperty({ description: 'ID of the task that this task depends on' })
  @IsUUID()
  dependsOnTaskId!: string;
}

export class RemoveDependencyDto {
  @ApiProperty({ description: 'ID of the dependency task to remove' })
  @IsUUID()
  dependsOnTaskId!: string;
}

export class GetDependenciesDto {
  @ApiPropertyOptional({ description: 'Include transitive dependencies' })
  @IsOptional()
  @IsBoolean()
  includeTransitive?: boolean;
}

export class SubtaskDto {
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
}

export class SplitTaskDto {
  @ApiProperty({ 
    description: 'Subtasks to create',
    type: [SubtaskDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubtaskDto)
  subtasks!: SubtaskDto[];

  @ApiPropertyOptional({ 
    description: 'Whether to preserve original task dependencies',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  preserveDependencies?: boolean;
}

export class DependencyValidationResultDto {
  @ApiProperty({ description: 'Whether the dependencies are valid' })
  isValid!: boolean;

  @ApiProperty({ 
    description: 'List of validation issues',
    type: [String],
  })
  issues!: string[];

  @ApiPropertyOptional({ 
    description: 'Circular dependency chains found',
    type: 'array',
    items: {
      type: 'array',
      items: { type: 'string' },
    },
  })
  circularDependencies?: string[][];

  @ApiPropertyOptional({ 
    description: 'Tasks with incomplete dependencies',
    type: [Object],
  })
  incompleteDependencies?: any[];

  @ApiPropertyOptional({ 
    description: 'Tasks that are ready to start',
    type: [Object],
  })
  readyTasks?: any[];

  @ApiPropertyOptional({ 
    description: 'Tasks that are blocked by dependencies',
    type: [Object],
  })
  blockedTasks?: any[];
}

export class TaskGraphNodeDto {
  @ApiProperty({ description: 'Task ID' })
  id!: string;

  @ApiProperty({ description: 'Task number' })
  taskNumber!: string;

  @ApiProperty({ description: 'Task name' })
  name!: string;

  @ApiProperty({ description: 'Task status' })
  status!: string;

  @ApiProperty({ description: 'Estimated hours' })
  estimatedHours!: number;

  @ApiProperty({ 
    description: 'IDs of tasks this task depends on',
    type: [String],
  })
  dependencies!: string[];

  @ApiProperty({ 
    description: 'IDs of tasks that depend on this task',
    type: [String],
  })
  dependents!: string[];
}

export class DependencyGraphDto {
  @ApiProperty({ 
    description: 'Nodes in the dependency graph',
    type: [TaskGraphNodeDto],
  })
  nodes!: TaskGraphNodeDto[];

  @ApiProperty({ 
    description: 'Critical path through the tasks',
    type: [String],
  })
  criticalPath!: string[];

  @ApiProperty({ description: 'Total project duration in hours' })
  totalDuration!: number;
}