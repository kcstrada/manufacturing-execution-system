import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
  WasteService,
  WasteMetrics,
  WasteTrend,
} from './waste.service';
import {
  CreateWasteRecordDto,
  RecordDisposalDto,
} from './dto/create-waste-record.dto';
import { UpdateWasteRecordDto } from './dto/update-waste-record.dto';
import {
  WasteRecord,
  WasteType,
  WasteCategory,
  DisposalMethod,
  WasteSummary,
} from '../../entities/waste-record.entity';

@ApiTags('waste')
@ApiBearerAuth()
@Controller('waste')
@UseGuards(AuthGuard, RoleGuard)
export class WasteController {
  constructor(private readonly wasteService: WasteService) {}

  @Post()
  @Roles({ roles: ['admin', 'production_supervisor', 'quality_inspector'] })
  @ApiOperation({ summary: 'Record waste/scrap' })
  @ApiResponse({ status: HttpStatus.CREATED, type: WasteRecord })
  async create(@Body() createDto: CreateWasteRecordDto): Promise<WasteRecord> {
    return this.wasteService.create(createDto);
  }

  @Get()
  @Roles({ roles: ['admin', 'user'] })
  @ApiOperation({ summary: 'Get all waste records' })
  @ApiQuery({ name: 'type', enum: WasteType, required: false })
  @ApiQuery({ name: 'category', enum: WasteCategory, required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'workOrderId', required: false })
  @ApiQuery({ name: 'equipmentId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'isRecurring', type: Boolean, required: false })
  @ApiQuery({ name: 'disposalMethod', enum: DisposalMethod, required: false })
  @ApiResponse({ status: HttpStatus.OK, type: [WasteRecord] })
  async findAll(
    @Query('type') type?: WasteType,
    @Query('category') category?: WasteCategory,
    @Query('productId') productId?: string,
    @Query('workOrderId') workOrderId?: string,
    @Query('equipmentId') equipmentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('isRecurring') isRecurring?: boolean,
    @Query('disposalMethod') disposalMethod?: DisposalMethod,
  ): Promise<WasteRecord[]> {
    return this.wasteService.findAll({
      type,
      category,
      productId,
      workOrderId,
      equipmentId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      isRecurring,
      disposalMethod,
    });
  }

  @Get('metrics')
  @Roles({ roles: ['admin', 'production_manager', 'quality_manager'] })
  @ApiOperation({ summary: 'Get waste metrics and KPIs' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiResponse({ status: HttpStatus.OK })
  async getMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('productId') productId?: string,
  ): Promise<WasteMetrics> {
    return this.wasteService.getWasteMetrics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      productId,
    );
  }

  @Get('summary')
  @Roles({ roles: ['admin', 'production_manager'] })
  @ApiOperation({ summary: 'Get waste summary' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: HttpStatus.OK })
  async getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<WasteSummary> {
    return this.wasteService.getWasteSummary(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('trends')
  @Roles({ roles: ['admin', 'production_manager'] })
  @ApiOperation({ summary: 'Get waste trends' })
  @ApiQuery({ name: 'period', enum: ['daily', 'weekly', 'monthly'], default: 'daily' })
  @ApiQuery({ name: 'days', type: Number, default: 30 })
  @ApiResponse({ status: HttpStatus.OK })
  async getTrends(
    @Query('period') period?: 'daily' | 'weekly' | 'monthly',
    @Query('days') days?: number,
  ): Promise<WasteTrend[]> {
    return this.wasteService.getWasteTrends(period || 'daily', days || 30);
  }

  @Get('recurring')
  @Roles({ roles: ['admin', 'production_manager', 'quality_manager'] })
  @ApiOperation({ summary: 'Get recurring waste issues' })
  @ApiResponse({ status: HttpStatus.OK, type: [WasteRecord] })
  async getRecurringIssues(): Promise<WasteRecord[]> {
    return this.wasteService.getRecurringIssues();
  }

  @Get('pending-disposals')
  @Roles({ roles: ['admin', 'waste_manager'] })
  @ApiOperation({ summary: 'Get waste records pending disposal' })
  @ApiResponse({ status: HttpStatus.OK, type: [WasteRecord] })
  async getPendingDisposals(): Promise<WasteRecord[]> {
    return this.wasteService.getPendingDisposals();
  }

  @Get('hazardous')
  @Roles({ roles: ['admin', 'waste_manager', 'safety_officer'] })
  @ApiOperation({ summary: 'Get hazardous waste records' })
  @ApiResponse({ status: HttpStatus.OK, type: [WasteRecord] })
  async getHazardousWaste(): Promise<WasteRecord[]> {
    return this.wasteService.getHazardousWaste();
  }

  @Get('alerts')
  @Roles({ roles: ['admin', 'production_manager'] })
  @ApiOperation({ summary: 'Get waste alerts and warnings' })
  @ApiResponse({ status: HttpStatus.OK })
  async getAlerts(): Promise<Array<{ type: string; message: string; severity: string }>> {
    return this.wasteService.checkWasteAlerts();
  }

  @Get('by-record/:recordNumber')
  @Roles({ roles: ['admin', 'user'] })
  @ApiOperation({ summary: 'Get waste record by record number' })
  @ApiResponse({ status: HttpStatus.OK, type: WasteRecord })
  async findByRecordNumber(@Param('recordNumber') recordNumber: string): Promise<WasteRecord> {
    return this.wasteService.findByRecordNumber(recordNumber);
  }

  @Get(':id')
  @Roles({ roles: ['admin', 'user'] })
  @ApiOperation({ summary: 'Get waste record by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: WasteRecord })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<WasteRecord> {
    return this.wasteService.findOne(id);
  }

  @Patch(':id')
  @Roles({ roles: ['admin', 'production_supervisor'] })
  @ApiOperation({ summary: 'Update waste record' })
  @ApiResponse({ status: HttpStatus.OK, type: WasteRecord })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateWasteRecordDto,
  ): Promise<WasteRecord> {
    return this.wasteService.update(id, updateDto);
  }

  @Post(':id/disposal')
  @Roles({ roles: ['admin', 'waste_manager'] })
  @ApiOperation({ summary: 'Record waste disposal' })
  @ApiResponse({ status: HttpStatus.OK, type: WasteRecord })
  async recordDisposal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() disposalDto: RecordDisposalDto,
  ): Promise<WasteRecord> {
    return this.wasteService.recordDisposal(id, disposalDto);
  }

  @Delete(':id')
  @Roles({ roles: ['admin'] })
  @ApiOperation({ summary: 'Delete waste record' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.wasteService.delete(id);
  }
}