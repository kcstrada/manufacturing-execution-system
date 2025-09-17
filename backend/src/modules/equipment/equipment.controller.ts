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
  EquipmentService,
  EquipmentMetrics,
  MaintenanceMetrics,
} from './equipment.service';
import {
  CreateEquipmentDto,
  CreateMaintenanceScheduleDto,
  RecordMaintenanceDto,
} from './dto/create-equipment.dto';
import {
  UpdateEquipmentDto,
  UpdateMaintenanceScheduleDto,
} from './dto/update-equipment.dto';
import {
  Equipment,
  EquipmentStatus,
  EquipmentType,
  MaintenanceSchedule,
  MaintenanceRecord,
} from '../../entities/equipment.entity';

@ApiTags('equipment')
@ApiBearerAuth()
@Controller('equipment')
@UseGuards(AuthGuard, RoleGuard)
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  // Equipment Management
  @Post()
  @Roles({ roles: ['admin', 'production_manager', 'maintenance_manager'] })
  @ApiOperation({ summary: 'Create new equipment' })
  @ApiResponse({ status: HttpStatus.CREATED, type: Equipment })
  async create(
    @Body() createEquipmentDto: CreateEquipmentDto,
  ): Promise<Equipment> {
    return this.equipmentService.create(createEquipmentDto);
  }

  @Get()
  @Roles({ roles: ['admin', 'user'] })
  @ApiOperation({ summary: 'Get all equipment' })
  @ApiQuery({ name: 'status', enum: EquipmentStatus, required: false })
  @ApiQuery({ name: 'type', enum: EquipmentType, required: false })
  @ApiQuery({ name: 'workCenterId', required: false })
  @ApiQuery({ name: 'departmentId', required: false })
  @ApiQuery({ name: 'isCritical', type: Boolean, required: false })
  @ApiQuery({ name: 'requiresCalibration', type: Boolean, required: false })
  @ApiResponse({ status: HttpStatus.OK, type: [Equipment] })
  async findAll(
    @Query('status') status?: EquipmentStatus,
    @Query('type') type?: EquipmentType,
    @Query('workCenterId') workCenterId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('isCritical') isCritical?: boolean,
    @Query('requiresCalibration') requiresCalibration?: boolean,
  ): Promise<Equipment[]> {
    return this.equipmentService.findAll({
      status,
      type,
      workCenterId,
      departmentId,
      isCritical,
      requiresCalibration,
    });
  }

  @Get('metrics')
  @Roles({ roles: ['admin', 'production_manager', 'maintenance_manager'] })
  @ApiOperation({ summary: 'Get equipment metrics' })
  @ApiResponse({ status: HttpStatus.OK })
  async getMetrics(): Promise<EquipmentMetrics> {
    return this.equipmentService.getEquipmentMetrics();
  }

  @Get('calibration-due')
  @Roles({ roles: ['admin', 'maintenance_manager', 'quality_manager'] })
  @ApiOperation({ summary: 'Get equipment requiring calibration' })
  @ApiResponse({ status: HttpStatus.OK, type: [Equipment] })
  async getCalibrationDue(): Promise<Equipment[]> {
    return this.equipmentService.getEquipmentRequiringCalibration();
  }

  @Get(':id')
  @Roles({ roles: ['admin', 'user'] })
  @ApiOperation({ summary: 'Get equipment by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: Equipment })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Equipment> {
    return this.equipmentService.findOne(id);
  }

  @Patch(':id')
  @Roles({ roles: ['admin', 'production_manager', 'maintenance_manager'] })
  @ApiOperation({ summary: 'Update equipment' })
  @ApiResponse({ status: HttpStatus.OK, type: Equipment })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
  ): Promise<Equipment> {
    return this.equipmentService.update(id, updateEquipmentDto);
  }

  @Patch(':id/status')
  @Roles({ roles: ['admin', 'production_manager', 'maintenance_manager'] })
  @ApiOperation({ summary: 'Update equipment status' })
  @ApiResponse({ status: HttpStatus.OK, type: Equipment })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: EquipmentStatus,
  ): Promise<Equipment> {
    return this.equipmentService.updateStatus(id, status);
  }

  @Post(':id/operating-hours')
  @Roles({ roles: ['admin', 'production_manager', 'maintenance_manager'] })
  @ApiOperation({ summary: 'Update equipment operating hours' })
  @ApiResponse({ status: HttpStatus.OK, type: Equipment })
  async updateOperatingHours(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('hours') hours: number,
  ): Promise<Equipment> {
    return this.equipmentService.updateOperatingHours(id, hours);
  }

  @Post(':id/calibration')
  @Roles({ roles: ['admin', 'maintenance_manager', 'quality_manager'] })
  @ApiOperation({ summary: 'Record equipment calibration' })
  @ApiResponse({ status: HttpStatus.OK, type: Equipment })
  async recordCalibration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { calibrationDate: string; nextCalibrationDate: string },
  ): Promise<Equipment> {
    return this.equipmentService.recordCalibration(
      id,
      new Date(body.calibrationDate),
      new Date(body.nextCalibrationDate),
    );
  }

  @Get(':id/oee')
  @Roles({ roles: ['admin', 'production_manager'] })
  @ApiOperation({ summary: 'Calculate equipment OEE' })
  @ApiResponse({ status: HttpStatus.OK })
  async calculateOEE(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ oee: number }> {
    const period =
      startDate && endDate
        ? { start: new Date(startDate), end: new Date(endDate) }
        : undefined;

    const oee = await this.equipmentService.calculateOEE(id, period);
    return { oee };
  }

  @Delete(':id')
  @Roles({ roles: ['admin'] })
  @ApiOperation({ summary: 'Delete equipment' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.equipmentService.remove(id);
  }

  // Maintenance Schedule Management
  @Post('maintenance/schedule')
  @Roles({ roles: ['admin', 'maintenance_manager'] })
  @ApiOperation({ summary: 'Create maintenance schedule' })
  @ApiResponse({ status: HttpStatus.CREATED, type: MaintenanceSchedule })
  async createMaintenanceSchedule(
    @Body() createDto: CreateMaintenanceScheduleDto,
  ): Promise<MaintenanceSchedule> {
    return this.equipmentService.createMaintenanceSchedule(createDto);
  }

  @Get('maintenance/upcoming')
  @Roles({ roles: ['admin', 'maintenance_manager', 'production_manager'] })
  @ApiOperation({ summary: 'Get upcoming maintenance' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days ahead',
  })
  @ApiResponse({ status: HttpStatus.OK, type: [MaintenanceSchedule] })
  async getUpcomingMaintenance(
    @Query('days') days?: number,
  ): Promise<MaintenanceSchedule[]> {
    return this.equipmentService.getUpcomingMaintenance(days);
  }

  @Get('maintenance/overdue')
  @Roles({ roles: ['admin', 'maintenance_manager'] })
  @ApiOperation({ summary: 'Get overdue maintenance' })
  @ApiResponse({ status: HttpStatus.OK, type: [MaintenanceSchedule] })
  async getOverdueMaintenance(): Promise<MaintenanceSchedule[]> {
    return this.equipmentService.getOverdueMaintenance();
  }

  @Get('maintenance/metrics')
  @Roles({ roles: ['admin', 'maintenance_manager'] })
  @ApiOperation({ summary: 'Get maintenance metrics' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: HttpStatus.OK })
  async getMaintenanceMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<MaintenanceMetrics> {
    return this.equipmentService.getMaintenanceMetrics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Patch('maintenance/schedule/:id')
  @Roles({ roles: ['admin', 'maintenance_manager'] })
  @ApiOperation({ summary: 'Update maintenance schedule' })
  @ApiResponse({ status: HttpStatus.OK, type: MaintenanceSchedule })
  async updateMaintenanceSchedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateMaintenanceScheduleDto,
  ): Promise<MaintenanceSchedule> {
    return this.equipmentService.updateMaintenanceSchedule(id, updateDto);
  }

  @Post('maintenance/schedule/:id/start')
  @Roles({ roles: ['admin', 'maintenance_manager', 'maintenance_technician'] })
  @ApiOperation({ summary: 'Start scheduled maintenance' })
  @ApiResponse({ status: HttpStatus.OK, type: MaintenanceSchedule })
  async startMaintenance(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MaintenanceSchedule> {
    return this.equipmentService.startMaintenance(id);
  }

  @Post('maintenance/schedule/:id/complete')
  @Roles({ roles: ['admin', 'maintenance_manager', 'maintenance_technician'] })
  @ApiOperation({ summary: 'Complete scheduled maintenance' })
  @ApiResponse({ status: HttpStatus.OK, type: MaintenanceRecord })
  async completeMaintenance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() recordDto: RecordMaintenanceDto,
  ): Promise<MaintenanceRecord> {
    return this.equipmentService.completeMaintenance(id, recordDto);
  }

  // Maintenance Records
  @Post('maintenance/record')
  @Roles({ roles: ['admin', 'maintenance_manager', 'maintenance_technician'] })
  @ApiOperation({ summary: 'Record maintenance activity' })
  @ApiResponse({ status: HttpStatus.CREATED, type: MaintenanceRecord })
  async recordMaintenance(
    @Body() recordDto: RecordMaintenanceDto,
  ): Promise<MaintenanceRecord> {
    return this.equipmentService.recordMaintenance(recordDto);
  }

  @Get(':id/maintenance/history')
  @Roles({ roles: ['admin', 'maintenance_manager'] })
  @ApiOperation({ summary: 'Get equipment maintenance history' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: HttpStatus.OK, type: [MaintenanceRecord] })
  async getMaintenanceHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
  ): Promise<MaintenanceRecord[]> {
    return this.equipmentService.getMaintenanceHistory(id, limit);
  }
}
