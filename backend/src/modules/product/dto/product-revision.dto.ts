import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export enum RevisionType {
  MAJOR = 'major',
  MINOR = 'minor',
  PATCH = 'patch',
}

export enum RevisionStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

export class CreateProductRevisionDto {
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

  @ApiPropertyOptional({ description: 'Changes made' })
  @IsObject()
  @IsOptional()
  changes?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
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
}
