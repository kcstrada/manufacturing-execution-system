import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductTemplate, TemplateStatus } from '../../../entities/product-template.entity';
import { Product } from '../../../entities/product.entity';
import { ProductCategory } from '../../../entities/product-category.entity';
import { UnitOfMeasure } from '../../../entities/unit-of-measure.entity';
import { CreateTemplateDto } from '../dto/create-template.dto';
import { UpdateTemplateDto } from '../dto/update-template.dto';
import { InstantiateTemplateDto } from '../dto/instantiate-template.dto';
import { TemplateQueryDto } from '../dto/template-query.dto';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductService } from './product.service';

@Injectable()
export class ProductTemplateService {
  private readonly logger = new Logger(ProductTemplateService.name);

  constructor(
    @InjectRepository(ProductTemplate)
    private readonly templateRepository: Repository<ProductTemplate>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly categoryRepository: Repository<ProductCategory>,
    @InjectRepository(UnitOfMeasure)
    private readonly uomRepository: Repository<UnitOfMeasure>,
    private readonly productService: ProductService,
  ) {}

  /**
   * Create a new product template
   */
  async create(
    createTemplateDto: CreateTemplateDto,
    tenantId: string,
  ): Promise<ProductTemplate> {
    this.logger.log(`Creating template: ${createTemplateDto.templateCode}`);

    // Check if template code already exists
    const existingTemplate = await this.templateRepository.findOne({
      where: {
        tenantId,
        templateCode: createTemplateDto.templateCode,
      },
    });

    if (existingTemplate) {
      throw new ConflictException(
        `Template with code ${createTemplateDto.templateCode} already exists`,
      );
    }

    // Validate related entities if provided
    if (createTemplateDto.defaultCategoryId) {
      const category = await this.categoryRepository.findOne({
        where: {
          id: createTemplateDto.defaultCategoryId,
          tenantId,
        },
      });
      if (!category) {
        throw new NotFoundException('Default category not found');
      }
    }

    if (createTemplateDto.defaultUnitOfMeasureId) {
      const uom = await this.uomRepository.findOne({
        where: {
          id: createTemplateDto.defaultUnitOfMeasureId,
          tenantId,
        },
      });
      if (!uom) {
        throw new NotFoundException('Default unit of measure not found');
      }
    }

    const template = this.templateRepository.create({
      ...createTemplateDto,
      tenantId,
      lastSequenceNumber: 0,
      usageCount: 0,
    } as any);

    const savedTemplate = await this.templateRepository.save(template);
    const finalTemplate = Array.isArray(savedTemplate) ? savedTemplate[0] : savedTemplate;

    if (!finalTemplate) {
      throw new BadRequestException('Failed to create template');
    }

    this.logger.log(`Template created with ID: ${finalTemplate.id}`);
    return finalTemplate;
  }

