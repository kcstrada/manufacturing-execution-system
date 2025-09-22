import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import {
  BillOfMaterials,
  BOMComponent,
  BOMStatus,
} from '../../../entities/bill-of-materials.entity';
import { Product } from '../../../entities/product.entity';
import { UnitOfMeasure } from '../../../entities/unit-of-measure.entity';
import { CreateBOMDto, CreateBOMComponentDto } from '../dto/create-bom.dto';
import { UpdateBOMDto } from '../dto/update-bom.dto';
import { BOMQueryDto } from '../dto/bom-query.dto';
import { BOMResponseDto, BOMExplosionDto } from '../dto/bom-response.dto';

@Injectable()
export class BOMService {
  private readonly logger = new Logger(BOMService.name);

  constructor(
    @InjectRepository(BillOfMaterials)
    private readonly bomRepository: Repository<BillOfMaterials>,
    @InjectRepository(BOMComponent)
    private readonly componentRepository: Repository<BOMComponent>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(UnitOfMeasure)
    private readonly uomRepository: Repository<UnitOfMeasure>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new BOM
   */
  async create(
    createBomDto: CreateBOMDto,
    tenantId: string,
    userId: string,
  ): Promise<BillOfMaterials> {
    this.logger.log(`Creating BOM for product: ${createBomDto.productId}`);

    // Validate product exists
    const product = await this.productRepository.findOne({
      where: { id: createBomDto.productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check for circular dependencies before creating
    if (createBomDto.components && createBomDto.components.length > 0) {
      await this.validateCircularDependency(
        createBomDto.productId,
        createBomDto.components.map(c => c.componentId),
        tenantId,
      );
    }

    // Start transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Determine version number
      const existingBOMs = await this.bomRepository.find({
        where: { productId: createBomDto.productId, tenantId },
        order: { version: 'DESC' },
      });

      const nextVersion = existingBOMs.length > 0 && existingBOMs[0]?.version
        ? this.incrementVersion(existingBOMs[0].version.toString())
        : '1.0';

      // Create BOM
      const bom = this.bomRepository.create({
        ...createBomDto,
        tenantId,
        version: createBomDto.version || nextVersion,
        createdBy: userId,
        totalCost: 0, // Will be calculated after components are added
      } as any);

      const savedBOM = await queryRunner.manager.save(bom);
      const finalBOM = Array.isArray(savedBOM) ? savedBOM[0] : savedBOM;

      if (!finalBOM) {
        throw new BadRequestException('Failed to create BOM');
      }

      // Create components
      if (createBomDto.components && createBomDto.components.length > 0) {
        const components = await this.createComponents(
          finalBOM.id,
          createBomDto.components,
          tenantId,
          queryRunner.manager,
        );
        finalBOM.components = components;
      }

      // Calculate total cost
      const totalCost = await this.calculateTotalCost(finalBOM.id, tenantId);
      finalBOM.totalCost = totalCost;
      await queryRunner.manager.save(finalBOM);

      // If marked as default, update product and unset other defaults
      if (createBomDto.isDefault) {
        await this.setAsDefault(finalBOM.id, createBomDto.productId, tenantId, queryRunner.manager);
      }

      await queryRunner.commitTransaction();

      this.logger.log(`BOM created with ID: ${finalBOM.id}`);
      return finalBOM;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find all BOMs with filtering
   */
  async findAll(
    queryDto: BOMQueryDto,
    tenantId: string,
  ): Promise<{
    items: BillOfMaterials[];
    total: number;
  }> {
    const {
      productId,
      status,
      isActive,
      isDefault,
      effectiveDate,
      page = 1,
      pageSize = 20,
    } = queryDto;

    const queryBuilder = this.bomRepository
      .createQueryBuilder('bom')
      .leftJoinAndSelect('bom.product', 'product')
      .leftJoinAndSelect('bom.components', 'components')
      .leftJoinAndSelect('components.component', 'componentProduct')
      .leftJoinAndSelect('components.unitOfMeasure', 'uom')
      .where('bom.tenantId = :tenantId', { tenantId });

    if (productId) {
      queryBuilder.andWhere('bom.productId = :productId', { productId });
    }

    if (status) {
      queryBuilder.andWhere('bom.status = :status', { status });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('bom.isActive = :isActive', { isActive });
    }

    if (isDefault !== undefined) {
      queryBuilder.andWhere('bom.isDefault = :isDefault', { isDefault });
    }

    if (effectiveDate) {
      queryBuilder.andWhere('bom.effectiveDate <= :effectiveDate', { effectiveDate });
      queryBuilder.andWhere(
        '(bom.expiryDate IS NULL OR bom.expiryDate > :effectiveDate)',
        { effectiveDate },
      );
    }

    queryBuilder
      .orderBy('bom.version', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total };
  }

  /**
   * Find BOM by ID
   */
  async findOne(id: string, tenantId: string): Promise<BillOfMaterials> {
    const bom = await this.bomRepository.findOne({
      where: { id, tenantId },
      relations: [
        'product',
        'components',
        'components.component',
        'components.unitOfMeasure',
      ],
    });

    if (!bom) {
      throw new NotFoundException(`BOM with ID ${id} not found`);
    }

    return bom;
  }

  /**
   * Update BOM
   */
  async update(
    id: string,
    updateBomDto: UpdateBOMDto,
    tenantId: string,
    userId: string,
  ): Promise<BillOfMaterials> {
    const bom = await this.findOne(id, tenantId);

    // Check if BOM is active and prevent certain changes
    if (bom.status === BOMStatus.ACTIVE && updateBomDto.components) {
      throw new BadRequestException(
        'Cannot modify components of an active BOM. Create a new version instead.',
      );
    }

    // Start transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update BOM fields
      Object.assign(bom, {
        ...updateBomDto,
        updatedAt: new Date(),
      });

      // If components are being updated
      if (updateBomDto.components) {
        // Validate circular dependencies
        await this.validateCircularDependency(
          bom.productId,
          updateBomDto.components.map(c => c.componentId),
          tenantId,
        );

        // Delete existing components
        await queryRunner.manager.delete(BOMComponent, {
          billOfMaterialsId: id,
        });

        // Create new components
        const components = await this.createComponents(
          id,
          updateBomDto.components,
          tenantId,
          queryRunner.manager,
        );
        bom.components = components;
      }

      // Recalculate total cost
      const totalCost = await this.calculateTotalCost(id, tenantId);
      bom.totalCost = totalCost;

      const updatedBOM = await queryRunner.manager.save(bom);

      // If marked as default, update product
      if (updateBomDto.isDefault) {
        await this.setAsDefault(id, bom.productId, tenantId, queryRunner.manager);
      }

      await queryRunner.commitTransaction();

      this.logger.log(`BOM updated with ID: ${id}`);
      return updatedBOM;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Delete BOM (soft delete)
   */
  async remove(id: string, tenantId: string): Promise<void> {
    const bom = await this.findOne(id, tenantId);

    if (bom.isDefault) {
      throw new BadRequestException('Cannot delete default BOM. Set another BOM as default first.');
    }

    if (bom.status === BOMStatus.ACTIVE) {
      throw new BadRequestException('Cannot delete active BOM. Set status to obsolete first.');
    }

    bom.isActive = false;
    bom.status = BOMStatus.OBSOLETE;
    await this.bomRepository.save(bom);

    this.logger.log(`BOM soft deleted with ID: ${id}`);
  }

  /**
   * Perform multi-level BOM explosion
   */
  async explodeBOM(
    bomId: string,
    tenantId: string,
    quantity = 1,
    maxLevel = 10,
  ): Promise<BOMExplosionDto> {
    const bom = await this.findOne(bomId, tenantId);
    const explosion = await this.explodeRecursive(
      bom,
      quantity,
      1,
      maxLevel,
      new Set(),
      tenantId,
    );

    return explosion;
  }

  /**
   * Copy BOM to create new version
   */
  async copyBOM(
    id: string,
    newProductId: string,
    tenantId: string,
    userId: string,
  ): Promise<BillOfMaterials> {
    const sourceBOM = await this.findOne(id, tenantId);

    // Create new BOM with copied data
    const createDto: CreateBOMDto = {
      productId: newProductId || sourceBOM.productId,
      name: `${sourceBOM.name} (Copy)`,
      version: '1.0', // New version for copy
      description: sourceBOM.description,
      status: BOMStatus.DRAFT,
      effectiveDate: new Date(),
      expiryDate: sourceBOM.expiryDate,
      isDefault: false,
      notes: JSON.stringify(sourceBOM.notes || {}),
      components: sourceBOM.components.map(c => ({
        componentId: c.componentId,
        sequence: c.sequence,
        quantity: c.quantity,
        unit: 'EA', // Default unit, should be fetched from UOM
        unitOfMeasureId: c.unitOfMeasureId,
        scrapPercentage: c.scrapPercentage,
        referenceDesignator: c.referenceDesignator,
        isPhantom: c.isPhantom,
        isRequired: c.isRequired,
        isAlternateAllowed: c.isAlternateAllowed,
        supplyType: c.supplyType,
        leadTimeDays: c.leadTimeDays,
        notes: c.notes,
      })),
    };

    return this.create(createDto, tenantId, userId);
  }

  /**
   * Activate BOM
   */
  async activateBOM(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<BillOfMaterials> {
    const bom = await this.findOne(id, tenantId);

    if (bom.status === BOMStatus.ACTIVE) {
      throw new BadRequestException('BOM is already active');
    }

    // Validate BOM has components
    if (!bom.components || bom.components.length === 0) {
      throw new BadRequestException('Cannot activate BOM without components');
    }

    // Update status
    bom.status = BOMStatus.ACTIVE;
    bom.approvedById = userId;
    bom.approvedAt = new Date();

    const updatedBOM = await this.bomRepository.save(bom);
    this.logger.log(`BOM activated with ID: ${id}`);
    return updatedBOM;
  }

  /**
   * Compare two BOMs
   */
  async compareBOMs(
    bomId1: string,
    bomId2: string,
    tenantId: string,
  ): Promise<{
    added: BOMComponent[];
    removed: BOMComponent[];
    modified: Array<{
      component: BOMComponent;
      changes: Record<string, { old: any; new: any }>;
    }>;
  }> {
    const bom1 = await this.findOne(bomId1, tenantId);
    const bom2 = await this.findOne(bomId2, tenantId);

    const components1Map = new Map(
      bom1.components.map(c => [c.componentId, c]),
    );
    const components2Map = new Map(
      bom2.components.map(c => [c.componentId, c]),
    );

    const added: BOMComponent[] = [];
    const removed: BOMComponent[] = [];
    const modified: Array<{
      component: BOMComponent;
      changes: Record<string, { old: any; new: any }>;
    }> = [];

    // Find removed and modified
    for (const [componentId, comp1] of components1Map) {
      const comp2 = components2Map.get(componentId);
      if (!comp2) {
        removed.push(comp1);
      } else {
        const changes: Record<string, { old: any; new: any }> = {};
        if (comp1.quantity !== comp2.quantity) {
          changes.quantity = { old: comp1.quantity, new: comp2.quantity };
        }
        if (comp1.scrapPercentage !== comp2.scrapPercentage) {
          changes.scrapPercentage = {
            old: comp1.scrapPercentage,
            new: comp2.scrapPercentage,
          };
        }
        if (Object.keys(changes).length > 0) {
          modified.push({ component: comp2, changes });
        }
      }
    }

    // Find added
    for (const [componentId, comp2] of components2Map) {
      if (!components1Map.has(componentId)) {
        added.push(comp2);
      }
    }

    return { added, removed, modified };
  }

  /**
   * Get where-used list for a component
   */
  async getWhereUsed(
    componentId: string,
    tenantId: string,
  ): Promise<BillOfMaterials[]> {
    const components = await this.componentRepository.find({
      where: {
        componentId,
        tenantId,
      },
      relations: ['billOfMaterials', 'billOfMaterials.product'],
    });

    const uniqueBOMs = new Map<string, BillOfMaterials>();
    for (const component of components) {
      if (component.billOfMaterials) {
        uniqueBOMs.set(component.billOfMaterials.id, component.billOfMaterials);
      }
    }

    return Array.from(uniqueBOMs.values());
  }

  // Private helper methods

  /**
   * Create BOM components
   */
  private async createComponents(
    bomId: string,
    componentsDto: CreateBOMComponentDto[],
    tenantId: string,
    manager: any,
  ): Promise<BOMComponent[]> {
    const components: BOMComponent[] = [];

    for (const [index, compDto] of componentsDto.entries()) {
      // Validate component product exists
      const product = await this.productRepository.findOne({
        where: { id: compDto.componentId, tenantId },
      });

      if (!product) {
        throw new NotFoundException(
          `Component product ${compDto.componentId} not found`,
        );
      }

      // Get UOM ID from unit string if not provided
      let uomId = (compDto as any).unitOfMeasureId;
      if (!uomId && compDto.unit) {
        const uom = await this.uomRepository.findOne({
          where: { code: compDto.unit, tenantId },
        });
        if (!uom) {
          throw new NotFoundException(
            `Unit of measure ${compDto.unit} not found`,
          );
        }
        uomId = uom.id;
      }

      const component = this.componentRepository.create({
        ...compDto,
        billOfMaterialsId: bomId,
        tenantId,
        sequence: compDto.sequence || index + 1,
        unitOfMeasureId: uomId,
        unitCost: product.cost || 0,
        extendedCost: (product.cost || 0) * compDto.quantity,
      } as any);

      const savedComponent = await manager.save(component);
      components.push(savedComponent);
    }

    return components;
  }

  /**
   * Calculate total cost of BOM
   */
  private async calculateTotalCost(
    bomId: string,
    tenantId: string,
  ): Promise<number> {
    const components = await this.componentRepository.find({
      where: { billOfMaterialsId: bomId, tenantId },
      relations: ['component'],
    });

    let totalCost = 0;
    for (const component of components) {
      if (component.component) {
        const quantityWithScrap =
          component.quantity * (1 + (component.scrapPercentage || 0) / 100);
        totalCost += (component.component.cost || 0) * quantityWithScrap;
      }
    }

    return totalCost;
  }

  /**
   * Validate circular dependency
   */
  private async validateCircularDependency(
    parentId: string,
    componentIds: string[],
    tenantId: string,
  ): Promise<void> {
    if (componentIds.includes(parentId)) {
      throw new BadRequestException(
        'Circular dependency detected: Product cannot be a component of itself',
      );
    }

    // Check deeper levels
    for (const componentId of componentIds) {
      await this.checkCircularDependencyRecursive(
        parentId,
        componentId,
        new Set([parentId]),
        tenantId,
      );
    }
  }

  /**
   * Check circular dependency recursively
   */
  private async checkCircularDependencyRecursive(
    originalParentId: string,
    currentComponentId: string,
    visited: Set<string>,
    tenantId: string,
  ): Promise<void> {
    if (visited.has(currentComponentId)) {
      throw new BadRequestException(
        `Circular dependency detected involving product ${currentComponentId}`,
      );
    }

    visited.add(currentComponentId);

    // Get all BOMs for this component
    const boms = await this.bomRepository.find({
      where: {
        productId: currentComponentId,
        tenantId,
        isActive: true,
      },
      relations: ['components'],
    });

    for (const bom of boms) {
      for (const component of bom.components || []) {
        if (component.componentId === originalParentId) {
          throw new BadRequestException(
            `Circular dependency detected: ${originalParentId} -> ${currentComponentId} -> ${originalParentId}`,
          );
        }
        await this.checkCircularDependencyRecursive(
          originalParentId,
          component.componentId,
          new Set(visited),
          tenantId,
        );
      }
    }
  }

  /**
   * Set BOM as default
   */
  private async setAsDefault(
    bomId: string,
    productId: string,
    tenantId: string,
    manager: any,
  ): Promise<void> {
    // Unset other defaults for this product
    await manager.update(
      BillOfMaterials,
      {
        productId,
        tenantId,
        isDefault: true,
      },
      {
        isDefault: false,
      },
    );

    // Set this BOM as default
    await manager.update(
      BillOfMaterials,
      { id: bomId },
      { isDefault: true },
    );

    // Update product's defaultBomId
    await manager.update(
      Product,
      { id: productId },
      { defaultBomId: bomId },
    );
  }

  /**
   * Explode BOM recursively
   */
  private async explodeRecursive(
    bom: BillOfMaterials,
    parentQuantity: number,
    level: number,
    maxLevel: number,
    visited: Set<string>,
    tenantId: string,
  ): Promise<BOMExplosionDto> {
    if (level > maxLevel) {
      throw new BadRequestException(`Maximum explosion level ${maxLevel} reached`);
    }

    if (visited.has(bom.productId)) {
      throw new BadRequestException(
        `Circular reference detected at product ${bom.productId}`,
      );
    }

    visited.add(bom.productId);

    const explosion: BOMExplosionDto = {
      level,
      component: {
        id: bom.productId,
        sku: bom.product?.sku || '',
        name: bom.product?.name || '',
        type: bom.product?.type || '',
      },
      quantity: parentQuantity,
      totalQuantity: parentQuantity,
      unitOfMeasure: 'EA', // Default UOM
      unitCost: bom.product?.cost || 0,
      extendedCost: (bom.product?.cost || 0) * parentQuantity,
      leadTimeDays: bom.product?.leadTimeDays || 0,
      path: [],
      hasChildren: (bom.components || []).length > 0,
      children: [],
    };

    // Process components
    for (const component of bom.components || []) {
      const componentQuantity = component.quantity * parentQuantity;
      const quantityWithScrap =
        componentQuantity * (1 + (component.scrapPercentage || 0) / 100);

      const componentExplosion: BOMExplosionDto = {
        level: level + 1,
        component: {
          id: component.componentId,
          sku: component.component?.sku || '',
          name: component.component?.name || '',
          type: component.component?.type || '',
        },
        quantity: component.quantity,
        totalQuantity: quantityWithScrap,
        unitOfMeasure: 'EA', // Default UOM
        unitCost: component.component?.cost || 0,
        extendedCost: (component.component?.cost || 0) * quantityWithScrap,
        leadTimeDays: component.leadTimeDays || 0,
        path: [],
        hasChildren: false,
        children: [],
      };

      // If component has its own BOM, explode it
      if (component.component?.defaultBomId && !component.isPhantom) {
        const componentBOM = await this.findOne(
          component.component.defaultBomId,
          tenantId,
        );
        const subExplosion = await this.explodeRecursive(
          componentBOM,
          quantityWithScrap,
          level + 1,
          maxLevel,
          new Set(visited),
          tenantId,
        );
        componentExplosion.children = subExplosion.children;
        componentExplosion.hasChildren = true;
      }

      explosion.children?.push(componentExplosion);
    }

    visited.delete(bom.productId);
    return explosion;
  }

  /**
   * Increment version string
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.');
    if (parts.length === 0) return '1.0';
    const lastPartStr = parts[parts.length - 1];
    if (!lastPartStr) return '1.0';
    const lastPart = parseInt(lastPartStr);
    parts[parts.length - 1] = (lastPart + 1).toString();
    return parts.join('.');
  }
}