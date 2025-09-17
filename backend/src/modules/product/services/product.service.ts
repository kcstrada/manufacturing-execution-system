import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  FindOptionsWhere,
  ILike,
  In,
  Between,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import { Product, ProductStatus, ProductType } from '../../../entities/product.entity';
import { ProductCategory } from '../../../entities/product-category.entity';
import { UnitOfMeasure } from '../../../entities/unit-of-measure.entity';
import { BillOfMaterials } from '../../../entities/bill-of-materials.entity';
import { Routing } from '../../../entities/routing.entity';
import { ProductRevision } from '../../../entities/product-revision.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import { ProductResponseDto } from '../dto/product-response.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly categoryRepository: Repository<ProductCategory>,
    @InjectRepository(UnitOfMeasure)
    private readonly unitOfMeasureRepository: Repository<UnitOfMeasure>,
    @InjectRepository(BillOfMaterials)
    private readonly bomRepository: Repository<BillOfMaterials>,
    @InjectRepository(Routing)
    private readonly routingRepository: Repository<Routing>,
    @InjectRepository(ProductRevision)
    private readonly revisionRepository: Repository<ProductRevision>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new product
   */
  async create(
    createProductDto: CreateProductDto,
    tenantId: string,
    userId: string,
  ): Promise<Product> {
    this.logger.log(`Creating product with SKU: ${createProductDto.sku}`);

    // Check if SKU already exists for this tenant
    const existingProduct = await this.productRepository.findOne({
      where: {
        tenantId,
        sku: createProductDto.sku,
      },
    });

    if (existingProduct) {
      throw new ConflictException(`Product with SKU ${createProductDto.sku} already exists`);
    }

    // Validate category if provided
    if (createProductDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: {
          id: createProductDto.categoryId,
          tenantId,
        },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Validate unit of measure
    const unitOfMeasure = await this.unitOfMeasureRepository.findOne({
      where: {
        id: createProductDto.unitOfMeasureId,
        tenantId,
      },
    });
    if (!unitOfMeasure) {
      throw new NotFoundException('Unit of measure not found');
    }

    // Create product
    const product = this.productRepository.create({
      ...createProductDto,
      tenantId,
      dimensions: createProductDto.length || createProductDto.width || createProductDto.height
        ? {
            length: createProductDto.length,
            width: createProductDto.width,
            height: createProductDto.height,
            unit: 'cm',
          }
        : undefined,
      isActive: createProductDto.status === ProductStatus.ACTIVE,
      currentRevisionNumber: 1,
    } as any);

    const savedProduct = await this.productRepository.save(product);
    const finalProduct = Array.isArray(savedProduct) ? savedProduct[0] : savedProduct;

    if (!finalProduct) {
      throw new BadRequestException('Failed to create product');
    }

    // Create initial revision
    await this.createRevision(finalProduct, userId, 'Initial product creation');

    this.logger.log(`Product created successfully with ID: ${finalProduct.id}`);
    return finalProduct;
  }

  /**
   * Find all products with filtering and pagination
   */
  async findAll(
    queryDto: ProductQueryDto,
    tenantId: string,
  ): Promise<{ items: Product[]; total: number; page: number; pageSize: number }> {
    const {
      page = 1,
      pageSize = 10,
      search,
      type,
      status,
      categoryId,
      isManufacturable,
      isPurchasable,
      minPrice,
      maxPrice,
      minStock,
      maxStock,
      sortBy = 'name',
      sortOrder = 'ASC',
    } = queryDto;

    const where: FindOptionsWhere<Product> = {
      tenantId,
    };

    // Apply filters
    if (search) {
      where.name = ILike(`%${search}%`);
    }
    if (type) {
      where.type = type;
    }
    if (status) {
      where.isActive = status === ProductStatus.ACTIVE;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (isManufacturable !== undefined) {
      where.isManufacturable = isManufacturable;
    }
    if (isPurchasable !== undefined) {
      where.isPurchasable = isPurchasable;
    }
    if (minPrice !== undefined && maxPrice !== undefined) {
      where.price = Between(minPrice, maxPrice);
    } else if (minPrice !== undefined) {
      where.price = MoreThanOrEqual(minPrice);
    } else if (maxPrice !== undefined) {
      where.price = LessThanOrEqual(maxPrice);
    }

    const [items, total] = await this.productRepository.findAndCount({
      where,
      relations: ['category', 'unitOfMeasure', 'defaultBom', 'defaultRouting'],
      take: pageSize,
      skip: (page - 1) * pageSize,
      order: {
        [sortBy]: sortOrder,
      },
    });

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Find a single product by ID
   */
  async findOne(id: string, tenantId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: {
        id,
        tenantId,
      },
      relations: [
        'category',
        'unitOfMeasure',
        'defaultBom',
        'defaultRouting',
        'billsOfMaterials',
        'routings',
      ],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  /**
   * Find product by SKU
   */
  async findBySku(sku: string, tenantId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: {
        sku,
        tenantId,
      },
      relations: ['category', 'unitOfMeasure'],
    });

    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }

    return product;
  }

  /**
   * Update a product
   */
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    tenantId: string,
    userId: string,
  ): Promise<Product> {
    const product = await this.findOne(id, tenantId);

    // If SKU is being changed, check for uniqueness
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: {
          tenantId,
          sku: updateProductDto.sku,
        },
      });
      if (existingProduct) {
        throw new ConflictException(`Product with SKU ${updateProductDto.sku} already exists`);
      }
    }

    // Validate category if provided
    if (updateProductDto.categoryId && updateProductDto.categoryId !== product.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: {
          id: updateProductDto.categoryId,
          tenantId,
        },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    // Validate unit of measure if provided
    if (updateProductDto.unitOfMeasureId && updateProductDto.unitOfMeasureId !== product.unitOfMeasureId) {
      const unitOfMeasure = await this.unitOfMeasureRepository.findOne({
        where: {
          id: updateProductDto.unitOfMeasureId,
          tenantId,
        },
      });
      if (!unitOfMeasure) {
        throw new NotFoundException('Unit of measure not found');
      }
    }

    // Track changes for revision
    const changes = this.trackChanges(product, updateProductDto);

    // Update product
    const { length, width, height, ...restDto } = updateProductDto;

    Object.assign(product, {
      ...restDto,
      dimensions: length !== undefined || width !== undefined || height !== undefined
        ? {
            length: length ?? product.dimensions?.length,
            width: width ?? product.dimensions?.width,
            height: height ?? product.dimensions?.height,
            unit: 'cm',
          }
        : product.dimensions,
      isActive: updateProductDto.status ? updateProductDto.status === ProductStatus.ACTIVE : product.isActive,
    });

    const updatedProduct = await this.productRepository.save(product);

    // Create revision if significant changes were made
    if (changes.length > 0) {
      await this.createRevision(
        updatedProduct,
        userId,
        `Product updated: ${changes.join(', ')}`,
      );

      // Increment revision number
      updatedProduct.currentRevisionNumber = (updatedProduct.currentRevisionNumber || 1) + 1;
      await this.productRepository.save(updatedProduct);
    }

    this.logger.log(`Product updated successfully with ID: ${updatedProduct.id}`);
    return updatedProduct;
  }

  /**
   * Delete a product (soft delete)
   */
  async remove(id: string, tenantId: string, userId: string): Promise<void> {
    const product = await this.findOne(id, tenantId);

    // Check if product is used in any active BOMs
    const bomCount = await this.dataSource
      .getRepository('bom_components')
      .count({
        where: {
          componentId: id,
          tenantId,
        },
      });

    if (bomCount > 0) {
      throw new BadRequestException(
        'Cannot delete product as it is used in bill of materials',
      );
    }

    // Check if product has active production orders
    const orderCount = await this.dataSource
      .getRepository('production_orders')
      .count({
        where: {
          productId: id,
          tenantId,
        },
      });

    if (orderCount > 0) {
      throw new BadRequestException(
        'Cannot delete product as it has active production orders',
      );
    }

    // Soft delete
    product.isActive = false;
    await this.productRepository.save(product);

    // Create final revision
    await this.createRevision(product, userId, 'Product deactivated');

    this.logger.log(`Product soft deleted with ID: ${id}`);
  }

  /**
   * Set default BOM for a product
   */
  async setDefaultBom(
    productId: string,
    bomId: string,
    tenantId: string,
    userId: string,
  ): Promise<Product> {
    const product = await this.findOne(productId, tenantId);

    // Verify BOM exists and belongs to this product
    const bom = await this.bomRepository.findOne({
      where: {
        id: bomId,
        productId,
        tenantId,
      },
    });

    if (!bom) {
      throw new NotFoundException('BOM not found for this product');
    }

    // Update all BOMs to not be default
    await this.bomRepository.update(
      { productId, tenantId },
      { isDefault: false },
    );

    // Set the new default
    bom.isDefault = true;
    await this.bomRepository.save(bom);

    // Update product
    product.defaultBomId = bomId;
    const updatedProduct = await this.productRepository.save(product);

    this.logger.log(`Default BOM set for product ID: ${productId}`);
    return updatedProduct;
  }

  /**
   * Set default routing for a product
   */
  async setDefaultRouting(
    productId: string,
    routingId: string,
    tenantId: string,
    userId: string,
  ): Promise<Product> {
    const product = await this.findOne(productId, tenantId);

    // Verify routing exists and belongs to this product
    const routing = await this.routingRepository.findOne({
      where: {
        id: routingId,
        productId,
        tenantId,
      },
    });

    if (!routing) {
      throw new NotFoundException('Routing not found for this product');
    }

    // Update all routings to not be default
    await this.routingRepository.update(
      { productId, tenantId },
      { isDefault: false },
    );

    // Set the new default
    routing.isDefault = true;
    await this.routingRepository.save(routing);

    // Update product
    product.defaultRoutingId = routingId;
    const updatedProduct = await this.productRepository.save(product);

    this.logger.log(`Default routing set for product ID: ${productId}`);
    return updatedProduct;
  }

  /**
   * Get products by category
   */
  async findByCategory(categoryId: string, tenantId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: {
        categoryId,
        tenantId,
        isActive: true,
      },
      relations: ['unitOfMeasure'],
      order: {
        name: 'ASC',
      },
    });
  }

  /**
   * Get products by type
   */
  async findByType(type: ProductType, tenantId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: {
        type,
        tenantId,
        isActive: true,
      },
      relations: ['category', 'unitOfMeasure'],
      order: {
        name: 'ASC',
      },
    });
  }

  /**
   * Get manufacturable products
   */
  async findManufacturable(tenantId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: {
        isManufacturable: true,
        tenantId,
        isActive: true,
      },
      relations: ['category', 'unitOfMeasure', 'defaultBom', 'defaultRouting'],
      order: {
        name: 'ASC',
      },
    });
  }

  /**
   * Get purchasable products
   */
  async findPurchasable(tenantId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: {
        isPurchasable: true,
        tenantId,
        isActive: true,
      },
      relations: ['category', 'unitOfMeasure'],
      order: {
        name: 'ASC',
      },
    });
  }

  /**
   * Update product stock levels
   */
  async updateStockLevels(
    productId: string,
    levels: {
      minStockLevel?: number;
      maxStockLevel?: number;
      reorderPoint?: number;
      reorderQuantity?: number;
    },
    tenantId: string,
    userId: string,
  ): Promise<Product> {
    const product = await this.findOne(productId, tenantId);

    Object.assign(product, levels);

    const updatedProduct = await this.productRepository.save(product);
    this.logger.log(`Stock levels updated for product ID: ${productId}`);
    return updatedProduct;
  }

  /**
   * Clone a product
   */
  async clone(
    sourceProductId: string,
    newSku: string,
    newName: string,
    tenantId: string,
    userId: string,
  ): Promise<Product> {
    const sourceProduct = await this.findOne(sourceProductId, tenantId);

    // Check if new SKU is unique
    const existingProduct = await this.productRepository.findOne({
      where: {
        tenantId,
        sku: newSku,
      },
    });

    if (existingProduct) {
      throw new ConflictException(`Product with SKU ${newSku} already exists`);
    }

    // Create new product with cloned data
    const { id, sku, name, createdAt, updatedAt, ...cloneData } = sourceProduct;

    const newProduct = this.productRepository.create({
      ...cloneData,
      sku: newSku,
      name: newName,
      tenantId,
      defaultBomId: null,
      defaultRoutingId: null,
      currentRevisionNumber: 1,
    } as any);

    const savedProduct = await this.productRepository.save(newProduct);
    const finalProduct = Array.isArray(savedProduct) ? savedProduct[0] : savedProduct;

    if (!finalProduct) {
      throw new BadRequestException('Failed to clone product');
    }

    // Create initial revision
    await this.createRevision(
      finalProduct,
      userId,
      `Product cloned from ${sourceProduct.sku}`,
    );

    this.logger.log(`Product cloned successfully with ID: ${finalProduct.id}`);
    return finalProduct;
  }

  /**
   * Private helper method to create product revision
   */
  private async createRevision(
    product: Product,
    userId: string,
    reason: string,
  ): Promise<void> {
    const revision = this.revisionRepository.create({
      productId: product.id,
      revisionNumber: product.currentRevisionNumber || 1,
      revisionCode: `v${product.currentRevisionNumber || 1}`,
      reason,
      changedBy: userId,
      changedAt: new Date(),
      snapshot: JSON.stringify(product),
      tenantId: product.tenantId,
    } as any);

    await this.revisionRepository.save(revision);
  }

  /**
   * Private helper method to track changes
   */
  private trackChanges(
    original: Product,
    updated: UpdateProductDto,
  ): string[] {
    const changes: string[] = [];

    if (updated.name && updated.name !== original.name) {
      changes.push('name');
    }
    if (updated.sku && updated.sku !== original.sku) {
      changes.push('SKU');
    }
    if (updated.description !== undefined && updated.description !== original.description) {
      changes.push('description');
    }
    if (updated.price !== undefined && updated.price !== original.price) {
      changes.push('price');
    }
    if (updated.cost !== undefined && updated.cost !== original.cost) {
      changes.push('cost');
    }
    if (updated.type && updated.type !== original.type) {
      changes.push('type');
    }
    if (updated.categoryId && updated.categoryId !== original.categoryId) {
      changes.push('category');
    }
    if (updated.isManufacturable !== undefined && updated.isManufacturable !== original.isManufacturable) {
      changes.push('manufacturable status');
    }
    if (updated.isPurchasable !== undefined && updated.isPurchasable !== original.isPurchasable) {
      changes.push('purchasable status');
    }

    return changes;
  }
}