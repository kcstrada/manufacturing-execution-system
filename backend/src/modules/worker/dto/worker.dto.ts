import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsDateString,
  Min,
  Max,
  IsEmail,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  WorkerStatus,
  SkillLevel,
  ShiftType,
} from '../../../entities/worker.entity';

export class WorkerSkillDto {
  @ApiProperty({ description: 'Skill name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Skill level', enum: SkillLevel })
  @IsEnum(SkillLevel)
  level!: SkillLevel;

  @ApiPropertyOptional({ description: 'Certification date' })
  @IsOptional()
  @IsDateString()
  certifiedDate?: string;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}

export class WorkerCertificationDto {
  @ApiProperty({ description: 'Certification name' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Issuing organization' })
  @IsString()
  issuer!: string;

  @ApiProperty({ description: 'Issue date' })
  @IsDateString()
  issueDate!: string;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Certificate number' })
  @IsOptional()
  @IsString()
  certificateNumber?: string;
}

export class WorkerAvailabilityDto {
  @ApiPropertyOptional({ description: 'Start time (HH:mm)' })
  @IsOptional()
  @IsString()
  start?: string;

  @ApiPropertyOptional({ description: 'End time (HH:mm)' })
  @IsOptional()
  @IsString()
  end?: string;

  @ApiPropertyOptional({ description: 'Is available' })
  @IsOptional()
  @IsBoolean()
  available?: boolean;
}

export class CreateWorkerDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsString()
  employeeId!: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  firstName!: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  lastName!: string;

  @ApiPropertyOptional({ description: 'Position/Role' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: 'Worker status', enum: WorkerStatus })
  @IsOptional()
  @IsEnum(WorkerStatus)
  status?: WorkerStatus;

  @ApiPropertyOptional({ description: 'Shift type', enum: ShiftType })
  @IsOptional()
  @IsEnum(ShiftType)
  shiftType?: ShiftType;

  @ApiPropertyOptional({ description: 'Hourly rate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ description: 'Overtime rate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeRate?: number;

  @ApiPropertyOptional({ description: 'Hire date' })
  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Emergency contact name' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ description: 'Emergency phone' })
  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @ApiPropertyOptional({ description: 'User ID to link' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Supervisor ID' })
  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @ApiPropertyOptional({ description: 'Work center IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  workCenterIds?: string[];

  @ApiPropertyOptional({
    description: 'Worker skills',
    type: [WorkerSkillDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkerSkillDto)
  skills?: WorkerSkillDto[];

  @ApiPropertyOptional({
    description: 'Worker certifications',
    type: [WorkerCertificationDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkerCertificationDto)
  certifications?: WorkerCertificationDto[];

  @ApiPropertyOptional({ description: 'Weekly hours limit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(168)
  weeklyHoursLimit?: number;

  @ApiPropertyOptional({ description: 'Daily hours limit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  dailyHoursLimit?: number;

  @ApiPropertyOptional({ description: 'Weekly availability' })
  @IsOptional()
  @IsObject()
  availability?: {
    monday?: WorkerAvailabilityDto;
    tuesday?: WorkerAvailabilityDto;
    wednesday?: WorkerAvailabilityDto;
    thursday?: WorkerAvailabilityDto;
    friday?: WorkerAvailabilityDto;
    saturday?: WorkerAvailabilityDto;
    sunday?: WorkerAvailabilityDto;
  };
}

export class UpdateWorkerDto {
  @ApiPropertyOptional({ description: 'Employee ID' })
  @IsOptional()
  @IsString()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'First name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Position/Role' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: 'Worker status', enum: WorkerStatus })
  @IsOptional()
  @IsEnum(WorkerStatus)
  status?: WorkerStatus;

  @ApiPropertyOptional({ description: 'Shift type', enum: ShiftType })
  @IsOptional()
  @IsEnum(ShiftType)
  shiftType?: ShiftType;

  @ApiPropertyOptional({ description: 'Hourly rate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ description: 'Overtime rate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  overtimeRate?: number;

  @ApiPropertyOptional({ description: 'Hire date' })
  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Emergency contact name' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ description: 'Emergency phone' })
  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @ApiPropertyOptional({ description: 'User ID to link' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Supervisor ID' })
  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @ApiPropertyOptional({ description: 'Work center IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  workCenterIds?: string[];

  @ApiPropertyOptional({
    description: 'Worker skills',
    type: [WorkerSkillDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkerSkillDto)
  skills?: WorkerSkillDto[];

  @ApiPropertyOptional({
    description: 'Worker certifications',
    type: [WorkerCertificationDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkerCertificationDto)
  certifications?: WorkerCertificationDto[];

  @ApiPropertyOptional({ description: 'Weekly hours limit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(168)
  weeklyHoursLimit?: number;

  @ApiPropertyOptional({ description: 'Daily hours limit' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(24)
  dailyHoursLimit?: number;

  @ApiPropertyOptional({ description: 'Weekly availability' })
  @IsOptional()
  @IsObject()
  availability?: {
    monday?: WorkerAvailabilityDto;
    tuesday?: WorkerAvailabilityDto;
    wednesday?: WorkerAvailabilityDto;
    thursday?: WorkerAvailabilityDto;
    friday?: WorkerAvailabilityDto;
    saturday?: WorkerAvailabilityDto;
    sunday?: WorkerAvailabilityDto;
  };
}

export class UpdateWorkerStatusDto {
  @ApiProperty({ description: 'New status', enum: WorkerStatus })
  @IsEnum(WorkerStatus)
  status!: WorkerStatus;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateWorkerSkillsDto {
  @ApiProperty({
    description: 'Worker skills',
    type: [WorkerSkillDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkerSkillDto)
  skills!: WorkerSkillDto[];
}

export class SkillRequirementDto {
  @ApiProperty({ description: 'Skill name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Minimum skill level required',
    enum: SkillLevel,
  })
  @IsOptional()
  @IsEnum(SkillLevel)
  minimumLevel?: SkillLevel;

  @ApiPropertyOptional({ description: 'Is this skill required?' })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: 'Is certification required?' })
  @IsOptional()
  @IsBoolean()
  certificationRequired?: boolean;
}

export class FindWorkersWithSkillsDto {
  @ApiProperty({
    description: 'Skill requirements',
    type: [SkillRequirementDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillRequirementDto)
  skillRequirements!: SkillRequirementDto[];

  @ApiPropertyOptional({ description: 'Include unavailable workers' })
  @IsOptional()
  @IsBoolean()
  includeUnavailable?: boolean;

  @ApiPropertyOptional({ description: 'Work center ID filter' })
  @IsOptional()
  @IsUUID()
  workCenterId?: string;

  @ApiPropertyOptional({ description: 'Minimum match score (0-100)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minimumMatchScore?: number;
}

export class CheckAvailabilityDto {
  @ApiProperty({ description: 'Date to check' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ description: 'Start time (HH:mm)' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time (HH:mm)' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Hours needed' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hoursNeeded?: number;
}

export class UpdatePerformanceMetricsDto {
  @ApiPropertyOptional({ description: 'Efficiency percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  efficiency?: number;

  @ApiPropertyOptional({ description: 'Quality score percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  qualityScore?: number;

  @ApiPropertyOptional({ description: 'Tasks completed' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tasksCompleted?: number;

  @ApiPropertyOptional({ description: 'Hours worked' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hoursWorked?: number;
}

export class WorkerFilterDto {
  @ApiPropertyOptional({ description: 'Worker status', enum: WorkerStatus })
  @IsOptional()
  @IsEnum(WorkerStatus)
  status?: WorkerStatus;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Work center ID' })
  @IsOptional()
  @IsUUID()
  workCenterId?: string;

  @ApiPropertyOptional({ description: 'Shift type', enum: ShiftType })
  @IsOptional()
  @IsEnum(ShiftType)
  shiftType?: ShiftType;

  @ApiPropertyOptional({ description: 'Has specific skill' })
  @IsOptional()
  @IsString()
  hasSkill?: string;
}
