import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsBoolean, IsOptional } from 'class-validator';

/**
 * Base response DTO with common fields
 */
export class BaseResponseDto {
  @ApiProperty({ description: 'Unique identifier', format: 'uuid' })
  @IsUUID()
  id!: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @IsDateString()
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @IsDateString()
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * Tenant-aware base response DTO
 */
export class TenantAwareResponseDto extends BaseResponseDto {
  @ApiProperty({ description: 'Tenant identifier', format: 'uuid' })
  @IsUUID()
  tenantId!: string;
}

/**
 * Soft-deletable response DTO
 */
export class SoftDeletableResponseDto extends BaseResponseDto {
  @ApiPropertyOptional({ description: 'Deletion timestamp' })
  @IsDateString()
  @IsOptional()
  deletedAt?: Date;
}

/**
 * Auditable response DTO with user tracking
 */
export class AuditableResponseDto extends TenantAwareResponseDto {
  @ApiPropertyOptional({ description: 'User who created the record', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'User who last updated the record', format: 'uuid' })
  @IsUUID()
  @IsOptional()
  updatedBy?: string;
}