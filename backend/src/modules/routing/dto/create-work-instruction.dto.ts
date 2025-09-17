import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  IsObject,
} from 'class-validator';
import {
  InstructionType,
  InstructionFormat,
} from '../../../entities/work-instruction.entity';

export class CreateWorkInstructionDto {
  @ApiProperty({ description: 'Instruction code' })
  @IsString()
  instructionCode!: string;

  @ApiProperty({ description: 'Instruction title' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Instruction content' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: 'Instruction type', enum: InstructionType })
  @IsEnum(InstructionType)
  type!: InstructionType;

  @ApiPropertyOptional({
    description: 'Instruction format',
    enum: InstructionFormat,
  })
  @IsEnum(InstructionFormat)
  @IsOptional()
  format?: InstructionFormat;

  @ApiPropertyOptional({ description: 'Priority level' })
  @IsNumber()
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ description: 'Required skill level' })
  @IsString()
  @IsOptional()
  requiredSkillLevel?: string;

  @ApiPropertyOptional({ description: 'Steps' })
  @IsArray()
  @IsOptional()
  steps?: any[];

  @ApiPropertyOptional({ description: 'Tools required' })
  @IsArray()
  @IsOptional()
  toolsRequired?: string[];

  @ApiPropertyOptional({ description: 'Safety information' })
  @IsObject()
  @IsOptional()
  safetyInfo?: any;

  @ApiPropertyOptional({ description: 'Quality checkpoints' })
  @IsArray()
  @IsOptional()
  qualityCheckpoints?: any[];

  @ApiPropertyOptional({ description: 'Is critical' })
  @IsBoolean()
  @IsOptional()
  isCritical?: boolean = false;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
