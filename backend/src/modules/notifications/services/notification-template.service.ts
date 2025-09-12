import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationTemplate } from '../entities/notification-template.entity';
import { NotificationType, NotificationChannel } from '../types/notification.types';
import * as Handlebars from 'handlebars';

@Injectable()
export class NotificationTemplateService {
  private readonly logger = new Logger(NotificationTemplateService.name);
  private readonly templateCache = new Map<string, Handlebars.TemplateDelegate>();

  constructor(
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
  ) {
    this.registerHelpers();
  }

  private registerHelpers(): void {
    // Register common Handlebars helpers
    Handlebars.registerHelper('formatDate', (date: Date, format: string) => {
      return new Date(date).toLocaleDateString('en-US');
    });

    Handlebars.registerHelper('formatCurrency', (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
    });

    Handlebars.registerHelper('formatNumber', (num: number) => {
      return new Intl.NumberFormat('en-US').format(num);
    });

    Handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    Handlebars.registerHelper('lowercase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });

    Handlebars.registerHelper('pluralize', (count: number, singular: string, plural: string) => {
      return count === 1 ? singular : plural;
    });

    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    Handlebars.registerHelper('lt', (a: any, b: any) => a < b);
    Handlebars.registerHelper('gt', (a: any, b: any) => a > b);
    Handlebars.registerHelper('lte', (a: any, b: any) => a <= b);
    Handlebars.registerHelper('gte', (a: any, b: any) => a >= b);
  }

  async createTemplate(
    tenantId: string,
    templateData: Partial<NotificationTemplate>,
  ): Promise<NotificationTemplate> {
    const template = this.templateRepository.create({
      ...templateData,
      tenantId,
    });

    return await this.templateRepository.save(template);
  }

  async updateTemplate(
    templateId: string,
    updateData: Partial<NotificationTemplate>,
  ): Promise<NotificationTemplate> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    Object.assign(template, updateData);
    const updated = await this.templateRepository.save(template);

    // Clear cache for this template
    this.templateCache.delete(templateId);

    return updated;
  }

  async getTemplate(templateId: string): Promise<NotificationTemplate | null> {
    return await this.templateRepository.findOne({
      where: { id: templateId },
    });
  }

  async getTemplateByCode(
    tenantId: string,
    code: string,
  ): Promise<NotificationTemplate | null> {
    return await this.templateRepository.findOne({
      where: { tenantId, code },
    });
  }

  async getTemplates(
    tenantId: string,
    type?: NotificationType,
    channel?: NotificationChannel,
  ): Promise<NotificationTemplate[]> {
    const query = this.templateRepository.createQueryBuilder('template')
      .where('template.tenantId = :tenantId', { tenantId })
      .andWhere('template.active = :active', { active: true });

    if (type) {
      query.andWhere('template.type = :type', { type });
    }

    if (channel) {
      query.andWhere('template.channel = :channel', { channel });
    }

    return await query.getMany();
  }

  async renderTemplate(
    template: NotificationTemplate,
    data: Record<string, any>,
  ): Promise<{ subject: string; body: string }> {
    try {
      // Compile and cache templates
      const subjectTemplate = this.compileTemplate(`subject_${template.id}`, template.subject);
      const bodyTemplate = this.compileTemplate(`body_${template.id}`, template.body);

      // Apply default values for missing variables
      const templateData = { ...data };
      if (template.variables) {
        for (const variable of template.variables) {
          if (!(variable.name in templateData) && variable.defaultValue !== undefined) {
            templateData[variable.name] = variable.defaultValue;
          }
        }
      }

      // Render templates
      const subject = subjectTemplate(templateData);
      const body = bodyTemplate(templateData);

      return { subject, body };
    } catch (error) {
      this.logger.error(`Failed to render template ${template.id}: ${(error as Error).message}`);
      throw error;
    }
  }

  private compileTemplate(cacheKey: string, templateString: string): Handlebars.TemplateDelegate {
    let compiledTemplate = this.templateCache.get(cacheKey);
    
    if (!compiledTemplate) {
      compiledTemplate = Handlebars.compile(templateString);
      this.templateCache.set(cacheKey, compiledTemplate);
    }

    return compiledTemplate;
  }

