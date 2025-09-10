import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import { TimeClockService } from './time-clock.service';
import {
  ClockInDto,
  ClockOutDto,
  BreakDto,
  ManualClockEntryDto,
  ApproveClockEntryDto,
  CorrectTimeEntryDto,
  TimeClockReportDto,
  TimeClockStatusDto,
  TimeClockRuleDto,
  WorkerTimeStatusResponseDto,
  TimeClockValidationResponseDto,
} from './dto/time-clock.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { TimeClockEntry, TimeClockSession, TimeClockRule } from '../../entities/time-clock.entity';

@ApiTags('Time Clock')
@ApiBearerAuth()
@Controller('time-clock')
@UseGuards(AuthGuard, RoleGuard)
export class TimeClockController {
  constructor(private readonly timeClockService: TimeClockService) {}

  @Post('clock-in')
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clock in for work' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully clocked in',
    type: TimeClockEntry,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Worker is already clocked in',
  })
  async clockIn(
    @Body() dto: ClockInDto,
    @CurrentUser() user: any,
  ): Promise<TimeClockEntry> {
    // In a real implementation, we would map the user to their worker ID
    // For now, we'll use the user ID as the worker ID
    return this.timeClockService.clockIn(user.id, dto);
  }

  @Post('clock-out')
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clock out from work' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully clocked out',
    type: TimeClockEntry,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Worker is not clocked in',
  })
  async clockOut(
    @Body() dto: ClockOutDto,
    @CurrentUser() user: any,
  ): Promise<TimeClockEntry> {
    return this.timeClockService.clockOut(user.id, dto);
  }

  @Post('break')
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record break start or end' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Break recorded successfully',
    type: TimeClockEntry,
  })
  async recordBreak(
    @Body() dto: BreakDto,
    @CurrentUser() user: any,
  ): Promise<TimeClockEntry> {
    return this.timeClockService.recordBreak(user.id, dto);
  }

  @Post('manual-entry')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Create manual time clock entry' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Manual entry created successfully',
    type: TimeClockEntry,
  })
  async createManualEntry(
    @Body() dto: ManualClockEntryDto,
    @CurrentUser() user: any,
  ): Promise<TimeClockEntry> {
    return this.timeClockService.createManualEntry(dto, user.id);
  }

  @Put('approve')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Approve or reject time clock entry' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entry approval updated',
    type: TimeClockEntry,
  })
  async approveEntry(
    @Body() dto: ApproveClockEntryDto,
    @CurrentUser() user: any,
  ): Promise<TimeClockEntry> {
    return this.timeClockService.approveEntry(dto, user.id);
  }

  @Put('correct')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Correct time clock session' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Session corrected successfully',
    type: TimeClockSession,
  })
  async correctTimeEntry(
    @Body() dto: CorrectTimeEntryDto,
    @CurrentUser() user: any,
  ): Promise<TimeClockSession> {
    return this.timeClockService.correctTimeEntry(dto, user.id);
  }

  @Get('status')
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @ApiOperation({ summary: 'Get worker time clock status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Worker status retrieved',
    type: [WorkerTimeStatusResponseDto],
  })
  async getWorkerStatus(
    @Query() dto: TimeClockStatusDto,
  ): Promise<WorkerTimeStatusResponseDto[]> {
    return this.timeClockService.getWorkerStatus(dto);
  }

  @Get('status/:workerId')
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @ApiOperation({ summary: 'Get specific worker time clock status' })
  @ApiParam({ name: 'workerId', description: 'Worker ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Worker status retrieved',
    type: WorkerTimeStatusResponseDto,
  })
  async getSpecificWorkerStatus(
    @Param('workerId') workerId: string,
  ): Promise<WorkerTimeStatusResponseDto[]> {
    return this.timeClockService.getWorkerStatus({ workerId });
  }

  @Post('validate')
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate clock event before submission' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Validation result',
    type: TimeClockValidationResponseDto,
  })
  async validateClockEvent(
    @Body() dto: { workerId: string; eventType: string; clockTime?: string },
    @CurrentUser() _user: any,
  ): Promise<TimeClockValidationResponseDto> {
    return this.timeClockService.validateClockEvent(
      dto.workerId,
      dto.eventType as any,
      dto.clockTime ? new Date(dto.clockTime) : undefined,
    );
  }

  @Post('report')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate time clock report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Report generated successfully',
  })
  async generateReport(@Body() dto: TimeClockReportDto): Promise<any> {
    return this.timeClockService.generateReport(dto);
  }

  @Get('sessions/:workerId')
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @ApiOperation({ summary: 'Get worker time clock sessions' })
  @ApiParam({ name: 'workerId', description: 'Worker ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sessions retrieved',
    type: [TimeClockSession],
  })
  async getWorkerSessions(
    @Param('workerId') _workerId: string,
    @Query('startDate') _startDate: string,
    @Query('endDate') _endDate: string,
  ): Promise<TimeClockSession[]> {
    // This would need to be implemented in the service
    throw new Error('Method not yet implemented');
  }

  @Get('entries/:workerId')
  @Roles({ roles: ['admin', 'executive', 'sales', 'worker'] })
  @ApiOperation({ summary: 'Get worker time clock entries' })
  @ApiParam({ name: 'workerId', description: 'Worker ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entries retrieved',
    type: [TimeClockEntry],
  })
  async getWorkerEntries(
    @Param('workerId') _workerId: string,
    @Query('date') _date: string,
  ): Promise<TimeClockEntry[]> {
    // This would need to be implemented in the service
    throw new Error('Method not yet implemented');
  }

  @Get('rules')
  @Roles({ roles: ['admin', 'executive'] })
  @ApiOperation({ summary: 'Get time clock rules' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rules retrieved',
    type: [TimeClockRule],
  })
  async getRules(): Promise<TimeClockRule[]> {
    // This would need to be implemented in the service
    throw new Error('Method not yet implemented');
  }

  @Post('rules')
  @Roles({ roles: ['admin'] })
  @ApiOperation({ summary: 'Create time clock rule' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Rule created successfully',
    type: TimeClockRule,
  })
  async createRule(@Body() _dto: TimeClockRuleDto): Promise<TimeClockRule> {
    // This would need to be implemented in the service
    throw new Error('Method not yet implemented');
  }

  @Put('rules/:id')
  @Roles({ roles: ['admin'] })
  @ApiOperation({ summary: 'Update time clock rule' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rule updated successfully',
    type: TimeClockRule,
  })
  async updateRule(
    @Param('id') _id: string,
    @Body() _dto: TimeClockRuleDto,
  ): Promise<TimeClockRule> {
    // This would need to be implemented in the service
    throw new Error('Method not yet implemented');
  }

  @Get('summary/today')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Get today\'s time clock summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Summary retrieved',
  })
  async getTodaySummary(): Promise<any> {
    // This would return a summary of today's clock ins/outs
    // This would need to be implemented in the service
    throw new Error('Method not yet implemented');
  }

  @Get('summary/week')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Get this week\'s time clock summary' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Summary retrieved',
  })
  async getWeekSummary(): Promise<any> {
    // This would return a summary of this week's time data
    // This would need to be implemented in the service
    throw new Error('Method not yet implemented');
  }

  @Get('overtime')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Get overtime report' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Overtime report retrieved',
  })
  async getOvertimeReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<any> {
    return this.timeClockService.generateReport({
      startDate,
      endDate,
      overtimeOnly: true,
    });
  }

  @Get('exceptions')
  @Roles({ roles: ['admin', 'executive', 'sales'] })
  @ApiOperation({ summary: 'Get time clock exceptions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Exceptions retrieved',
  })
  async getExceptions(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<any> {
    return this.timeClockService.generateReport({
      startDate,
      endDate,
      exceptionsOnly: true,
    });
  }
}