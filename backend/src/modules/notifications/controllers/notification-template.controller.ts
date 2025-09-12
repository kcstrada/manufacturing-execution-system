import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { RequireRoles as Roles } from '../../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { NotificationTemplateService } from '../services/notification-template.service';
import { NotificationTemplate } from '../entities/notification-template.entity';
import { NotificationType, NotificationChannel } from '../types/notification.types';

@ApiTags('Notification Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notification-templates')
export class NotificationTemplateController {
  constructor(
    private readonly templateService: NotificationTemplateService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get notification templates' })
  @ApiResponse({ status: 200, description: 'Returns list of templates' })
  async getTemplates(
    @CurrentUser() user: any,
    @Query('type') type?: NotificationType,
    @Query('channel') channel?: NotificationChannel,
  ): Promise<NotificationTemplate[]> {
    return await this.templateService.getTemplates(user.tenantId, type, channel);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({ status: 200, description: 'Returns template' })
  async getTemplate(@Param('id') id: string): Promise<NotificationTemplate | null> {
    return await this.templateService.getTemplate(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get template by code' })
  @ApiResponse({ status: 200, description: 'Returns template' })
  async getTemplateByCode(
    @CurrentUser() user: any,
    @Param('code') code: string,
  ): Promise<NotificationTemplate | null> {
    return await this.templateService.getTemplateByCode(user.tenantId, code);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create notification template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createTemplate(
    @CurrentUser() user: any,
    @Body() templateData: Partial<NotificationTemplate>,
  ): Promise<NotificationTemplate> {
    return await this.templateService.createTemplate(user.tenantId, templateData);
  }

  @Put(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update notification template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateData: Partial<NotificationTemplate>,
  ): Promise<NotificationTemplate> {
    return await this.templateService.updateTemplate(id, updateData);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notification template' })
  @ApiResponse({ status: 204, description: 'Template deleted successfully' })
  async deleteTemplate(@Param('id') id: string): Promise<void> {
    await this.templateService.deleteTemplate(id);
  }

  @Post('validate')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Validate template syntax' })
  @ApiResponse({ status: 200, description: 'Returns validation result' })
  async validateTemplate(
    @Body() body: { template: string },
  ): Promise<{ valid: boolean }> {
    const valid = await this.templateService.validateTemplate(body.template);
    return { valid };
  }

  @Post(':id/preview')
  @ApiOperation({ summary: 'Preview template with sample data' })
  @ApiResponse({ status: 200, description: 'Returns rendered template' })
  async previewTemplate(
    @Param('id') id: string,
    @Body() data: Record<string, any>,
  ): Promise<{ subject: string; body: string }> {
    const template = await this.templateService.getTemplate(id);
    if (!template) {
      throw new Error('Template not found');
    }
    return await this.templateService.renderTemplate(template, data);
  }

  @Post('defaults')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Create default templates' })
  @ApiResponse({ status: 204, description: 'Default templates created' })
  async createDefaults(@CurrentUser() user: any): Promise<void> {
    await this.templateService.createDefaultTemplates(user.tenantId);
  }
}