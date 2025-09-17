import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CategoryQueryDto {
  @ApiPropertyOptional({ description: 'Search term for name, code, or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by parent category ID (null for root categories)' })
  @IsOptional()
  parentId?: string | null;

  @ApiPropertyOptional({ description: 'Include category tree structure' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  includeTree?: boolean = false;

  @ApiPropertyOptional({ description: 'Include inactive categories' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  includeInactive?: boolean = false;
}