import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard, ResourceGuard, Roles } from 'nest-keycloak-connect';
import { ReportsService } from './reports.service';
import { ReportFiltersDto, CustomReportDto, ExportReportDto } from './dto/report-filters.dto';
import {
  ProductionEfficiencyReport,
  InventoryTurnoverReport,
  WorkerProductivityReport,
  QualityControlReport,
  DashboardMetrics,
  CustomReport,
} from './interfaces/report.interface';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(AuthGuard, ResourceGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('production-efficiency')
  @Roles({ roles: ['admin', 'production_manager', 'supervisor'] })
  @ApiOperation({ summary: 'Get production efficiency report' })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Production efficiency report generated successfully',
  })
  async getProductionEfficiencyReport(
    @Query() filters: ReportFiltersDto,
  ): Promise<ProductionEfficiencyReport> {
    return this.reportsService.getProductionEfficiencyReport(filters);
  }

  @Get('inventory-turnover')
  @Roles({ roles: ['admin', 'inventory_manager', 'supervisor'] })
  @ApiOperation({ summary: 'Get inventory turnover report' })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Inventory turnover report generated successfully',
  })
  async getInventoryTurnoverReport(
    @Query() filters: ReportFiltersDto,
  ): Promise<InventoryTurnoverReport> {
    return this.reportsService.getInventoryTurnoverReport(filters);
  }

  @Get('worker-productivity')
  @Roles({ roles: ['admin', 'hr_manager', 'supervisor'] })
  @ApiOperation({ summary: 'Get worker productivity report' })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Worker productivity report generated successfully',
  })
  async getWorkerProductivityReport(
    @Query() filters: ReportFiltersDto,
  ): Promise<WorkerProductivityReport> {
    return this.reportsService.getWorkerProductivityReport(filters);
  }

  @Get('quality-control')
  @Roles({ roles: ['admin', 'quality_manager', 'supervisor'] })
  @ApiOperation({ summary: 'Get quality control report' })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Quality control report generated successfully',
  })
  async getQualityControlReport(
    @Query() filters: ReportFiltersDto,
  ): Promise<QualityControlReport> {
    return this.reportsService.getQualityControlReport(filters);
  }

  @Get('dashboard')
  @Roles({ roles: ['admin', 'production_manager', 'supervisor', 'operator'] })
  @ApiOperation({ summary: 'Get dashboard metrics' })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Dashboard metrics retrieved successfully',
  })
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.reportsService.getDashboardMetrics();
  }

  @Post('custom')
  @Roles({ roles: ['admin', 'production_manager', 'supervisor'] })
  @ApiOperation({ summary: 'Generate custom report' })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Custom report generated successfully',
  })
  async generateCustomReport(
    @Body() customReportDto: CustomReportDto,
  ): Promise<CustomReport> {
    const { reportType, groupByFields, metrics, ...filters } = customReportDto;
    return this.reportsService.generateCustomReport(
      reportType,
      filters,
      groupByFields,
      metrics,
    );
  }

  @Post('export/production-efficiency')
  @Roles({ roles: ['admin', 'production_manager', 'supervisor'] })
  @ApiOperation({ summary: 'Export production efficiency report' })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Report exported successfully',
  })
  async exportProductionEfficiencyReport(
    @Query() filters: ReportFiltersDto,
    @Body() exportDto: ExportReportDto,
    @Res() res: Response,
  ): Promise<void> {
    const reportData = await this.reportsService.getProductionEfficiencyReport(filters);
    const exportData = await this.reportsService.exportReport(reportData, exportDto.format);
    
    res.setHeader('Content-Type', exportData.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    res.send(exportData.content);
  }

  @Post('export/inventory-turnover')
  @Roles({ roles: ['admin', 'inventory_manager', 'supervisor'] })
  @ApiOperation({ summary: 'Export inventory turnover report' })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Report exported successfully',
  })
  async exportInventoryTurnoverReport(
    @Query() filters: ReportFiltersDto,
    @Body() exportDto: ExportReportDto,
    @Res() res: Response,
  ): Promise<void> {
    const reportData = await this.reportsService.getInventoryTurnoverReport(filters);
    const exportData = await this.reportsService.exportReport(reportData, exportDto.format);
    
    res.setHeader('Content-Type', exportData.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    res.send(exportData.content);
  }

  @Post('export/worker-productivity')
  @Roles({ roles: ['admin', 'hr_manager', 'supervisor'] })
  @ApiOperation({ summary: 'Export worker productivity report' })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Report exported successfully',
  })
  async exportWorkerProductivityReport(
    @Query() filters: ReportFiltersDto,
    @Body() exportDto: ExportReportDto,
    @Res() res: Response,
  ): Promise<void> {
    const reportData = await this.reportsService.getWorkerProductivityReport(filters);
    const exportData = await this.reportsService.exportReport(reportData, exportDto.format);
    
    res.setHeader('Content-Type', exportData.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    res.send(exportData.content);
  }

  @Post('export/quality-control')
  @Roles({ roles: ['admin', 'quality_manager', 'supervisor'] })
  @ApiOperation({ summary: 'Export quality control report' })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Report exported successfully',
  })
  async exportQualityControlReport(
    @Query() filters: ReportFiltersDto,
    @Body() exportDto: ExportReportDto,
    @Res() res: Response,
  ): Promise<void> {
    const reportData = await this.reportsService.getQualityControlReport(filters);
    const exportData = await this.reportsService.exportReport(reportData, exportDto.format);
    
    res.setHeader('Content-Type', exportData.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    res.send(exportData.content);
  }

  @Post('export/custom')
  @Roles({ roles: ['admin', 'production_manager', 'supervisor'] })
  @ApiOperation({ summary: 'Export custom report' })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Custom report exported successfully',
  })
  async exportCustomReport(
    @Body() customReportDto: CustomReportDto,
    @Query() exportDto: ExportReportDto,
    @Res() res: Response,
  ): Promise<void> {
    const { reportType, groupByFields, metrics, ...filters } = customReportDto;
    const reportData = await this.reportsService.generateCustomReport(
      reportType,
      filters,
      groupByFields,
      metrics,
    );
    const exportData = await this.reportsService.exportReport(reportData, exportDto.format);
    
    res.setHeader('Content-Type', exportData.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    res.send(exportData.content);
  }

  @Get('summary/daily')
  @Roles({ roles: ['admin', 'production_manager', 'supervisor'] })
  @ApiOperation({ summary: 'Get daily summary report' })
  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Daily summary retrieved successfully',
  })
  async getDailySummary(
    @Query('date') date?: string,
  ): Promise<any> {
    const targetDate = date ? new Date(date) : new Date();
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const filters = { startDate, endDate };

    const [production, inventory, quality, worker] = await Promise.all([
      this.reportsService.getProductionEfficiencyReport(filters),
      this.reportsService.getInventoryTurnoverReport(filters),
      this.reportsService.getQualityControlReport(filters),
      this.reportsService.getWorkerProductivityReport(filters),
    ]);

    return {
      date: targetDate.toISOString().split('T')[0],
      production: {
        efficiency: production.efficiencyRate,
        actualQuantity: production.actualQuantity,
        oee: production.oeeScore,
      },
      inventory: {
        turnoverRatio: inventory.turnoverRatio,
        stockouts: inventory.stockoutEvents,
      },
      quality: {
        passRate: quality.passRate,
        defectRate: quality.defectRate,
      },
      worker: {
        productivity: worker.averageProductivity,
        totalWorkers: worker.totalWorkers,
      },
    };
  }

  @Get('summary/weekly')
  @Roles({ roles: ['admin', 'production_manager', 'supervisor'] })
  @ApiOperation({ summary: 'Get weekly summary report' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Weekly summary retrieved successfully',
  })
  async getWeeklySummary(
    @Query('startDate') startDateStr?: string,
  ): Promise<any> {
    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    startDate.setHours(0, 0, 0, 0);
    
    // Get Monday of the week
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diff);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const filters = { startDate, endDate };

    const [production, inventory, quality, worker] = await Promise.all([
      this.reportsService.getProductionEfficiencyReport(filters),
      this.reportsService.getInventoryTurnoverReport(filters),
      this.reportsService.getQualityControlReport(filters),
      this.reportsService.getWorkerProductivityReport(filters),
    ]);

    return {
      weekStarting: startDate.toISOString().split('T')[0],
      weekEnding: endDate.toISOString().split('T')[0],
      production: {
        efficiency: production.efficiencyRate,
        totalProduction: production.actualQuantity,
        oee: production.oeeScore,
        trends: production.trends,
      },
      inventory: {
        turnoverRatio: inventory.turnoverRatio,
        averageInventoryValue: inventory.averageInventoryValue,
        trends: inventory.trends,
      },
      quality: {
        passRate: quality.passRate,
        defectRate: quality.defectRate,
        topDefects: quality.byDefectType.slice(0, 5),
      },
      worker: {
        averageProductivity: worker.averageProductivity,
        totalTasksCompleted: worker.totalTasksCompleted,
        overtimeHours: worker.overtimeHours,
      },
    };
  }

  @Get('summary/monthly')
  @Roles({ roles: ['admin', 'production_manager', 'supervisor'] })
  @ApiOperation({ summary: 'Get monthly summary report' })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiResponse({ 
    status: HttpStatus.OK,
    description: 'Monthly summary retrieved successfully',
  })
  async getMonthlySummary(
    @Query('month') month?: number,
    @Query('year') year?: number,
  ): Promise<any> {
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const filters = { startDate, endDate };

    const [production, inventory, quality, worker, dashboard] = await Promise.all([
      this.reportsService.getProductionEfficiencyReport(filters),
      this.reportsService.getInventoryTurnoverReport(filters),
      this.reportsService.getQualityControlReport(filters),
      this.reportsService.getWorkerProductivityReport(filters),
      this.reportsService.getDashboardMetrics(),
    ]);

    return {
      month: targetMonth,
      year: targetYear,
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      production: {
        efficiency: production.efficiencyRate,
        totalProduction: production.actualQuantity,
        oee: production.oeeScore,
        downtime: production.downtime,
        byProduct: production.byProduct,
      },
      inventory: {
        turnoverRatio: inventory.turnoverRatio,
        averageInventoryValue: inventory.averageInventoryValue,
        daysInventoryOutstanding: inventory.daysInventoryOutstanding,
        byProduct: inventory.byProduct,
      },
      quality: {
        passRate: quality.passRate,
        defectRate: quality.defectRate,
        costOfQuality: quality.costOfQuality,
        paretoAnalysis: quality.paretoAnalysis,
      },
      worker: {
        averageProductivity: worker.averageProductivity,
        totalTasksCompleted: worker.totalTasksCompleted,
        utilizationRate: worker.utilizationRate,
        byDepartment: worker.byDepartment,
      },
      kpis: dashboard.kpis,
    };
  }
}