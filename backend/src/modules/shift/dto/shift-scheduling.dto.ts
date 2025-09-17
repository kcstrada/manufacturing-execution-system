import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsString,
  IsNumber,
  IsEnum,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftType, DayOfWeek } from '../../../entities/shift.entity';

export class GenerateScheduleDto {
  @ApiProperty({ description: 'Start date for schedule generation' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'End date for schedule generation' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({
    description: 'Specific shift IDs to include',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  shiftIds?: string[];

  @ApiPropertyOptional({ description: 'Department ID filter' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Work center ID filter' })
  @IsOptional()
  @IsUUID()
  workCenterId?: string;

  @ApiPropertyOptional({ description: 'Auto-assign workers to shifts' })
  @IsOptional()
  @IsBoolean()
  autoAssign?: boolean;

  @ApiPropertyOptional({
    description: 'Respect skill requirements when auto-assigning',
  })
  @IsOptional()
  @IsBoolean()
  respectSkillRequirements?: boolean;

  @ApiPropertyOptional({ description: 'Balance workload when auto-assigning' })
  @IsOptional()
  @IsBoolean()
  balanceWorkload?: boolean;
}

export class CoverageAnalysisDto {
  @ApiProperty({ description: 'Start date for analysis' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'End date for analysis' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({
    description: 'Specific shift IDs to analyze',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  shiftIds?: string[];
}

export class ShiftSwapRequestDto {
  @ApiProperty({ description: 'Worker ID giving up the shift' })
  @IsUUID()
  fromWorkerId!: string;

  @ApiProperty({ description: 'Worker ID taking the shift' })
  @IsUUID()
  toWorkerId!: string;

  @ApiProperty({ description: 'Assignment ID to swap' })
  @IsUUID()
  assignmentId!: string;

  @ApiProperty({ description: 'Reason for the swap' })
  @IsString()
  reason!: string;
}

export class ShiftPatternDto {
  @ApiProperty({ description: 'Pattern name' })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Array of shift codes in the pattern',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  pattern!: string[];

  @ApiProperty({ description: 'Rotation period in days' })
  @IsNumber()
  @Min(1)
  rotationPeriod!: number;

  @ApiProperty({ description: 'Pattern start date' })
  @IsDateString()
  startDate!: string;
}

export class ApplyPatternDto {
  @ApiProperty({ description: 'Shift pattern', type: ShiftPatternDto })
  @ValidateNested()
  @Type(() => ShiftPatternDto)
  pattern!: ShiftPatternDto;

  @ApiProperty({
    description: 'Worker IDs to apply pattern to',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  workerIds!: string[];

  @ApiProperty({ description: 'Start date for pattern application' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'End date for pattern application' })
  @IsDateString()
  endDate!: string;
}

export class UpdateAssignmentStatusDto {
  @ApiProperty({ description: 'New status for the assignment' })
  @IsString()
  status!: string;

  @ApiPropertyOptional({ description: 'Notes about the status change' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateShiftDto {
  @ApiProperty({ description: 'Unique shift code' })
  @IsString()
  shiftCode!: string;

  @ApiProperty({ description: 'Shift name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Shift description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Shift type', enum: ShiftType })
  @IsEnum(ShiftType)
  type!: ShiftType;

  @ApiProperty({ description: 'Start time (HH:mm)' })
  @IsString()
  startTime!: string;

  @ApiProperty({ description: 'End time (HH:mm)' })
  @IsString()
  endTime!: string;

  @ApiPropertyOptional({ description: 'Work days', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workDays?: string[];

  @ApiPropertyOptional({ description: 'Is overnight shift' })
  @IsOptional()
  @IsBoolean()
  isOvernight?: boolean;

  @ApiPropertyOptional({ description: 'Minimum workers required' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minWorkers?: number;

  @ApiPropertyOptional({ description: 'Maximum workers allowed' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxWorkers?: number;

  @ApiPropertyOptional({ description: 'Target number of workers' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetWorkers?: number;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Work center IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  workCenterIds?: string[];
}

export class UpdateShiftDto {
  @ApiPropertyOptional({ description: 'Unique shift code' })
  @IsOptional()
  @IsString()
  shiftCode?: string;

  @ApiPropertyOptional({ description: 'Shift name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Shift description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Shift type', enum: ShiftType })
  @IsOptional()
  @IsEnum(ShiftType)
  type?: ShiftType;

  @ApiPropertyOptional({ description: 'Start time (HH:mm)' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time (HH:mm)' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Work days', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workDays?: string[];

  @ApiPropertyOptional({ description: 'Is overnight shift' })
  @IsOptional()
  @IsBoolean()
  isOvernight?: boolean;

  @ApiPropertyOptional({ description: 'Minimum workers required' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minWorkers?: number;

  @ApiPropertyOptional({ description: 'Maximum workers allowed' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxWorkers?: number;

  @ApiPropertyOptional({ description: 'Target number of workers' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetWorkers?: number;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Work center IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  workCenterIds?: string[];
}

export class CreateShiftExceptionDto {
  @ApiProperty({ description: 'Shift ID' })
  @IsUUID()
  shiftId!: string;

  @ApiProperty({ description: 'Exception date' })
  @IsDateString()
  date!: string;

  @ApiProperty({ description: 'Exception type' })
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Reason for exception' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ description: 'Alternate start time' })
  @IsOptional()
  @IsString()
  alternateStartTime?: string;

  @ApiPropertyOptional({ description: 'Alternate end time' })
  @IsOptional()
  @IsString()
  alternateEndTime?: string;

  @ApiPropertyOptional({ description: 'Is shift cancelled' })
  @IsOptional()
  @IsBoolean()
  isCancelled?: boolean;

  @ApiPropertyOptional({ description: 'Reduced capacity percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  reducedCapacity?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class WorkerScheduleDto {
  @ApiProperty({ description: 'Worker ID' })
  @IsUUID()
  workerId!: string;

  @ApiProperty({ description: 'Start date' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'End date' })
  @IsDateString()
  endDate!: string;
}

export class ShiftFilterDto {
  @ApiPropertyOptional({ description: 'Shift type', enum: ShiftType })
  @IsOptional()
  @IsEnum(ShiftType)
  type?: ShiftType;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Work center ID' })
  @IsOptional()
  @IsUUID()
  workCenterId?: string;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Day of week', enum: DayOfWeek })
  @IsOptional()
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;
}

export class ConflictCheckDto {
  @ApiProperty({ description: 'Worker ID' })
  @IsUUID()
  workerId!: string;

  @ApiProperty({ description: 'Start date for conflict check' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'End date for conflict check' })
  @IsDateString()
  endDate!: string;
}
