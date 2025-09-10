import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, In, Not } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';
import {
  Equipment,
  EquipmentStatus,
  EquipmentType,
  MaintenanceSchedule,
  MaintenanceRecord,
  MaintenanceStatus,
} from '../../entities/equipment.entity';
import {
  CreateEquipmentDto,
  CreateMaintenanceScheduleDto,
  RecordMaintenanceDto,
} from './dto/create-equipment.dto';
import {
  UpdateEquipmentDto,
  UpdateMaintenanceScheduleDto,
} from './dto/update-equipment.dto';
import { addDays, differenceInHours, startOfDay, endOfDay } from 'date-fns';

export interface EquipmentMetrics {
  totalEquipment: number;
  operationalCount: number;
  maintenanceCount: number;
  breakdownCount: number;
  averageOEE: number;
  upcomingMaintenance: number;
  overdueMaintenance: number;
  criticalEquipment: {
    total: number;
    operational: number;
  };
}

export interface MaintenanceMetrics {
  totalScheduled: number;
  completed: number;
  overdue: number;
  inProgress: number;
  mtbf: number; // Mean Time Between Failures
  mttr: number; // Mean Time To Repair
  totalCost: number;
  breakdownRate: number;
}

@Injectable()
export class EquipmentService {
  private readonly logger = new Logger(EquipmentService.name);

  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    @InjectRepository(MaintenanceSchedule)
    private readonly scheduleRepository: Repository<MaintenanceSchedule>,
    @InjectRepository(MaintenanceRecord)
    private readonly recordRepository: Repository<MaintenanceRecord>,
    private readonly eventEmitter: EventEmitter2,
    private readonly clsService: ClsService,
  ) {}

  private getTenantId(): string {
    const tenantId = this.clsService.get<string>('tenantId');
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required');
    }
    return tenantId;
  }

  // Equipment Management
  async create(createDto: CreateEquipmentDto): Promise<Equipment> {
    const tenantId = this.getTenantId();

    // Check for duplicate equipment code
    const existing = await this.equipmentRepository.findOne({
      where: { tenantId, equipmentCode: createDto.equipmentCode },
    });

    if (existing) {
      throw new ConflictException(
        `Equipment with code ${createDto.equipmentCode} already exists`,
      );
    }

    const equipment = this.equipmentRepository.create({
      ...createDto,
      tenantId,
      status: createDto.status || EquipmentStatus.OPERATIONAL,
      totalOperatingHours: 0,
      hoursSinceLastMaintenance: 0,
      totalMaintenanceCount: 0,
      totalBreakdownCount: 0,
      availability: 100,
      performance: 100,
      quality: 100,
      oee: 100,
    });

    // Calculate next maintenance date if interval is provided
    if (createDto.maintenanceIntervalHours) {
      equipment.maintenanceIntervalHours = createDto.maintenanceIntervalHours;
      const nextDate = new Date();
      nextDate.setHours(nextDate.getHours() + createDto.maintenanceIntervalHours);
      equipment.nextMaintenanceDate = nextDate;
    }

    const saved = await this.equipmentRepository.save(equipment);

    this.eventEmitter.emit('equipment.created', {
      equipmentId: saved.id,
      equipmentCode: saved.equipmentCode,
      type: saved.type,
    });

    this.logger.log(`Equipment ${saved.equipmentCode} created`);
    return saved;
  }

  async findAll(filters?: {
    status?: EquipmentStatus;
    type?: EquipmentType;
    workCenterId?: string;
    departmentId?: string;
    isCritical?: boolean;
    requiresCalibration?: boolean;
  }): Promise<Equipment[]> {
    const tenantId = this.getTenantId();
    const where: any = { tenantId };

    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    if (filters?.workCenterId) where.workCenterId = filters.workCenterId;
    if (filters?.departmentId) where.departmentId = filters.departmentId;
    if (filters?.isCritical !== undefined) where.isCritical = filters.isCritical;
    if (filters?.requiresCalibration !== undefined) {
      where.requiresCalibration = filters.requiresCalibration;
    }

    return this.equipmentRepository.find({
      where,
      relations: ['workCenter', 'department'],
      order: { equipmentCode: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Equipment> {
    const tenantId = this.getTenantId();
    const equipment = await this.equipmentRepository.findOne({
      where: { id, tenantId },
      relations: ['workCenter', 'department', 'supplier'],
    });

    if (!equipment) {
      throw new NotFoundException(`Equipment with ID ${id} not found`);
    }

    return equipment;
  }

  async update(id: string, updateDto: UpdateEquipmentDto): Promise<Equipment> {
    const equipment = await this.findOne(id);

    // Check for duplicate equipment code if changing
    if (updateDto.equipmentCode && updateDto.equipmentCode !== equipment.equipmentCode) {
      const existing = await this.equipmentRepository.findOne({
        where: {
          tenantId: equipment.tenantId,
          equipmentCode: updateDto.equipmentCode,
          id: Not(id),
        },
      });

      if (existing) {
        throw new ConflictException(
          `Equipment with code ${updateDto.equipmentCode} already exists`,
        );
      }
    }

    Object.assign(equipment, updateDto);

    const saved = await this.equipmentRepository.save(equipment);

    if (updateDto.status) {
      this.eventEmitter.emit('equipment.status.changed', {
        equipmentId: saved.id,
        oldStatus: equipment.status,
        newStatus: updateDto.status,
      });
    }

    return saved;
  }

  async updateStatus(id: string, status: EquipmentStatus): Promise<Equipment> {
    const equipment = await this.findOne(id);
    const oldStatus = equipment.status;

    equipment.status = status;

    // Update availability metric
    if (status === EquipmentStatus.OPERATIONAL || status === EquipmentStatus.IDLE) {
      equipment.availability = 100;
    } else if (status === EquipmentStatus.MAINTENANCE || status === EquipmentStatus.REPAIR) {
      equipment.availability = 0;
    }

    // Recalculate OEE
    equipment.oee = (equipment.availability * equipment.performance * equipment.quality) / 10000;

    const saved = await this.equipmentRepository.save(equipment);

    this.eventEmitter.emit('equipment.status.changed', {
      equipmentId: saved.id,
      equipmentCode: saved.equipmentCode,
      oldStatus,
      newStatus: status,
    });

    this.logger.log(`Equipment ${saved.equipmentCode} status changed to ${status}`);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const equipment = await this.findOne(id);

    // Check for active maintenance schedules
    const activeSchedules = await this.scheduleRepository.count({
      where: {
        equipmentId: id,
        status: In([MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS]),
      },
    });

    if (activeSchedules > 0) {
      throw new BadRequestException(
        'Cannot delete equipment with active maintenance schedules',
      );
    }

    await this.equipmentRepository.softDelete(id);

    this.eventEmitter.emit('equipment.deleted', {
      equipmentId: id,
      equipmentCode: equipment.equipmentCode,
    });

    this.logger.log(`Equipment ${equipment.equipmentCode} deleted`);
  }

  // Operating Hours Management
  async updateOperatingHours(id: string, hours: number): Promise<Equipment> {
    const equipment = await this.findOne(id);

    equipment.totalOperatingHours += hours;
    equipment.hoursSinceLastMaintenance += hours;

    // Check if maintenance is due
    if (
      equipment.maintenanceIntervalHours > 0 &&
      equipment.hoursSinceLastMaintenance >= equipment.maintenanceIntervalHours
    ) {
      this.eventEmitter.emit('equipment.maintenance.due', {
        equipmentId: equipment.id,
        equipmentCode: equipment.equipmentCode,
        hoursSinceLastMaintenance: equipment.hoursSinceLastMaintenance,
      });
    }

    return this.equipmentRepository.save(equipment);
  }

  // Maintenance Schedule Management
  async createMaintenanceSchedule(
    createDto: CreateMaintenanceScheduleDto,
  ): Promise<MaintenanceSchedule> {
    const tenantId = this.getTenantId();
    const equipment = await this.findOne(createDto.equipmentId);

    const schedule = this.scheduleRepository.create({
      ...createDto,
      tenantId,
      status: MaintenanceStatus.SCHEDULED,
      scheduledDate: new Date(createDto.scheduledDate),
    });

    const saved = await this.scheduleRepository.save(schedule);

    // Update equipment next maintenance date
    if (!equipment.nextMaintenanceDate || 
        new Date(createDto.scheduledDate) < equipment.nextMaintenanceDate) {
      equipment.nextMaintenanceDate = new Date(createDto.scheduledDate);
      await this.equipmentRepository.save(equipment);
    }

    // Create recurring schedules if specified
    if (createDto.isRecurring && createDto.recurringIntervalDays) {
      await this.createRecurringSchedules(saved, createDto.recurringIntervalDays);
    }

    this.eventEmitter.emit('maintenance.scheduled', {
      scheduleId: saved.id,
      equipmentId: saved.equipmentId,
      scheduledDate: saved.scheduledDate,
      type: saved.type,
    });

    this.logger.log(`Maintenance scheduled for equipment ${equipment.equipmentCode}`);
    return saved;
  }

  private async createRecurringSchedules(
    originalSchedule: MaintenanceSchedule,
    intervalDays: number,
    count: number = 12, // Create 12 recurring schedules by default
  ): Promise<void> {
    const schedules: MaintenanceSchedule[] = [];
    let currentDate = new Date(originalSchedule.scheduledDate);

    for (let i = 1; i <= count; i++) {
      currentDate = addDays(currentDate, intervalDays);
      
      const recurringSchedule = this.scheduleRepository.create({
        ...originalSchedule,
        id: undefined,
        scheduledDate: currentDate,
        createdAt: undefined,
        updatedAt: undefined,
      });

      schedules.push(recurringSchedule);
    }

    await this.scheduleRepository.save(schedules);
  }

  async getUpcomingMaintenance(days: number = 7): Promise<MaintenanceSchedule[]> {
    const tenantId = this.getTenantId();
    const endDate = addDays(new Date(), days);

    return this.scheduleRepository.find({
      where: {
        tenantId,
        status: MaintenanceStatus.SCHEDULED,
        scheduledDate: Between(new Date(), endDate),
      },
      relations: ['equipment'],
      order: { scheduledDate: 'ASC' },
    });
  }

  async getOverdueMaintenance(): Promise<MaintenanceSchedule[]> {
    const tenantId = this.getTenantId();

    const schedules = await this.scheduleRepository.find({
      where: {
        tenantId,
        status: MaintenanceStatus.SCHEDULED,
        scheduledDate: LessThan(new Date()),
      },
      relations: ['equipment'],
      order: { scheduledDate: 'ASC' },
    });

    // Update status to overdue
    for (const schedule of schedules) {
      schedule.status = MaintenanceStatus.OVERDUE;
      await this.scheduleRepository.save(schedule);
    }

    return schedules;
  }

  async updateMaintenanceSchedule(
    id: string,
    updateDto: UpdateMaintenanceScheduleDto,
  ): Promise<MaintenanceSchedule> {
    const tenantId = this.getTenantId();
    const schedule = await this.scheduleRepository.findOne({
      where: { id, tenantId },
      relations: ['equipment'],
    });

    if (!schedule) {
      throw new NotFoundException(`Maintenance schedule with ID ${id} not found`);
    }

    Object.assign(schedule, updateDto);

    if (updateDto.scheduledDate) {
      schedule.scheduledDate = new Date(updateDto.scheduledDate);
    }

    return this.scheduleRepository.save(schedule);
  }

  async startMaintenance(scheduleId: string): Promise<MaintenanceSchedule> {
    const tenantId = this.getTenantId();
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId, tenantId },
      relations: ['equipment'],
    });

    if (!schedule) {
      throw new NotFoundException(`Maintenance schedule with ID ${scheduleId} not found`);
    }

    if (schedule.status !== MaintenanceStatus.SCHEDULED &&
        schedule.status !== MaintenanceStatus.OVERDUE) {
      throw new BadRequestException('Maintenance has already been started or completed');
    }

    schedule.status = MaintenanceStatus.IN_PROGRESS;
    const saved = await this.scheduleRepository.save(schedule);

    // Update equipment status
    await this.updateStatus(schedule.equipmentId, EquipmentStatus.MAINTENANCE);

    this.eventEmitter.emit('maintenance.started', {
      scheduleId: saved.id,
      equipmentId: saved.equipmentId,
    });

    return saved;
  }

  async completeMaintenance(
    scheduleId: string,
    recordDto: RecordMaintenanceDto,
  ): Promise<MaintenanceRecord> {
    const tenantId = this.getTenantId();
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId, tenantId },
      relations: ['equipment'],
    });

    if (!schedule) {
      throw new NotFoundException(`Maintenance schedule with ID ${scheduleId} not found`);
    }

    if (schedule.status !== MaintenanceStatus.IN_PROGRESS) {
      throw new BadRequestException('Maintenance is not in progress');
    }

    // Create maintenance record
    const record = await this.recordMaintenance({
      ...recordDto,
      scheduleId,
    });

    // Update schedule status
    schedule.status = MaintenanceStatus.COMPLETED;
    await this.scheduleRepository.save(schedule);

    // Update equipment
    const equipment = await this.findOne(schedule.equipmentId);
    equipment.lastMaintenanceDate = new Date();
    equipment.hoursSinceLastMaintenance = 0;
    equipment.totalMaintenanceCount++;
    equipment.status = EquipmentStatus.OPERATIONAL;

    // Calculate next maintenance date
    if (equipment.maintenanceIntervalHours > 0) {
      const nextDate = new Date();
      nextDate.setHours(nextDate.getHours() + equipment.maintenanceIntervalHours);
      equipment.nextMaintenanceDate = nextDate;
    }

    await this.equipmentRepository.save(equipment);

    this.eventEmitter.emit('maintenance.completed', {
      scheduleId,
      recordId: record.id,
      equipmentId: equipment.id,
    });

    return record;
  }

  // Maintenance Records
  async recordMaintenance(recordDto: RecordMaintenanceDto): Promise<MaintenanceRecord> {
    const tenantId = this.getTenantId();
    const equipment = await this.findOne(recordDto.equipmentId);

    // Generate record number
    const count = await this.recordRepository.count({ where: { tenantId } });
    const recordNumber = `MR-${String(count + 1).padStart(6, '0')}`;

    // Calculate duration if not provided
    let duration = recordDto.duration;
    if (!duration && recordDto.startDate && recordDto.endDate) {
      duration = differenceInHours(
        new Date(recordDto.endDate),
        new Date(recordDto.startDate),
      );
    }

    // Calculate total cost
    const totalCost = (recordDto.laborCost || 0) + (recordDto.partsCost || 0);

    const record = this.recordRepository.create({
      ...recordDto,
      tenantId,
      recordNumber,
      duration: duration || 0,
      totalCost,
      startDate: new Date(recordDto.startDate),
      endDate: recordDto.endDate ? new Date(recordDto.endDate) : undefined,
    });

    const saved = await this.recordRepository.save(record);

    // Update equipment statistics
    if (recordDto.wasBreakdown) {
      equipment.totalBreakdownCount++;
    }

    this.logger.log(`Maintenance record ${saved.recordNumber} created`);
    return saved;
  }

  async getMaintenanceHistory(
    equipmentId: string,
    limit: number = 50,
  ): Promise<MaintenanceRecord[]> {
    const tenantId = this.getTenantId();
    
    return this.recordRepository.find({
      where: { equipmentId, tenantId },
      order: { startDate: 'DESC' },
      take: limit,
    });
  }

  // Metrics and Analytics
  async getEquipmentMetrics(): Promise<EquipmentMetrics> {
    const tenantId = this.getTenantId();
    const equipment = await this.equipmentRepository.find({ where: { tenantId } });

    const metrics: EquipmentMetrics = {
      totalEquipment: equipment.length,
      operationalCount: 0,
      maintenanceCount: 0,
      breakdownCount: 0,
      averageOEE: 0,
      upcomingMaintenance: 0,
      overdueMaintenance: 0,
      criticalEquipment: {
        total: 0,
        operational: 0,
      },
    };

    let totalOEE = 0;

    for (const eq of equipment) {
      if (eq.status === EquipmentStatus.OPERATIONAL) {
        metrics.operationalCount++;
        if (eq.isCritical) metrics.criticalEquipment.operational++;
      } else if (eq.status === EquipmentStatus.MAINTENANCE) {
        metrics.maintenanceCount++;
      } else if (eq.status === EquipmentStatus.REPAIR) {
        metrics.breakdownCount++;
      }

      if (eq.isCritical) metrics.criticalEquipment.total++;
      totalOEE += eq.oee;
    }

    metrics.averageOEE = equipment.length > 0 ? totalOEE / equipment.length : 0;

    // Count upcoming and overdue maintenance
    const upcoming = await this.getUpcomingMaintenance(7);
    metrics.upcomingMaintenance = upcoming.length;

    const overdue = await this.getOverdueMaintenance();
    metrics.overdueMaintenance = overdue.length;

    return metrics;
  }

  async getMaintenanceMetrics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<MaintenanceMetrics> {
    const tenantId = this.getTenantId();
    const dateRange = {
      startDate: startDate || startOfDay(new Date(new Date().setMonth(new Date().getMonth() - 1))),
      endDate: endDate || endOfDay(new Date()),
    };

    const schedules = await this.scheduleRepository.find({
      where: {
        tenantId,
        scheduledDate: Between(dateRange.startDate, dateRange.endDate),
      },
    });

    const records = await this.recordRepository.find({
      where: {
        tenantId,
        startDate: Between(dateRange.startDate, dateRange.endDate),
      },
    });

    const metrics: MaintenanceMetrics = {
      totalScheduled: schedules.length,
      completed: schedules.filter(s => s.status === MaintenanceStatus.COMPLETED).length,
      overdue: schedules.filter(s => s.status === MaintenanceStatus.OVERDUE).length,
      inProgress: schedules.filter(s => s.status === MaintenanceStatus.IN_PROGRESS).length,
      mtbf: 0,
      mttr: 0,
      totalCost: 0,
      breakdownRate: 0,
    };

    // Calculate total cost and repair times
    let totalRepairTime = 0;
    let breakdownCount = 0;

    for (const record of records) {
      metrics.totalCost += record.totalCost;
      if (record.wasBreakdown) {
        breakdownCount++;
        totalRepairTime += record.duration;
      }
    }

    // Calculate MTTR (Mean Time To Repair)
    if (breakdownCount > 0) {
      metrics.mttr = totalRepairTime / breakdownCount;
    }

    // Calculate breakdown rate
    if (records.length > 0) {
      metrics.breakdownRate = (breakdownCount / records.length) * 100;
    }

    // Calculate MTBF (would need operating hours data for accurate calculation)
    // This is a simplified calculation
    const equipment = await this.equipmentRepository.find({ where: { tenantId } });
    let totalOperatingHours = 0;
    let totalBreakdowns = 0;

    for (const eq of equipment) {
      totalOperatingHours += eq.totalOperatingHours;
      totalBreakdowns += eq.totalBreakdownCount;
    }

    if (totalBreakdowns > 0) {
      metrics.mtbf = totalOperatingHours / totalBreakdowns;
    }

    return metrics;
  }

  async calculateOEE(equipmentId: string, _period?: { start: Date; end: Date }): Promise<number> {
    const equipment = await this.findOne(equipmentId);

    // This is a simplified OEE calculation
    // In a real system, you would track actual production data
    const oee = (equipment.availability * equipment.performance * equipment.quality) / 10000;
    
    equipment.oee = oee;
    await this.equipmentRepository.save(equipment);

    return oee;
  }

  // Calibration Management
  async getEquipmentRequiringCalibration(): Promise<Equipment[]> {
    const tenantId = this.getTenantId();
    const today = new Date();

    return this.equipmentRepository.find({
      where: {
        tenantId,
        requiresCalibration: true,
        nextCalibrationDate: LessThan(today),
      },
      order: { nextCalibrationDate: 'ASC' },
    });
  }

  async recordCalibration(
    equipmentId: string,
    calibrationDate: Date,
    nextCalibrationDate: Date,
  ): Promise<Equipment> {
    const equipment = await this.findOne(equipmentId);

    equipment.lastCalibrationDate = calibrationDate;
    equipment.nextCalibrationDate = nextCalibrationDate;

    const saved = await this.equipmentRepository.save(equipment);

    this.eventEmitter.emit('equipment.calibrated', {
      equipmentId: saved.id,
      equipmentCode: saved.equipmentCode,
      calibrationDate,
      nextCalibrationDate,
    });

    return saved;
  }
}