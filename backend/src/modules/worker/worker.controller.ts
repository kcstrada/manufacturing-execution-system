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
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { WorkerService } from './worker.service';
import {
  CreateWorkerDto,
  UpdateWorkerDto,
  UpdateWorkerStatusDto,
  UpdateWorkerSkillsDto,
  FindWorkersWithSkillsDto,
  CheckAvailabilityDto,
  UpdatePerformanceMetricsDto,
  WorkerFilterDto,
} from './dto/worker.dto';
import { Worker } from '../../entities/worker.entity';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('Workers')
@ApiBearerAuth()
@Controller('workers')
@UseGuards(AuthGuard, RoleGuard)
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Get()
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @ApiOperation({ summary: 'Get all workers with optional filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of workers',
    type: [Worker],
  })
  async findAll(@Query() filters: WorkerFilterDto): Promise<Worker[]> {
    return this.workerService.findAll(filters);
  }

  @Get('current')
  @Roles({ roles: ['worker'] })
  @ApiOperation({ summary: 'Get current worker profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current worker profile',
    type: Worker,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Worker profile not found',
  })
  async getCurrentWorker(@CurrentUser() user: any): Promise<Worker | null> {
    return this.workerService.findByUserId(user.id);
  }

  @Post('find-with-skills')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Find workers with specific skills' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workers matching skill requirements',
  })
  async findWorkersWithSkills(@Body() dto: FindWorkersWithSkillsDto) {
    return this.workerService.findWorkersWithSkills(dto.skillRequirements, {
      includeUnavailable: dto.includeUnavailable,
      workCenterId: dto.workCenterId,
      minimumMatchScore: dto.minimumMatchScore,
    });
  }

  @Get('task/:taskId/best-matches')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Find best worker matches for a task' })
  @ApiParam({ name: 'taskId', description: 'Task ID' })
  @ApiQuery({
    name: 'considerWorkload',
    required: false,
    description: 'Consider worker workload',
  })
  @ApiQuery({
    name: 'considerPerformance',
    required: false,
    description: 'Consider worker performance',
  })
  @ApiQuery({
    name: 'maxCandidates',
    required: false,
    description: 'Maximum number of candidates',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Best matching workers for the task',
  })
  async findBestMatchesForTask(
    @Param('taskId') taskId: string,
    @Query('considerWorkload') considerWorkload?: boolean,
    @Query('considerPerformance') considerPerformance?: boolean,
    @Query('maxCandidates') maxCandidates?: number,
  ) {
    return this.workerService.findBestMatchForTask(taskId, {
      considerWorkload,
      considerPerformance,
      maxCandidates,
    });
  }

  @Get(':id')
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @ApiOperation({ summary: 'Get worker by ID' })
  @ApiParam({ name: 'id', description: 'Worker ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Worker details',
    type: Worker,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Worker not found',
  })
  async findOne(@Param('id') id: string): Promise<Worker> {
    return this.workerService.findOne(id);
  }

  @Get(':id/workload')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Get worker workload analysis' })
  @ApiParam({ name: 'id', description: 'Worker ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Worker workload analysis',
  })
  async getWorkload(@Param('id') id: string) {
    return this.workerService.getWorkerWorkload(id);
  }

  @Get(':id/performance')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Get worker performance metrics' })
  @ApiParam({ name: 'id', description: 'Worker ID' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for metrics',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for metrics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Worker performance metrics',
  })
  async getPerformance(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const dateRange =
      startDate && endDate
        ? { start: new Date(startDate), end: new Date(endDate) }
        : undefined;

    return this.workerService.getWorkerPerformance(id, dateRange);
  }

  @Post(':id/check-availability')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Check worker availability' })
  @ApiParam({ name: 'id', description: 'Worker ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Availability check result',
  })
  async checkAvailability(
    @Param('id') id: string,
    @Body() dto: CheckAvailabilityDto,
  ) {
    return this.workerService.checkAvailability({
      workerId: id,
      date: new Date(dto.date),
      startTime: dto.startTime,
      endTime: dto.endTime,
      hoursNeeded: dto.hoursNeeded,
    });
  }

  @Post()
  @Roles({ roles: ['admin', 'executive'] })
  @ApiOperation({ summary: 'Create a new worker' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Worker created successfully',
    type: Worker,
  })
  async create(@Body() _dto: CreateWorkerDto): Promise<Worker> {
    // This would need to be implemented in the service
    throw new Error('Create method not yet implemented');
  }

  @Put(':id')
  @Roles({ roles: ['admin', 'executive'] })
  @ApiOperation({ summary: 'Update worker details' })
  @ApiParam({ name: 'id', description: 'Worker ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Worker updated successfully',
    type: Worker,
  })
  async update(
    @Param('id') _id: string,
    @Body() _dto: UpdateWorkerDto,
  ): Promise<Worker> {
    // This would need to be implemented in the service
    throw new Error('Update method not yet implemented');
  }

  @Patch(':id/status')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Update worker status' })
  @ApiParam({ name: 'id', description: 'Worker ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Worker status updated',
    type: Worker,
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateWorkerStatusDto,
  ): Promise<Worker> {
    return this.workerService.updateStatus(id, dto.status, dto.reason);
  }

  @Patch(':id/skills')
  @Roles({ roles: ['admin', 'executive'] })
  @ApiOperation({ summary: 'Update worker skills' })
  @ApiParam({ name: 'id', description: 'Worker ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Worker skills updated',
    type: Worker,
  })
  async updateSkills(
    @Param('id') id: string,
    @Body() dto: UpdateWorkerSkillsDto,
  ): Promise<Worker> {
    return this.workerService.updateSkills(
      id,
      dto.skills.map((skill) => ({
        name: skill.name,
        level: skill.level,
        certifiedDate: skill.certifiedDate
          ? new Date(skill.certifiedDate)
          : undefined,
        expiryDate: skill.expiryDate ? new Date(skill.expiryDate) : undefined,
      })),
    );
  }

  @Patch(':id/performance')
  @Roles({ roles: ['admin', 'executive'] })
  @ApiOperation({ summary: 'Update worker performance metrics' })
  @ApiParam({ name: 'id', description: 'Worker ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Performance metrics updated',
    type: Worker,
  })
  async updatePerformanceMetrics(
    @Param('id') id: string,
    @Body() dto: UpdatePerformanceMetricsDto,
  ): Promise<Worker> {
    return this.workerService.recordPerformanceMetrics(id, dto);
  }

  @Delete(':id')
  @Roles({ roles: ['admin'] })
  @ApiOperation({ summary: 'Delete a worker' })
  @ApiParam({ name: 'id', description: 'Worker ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Worker deleted successfully',
  })
  async delete(@Param('id') _id: string): Promise<void> {
    // This would need to be implemented in the service
    throw new Error('Delete method not yet implemented');
  }
}
