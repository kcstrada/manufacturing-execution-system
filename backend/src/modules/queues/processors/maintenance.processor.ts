import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { QUEUE_NAMES, JOB_NAMES } from '../constants/queue-names';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Processor(QUEUE_NAMES.MAINTENANCE)
export class MaintenanceProcessor {
  private readonly logger = new Logger(MaintenanceProcessor.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Process(JOB_NAMES.CHECK_MAINTENANCE_DUE)
  async checkMaintenanceDue(job: Job) {
    this.logger.log(`Checking maintenance due - Job ${job.id}`);
    const { equipmentList, checkDate } = job.data;

    try {
      const maintenanceDue = [];

      for (const equipment of equipmentList) {
        await this.simulateProcessing(100);

        const isDue = Math.random() > 0.7; // 30% chance
        if (isDue) {
          const daysOverdue = Math.floor(Math.random() * 10);
          maintenanceDue.push({
            equipmentId: equipment.id,
            equipmentName: equipment.name,
            maintenanceType: this.getRandomMaintenanceType(),
            daysOverdue,
            priority: daysOverdue > 5 ? 'high' : 'medium',
          });

          // Emit maintenance due event
          this.eventEmitter.emit('equipment.maintenance.due', {
            equipment,
            daysOverdue,
            timestamp: new Date(),
          });
        }
      }

      this.logger.log(`Found ${maintenanceDue.length} equipment requiring maintenance`);

      return {
        success: true,
        totalChecked: equipmentList.length,
        maintenanceDue,
        checkedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to check maintenance: ${error.message}`);
      throw error;
    }
  }

  @Process(JOB_NAMES.SCHEDULE_MAINTENANCE)
  async scheduleMaintenance(job: Job) {
    this.logger.log(`Scheduling maintenance - Job ${job.id}`);
    const { equipmentId, maintenanceType, scheduledDate, duration } = job.data;

    try {
      await this.simulateProcessing(2000);

      const schedule = {
        id: `MAINT-${Date.now()}`,
        equipmentId,
        maintenanceType,
        scheduledDate,
        duration,
        status: 'scheduled',
        assignedTechnician: `TECH-${Math.floor(Math.random() * 10)}`,
        createdAt: new Date(),
      };

      this.logger.log(`Maintenance scheduled: ${schedule.id}`);

      // Emit maintenance scheduled event
      this.eventEmitter.emit('equipment.maintenance.scheduled', schedule);

      return {
        success: true,
        schedule,
      };
    } catch (error) {
      this.logger.error(`Failed to schedule maintenance: ${error.message}`);
      throw error;
    }
  }

  @Process(JOB_NAMES.UPDATE_EQUIPMENT_STATUS)
  async updateEquipmentStatus(job: Job) {
    this.logger.log(`Updating equipment status - Job ${job.id}`);
    const { equipmentId, newStatus, reason } = job.data;

    try {
      await this.simulateProcessing(1000);

      // Emit status update event
      this.eventEmitter.emit('equipment.status.changed', {
        equipmentId,
        newStatus,
        reason,
        timestamp: new Date(),
      });

      // If equipment is down, trigger alerts
      if (newStatus === 'breakdown' || newStatus === 'maintenance') {
        this.eventEmitter.emit('equipment.breakdown', {
          equipmentId,
          severity: 'high',
          timestamp: new Date(),
        });
      }

      return {
        success: true,
        equipmentId,
        newStatus,
        updatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to update equipment status: ${error.message}`);
      throw error;
    }
  }

  private async simulateProcessing(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getRandomMaintenanceType(): string {
    const types = ['preventive', 'corrective', 'predictive', 'routine', 'emergency'];
    return types[Math.floor(Math.random() * types.length)] || 'routine';
  }
}