import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequireRoles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { TaskService } from './services/task.service';
import { TaskAssignmentService } from './services/task-assignment.service';
import { Task } from '../../entities/task.entity';
import { TaskAssignment } from '../../entities/task-assignment.entity';
import {
  CreateTaskDto,
  UpdateTaskDto,
  AssignTaskDto,
  ReassignTaskDto,
  UpdateProgressDto,
  CompleteTaskDto,
  TaskFilterDto,
  ChecklistItemDto,
} from './dto/task.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly assignmentService: TaskAssignmentService,
  ) {}

  @Post()
  @RequireRoles('Admin', 'Manager', 'Supervisor')
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully', type: Task })
  async create(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
    return this.taskService.create(createTaskDto);
  }

  @Get()
  @RequireRoles('Admin', 'Manager', 'Supervisor', 'Worker', 'Viewer')
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, description: 'List of tasks', type: [Task] })
  async findAll(@Query() filters: TaskFilterDto): Promise<Task[]> {
    return this.taskService.findAll(filters);
  }

  @Get('my-tasks')
  @RequireRoles('Admin', 'Manager', 'Supervisor', 'Worker')
  @ApiOperation({ summary: 'Get current user tasks' })
  @ApiResponse({ status: 200, description: 'List of user tasks', type: [Task] })
  async getMyTasks(
    @CurrentUser() user: any,
    @Query('status') status?: any,
  ): Promise<Task[]> {
    return this.taskService.getUserTasks(user.id, status);
  }

  @Get('overdue')
  @RequireRoles('Admin', 'Manager', 'Supervisor')
  @ApiOperation({ summary: 'Get overdue tasks' })
  @ApiResponse({ status: 200, description: 'List of overdue tasks', type: [Task] })
  async getOverdueTasks(): Promise<Task[]> {
    return this.taskService.getOverdueTasks();
  }

  @Get('statistics')
  @RequireRoles('Admin', 'Manager', 'Viewer')
  @ApiOperation({ summary: 'Get task assignment statistics' })
  @ApiResponse({ status: 200, description: 'Task assignment statistics' })
  async getStatistics() {
    return this.assignmentService.getAssignmentStatistics();
  }

  @Get(':id')
  @RequireRoles('Admin', 'Manager', 'Supervisor', 'Worker', 'Viewer')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task found', type: Task })
  async findOne(@Param('id') id: string): Promise<Task> {
    return this.taskService.findOne(id);
  }

  @Get(':id/assignments')
  @RequireRoles('Admin', 'Manager', 'Supervisor', 'Viewer')
  @ApiOperation({ summary: 'Get task assignments' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task assignments', type: [TaskAssignment] })
  async getTaskAssignments(@Param('id') id: string): Promise<TaskAssignment[]> {
    return this.taskService.getTaskAssignments(id);
  }

  @Put(':id')
  @RequireRoles('Admin', 'Manager', 'Supervisor')
  @ApiOperation({ summary: 'Update task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully', type: Task })
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    return this.taskService.update(id, updateTaskDto);
  }

  @Post(':id/assign')
  @RequireRoles('Admin', 'Manager', 'Supervisor')
  @ApiOperation({ summary: 'Assign task to user' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task assigned successfully', type: TaskAssignment })
  async assignTask(
    @Param('id') id: string,
    @Body() assignTaskDto: AssignTaskDto,
  ): Promise<TaskAssignment> {
    return this.taskService.assignTask(id, assignTaskDto);
  }

  @Post(':id/auto-assign')
  @RequireRoles('Admin', 'Manager', 'Supervisor')
  @ApiOperation({ summary: 'Auto-assign task based on rules' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task auto-assigned successfully' })
  async autoAssign(@Param('id') id: string): Promise<TaskAssignment | null> {
    const task = await this.taskService.findOne(id);
    return this.taskService.autoAssignTask(task);
  }

  @Post(':id/reassign')
  @RequireRoles('Admin', 'Manager', 'Supervisor')
  @ApiOperation({ summary: 'Reassign task to another user' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task reassigned successfully', type: TaskAssignment })
  async reassignTask(
    @Param('id') id: string,
    @Body() reassignTaskDto: ReassignTaskDto,
  ): Promise<TaskAssignment> {
    return this.taskService.reassignTask(
      id,
      reassignTaskDto.newUserId,
      reassignTaskDto.reason,
      reassignTaskDto.reassignedBy,
    );
  }

  @Post(':id/start')
  @RequireRoles('Admin', 'Manager', 'Supervisor', 'Worker')
  @ApiOperation({ summary: 'Start working on a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task started successfully', type: Task })
  async startTask(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<Task> {
    return this.taskService.startTask(id, user.id);
  }

  @Post(':id/pause')
  @RequireRoles('Admin', 'Manager', 'Supervisor', 'Worker')
  @ApiOperation({ summary: 'Pause a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task paused successfully', type: Task })
  async pauseTask(@Param('id') id: string): Promise<Task> {
    return this.taskService.update(id, { status: 'paused' as any });
  }

  @Post(':id/resume')
  @RequireRoles('Admin', 'Manager', 'Supervisor', 'Worker')
  @ApiOperation({ summary: 'Resume a paused task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task resumed successfully', type: Task })
  async resumeTask(@Param('id') id: string): Promise<Task> {
    return this.taskService.update(id, { status: 'in_progress' as any });
  }

  @Post(':id/complete')
  @RequireRoles('Admin', 'Manager', 'Supervisor', 'Worker')
  @ApiOperation({ summary: 'Complete a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task completed successfully', type: Task })
  async completeTask(
    @Param('id') id: string,
    @Body() completeTaskDto: CompleteTaskDto,
  ): Promise<Task> {
    // Update progress if quantities provided
    if (completeTaskDto.completedQuantity !== undefined) {
      await this.taskService.updateProgress(
        id,
        completeTaskDto.completedQuantity,
        completeTaskDto.rejectedQuantity,
      );
    }
    
    return this.taskService.completeTask(
      id,
      completeTaskDto.userId,
      completeTaskDto.notes,
    );
  }

  @Post(':id/cancel')
  @RequireRoles('Admin', 'Manager', 'Supervisor')
  @ApiOperation({ summary: 'Cancel a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Task cancelled successfully', type: Task })
  async cancelTask(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ): Promise<Task> {
    return this.taskService.update(id, {
      status: 'cancelled' as any,
      failureReason: reason,
    });
  }

  @Patch(':id/progress')
  @RequireRoles('Admin', 'Manager', 'Supervisor', 'Worker')
  @ApiOperation({ summary: 'Update task progress' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Progress updated successfully', type: Task })
  async updateProgress(
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ): Promise<Task> {
    return this.taskService.updateProgress(
      id,
      updateProgressDto.completedQuantity,
      updateProgressDto.rejectedQuantity,
    );
  }

  @Patch(':id/checklist')
  @RequireRoles('Admin', 'Manager', 'Supervisor', 'Worker')
  @ApiOperation({ summary: 'Update checklist item' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 200, description: 'Checklist updated successfully', type: Task })
  async updateChecklist(
    @Param('id') id: string,
    @Body() checklistItemDto: ChecklistItemDto,
  ): Promise<Task> {
    const task = await this.taskService.findOne(id);
    
    if (task.checklistItems) {
      const item = task.checklistItems.find(i => i.id === checklistItemDto.id);
      if (item) {
        item.completed = checklistItemDto.completed;
        if (checklistItemDto.completed) {
          item.completedAt = new Date();
          item.completedBy = checklistItemDto.completedBy;
        }
      }
    }
    
    return this.taskService.update(id, { checklistItems: task.checklistItems });
  }

  @Post('rebalance')
  @RequireRoles('Admin', 'Manager')
  @ApiOperation({ summary: 'Rebalance task assignments' })
  @ApiResponse({ status: 200, description: 'Tasks rebalanced successfully' })
  @HttpCode(HttpStatus.OK)
  async rebalanceAssignments(): Promise<{ message: string }> {
    await this.assignmentService.rebalanceAssignments();
    return { message: 'Task assignments rebalanced successfully' };
  }

  @Delete(':id')
  @RequireRoles('Admin')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiResponse({ status: 204, description: 'Task deleted successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    // Soft delete by setting status to cancelled
    await this.taskService.update(id, {
      status: 'cancelled' as any,
      failureReason: 'Task deleted',
    });
  }
}