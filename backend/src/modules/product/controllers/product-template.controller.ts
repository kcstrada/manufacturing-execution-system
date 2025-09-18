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
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../tenants/tenant.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { User } from '../../../entities/user.entity';
import { ProductTemplateService } from '../services/product-template.service';
import { ProductTemplate } from '../../../entities/product-template.entity';
import { Product } from '../../../entities/product.entity';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';
import { InstantiateTemplateDto } from '../dto/instantiate-template.dto';
import { TemplateQueryDto } from '../dto/template-query.dto';

@ApiTags('product-templates')
@Controller('api/v1/product-templates')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class ProductTemplateController {
  private readonly logger = new Logger(ProductTemplateController.name);

  constructor(
    private readonly templateService: ProductTemplateService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product template' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Template created successfully',
    type: ProductTemplate,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Template with this code already exists',
  })
  async create(
    @Body() createTemplateDto: CreateTemplateDto,
    @CurrentUser() user: User,
  ): Promise<ProductTemplate> {
    this.logger.log(`Creating template: ${createTemplateDto.templateCode}`);
    return this.templateService.create(createTemplateDto, user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product templates with filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of templates retrieved successfully',
  })
  async findAll(
    @Query() queryDto: TemplateQueryDto,
    @CurrentUser() user: User,
  ): Promise<{
    items: ProductTemplate[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    return this.templateService.findAll(queryDto, user.tenantId);
  }

  @Get('most-used')
  @ApiOperation({ summary: 'Get most used templates' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Most used templates retrieved successfully',
    type: [ProductTemplate],
  })
  async getMostUsed(
    @Query('limit') limit = 10,
    @CurrentUser() user: User,
  ): Promise<ProductTemplate[]> {
    return this.templateService.getMostUsedTemplates(user.tenantId, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product template by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template retrieved successfully',
    type: ProductTemplate,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<ProductTemplate> {
    return this.templateService.findOne(id, user.tenantId);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get product template by code' })
  @ApiParam({ name: 'code', type: String, description: 'Template code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template retrieved successfully',
    type: ProductTemplate,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  async findByCode(
    @Param('code') code: string,
    @CurrentUser() user: User,
  ): Promise<ProductTemplate> {
    return this.templateService.findByCode(code, user.tenantId);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get template usage statistics' })
  @ApiParam({ name: 'id', type: String, description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{
    usageCount: number;
    lastUsedAt: Date | null;
    productsCreated: number;
    activeProducts: number;
    totalValue: number;
  }> {
    return this.templateService.getTemplateStatistics(id, user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product template' })
  @ApiParam({ name: 'id', type: String, description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template updated successfully',
    type: ProductTemplate,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
    @CurrentUser() user: User,
  ): Promise<ProductTemplate> {
    return this.templateService.update(id, updateTemplateDto, user.tenantId);
  }

  @Post('instantiate')
  @ApiOperation({ summary: 'Create a product from a template' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Product created from template successfully',
    type: Product,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Template is not active or validation failed',
  })
  async instantiate(
    @Body() instantiateDto: InstantiateTemplateDto,
    @CurrentUser() user: User,
  ): Promise<Product> {
    this.logger.log(`Instantiating product from template: ${instantiateDto.templateId}`);
    return this.templateService.instantiateProduct(instantiateDto, user.tenantId);
  }

  @Post(':id/clone')
  @ApiOperation({ summary: 'Clone a template' })
  @ApiParam({ name: 'id', type: String, description: 'Template ID to clone' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Template cloned successfully',
    type: ProductTemplate,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'New template code already exists',
  })
  async clone(
    @Param('id') id: string,
    @Body('templateCode') templateCode: string,
    @Body('templateName') templateName: string,
    @CurrentUser() user: User,
  ): Promise<ProductTemplate> {
    this.logger.log(`Cloning template ${id} to ${templateCode}`);
    return this.templateService.cloneTemplate(
      id,
      templateCode,
      templateName,
      user.tenantId,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product template (soft delete)' })
  @ApiParam({ name: 'id', type: String, description: 'Template ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Template deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Template not found',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.templateService.remove(id, user.tenantId);
  }
}