import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsObject,
  IsArray,
  Min,
  MaxLength,
} from 'class-validator';
import {
  EquipmentType,
  EquipmentStatus,
  MaintenanceType,
} from '../../../entities/equipment.entity';

export class CreateEquipmentDto {
  @ApiProperty({ description: 'Unique equipment code' })
  @IsString()
  @MaxLength(50)
  equipmentCode!: string;

  @ApiProperty({ description: 'Equipment name' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'Equipment description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: EquipmentType, default: EquipmentType.MACHINE })
  @IsEnum(EquipmentType)
  type!: EquipmentType;

  @ApiProperty({ enum: EquipmentStatus, default: EquipmentStatus.OPERATIONAL })
  @IsOptional()
  @IsEnum(EquipmentStatus)
  status?: EquipmentStatus;

  @ApiProperty({ description: 'Manufacturer name', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturer?: string;

  @ApiProperty({ description: 'Model number', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiProperty({ description: 'Serial number', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  serialNumber?: string;

  @ApiProperty({ description: 'Purchase date', required: false })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiProperty({ description: 'Installation date', required: false })
  @IsOptional()
  @IsDateString()
  installationDate?: string;

  @ApiProperty({ description: 'Warranty expiry date', required: false })
  @IsOptional()
  @IsDateString()
  warrantyExpiry?: string;

  @ApiProperty({ description: 'Purchase cost', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchaseCost?: number;

  @ApiProperty({ description: 'Current value', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentValue?: number;

  @ApiProperty({ description: 'Hourly operating cost', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyOperatingCost?: number;

  @ApiProperty({ description: 'Physical location', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @ApiProperty({ description: 'Work center ID', required: false })
  @IsOptional()
  @IsString()
  workCenterId?: string;

  @ApiProperty({ description: 'Department ID', required: false })
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiProperty({ description: 'Supplier ID', required: false })
  @IsOptional()
  @IsString()
  supplierId?: string;

  @ApiProperty({ description: 'Technical specifications', required: false })
  @IsOptional()
  @IsObject()
  specifications?: {
    capacity?: string;
    power?: string;
    dimensions?: string;
    weight?: string;
    voltage?: string;
    frequency?: string;
    [key: string]: any;
  };

  @ApiProperty({
    description: 'Maintenance interval in hours',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maintenanceIntervalHours?: number;

  @ApiProperty({ description: 'Is critical equipment', default: false })
  @IsOptional()
  @IsBoolean()
  isCritical?: boolean;

  @ApiProperty({ description: 'Requires calibration', default: false })
  @IsOptional()
  @IsBoolean()
  requiresCalibration?: boolean;

  @ApiProperty({ description: 'Last calibration date', required: false })
  @IsOptional()
  @IsDateString()
  lastCalibrationDate?: string;

  @ApiProperty({ description: 'Next calibration date', required: false })
  @IsOptional()
  @IsDateString()
  nextCalibrationDate?: string;

  @ApiProperty({ description: 'Document references', required: false })
  @IsOptional()
  @IsObject()
  documents?: {
    manuals?: string[];
    certificates?: string[];
    inspectionReports?: string[];
    maintenanceRecords?: string[];
  };

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateMaintenanceScheduleDto {
  @ApiProperty({ description: 'Equipment ID' })
  @IsString()
  equipmentId!: string;

  @ApiProperty({ description: 'Schedule title' })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ description: 'Schedule description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Maintenance type', enum: MaintenanceType })
  @IsEnum(MaintenanceType)
  type!: MaintenanceType;

  @ApiProperty({ description: 'Scheduled date' })
  @IsDateString()
  scheduledDate!: string;

  @ApiProperty({ description: 'Estimated duration in hours' })
  @IsNumber()
  @Min(0)
  estimatedDuration!: number;

  @ApiProperty({ description: 'Estimated cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @ApiProperty({ description: 'Task list', required: false })
  @IsOptional()
  @IsArray()
  tasks?: Array<{
    id: string;
    description: string;
    completed: boolean;
  }>;

  @ApiProperty({ description: 'Required parts', required: false })
  @IsOptional()
  @IsArray()
  requiredParts?: Array<{
    name: string;
    quantity: number;
    partNumber?: string;
  }>;

  @ApiProperty({ description: 'Assigned technician ID', required: false })
  @IsOptional()
  @IsString()
  assignedToId?: string;

  @ApiProperty({ description: 'Is recurring schedule', default: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({ description: 'Recurring interval in days', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  recurringIntervalDays?: number;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordMaintenanceDto {
  @ApiProperty({ description: 'Equipment ID' })
  @IsString()
  equipmentId!: string;

  @ApiProperty({ description: 'Maintenance type', enum: MaintenanceType })
  @IsEnum(MaintenanceType)
  type!: MaintenanceType;

  @ApiProperty({ description: 'Start date and time' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'End date and time', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Duration in hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiProperty({ description: 'Work performed' })
  @IsString()
  workPerformed!: string;

  @ApiProperty({ description: 'Parts replaced', required: false })
  @IsOptional()
  @IsArray()
  partsReplaced?: Array<{
    name: string;
    quantity: number;
    partNumber?: string;
    cost?: number;
  }>;

  @ApiProperty({ description: 'Labor cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  laborCost?: number;

  @ApiProperty({ description: 'Parts cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  partsCost?: number;

  @ApiProperty({ description: 'Performed by ID', required: false })
  @IsOptional()
  @IsString()
  performedById?: string;

  @ApiProperty({ description: 'Performed by name' })
  @IsString()
  performedBy!: string;

  @ApiProperty({ description: 'Findings', required: false })
  @IsOptional()
  @IsString()
  findings?: string;

  @ApiProperty({ description: 'Recommendations', required: false })
  @IsOptional()
  @IsString()
  recommendations?: string;

  @ApiProperty({ description: 'Meter reading', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  meterReading?: number;

  @ApiProperty({ description: 'Was this a breakdown', default: false })
  @IsOptional()
  @IsBoolean()
  wasBreakdown?: boolean;

  @ApiProperty({ description: 'Failure reason', required: false })
  @IsOptional()
  @IsString()
  failureReason?: string;

  @ApiProperty({ description: 'Attachments', required: false })
  @IsOptional()
  @IsArray()
  attachments?: string[];

  @ApiProperty({ description: 'Related schedule ID', required: false })
  @IsOptional()
  @IsString()
  scheduleId?: string;
}
