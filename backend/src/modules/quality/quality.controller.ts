import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard, RoleGuard, Roles } from 'nest-keycloak-connect';
import {
  QualityService,
  QualityMetrics,
  InspectionSummary,
  ControlChartData,
} from './quality.service';
import {
  CreateQualityMetricDto,
  CreateQualityInspectionDto,
  CreateQualityControlPlanDto,
  CreateNonConformanceReportDto,
  ReviewInspectionDto,
  CloseNonConformanceDto,
} from './dto/create-quality.dto';
import {
  UpdateQualityMetricDto,
  UpdateQualityInspectionDto,
  UpdateNonConformanceReportDto,
} from './dto/update-quality.dto';
import {
  QualityMetric,
  QualityInspection,
  QualityControlPlan,
  NonConformanceReport,
  MetricType,
  InspectionResult,
  DefectSeverity,
  InspectionType,
} from '../../entities/quality-metric.entity';

@ApiTags('quality')
@ApiBearerAuth()
@Controller('quality')
@UseGuards(AuthGuard, RoleGuard)
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  // Quality Metrics Endpoints
  @Post('metrics')
  @Roles({ roles: ['admin', 'quality_manager'] })
  @ApiOperation({ summary: 'Create quality metric' })
  @ApiResponse({ status: HttpStatus.CREATED, type: QualityMetric })
  async createMetric(
    @Body() createDto: CreateQualityMetricDto,
  ): Promise<QualityMetric> {
    return this.qualityService.createMetric(createDto);
  }

  @Get('metrics')
  @Roles({ roles: ['admin', 'user'] })
  @ApiOperation({ summary: 'Get all quality metrics' })
  @ApiQuery({ name: 'type', enum: MetricType, required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'isCritical', type: Boolean, required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  @ApiResponse({ status: HttpStatus.OK, type: [QualityMetric] })
  async findAllMetrics(
    @Query('type') type?: MetricType,
    @Query('productId') productId?: string,
    @Query('isCritical') isCritical?: boolean,
    @Query('isActive') isActive?: boolean,
  ): Promise<QualityMetric[]> {
    return this.qualityService.findAllMetrics({
      type,
      productId,
      isCritical,
      isActive,
    });
  }

  @Get('metrics/:id')
  @Roles({ roles: ['admin', 'user'] })
  @ApiOperation({ summary: 'Get quality metric by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: QualityMetric })
  async findMetric(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QualityMetric> {
    return this.qualityService.findMetricById(id);
  }

  @Patch('metrics/:id')
  @Roles({ roles: ['admin', 'quality_manager'] })
  @ApiOperation({ summary: 'Update quality metric' })
  @ApiResponse({ status: HttpStatus.OK, type: QualityMetric })
  async updateMetric(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateQualityMetricDto,
  ): Promise<QualityMetric> {
    return this.qualityService.updateMetric(id, updateDto);
  }

  // Quality Inspections Endpoints
  @Post('inspections')
  @Roles({ roles: ['admin', 'quality_inspector', 'quality_manager'] })
  @ApiOperation({ summary: 'Create quality inspection' })
  @ApiResponse({ status: HttpStatus.CREATED, type: QualityInspection })
  async createInspection(
    @Body() createDto: CreateQualityInspectionDto,
  ): Promise<QualityInspection> {
    return this.qualityService.createInspection(createDto);
  }

  @Get('inspections')
  @Roles({ roles: ['admin', 'user'] })
  @ApiOperation({ summary: 'Get all quality inspections' })
  @ApiQuery({ name: 'type', enum: InspectionType, required: false })
  @ApiQuery({ name: 'result', enum: InspectionResult, required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'workOrderId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'requiresReview', type: Boolean, required: false })
  @ApiResponse({ status: HttpStatus.OK, type: [QualityInspection] })
  async findAllInspections(
    @Query('type') type?: InspectionType,
    @Query('result') result?: InspectionResult,
    @Query('productId') productId?: string,
    @Query('workOrderId') workOrderId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('requiresReview') requiresReview?: boolean,
  ): Promise<QualityInspection[]> {
    return this.qualityService.findAllInspections({
      type,
      result,
      productId,
      workOrderId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      requiresReview,
    });
  }

  @Get('inspections/:id')
  @Roles({ roles: ['admin', 'user'] })
  @ApiOperation({ summary: 'Get quality inspection by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: QualityInspection })
  async findInspection(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QualityInspection> {
    return this.qualityService.findInspectionById(id);
  }

  @Patch('inspections/:id')
  @Roles({ roles: ['admin', 'quality_inspector', 'quality_manager'] })
  @ApiOperation({ summary: 'Update quality inspection' })
  @ApiResponse({ status: HttpStatus.OK, type: QualityInspection })
  async updateInspection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateQualityInspectionDto,
  ): Promise<QualityInspection> {
    return this.qualityService.updateInspection(id, updateDto);
  }

  @Post('inspections/:id/review')
  @Roles({ roles: ['admin', 'quality_manager'] })
  @ApiOperation({ summary: 'Review quality inspection' })
  @ApiResponse({ status: HttpStatus.OK, type: QualityInspection })
  async reviewInspection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() reviewDto: ReviewInspectionDto,
  ): Promise<QualityInspection> {
    return this.qualityService.reviewInspection(id, reviewDto);
  }

  // Quality Control Plans Endpoints
  @Post('control-plans')
  @Roles({ roles: ['admin', 'quality_manager'] })
  @ApiOperation({ summary: 'Create quality control plan' })
  @ApiResponse({ status: HttpStatus.CREATED, type: QualityControlPlan })
  async createControlPlan(
    @Body() createDto: CreateQualityControlPlanDto,
  ): Promise<QualityControlPlan> {
    return this.qualityService.createControlPlan(createDto);
  }

  @Get('control-plans')
  @Roles({ roles: ['admin', 'user'] })
  @ApiOperation({ summary: 'Get all quality control plans' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiResponse({ status: HttpStatus.OK, type: [QualityControlPlan] })
  async findAllControlPlans(
    @Query('productId') productId?: string,
  ): Promise<QualityControlPlan[]> {
    return this.qualityService.findAllControlPlans(productId);
  }

  @Get('control-plans/:id')
  @Roles({ roles: ['admin', 'user'] })
  @ApiOperation({ summary: 'Get quality control plan by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: QualityControlPlan })
  async findControlPlan(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QualityControlPlan> {
    return this.qualityService.findControlPlanById(id);
  }

  @Post('control-plans/:id/approve')
  @Roles({ roles: ['admin', 'quality_manager'] })
  @ApiOperation({ summary: 'Approve quality control plan' })
  @ApiResponse({ status: HttpStatus.OK, type: QualityControlPlan })
  async approveControlPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('approvedBy') approvedBy: string,
  ): Promise<QualityControlPlan> {
    return this.qualityService.approveControlPlan(id, approvedBy);
  }

  // Non-Conformance Reports Endpoints
  @Post('ncr')
  @Roles({ roles: ['admin', 'quality_inspector', 'quality_manager'] })
  @ApiOperation({ summary: 'Create non-conformance report' })
  @ApiResponse({ status: HttpStatus.CREATED, type: NonConformanceReport })
  async createNCR(
    @Body() createDto: CreateNonConformanceReportDto,
  ): Promise<NonConformanceReport> {
    return this.qualityService.createNCR(createDto);
  }

  @Get('ncr')
  @Roles({ roles: ['admin', 'user'] })
  @ApiOperation({ summary: 'Get all non-conformance reports' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'severity', enum: DefectSeverity, required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: HttpStatus.OK, type: [NonConformanceReport] })
  async findAllNCRs(
    @Query('status') status?: string,
    @Query('severity') severity?: DefectSeverity,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<NonConformanceReport[]> {
    return this.qualityService.findAllNCRs({
      status,
      severity,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('ncr/:id')
  @Roles({ roles: ['admin', 'user'] })
  @ApiOperation({ summary: 'Get non-conformance report by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: NonConformanceReport })
  async findNCR(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NonConformanceReport> {
    return this.qualityService.findNCRById(id);
  }

  @Patch('ncr/:id')
  @Roles({ roles: ['admin', 'quality_manager'] })
  @ApiOperation({ summary: 'Update non-conformance report' })
  @ApiResponse({ status: HttpStatus.OK, type: NonConformanceReport })
  async updateNCR(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateNonConformanceReportDto,
  ): Promise<NonConformanceReport> {
    return this.qualityService.updateNCR(id, updateDto);
  }

  @Post('ncr/:id/close')
  @Roles({ roles: ['admin', 'quality_manager'] })
  @ApiOperation({ summary: 'Close non-conformance report' })
  @ApiResponse({ status: HttpStatus.OK, type: NonConformanceReport })
  async closeNCR(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() closeDto: CloseNonConformanceDto,
  ): Promise<NonConformanceReport> {
    return this.qualityService.closeNCR(id, closeDto);
  }

  // Analytics and Metrics Endpoints
  @Get('analytics/metrics')
  @Roles({ roles: ['admin', 'quality_manager', 'production_manager'] })
  @ApiOperation({ summary: 'Get quality metrics and KPIs' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiResponse({ status: HttpStatus.OK })
  async getQualityMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('productId') productId?: string,
  ): Promise<QualityMetrics> {
    return this.qualityService.getQualityMetrics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      productId,
    );
  }

  @Get('analytics/product-summary')
  @Roles({ roles: ['admin', 'quality_manager', 'production_manager'] })
  @ApiOperation({ summary: 'Get inspection summary by product' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: HttpStatus.OK })
  async getProductSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<InspectionSummary[]> {
    return this.qualityService.getInspectionSummaryByProduct(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('analytics/control-chart/:metricId')
  @Roles({ roles: ['admin', 'quality_manager'] })
  @ApiOperation({ summary: 'Get control chart data for metric' })
  @ApiQuery({ name: 'days', required: false, default: 30 })
  @ApiResponse({ status: HttpStatus.OK })
  async getControlChart(
    @Param('metricId', ParseUUIDPipe) metricId: string,
    @Query('days') days?: number,
  ): Promise<ControlChartData> {
    return this.qualityService.getControlChartData(metricId, days || 30);
  }

  @Get('analytics/pareto')
  @Roles({ roles: ['admin', 'quality_manager'] })
  @ApiOperation({ summary: 'Get defect Pareto analysis' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: HttpStatus.OK })
  async getDefectPareto(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<
    Array<{
      defectCode: string;
      description: string;
      count: number;
      percentage: number;
    }>
  > {
    return this.qualityService.getDefectParetoAnalysis(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('alerts')
  @Roles({ roles: ['admin', 'quality_manager'] })
  @ApiOperation({ summary: 'Get quality alerts and warnings' })
  @ApiResponse({ status: HttpStatus.OK })
  async getQualityAlerts(): Promise<
    Array<{ type: string; message: string; severity: string }>
  > {
    return this.qualityService.checkQualityAlerts();
  }
}