  /**
   * Find all templates with filtering
   */
  async findAll(
    queryDto: TemplateQueryDto,
    tenantId: string,
  ): Promise<{
    items: ProductTemplate[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const {
      search,
      productType,
      status,
      categoryId,
      isManufacturable,
      isPurchasable,
      includeStats,
      sortBy = 'templateName',
      sortOrder = 'ASC',
      page = 1,
      pageSize = 20,
    } = queryDto;

    const queryBuilder = this.templateRepository
      .createQueryBuilder('template')
      .where('template.tenantId = :tenantId', { tenantId });

    // Add relations if needed
    if (includeStats || categoryId) {
      queryBuilder.leftJoinAndSelect('template.defaultCategory', 'category');
    }
    queryBuilder.leftJoinAndSelect('template.defaultUnitOfMeasure', 'uom');

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(template.templateName ILIKE :search OR template.templateCode ILIKE :search OR template.templateDescription ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply filters
    if (productType) {
      queryBuilder.andWhere('template.productType = :productType', { productType });
    }

    if (status) {
      queryBuilder.andWhere('template.status = :status', { status });
    }

    if (categoryId) {
      queryBuilder.andWhere('template.defaultCategoryId = :categoryId', { categoryId });
    }

    if (isManufacturable !== undefined) {
      queryBuilder.andWhere('template.defaultIsManufacturable = :isManufacturable', {
        isManufacturable,
      });
    }

    if (isPurchasable !== undefined) {
      queryBuilder.andWhere('template.defaultIsPurchasable = :isPurchasable', {
        isPurchasable,
      });
    }

    // Apply sorting
    const sortField = `template.${sortBy}`;
    queryBuilder.orderBy(sortField, sortOrder);

    // Apply pagination
    queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Find template by ID
   */
  async findOne(id: string, tenantId: string): Promise<ProductTemplate> {
    const template = await this.templateRepository.findOne({
      where: {
        id,
        tenantId,
      },
      relations: ['defaultCategory', 'defaultUnitOfMeasure'],
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  /**
   * Find template by code
   */
  async findByCode(code: string, tenantId: string): Promise<ProductTemplate> {
    const template = await this.templateRepository.findOne({
      where: {
        templateCode: code,
        tenantId,
      },
      relations: ['defaultCategory', 'defaultUnitOfMeasure'],
    });

    if (!template) {
      throw new NotFoundException(`Template with code ${code} not found`);
    }

    return template;
  }

  /**
   * Update a template
   */
  async update(
    id: string,
    updateTemplateDto: UpdateTemplateDto,
    tenantId: string,
  ): Promise<ProductTemplate> {
    const template = await this.findOne(id, tenantId);

    // If template code is being changed, check uniqueness
    if (
      updateTemplateDto.templateCode &&
      updateTemplateDto.templateCode !== template.templateCode
    ) {
      const existingTemplate = await this.templateRepository.findOne({
        where: {
          tenantId,
          templateCode: updateTemplateDto.templateCode,
        },
      });
      if (existingTemplate) {
        throw new ConflictException(
          `Template with code ${updateTemplateDto.templateCode} already exists`,
        );
      }
    }

    // Validate related entities if being changed
    if (
      updateTemplateDto.defaultCategoryId &&
      updateTemplateDto.defaultCategoryId !== template.defaultCategoryId
    ) {
      const category = await this.categoryRepository.findOne({
        where: {
          id: updateTemplateDto.defaultCategoryId,
          tenantId,
        },
      });
      if (!category) {
        throw new NotFoundException('Default category not found');
      }
    }

    if (
      updateTemplateDto.defaultUnitOfMeasureId &&
      updateTemplateDto.defaultUnitOfMeasureId !== template.defaultUnitOfMeasureId
    ) {
      const uom = await this.uomRepository.findOne({
        where: {
          id: updateTemplateDto.defaultUnitOfMeasureId,
          tenantId,
        },
      });
      if (!uom) {
        throw new NotFoundException('Default unit of measure not found');
      }
    }

    Object.assign(template, updateTemplateDto);
    const updatedTemplate = await this.templateRepository.save(template);

    this.logger.log(`Template updated with ID: ${updatedTemplate.id}`);
    return updatedTemplate;
  }

  /**
   * Delete a template
   */
  async remove(id: string, tenantId: string): Promise<void> {
    const template = await this.findOne(id, tenantId);

    // Set template to inactive instead of hard delete
    template.status = TemplateStatus.INACTIVE;
    template.isActive = false;
    await this.templateRepository.save(template);

    this.logger.log(`Template deactivated with ID: ${id}`);
  }

  /**
   * Instantiate a product from a template
   */
  async instantiateProduct(
    instantiateDto: InstantiateTemplateDto,
    tenantId: string,
  ): Promise<Product> {
    const template = await this.findOne(instantiateDto.templateId, tenantId);

    // Check if template is active
    if (template.status !== TemplateStatus.ACTIVE || !template.isActive) {
      throw new BadRequestException('Template is not active');
    }

    // Generate SKU if not provided and auto-generate is enabled
    let sku = instantiateDto.sku;
    if (!sku && template.templateRules?.autoGenerateSku) {
      sku = await this.generateSku(template, instantiateDto.variables);
    }

    // Generate name if not provided and pattern exists
    let name = instantiateDto.name;
    if (!name && template.namePattern) {
      name = this.substitutePattern(
        template.namePattern,
        instantiateDto.variables || {},
      );
    }

    // Generate barcode if auto-generate is enabled
    let barcode: string | undefined;
    if (template.templateRules?.autoGenerateBarcode && template.barcodePattern) {
      barcode = this.substitutePattern(
        template.barcodePattern,
        instantiateDto.variables || {},
      );
    }

    // Validate against template rules
    if (!instantiateDto.skipValidation && template.templateRules?.validationRules) {
      this.validateProductData(
        { name, sku, ...instantiateDto },
        template.templateRules.validationRules,
      );
    }

    // Merge specifications
    const specifications = {
      ...template.defaultSpecifications,
      ...instantiateDto.specifications,
    };

    // Merge custom fields
    const customFields = {
      ...template.customFields,
      ...instantiateDto.customFields,
    };

    // Create product DTO
    const createProductDto: CreateProductDto = {
      sku: sku || '',
      name: name || template.templateName,
      description: instantiateDto.description || template.defaultDescription || '',
      type: template.productType!,
      categoryId: instantiateDto.categoryId || template.defaultCategoryId,
      unitOfMeasureId: instantiateDto.unitOfMeasureId || template.defaultUnitOfMeasureId!,
      cost: instantiateDto.cost ?? template.defaultCost ?? 0,
      price: instantiateDto.price ?? template.defaultPrice ?? 0,
      weight: template.defaultWeight ?? 0,
      specifications,
      barcode,
      leadTimeDays: template.defaultLeadTimeDays ?? 0,
      minStockLevel: template.defaultMinStockLevel ?? 0,
      maxStockLevel: template.defaultMaxStockLevel ?? 0,
      reorderPoint: template.defaultReorderPoint ?? 0,
      isManufacturable: template.defaultIsManufacturable,
      isPurchasable: template.defaultIsPurchasable,
    };

    // Create product using ProductService (using tenantId as userId for now)
    const product = await this.productService.create(createProductDto, tenantId, tenantId);

    // Update template usage statistics
    template.usageCount++;
    template.lastUsedAt = new Date();
    template.lastSequenceNumber++;
    await this.templateRepository.save(template);

    this.logger.log(
      `Product ${product.sku} created from template ${template.templateCode}`,
    );
    return product;
  }

  /**
   * Clone a template
   */
  async cloneTemplate(
    id: string,
    newCode: string,
    newName: string,
    tenantId: string,
  ): Promise<ProductTemplate> {
    const sourceTemplate = await this.findOne(id, tenantId);

    // Check if new code already exists
    const existingTemplate = await this.templateRepository.findOne({
      where: {
        tenantId,
        templateCode: newCode,
      },
    });

    if (existingTemplate) {
      throw new ConflictException(`Template with code ${newCode} already exists`);
    }

    // Clone template
    const clonedTemplate = this.templateRepository.create({
      ...sourceTemplate,
      id: undefined,
      templateCode: newCode,
      templateName: newName,
      status: TemplateStatus.DRAFT,
      usageCount: 0,
      lastUsedAt: undefined,
      lastSequenceNumber: 0,
      createdAt: undefined,
      updatedAt: undefined,
    } as any);

    const savedTemplate = await this.templateRepository.save(clonedTemplate);
    const finalTemplate = Array.isArray(savedTemplate) ? savedTemplate[0] : savedTemplate;

    if (!finalTemplate) {
      throw new BadRequestException('Failed to clone template');
    }

    this.logger.log(`Template cloned: ${sourceTemplate.templateCode} -> ${newCode}`);
    return finalTemplate;
  }

  /**
   * Get template statistics
   */
  async getTemplateStatistics(
    id: string,
    tenantId: string,
  ): Promise<{
    usageCount: number;
    lastUsedAt: Date | null;
    productsCreated: number;
    activeProducts: number;
    totalValue: number;
  }> {
    const template = await this.findOne(id, tenantId);

    // Get products created from this template
    // Note: This would require adding a templateId field to Product entity
    // For now, we'll use template usage count
    const productsCreated = template.usageCount;
    const activeProducts = 0; // Would need to track template reference in products
    const totalValue = 0; // Would need to calculate from actual products

    return {
      usageCount: template.usageCount,
      lastUsedAt: template.lastUsedAt || null,
      productsCreated,
      activeProducts,
      totalValue,
    };
  }

  /**
   * Get most used templates
   */
  async getMostUsedTemplates(
    tenantId: string,
    limit = 10,
  ): Promise<ProductTemplate[]> {
    return this.templateRepository.find({
      where: {
        tenantId,
        isActive: true,
        status: TemplateStatus.ACTIVE,
      },
      order: {
        usageCount: 'DESC',
      },
      take: limit,
      relations: ['defaultCategory'],
    });
  }

  /**
   * Generate SKU from template pattern
   */
  private async generateSku(
    template: ProductTemplate,
    variables?: Record<string, string>,
  ): Promise<string> {
    let sku = template.skuPattern || '';

    // Add prefix and suffix
    if (template.skuPrefix) {
      sku = template.skuPrefix + sku;
    }
    if (template.skuSuffix) {
      sku = sku + template.skuSuffix;
    }

    // Substitute pattern variables
    sku = this.substitutePattern(sku, variables || {});

    // Replace sequence number
    const sequenceNumber = template.lastSequenceNumber + 1;
    sku = sku.replace(/{0+}/g, (match) => {
      const length = match.length - 2; // Remove { }
      return sequenceNumber.toString().padStart(length, '0');
    });

    // Replace date patterns
    const now = new Date();
    sku = sku
      .replace(/{YYYY}/g, now.getFullYear().toString())
      .replace(/{YY}/g, now.getFullYear().toString().slice(-2))
      .replace(/{MM}/g, (now.getMonth() + 1).toString().padStart(2, '0'))
      .replace(/{DD}/g, now.getDate().toString().padStart(2, '0'));

    return sku;
  }

  /**
   * Substitute pattern with variables
   */
  private substitutePattern(
    pattern: string,
    variables: Record<string, string>,
  ): string {
    let result = pattern;

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    }

    // Replace date patterns
    const now = new Date();
    result = result
      .replace(/{YYYY}/g, now.getFullYear().toString())
      .replace(/{YY}/g, now.getFullYear().toString().slice(-2))
      .replace(/{MM}/g, (now.getMonth() + 1).toString().padStart(2, '0'))
      .replace(/{DD}/g, now.getDate().toString().padStart(2, '0'))
      .replace(/{HH}/g, now.getHours().toString().padStart(2, '0'))
      .replace(/{mm}/g, now.getMinutes().toString().padStart(2, '0'))
      .replace(/{ss}/g, now.getSeconds().toString().padStart(2, '0'));

    return result;
  }

  /**
   * Validate product data against template rules
   */
  private validateProductData(
    data: any,
    rules: Array<{ field: string; rule: string; message: string }>,
  ): void {
    for (const rule of rules) {
      const fieldValue = data[rule.field];
      
      // Simple validation examples
      // In production, you'd want a more robust rule engine
      if (rule.rule === 'required' && !fieldValue) {
        throw new BadRequestException(rule.message);
      }
      
      if (rule.rule.startsWith('minLength:')) {
        const parts = rule.rule.split(':');
        if (parts[1]) {
          const minLength = parseInt(parts[1]);
          if (fieldValue && fieldValue.length < minLength) {
            throw new BadRequestException(rule.message);
          }
        }
      }

      if (rule.rule.startsWith('pattern:')) {
        const parts = rule.rule.split(':');
        if (parts[1]) {
          const pattern = new RegExp(parts[1]);
          if (fieldValue && !pattern.test(fieldValue)) {
            throw new BadRequestException(rule.message);
          }
        }
      }
    }
  }
}