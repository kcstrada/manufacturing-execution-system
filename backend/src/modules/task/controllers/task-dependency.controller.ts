import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { TaskDependencyService } from '../services/task-dependency.service';
import {
  AddDependencyDto,
  GetDependenciesDto,
  SplitTaskDto,
  DependencyValidationResultDto,
  DependencyGraphDto,
} from '../dto/task-dependency.dto';
import { Task } from '../../../entities/task.entity';

@ApiTags('Task Dependencies')
@ApiBearerAuth()
@Controller('tasks/:taskId/dependencies')
@UseGuards(AuthGuard, RoleGuard)
export class TaskDependencyController {
  constructor(
    private readonly dependencyService: TaskDependencyService,
  ) {}

  @Post()
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Add a dependency to a task' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Dependency added successfully',
    type: Task,
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid dependency or would create circular dependency',
  })
  async addDependency(
    @Param('taskId') taskId: string,
    @Body() dto: AddDependencyDto,
  ): Promise<Task> {
    return this.dependencyService.addDependency(taskId, dto.dependsOnTaskId);
  }

  @Delete(':dependencyId')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Remove a dependency from a task' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiParam({ name: 'dependencyId', description: 'Dependency task ID to remove' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Dependency removed successfully',
    type: Task,
  })
  async removeDependency(
    @Param('taskId') taskId: string,
    @Param('dependencyId') dependencyId: string,
  ): Promise<Task> {
    return this.dependencyService.removeDependency(taskId, dependencyId);
  }

  @Get()
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @ApiOperation({ summary: 'Get dependencies for a task' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Task dependencies retrieved',
    type: [Task],
  })
  async getTaskDependencies(
    @Param('taskId') taskId: string,
    @Query() query: GetDependenciesDto,
  ): Promise<Task[]> {
    return this.dependencyService.getTaskDependencies(
      taskId,
      query.includeTransitive,
    );
  }

  @Get('dependents')
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @ApiOperation({ summary: 'Get tasks that depend on this task' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Dependent tasks retrieved',
    type: [Task],
  })
  async getTaskDependents(
    @Param('taskId') taskId: string,
    @Query() query: GetDependenciesDto,
  ): Promise<Task[]> {
    return this.dependencyService.getTaskDependents(
      taskId,
      query.includeTransitive,
    );
  }

  @Post('split')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Split a task into subtasks' })
  @ApiParam({ name: 'taskId', description: 'Task ID to split' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Task split successfully',
    type: [Task],
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Task cannot be split (already started or completed)',
  })
  async splitTask(
    @Param('taskId') taskId: string,
    @Body() dto: SplitTaskDto,
  ): Promise<Task[]> {
    return this.dependencyService.splitTask(taskId, dto);
  }
}

@ApiTags('Work Order Dependencies')
@ApiBearerAuth()
@Controller('work-orders/:workOrderId/dependencies')
@UseGuards(AuthGuard, RoleGuard)
export class WorkOrderDependencyController {
  constructor(
    private readonly dependencyService: TaskDependencyService,
  ) {}

  @Get('validate')
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @ApiOperation({ summary: 'Validate dependencies for a work order' })
  @ApiParam({ name: 'workOrderId', description: 'Work Order ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Dependency validation results',
    type: DependencyValidationResultDto,
  })
  async validateDependencies(
    @Param('workOrderId') workOrderId: string,
  ): Promise<DependencyValidationResultDto> {
    return this.dependencyService.validateDependencies(workOrderId);
  }

  @Get('graph')
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @ApiOperation({ summary: 'Get dependency graph for a work order' })
  @ApiParam({ name: 'workOrderId', description: 'Work Order ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Dependency graph data',
    type: DependencyGraphDto,
  })
  async getDependencyGraph(
    @Param('workOrderId') workOrderId: string,
  ): Promise<DependencyGraphDto> {
    const graph = await this.dependencyService.buildDependencyGraph(workOrderId);
    const criticalPath = await this.dependencyService.getCriticalPath(workOrderId);
    
    // Calculate total duration
    let totalDuration = 0;
    for (const task of criticalPath) {
      totalDuration += task.estimatedHours;
    }

    // Convert graph to DTO format
    const nodes = Array.from(graph.nodes.values()).map(task => ({
      id: task.id,
      taskNumber: task.taskNumber,
      name: task.name,
      status: task.status,
      estimatedHours: task.estimatedHours,
      dependencies: Array.from(graph.edges.get(task.id) || []),
      dependents: Array.from(graph.reverseEdges.get(task.id) || []),
    }));

    return {
      nodes,
      criticalPath: criticalPath.map(t => t.id),
      totalDuration,
    };
  }

  @Get('critical-path')
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @ApiOperation({ summary: 'Get critical path for a work order' })
  @ApiParam({ name: 'workOrderId', description: 'Work Order ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Critical path tasks',
    type: [Task],
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Cannot calculate critical path due to circular dependencies',
  })
  async getCriticalPath(
    @Param('workOrderId') workOrderId: string,
  ): Promise<Task[]> {
    return this.dependencyService.getCriticalPath(workOrderId);
  }
}