  async validateTemplate(templateString: string): Promise<boolean> {
    try {
      Handlebars.compile(templateString);
      return true;
    } catch (error) {
      this.logger.warn(`Invalid template: ${(error as Error).message}`);
      return false;
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    const template = await this.templateRepository.findOne({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    await this.templateRepository.remove(template);
    this.templateCache.delete(`subject_${templateId}`);
    this.templateCache.delete(`body_${templateId}`);
  }

  async createDefaultTemplates(tenantId: string): Promise<void> {
    const defaultTemplates = [
      {
        code: 'order.created',
        name: 'Order Created',
        type: NotificationType.ORDER_CREATED,
        channel: NotificationChannel.EMAIL,
        subject: 'Order {{orderNumber}} has been created',
        body: `
          <h2>New Order Created</h2>
          <p>Order #{{orderNumber}} has been successfully created.</p>
          <ul>
            <li>Customer: {{customerName}}</li>
            <li>Items: {{itemCount}}</li>
            <li>Total: {{formatCurrency totalAmount}}</li>
            <li>Due Date: {{formatDate dueDate}}</li>
          </ul>
        `,
        variables: [
          { name: 'orderNumber', type: 'string', required: true },
          { name: 'customerName', type: 'string', required: true },
          { name: 'itemCount', type: 'number', required: true },
          { name: 'totalAmount', type: 'number', required: true },
          { name: 'dueDate', type: 'date', required: true },
        ],
      },
      {
        code: 'inventory.low_stock',
        name: 'Low Stock Alert',
        type: NotificationType.INVENTORY_LOW_STOCK,
        channel: NotificationChannel.IN_APP,
        subject: 'Low stock alert for {{productName}}',
        body: `Product "{{productName}}" (SKU: {{sku}}) is running low on stock. Current quantity: {{currentQuantity}}. Reorder level: {{reorderLevel}}.`,
        variables: [
          { name: 'productName', type: 'string', required: true },
          { name: 'sku', type: 'string', required: true },
          { name: 'currentQuantity', type: 'number', required: true },
          { name: 'reorderLevel', type: 'number', required: true },
        ],
      },
      {
        code: 'task.assigned',
        name: 'Task Assigned',
        type: NotificationType.TASK_ASSIGNED,
        channel: NotificationChannel.EMAIL,
        subject: 'New task assigned: {{taskTitle}}',
        body: `
          <h2>Task Assignment</h2>
          <p>You have been assigned a new task:</p>
          <h3>{{taskTitle}}</h3>
          <p>{{taskDescription}}</p>
          <p><strong>Priority:</strong> {{priority}}</p>
          <p><strong>Due Date:</strong> {{formatDate dueDate}}</p>
        `,
        variables: [
          { name: 'taskTitle', type: 'string', required: true },
          { name: 'taskDescription', type: 'string', required: true },
          { name: 'priority', type: 'string', required: true },
          { name: 'dueDate', type: 'date', required: true },
        ],
      },
      {
        code: 'quality.alert',
        name: 'Quality Alert',
        type: NotificationType.QUALITY_ALERT,
        channel: NotificationChannel.IN_APP,
        subject: 'Quality issue detected',
        body: `Quality issue detected in {{productName}} (Batch: {{batchNumber}}). Issue: {{issueDescription}}. Severity: {{severity}}.`,
        variables: [
          { name: 'productName', type: 'string', required: true },
          { name: 'batchNumber', type: 'string', required: true },
          { name: 'issueDescription', type: 'string', required: true },
          { name: 'severity', type: 'string', required: true, defaultValue: 'Medium' },
        ],
      },
      {
        code: 'maintenance.due',
        name: 'Maintenance Due',
        type: NotificationType.MAINTENANCE_DUE,
        channel: NotificationChannel.EMAIL,
        subject: 'Maintenance due for {{equipmentName}}',
        body: `
          <h2>Maintenance Reminder</h2>
          <p>Scheduled maintenance is due for the following equipment:</p>
          <h3>{{equipmentName}}</h3>
          <ul>
            <li>Equipment ID: {{equipmentId}}</li>
            <li>Maintenance Type: {{maintenanceType}}</li>
            <li>Due Date: {{formatDate dueDate}}</li>
            <li>Last Maintenance: {{formatDate lastMaintenance}}</li>
          </ul>
        `,
        variables: [
          { name: 'equipmentName', type: 'string', required: true },
          { name: 'equipmentId', type: 'string', required: true },
          { name: 'maintenanceType', type: 'string', required: true },
          { name: 'dueDate', type: 'date', required: true },
          { name: 'lastMaintenance', type: 'date', required: false },
        ],
      },
    ];

    for (const templateData of defaultTemplates) {
      const existing = await this.getTemplateByCode(tenantId, templateData.code);
      if (!existing) {
        await this.createTemplate(tenantId, {
          ...templateData,
          active: true,
        });
        this.logger.log(`Created default template: ${templateData.code}`);
      }
    }
  }
}