import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsIP,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClockEventType, ClockMethod } from '../../../entities/time-clock.entity';

export class ClockInDto {
  @ApiPropertyOptional({ description: 'Work center ID' })
  @IsOptional()
  @IsUUID()
  workCenterId?: string;

  @ApiPropertyOptional({ description: 'Shift assignment ID' })
  @IsOptional()
  @IsUUID()
  shiftAssignmentId?: string;

  @ApiPropertyOptional({ description: 'Task ID if clocking in for specific task' })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiPropertyOptional({ description: 'Clock method', enum: ClockMethod })
  @IsOptional()
  @IsEnum(ClockMethod)
  method?: ClockMethod;

  @ApiPropertyOptional({ description: 'GPS latitude' })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ description: 'GPS longitude' })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ description: 'IP address' })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Device ID' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ClockOutDto {
  @ApiPropertyOptional({ description: 'Clock method', enum: ClockMethod })
  @IsOptional()
  @IsEnum(ClockMethod)
  method?: ClockMethod;

  @ApiPropertyOptional({ description: 'GPS latitude' })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ description: 'GPS longitude' })
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ description: 'IP address' })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'Device ID' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class BreakDto {
  @ApiProperty({ description: 'Break type', enum: ['break_start', 'break_end', 'lunch_start', 'lunch_end'] })
  @IsEnum(['break_start', 'break_end', 'lunch_start', 'lunch_end'])
  breakType!: string;

  @ApiPropertyOptional({ description: 'Clock method', enum: ClockMethod })
  @IsOptional()
  @IsEnum(ClockMethod)
  method?: ClockMethod;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ManualClockEntryDto {
  @ApiProperty({ description: 'Worker ID' })
  @IsUUID()
  workerId!: string;

  @ApiProperty({ description: 'Event type', enum: ClockEventType })
  @IsEnum(ClockEventType)
  eventType!: ClockEventType;

  @ApiProperty({ description: 'Clock time' })
  @IsDateString()
  clockedAt!: string;

  @ApiPropertyOptional({ description: 'Work center ID' })
  @IsOptional()
  @IsUUID()
  workCenterId?: string;

  @ApiPropertyOptional({ description: 'Shift assignment ID' })
  @IsOptional()
  @IsUUID()
  shiftAssignmentId?: string;

  @ApiProperty({ description: 'Reason for manual entry' })
  @IsString()
  @MaxLength(500)
  reason!: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ApproveClockEntryDto {
  @ApiProperty({ description: 'Entry ID' })
  @IsUUID()
  entryId!: string;

  @ApiProperty({ description: 'Approval decision' })
  @IsBoolean()
  approved!: boolean;

  @ApiPropertyOptional({ description: 'Approval notes' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  approvalNotes?: string;
}

export class TimeClockReportDto {
  @ApiProperty({ description: 'Start date' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'End date' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ description: 'Worker IDs', type: [String] })
  @IsOptional()
  @IsUUID('4', { each: true })
  workerIds?: string[];

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Work center ID' })
  @IsOptional()
  @IsUUID()
  workCenterId?: string;

  @ApiPropertyOptional({ description: 'Include overtime only' })
  @IsOptional()
  @IsBoolean()
  overtimeOnly?: boolean;

  @ApiPropertyOptional({ description: 'Include exceptions only' })
  @IsOptional()
  @IsBoolean()
  exceptionsOnly?: boolean;
}

export class TimeClockStatusDto {
  @ApiPropertyOptional({ description: 'Worker ID' })
  @IsOptional()
  @IsUUID()
  workerId?: string;

  @ApiPropertyOptional({ description: 'Date to check status' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class CorrectTimeEntryDto {
  @ApiProperty({ description: 'Session ID' })
  @IsUUID()
  sessionId!: string;

  @ApiPropertyOptional({ description: 'Corrected clock in time' })
  @IsOptional()
  @IsDateString()
  clockInTime?: string;

  @ApiPropertyOptional({ description: 'Corrected clock out time' })
  @IsOptional()
  @IsDateString()
  clockOutTime?: string;

  @ApiPropertyOptional({ description: 'Corrected break minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  breakMinutes?: number;

  @ApiPropertyOptional({ description: 'Corrected lunch minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lunchMinutes?: number;

  @ApiProperty({ description: 'Reason for correction' })
  @IsString()
  @MaxLength(500)
  reason!: string;
}

export class TimeClockRuleDto {
  @ApiProperty({ description: 'Rule name' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ description: 'Rule description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'Grace minutes for late arrival' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  graceMinutesLate?: number;

  @ApiPropertyOptional({ description: 'Grace minutes for early departure' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  graceMinutesEarly?: number;

  @ApiPropertyOptional({ description: 'Rounding minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30)
  roundingMinutes?: number;

  @ApiPropertyOptional({ description: 'Rounding direction', enum: ['up', 'down', 'nearest'] })
  @IsOptional()
  @IsEnum(['up', 'down', 'nearest'])
  roundingDirection?: string;

  @ApiPropertyOptional({ description: 'Standard work hours per day' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  standardWorkHours?: number;

  @ApiPropertyOptional({ description: 'Standard work hours per week' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(168)
  standardWorkWeekHours?: number;

  @ApiPropertyOptional({ description: 'Overtime multiplier' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  overtimeMultiplier?: number;

  @ApiPropertyOptional({ description: 'Allow mobile clock in' })
  @IsOptional()
  @IsBoolean()
  allowMobileClockIn?: boolean;

  @ApiPropertyOptional({ description: 'Require GPS for mobile' })
  @IsOptional()
  @IsBoolean()
  requireGpsForMobile?: boolean;

  @ApiPropertyOptional({ description: 'Max GPS radius in meters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  maxGpsRadius?: number;
}

export class WorkerTimeStatusResponseDto {
  @ApiProperty({ description: 'Worker ID' })
  workerId!: string;

  @ApiProperty({ description: 'Worker name' })
  workerName!: string;

  @ApiProperty({ description: 'Current status' })
  status!: 'clocked_in' | 'clocked_out' | 'on_break' | 'on_lunch';

  @ApiPropertyOptional({ description: 'Last clock event' })
  lastEvent?: {
    type: ClockEventType;
    time: Date;
    location?: string;
  };

  @ApiPropertyOptional({ description: 'Current session' })
  currentSession?: {
    clockInTime: Date;
    hoursWorked: number;
    breaksTaken: number;
    overtimeHours: number;
  };

  @ApiProperty({ description: 'Today\'s totals' })
  todayTotals!: {
    regularHours: number;
    overtimeHours: number;
    breakMinutes: number;
    lunchMinutes: number;
  };

  @ApiProperty({ description: 'Week totals' })
  weekTotals!: {
    regularHours: number;
    overtimeHours: number;
    totalHours: number;
  };
}

export class TimeClockValidationResponseDto {
  @ApiProperty({ description: 'Validation result' })
  valid!: boolean;

  @ApiPropertyOptional({ description: 'Validation errors', type: [String] })
  errors?: string[];

  @ApiPropertyOptional({ description: 'Validation warnings', type: [String] })
  warnings?: string[];

  @ApiPropertyOptional({ description: 'Suggested corrections' })
  suggestions?: {
    roundedTime?: Date;
    shiftAssignment?: string;
    requiresApproval?: boolean;
  };
}