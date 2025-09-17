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
} from '@nestjs/swagger';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { ShiftSchedulingService } from './shift-scheduling.service';
import {
  GenerateScheduleDto,
  CoverageAnalysisDto,
  ShiftSwapRequestDto,
  ApplyPatternDto,
  UpdateAssignmentStatusDto,
  CreateShiftDto,
  UpdateShiftDto,
  CreateShiftExceptionDto,
  WorkerScheduleDto,
  ShiftFilterDto,
  ConflictCheckDto,
} from './dto/shift-scheduling.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Shift, ShiftAssignment } from '../../entities/shift.entity';

@ApiTags('Shift Scheduling')
@ApiBearerAuth()
@Controller('shifts')
@UseGuards(AuthGuard, RoleGuard)
export class ShiftSchedulingController {
  constructor(private readonly schedulingService: ShiftSchedulingService) {}

  @Post('schedule/generate')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Generate shift schedule for a period' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Schedule generated successfully',
    type: [ShiftAssignment],
  })
  async generateSchedule(
    @Body() dto: GenerateScheduleDto,
  ): Promise<ShiftAssignment[]> {
    return this.schedulingService.generateSchedule({
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      shiftIds: dto.shiftIds,
      departmentId: dto.departmentId,
      workCenterId: dto.workCenterId,
      autoAssign: dto.autoAssign,
      respectSkillRequirements: dto.respectSkillRequirements,
      balanceWorkload: dto.balanceWorkload,
    });
  }

  @Post('coverage/analyze')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Analyze shift coverage for a period' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Coverage analysis results',
  })
  async analyzeCoverage(@Body() dto: CoverageAnalysisDto) {
    return this.schedulingService.analyzeCoverage(
      new Date(dto.startDate),
      new Date(dto.endDate),
      dto.shiftIds,
    );
  }

  @Post('swap')
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @ApiOperation({ summary: 'Request a shift swap between workers' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shift swap completed',
    type: ShiftAssignment,
  })
  async requestShiftSwap(
    @Body() dto: ShiftSwapRequestDto,
    @CurrentUser() user: any,
  ): Promise<ShiftAssignment> {
    return this.schedulingService.requestShiftSwap({
      ...dto,
      requestedBy: user.id,
    });
  }

  @Post('pattern/apply')
  @Roles({ roles: ['admin', 'executive'] })
  @ApiOperation({ summary: 'Apply a shift pattern to workers' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Pattern applied successfully',
    type: [ShiftAssignment],
  })
  async applyShiftPattern(
    @Body() dto: ApplyPatternDto,
  ): Promise<ShiftAssignment[]> {
    return this.schedulingService.applyShiftPattern(
      {
        ...dto.pattern,
        startDate: new Date(dto.pattern.startDate),
      },
      dto.workerIds,
      new Date(dto.startDate),
      new Date(dto.endDate),
    );
  }

  @Post('conflicts/check')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Check for scheduling conflicts' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Conflict check results',
  })
  async checkConflicts(@Body() dto: ConflictCheckDto) {
    return this.schedulingService.detectConflicts(
      dto.workerId,
      new Date(dto.startDate),
      new Date(dto.endDate),
    );
  }

  @Get('worker/:workerId/schedule')
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @ApiOperation({ summary: 'Get worker schedule for a period' })
  @ApiParam({ name: 'workerId', description: 'Worker ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Worker schedule',
    type: [ShiftAssignment],
  })
  async getWorkerSchedule(
    @Param('workerId') _workerId: string,
    @Query() _query: WorkerScheduleDto,
  ) {
    // This would need to be implemented in the service
    throw new Error('Method not yet implemented');
  }

  @Get()
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @ApiOperation({ summary: 'Get all shifts with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of shifts',
    type: [Shift],
  })
  async findAllShifts(@Query() _filters: ShiftFilterDto) {
    // This would need to be implemented in the service
    throw new Error('Method not yet implemented');
  }

  @Get(':id')
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @ApiOperation({ summary: 'Get shift by ID' })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shift details',
    type: Shift,
  })
  async findOneShift(@Param('id') _id: string) {
    // This would need to be implemented in the service
    throw new Error('Method not yet implemented');
  }

  @Post()
  @Roles({ roles: ['admin', 'executive'] })
  @ApiOperation({ summary: 'Create a new shift' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Shift created successfully',
    type: Shift,
  })
  async createShift(@Body() _dto: CreateShiftDto) {
    // This would need to be implemented in the service
    throw new Error('Method not yet implemented');
  }

  @Put(':id')
  @Roles({ roles: ['admin', 'executive'] })
  @ApiOperation({ summary: 'Update a shift' })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shift updated successfully',
    type: Shift,
  })
  async updateShift(@Param('id') _id: string, @Body() _dto: UpdateShiftDto) {
    // This would need to be implemented in the service
    throw new Error('Method not yet implemented');
  }

  @Delete(':id')
  @Roles({ roles: ['admin'] })
  @ApiOperation({ summary: 'Delete a shift' })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Shift deleted successfully',
  })
  async deleteShift(@Param('id') _id: string) {
    // This would need to be implemented in the service
    throw new Error('Method not yet implemented');
  }

  @Post('exceptions')
  @Roles({ roles: ['admin', 'executive'] })
  @ApiOperation({ summary: 'Create a shift exception' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Exception created successfully',
  })
  async createException(@Body() _dto: CreateShiftExceptionDto) {
    // This would need to be implemented in the service
    throw new Error('Method not yet implemented');
  }

  @Patch('assignments/:id/status')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Update assignment status' })
  @ApiParam({ name: 'id', description: 'Assignment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assignment status updated',
    type: ShiftAssignment,
  })
  async updateAssignmentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAssignmentStatusDto,
  ): Promise<ShiftAssignment> {
    return this.schedulingService.updateAssignmentStatus(
      id,
      dto.status,
      dto.notes,
    );
  }

  @Get('assignments/:date/available-workers')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Get available workers for a shift date' })
  @ApiParam({ name: 'date', description: 'Date (YYYY-MM-DD)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available workers',
  })
  async getAvailableWorkers(
    @Param('date') _date: string,
    @Query('shiftId') _shiftId: string,
  ) {
    // This would need to be implemented in the service
    throw new Error('Method not yet implemented');
  }
}
