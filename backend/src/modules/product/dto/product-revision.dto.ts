import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsObject,
  IsArray,
  IsBoolean,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum RevisionType {
  MAJOR = 'major',
  MINOR = 'minor',
  PATCH = 'patch',
  EMERGENCY = 'emergency',
}

export enum RevisionStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

export enum ChangeType {
  SPECIFICATION = 'specification',
  BOM = 'bom',
  ROUTING = 'routing',
  COST = 'cost',
  QUALITY = 'quality',
  PACKAGING = 'packaging',
  DOCUMENTATION = 'documentation',
  OTHER = 'other',
}

export class ProductChangeDto {
  @ApiProperty({ description: 'Change type', enum: ChangeType })
  @IsEnum(ChangeType)
  changeType!: ChangeType;

  @ApiProperty({ description: 'Field changed' })
  @IsString()
  field!: string;

  @ApiPropertyOptional({ description: 'Old value' })
  @IsOptional()
  oldValue?: any;

  @ApiPropertyOptional({ description: 'New value' })
  @IsOptional()
  newValue?: any;

  @ApiProperty({ description: 'Change description' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: 'Impact assessment' })
  @IsString()
  @IsOptional()
  impactAssessment?: string;
}

export class CreateProductRevisionDto {
  @ApiProperty({ description: 'Product ID', format: 'uuid' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ description: 'Revision number', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  revisionNumber!: string;

  @ApiProperty({ description: 'Revision reason' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ description: 'Revision description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Revision type', enum: RevisionType })
  @IsEnum(RevisionType)
  revisionType!: RevisionType;

  @ApiPropertyOptional({ description: 'Engineering change order number' })
  @IsString()
  @IsOptional()
  ecoNumber?: string;

  @ApiPropertyOptional({ description: 'Changes made', type: [ProductChangeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductChangeDto)
  @IsOptional()
  changes?: ProductChangeDto[];

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Effective date' })
  @IsDateString()
  @IsOptional()
  effectiveDate?: Date;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsDateString()
  @IsOptional()
  expiryDate?: Date;

  @ApiPropertyOptional({ description: 'Previous revision ID', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  previousRevisionId?: string;

  @ApiPropertyOptional({ description: 'New BOM ID if BOM changed', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  newBomId?: string;

  @ApiPropertyOptional({ description: 'New Routing ID if routing changed', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  newRoutingId?: string;

  @ApiPropertyOptional({ description: 'Impact on existing inventory' })
  @IsObject()
  @IsOptional()
  inventoryImpact?: {
    requiresRework: boolean;
    reworkInstructions?: string;
    obsoleteInventory: boolean;
    disposalInstructions?: string;
  };

  @ApiPropertyOptional({ description: 'Quality impact' })
  @IsObject()
  @IsOptional()
  qualityImpact?: {
    requiresRequalification: boolean;
    newTestingRequired?: string[];
    updatedStandards?: string[];
  };

  @ApiPropertyOptional({ description: 'Customer notification required' })
  @IsBoolean()
  @IsOptional()
  customerNotificationRequired?: boolean;

  @ApiPropertyOptional({ description: 'Supplier notification required' })
  @IsBoolean()
  @IsOptional()
  supplierNotificationRequired?: boolean;

  @ApiPropertyOptional({ description: 'Attachments' })
  @IsArray()
  @IsOptional()
  attachments?: Array<{
    name: string;
    type: string;
    url: string;
    description?: string;
  }>;

  @ApiPropertyOptional({
    description: 'Revision status',
    enum: RevisionStatus,
    default: RevisionStatus.DRAFT,
  })
  @IsEnum(RevisionStatus)
  @IsOptional()
  status?: RevisionStatus = RevisionStatus.DRAFT;
}

export class UpdateProductRevisionDto {
  @ApiPropertyOptional({ description: 'Revision status', enum: RevisionStatus })
  @IsEnum(RevisionStatus)
  @IsOptional()
  status?: RevisionStatus;

  @ApiPropertyOptional({ description: 'Approval notes' })
  @IsString()
  @IsOptional()
  approvalNotes?: string;

  @ApiPropertyOptional({ description: 'Effective date' })
  @IsDateString()
  @IsOptional()
  effectiveDate?: Date;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsDateString()
  @IsOptional()
  expiryDate?: Date;

  @ApiPropertyOptional({ description: 'Changes made', type: [ProductChangeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductChangeDto)
  @IsOptional()
  changes?: ProductChangeDto[];
}

export class ProductRevisionResponseDto {
  @ApiProperty({ description: 'Revision ID' })
  id!: string;

  @ApiProperty({ description: 'Product' })
  product!: {
    id: string;
    sku: string;
    name: string;
  };

  @ApiProperty({ description: 'Revision number' })
  revisionNumber!: string;

  @ApiProperty({ description: 'Revision type' })
  revisionType!: RevisionType;

  @ApiProperty({ description: 'Revision status' })
  status!: RevisionStatus;

  @ApiProperty({ description: 'Revision reason' })
  reason!: string;

  @ApiPropertyOptional({ description: 'ECO number' })
  ecoNumber?: string;

  @ApiPropertyOptional({ description: 'Changes made' })
  changes?: ProductChangeDto[];

  @ApiPropertyOptional({ description: 'Notes' })
  notes?: string;

  @ApiProperty({ description: 'Effective date' })
  effectiveDate!: Date;

  @ApiPropertyOptional({ description: 'Expiry date' })
  expiryDate?: Date;

  @ApiPropertyOptional({ description: 'Previous revision' })
  previousRevision?: {
    id: string;
    revisionNumber: string;
  };

  @ApiPropertyOptional({ description: 'Created by' })
  createdBy?: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional({ description: 'Approved by' })
  approvedBy?: {
    id: string;
    name: string;
  };

  @ApiPropertyOptional({ description: 'Approved at' })
  approvedAt?: Date;

  @ApiPropertyOptional({ description: 'Inventory impact' })
  inventoryImpact?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Quality impact' })
  qualityImpact?: Record<string, any>;

  @ApiProperty({ description: 'Created at' })
  createdAt!: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt!: Date;
}
