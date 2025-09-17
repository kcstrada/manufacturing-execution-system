import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository, IsNull, Not } from 'typeorm';
import { ProductCategory } from '../../../entities/product-category.entity';
import { Product } from '../../../entities/product.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryQueryDto } from '../dto/category-query.dto';

@Injectable()
export class ProductCategoryService {
  private readonly logger = new Logger(ProductCategoryService.name);

  constructor(
    @InjectRepository(ProductCategory)
    private readonly categoryRepository: Repository<ProductCategory>,
    @InjectRepository(ProductCategory)
    private readonly categoryTreeRepository: TreeRepository<ProductCategory>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Create a new product category
   */
  async create(
    createCategoryDto: CreateCategoryDto,
    tenantId: string,
  ): Promise<ProductCategory> {
    this.logger.log(`Creating category with code: ${createCategoryDto.code}`);

    // Check if code already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: {
        tenantId,
        code: createCategoryDto.code,
      },
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category with code ${createCategoryDto.code} already exists`,
      );
    }

    // Validate parent category if provided
    let parentCategory: ProductCategory | null = null;
    if (createCategoryDto.parentCategoryId) {
      parentCategory = await this.categoryRepository.findOne({
        where: {
          id: createCategoryDto.parentCategoryId,
          tenantId,
        },
      });
      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }

      // Check for circular reference
      await this.checkCircularReference(
        createCategoryDto.parentCategoryId,
        null,
        tenantId,
      );
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      tenantId,
      parentCategory: parentCategory || undefined,
    } as any);

    const savedCategory = await this.categoryRepository.save(category);
    const finalCategory = Array.isArray(savedCategory) ? savedCategory[0] : savedCategory;

    if (!finalCategory) {
      throw new BadRequestException('Failed to create category');
    }

    this.logger.log(`Category created with ID: ${finalCategory.id}`);
    return finalCategory;
  }

  /**
   * Find all categories with optional filtering
   */
  async findAll(
    queryDto: CategoryQueryDto,
    tenantId: string,
  ): Promise<{
    items: ProductCategory[];
    total: number;
    tree?: ProductCategory[];
  }> {
    const { search, parentId, includeTree, includeInactive } = queryDto;

    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.tenantId = :tenantId', { tenantId });

    if (!includeInactive) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive: true });
    }

    if (search) {
      queryBuilder.andWhere(
        '(category.name ILIKE :search OR category.code ILIKE :search OR category.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (parentId !== undefined) {
      if (parentId === null) {
        queryBuilder.andWhere('category.parentCategoryId IS NULL');
      } else {
        queryBuilder.andWhere('category.parentCategoryId = :parentId', {
          parentId,
        });
      }
    }

    queryBuilder
      .leftJoinAndSelect('category.parentCategory', 'parent')
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.name', 'ASC');

    const [items, total] = await queryBuilder.getManyAndCount();

    let tree: ProductCategory[] | undefined;
    if (includeTree) {
      tree = await this.getCategoryTree(tenantId, includeInactive);
    }

    return {
      items,
      total,
      tree,
    };
  }

  /**
   * Get category by ID
   */
  async findOne(id: string, tenantId: string): Promise<ProductCategory> {
    const category = await this.categoryRepository.findOne({
      where: {
        id,
        tenantId,
      },
      relations: ['parentCategory', 'subCategories'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  /**
   * Get category by code
   */
  async findByCode(code: string, tenantId: string): Promise<ProductCategory> {
    const category = await this.categoryRepository.findOne({
      where: {
        code,
        tenantId,
      },
      relations: ['parentCategory', 'subCategories'],
    });

    if (!category) {
      throw new NotFoundException(`Category with code ${code} not found`);
    }

    return category;
  }

  /**
   * Update a category
   */
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    tenantId: string,
  ): Promise<ProductCategory> {
    const category = await this.findOne(id, tenantId);

    // If code is being changed, check uniqueness
    if (updateCategoryDto.code && updateCategoryDto.code !== category.code) {
      const existingCategory = await this.categoryRepository.findOne({
        where: {
          tenantId,
          code: updateCategoryDto.code,
        },
      });
      if (existingCategory) {
        throw new ConflictException(
          `Category with code ${updateCategoryDto.code} already exists`,
        );
      }
    }

    // Validate parent category if being changed
    if (
      updateCategoryDto.parentCategoryId !== undefined &&
      updateCategoryDto.parentCategoryId !== category.parentCategoryId
    ) {
      if (updateCategoryDto.parentCategoryId) {
        const parentCategory = await this.categoryRepository.findOne({
          where: {
            id: updateCategoryDto.parentCategoryId,
            tenantId,
          },
        });
        if (!parentCategory) {
          throw new NotFoundException('Parent category not found');
        }

        // Check for circular reference
        await this.checkCircularReference(
          updateCategoryDto.parentCategoryId,
          id,
          tenantId,
        );
      }
    }

    Object.assign(category, updateCategoryDto);
    const updatedCategory = await this.categoryRepository.save(category);

    this.logger.log(`Category updated with ID: ${updatedCategory.id}`);
    return updatedCategory;
  }

  /**
   * Delete a category (soft delete)
   */
  async remove(id: string, tenantId: string): Promise<void> {
    const category = await this.findOne(id, tenantId);

    // Check if category has subcategories
    const subcategoriesCount = await this.categoryRepository.count({
      where: {
        parentCategoryId: id,
        tenantId,
      },
    });

    if (subcategoriesCount > 0) {
      throw new BadRequestException(
        'Cannot delete category with subcategories. Delete subcategories first.',
      );
    }

    // Check if category has products
    const productsCount = await this.productRepository.count({
      where: {
        categoryId: id,
        tenantId,
      },
    });

    if (productsCount > 0) {
      throw new BadRequestException(
        'Cannot delete category with associated products. Reassign products first.',
      );
    }

    category.isActive = false;
    await this.categoryRepository.save(category);

    this.logger.log(`Category soft deleted with ID: ${id}`);
  }

  /**
   * Get category tree structure
   */
  async getCategoryTree(
    tenantId: string,
    includeInactive = false,
  ): Promise<ProductCategory[]> {
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.tenantId = :tenantId', { tenantId })
      .andWhere('category.parentCategoryId IS NULL');

    if (!includeInactive) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive: true });
    }

    const rootCategories = await queryBuilder
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.name', 'ASC')
      .getMany();

    // Load subcategories recursively
    for (const category of rootCategories) {
      await this.loadSubcategories(category, tenantId, includeInactive);
    }

    return rootCategories;
  }

  /**
   * Get category path (breadcrumb)
   */
  async getCategoryPath(
    categoryId: string,
    tenantId: string,
  ): Promise<ProductCategory[]> {
    const path: ProductCategory[] = [];
    let currentCategory = await this.findOne(categoryId, tenantId);

    while (currentCategory) {
      path.unshift(currentCategory);
      if (currentCategory.parentCategoryId) {
        currentCategory = await this.findOne(
          currentCategory.parentCategoryId,
          tenantId,
        );
      } else {
        break;
      }
    }

    return path;
  }

  /**
   * Get all subcategory IDs (including nested)
   */
  async getAllSubcategoryIds(
    categoryId: string,
    tenantId: string,
  ): Promise<string[]> {
    const allIds: string[] = [];
    const queue: string[] = [categoryId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      allIds.push(currentId);

      const subcategories = await this.categoryRepository.find({
        where: {
          parentCategoryId: currentId,
          tenantId,
        },
        select: ['id'],
      });

      queue.push(...subcategories.map((c) => c.id));
    }

    return allIds;
  }

  /**
   * Get products by category (including subcategories)
   */
  async getProductsByCategory(
    categoryId: string,
    tenantId: string,
    includeSubcategories = true,
  ): Promise<Product[]> {
    let categoryIds: string[] = [categoryId];

    if (includeSubcategories) {
      categoryIds = await this.getAllSubcategoryIds(categoryId, tenantId);
    }

    return this.productRepository.find({
      where: {
        categoryId: categoryIds as any,
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
   * Move category to new parent
   */
  async moveCategory(
    categoryId: string,
    newParentId: string | null,
    tenantId: string,
  ): Promise<ProductCategory> {
    const category = await this.findOne(categoryId, tenantId);

    if (newParentId) {
      const newParent = await this.findOne(newParentId, tenantId);

      // Check for circular reference
      await this.checkCircularReference(newParentId, categoryId, tenantId);

      category.parentCategory = newParent;
      category.parentCategoryId = newParentId;
    } else {
      category.parentCategory = undefined;
      category.parentCategoryId = undefined;
    }

    const updatedCategory = await this.categoryRepository.save(category);
    this.logger.log(
      `Category ${categoryId} moved to parent ${newParentId || 'root'}`,
    );
    return updatedCategory;
  }

  /**
   * Reorder categories within same parent
   */
  async reorderCategories(
    categoryOrders: { id: string; sortOrder: number }[],
    tenantId: string,
  ): Promise<void> {
    for (const order of categoryOrders) {
      await this.categoryRepository.update(
        {
          id: order.id,
          tenantId,
        },
        {
          sortOrder: order.sortOrder,
        },
      );
    }
    this.logger.log('Categories reordered successfully');
  }

  /**
   * Get category statistics
   */
  async getCategoryStatistics(
    categoryId: string,
    tenantId: string,
  ): Promise<{
    totalProducts: number;
    activeProducts: number;
    subcategoriesCount: number;
    totalValue: number;
  }> {
    const categoryIds = await this.getAllSubcategoryIds(categoryId, tenantId);

    const totalProducts = await this.productRepository.count({
      where: {
        categoryId: categoryIds as any,
        tenantId,
      },
    });

    const activeProducts = await this.productRepository.count({
      where: {
        categoryId: categoryIds as any,
        tenantId,
        isActive: true,
      },
    });

    const subcategoriesCount = categoryIds.length - 1;

    // Calculate total inventory value
    const products = await this.productRepository.find({
      where: {
        categoryId: categoryIds as any,
        tenantId,
      },
      select: ['id', 'cost'],
    });

    const totalValue = products.reduce((sum, product) => {
      return sum + (product.cost || 0);
    }, 0);

    return {
      totalProducts,
      activeProducts,
      subcategoriesCount,
      totalValue,
    };
  }

  /**
   * Private helper: Load subcategories recursively
   */
  private async loadSubcategories(
    category: ProductCategory,
    tenantId: string,
    includeInactive: boolean,
  ): Promise<void> {
    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where('category.tenantId = :tenantId', { tenantId })
      .andWhere('category.parentCategoryId = :parentId', {
        parentId: category.id,
      });

    if (!includeInactive) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive: true });
    }

    category.subCategories = await queryBuilder
      .orderBy('category.sortOrder', 'ASC')
      .addOrderBy('category.name', 'ASC')
      .getMany();

    for (const subcategory of category.subCategories) {
      await this.loadSubcategories(subcategory, tenantId, includeInactive);
    }
  }

  /**
   * Private helper: Check for circular reference in category hierarchy
   */
  private async checkCircularReference(
    newParentId: string,
    currentCategoryId: string | null,
    tenantId: string,
  ): Promise<void> {
    if (!currentCategoryId) return;

    let checkId: string | undefined = newParentId;
    const visited = new Set<string>();

    while (checkId) {
      if (visited.has(checkId)) {
        throw new BadRequestException('Circular reference detected in category hierarchy');
      }
      visited.add(checkId);

      if (checkId === currentCategoryId) {
        throw new BadRequestException(
          'Cannot set a category as its own parent or descendant',
        );
      }

      const parent = await this.categoryRepository.findOne({
        where: { id: checkId, tenantId },
        select: ['parentCategoryId'],
      });

      checkId = parent?.parentCategoryId || undefined;
    }
  }
}