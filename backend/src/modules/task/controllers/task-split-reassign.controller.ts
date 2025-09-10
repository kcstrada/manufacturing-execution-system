import {
  Controller,
  Post,
  Body,
  Param,
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
import { TaskSplitReassignService } from '../services/task-split-reassign.service';
import {
  TaskSplitConfigDto,
  BulkReassignConfigDto,
  WorkerUnavailabilityDto,
  WorkloadBalanceConfigDto,
  EmergencyRedistributionDto,
  TaskReassignmentResultDto,
  SingleTaskReassignDto,
} from '../dto/task-split-reassign.dto';
import { Task } from '../../../entities/task.entity';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';

@ApiTags('Task Management - Split & Reassign')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(AuthGuard, RoleGuard)
export class TaskSplitReassignController {
  constructor(
    private readonly splitReassignService: TaskSplitReassignService,
  ) {}

  @Post('split')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Split a task into subtasks with optional assignments' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task split successfully',
    type: [Task],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Task cannot be split (already started or invalid config)',
  })
  async splitTaskWithAssignments(
    @Body() dto: TaskSplitConfigDto,
  ): Promise<Task[]> {
    return this.splitReassignService.splitTaskWithAssignments(dto);
  }

  @Post(':taskId/reassign')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Reassign a single task to another user' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task reassigned successfully',
    type: TaskReassignmentResultDto,
  })
  async reassignSingleTask(
    @Param('taskId') taskId: string,
    @Body() dto: SingleTaskReassignDto,
    @CurrentUser() user: any,
  ): Promise<TaskReassignmentResultDto> {
    const results = await this.splitReassignService.bulkReassignTasks({
      taskIds: [taskId],
      toUserId: dto.toUserId,
      reason: dto.reason,
      reassignedBy: user.id || 'system',
      priority: dto.priority,
    });

    return results[0] || {
      taskId,
      newAssignee: { id: dto.toUserId },
      reason: dto.reason,
      success: false,
      error: 'Task not found or could not be reassigned',
    } as TaskReassignmentResultDto;
  }

  @Post('bulk-reassign')
  @Roles({ roles: ['admin', 'executive'] })
  @ApiOperation({ summary: 'Bulk reassign multiple tasks' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tasks reassigned',
    type: [TaskReassignmentResultDto],
  })
  async bulkReassignTasks(
    @Body() dto: BulkReassignConfigDto,
  ): Promise<TaskReassignmentResultDto[]> {
    return this.splitReassignService.bulkReassignTasks(dto);
  }

  @Post('worker-unavailable')
  @Roles({ roles: ['admin', 'executive'] })
  @ApiOperation({ summary: 'Handle worker unavailability and redistribute tasks' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tasks redistributed',
    type: [TaskReassignmentResultDto],
  })
  async handleWorkerUnavailability(
    @Body() dto: WorkerUnavailabilityDto,
  ): Promise<TaskReassignmentResultDto[]> {
    return this.splitReassignService.handleWorkerUnavailability(
      dto.workerId,
      dto.reason,
      dto.redistributionStrategy || 'workload',
    );
  }

  @Post('balance-workload')
  @Roles({ roles: ['admin', 'executive'] })
  @ApiOperation({ summary: 'Balance workload across workers' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workload balanced',
    type: [TaskReassignmentResultDto],
  })
  async balanceWorkload(
    @Body() dto: WorkloadBalanceConfigDto,
  ): Promise<TaskReassignmentResultDto[]> {
    const config = {
      ...dto,
      timeWindow: dto.timeWindow
        ? {
            start: new Date(dto.timeWindow.start),
            end: new Date(dto.timeWindow.end),
          }
        : undefined,
    };
    return this.splitReassignService.balanceWorkload(config);
  }

  @Post('emergency-redistribution')
  @Roles({ roles: ['admin', 'executive'] })
  @ApiOperation({ summary: 'Emergency redistribution of urgent tasks' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tasks redistributed',
    type: [TaskReassignmentResultDto],
  })
  async emergencyRedistribution(
    @Body() dto: EmergencyRedistributionDto,
  ): Promise<TaskReassignmentResultDto[]> {
    return this.splitReassignService.emergencyRedistribution(dto);
  }
}