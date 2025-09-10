import { PartialType } from '@nestjs/swagger';
import {
  CreateQualityMetricDto,
  CreateQualityInspectionDto,
  CreateQualityControlPlanDto,
  CreateNonConformanceReportDto,
} from './create-quality.dto';

export class UpdateQualityMetricDto extends PartialType(CreateQualityMetricDto) {}

export class UpdateQualityInspectionDto extends PartialType(CreateQualityInspectionDto) {}

export class UpdateQualityControlPlanDto extends PartialType(CreateQualityControlPlanDto) {}

export class UpdateNonConformanceReportDto extends PartialType(CreateNonConformanceReportDto) {}