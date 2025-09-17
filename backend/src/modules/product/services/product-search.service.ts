import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Brackets } from 'typeorm';
import { Product, ProductType, ProductStatus } from '../../../entities/product.entity';
import { ProductSearchDto } from '../dto/product-search.dto';
import { SearchResultDto } from '../dto/search-result.dto';

@Injectable()
export class ProductSearchService {
  private readonly logger = new Logger(ProductSearchService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Advanced product search with multiple filters and full-text search
   */
  async searchProducts(
    searchDto: ProductSearchDto,
    tenantId: string,
  ): Promise<SearchResultDto> {
    const {
      query,
      categories,
      types,
      status,
      priceMin,
      priceMax,
      costMin,
      costMax,
      inStock,
      isManufacturable,
      isPurchasable,
      hasDefaultBom,
      hasDefaultRouting,
      tags,
      specifications,
      sortBy = 'relevance',
      sortOrder = 'DESC',
      page = 1,
      pageSize = 20,
      includeFacets = true,
    } = searchDto;

    // Build base query
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.unitOfMeasure', 'uom')
      .leftJoinAndSelect('product.defaultBom', 'bom')
      .leftJoinAndSelect('product.defaultRouting', 'routing')
      .where('product.tenantId = :tenantId', { tenantId });

    // Apply full-text search
    if (query && query.trim()) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('product.name ILIKE :query', { query: `%${query}%` })
            .orWhere('product.sku ILIKE :query', { query: `%${query}%` })
            .orWhere('product.description ILIKE :query', { query: `%${query}%` })
            .orWhere('product.barcode = :exactQuery', { exactQuery: query })
            .orWhere('category.name ILIKE :query', { query: `%${query}%` });
        }),
      );
    }

    // Apply category filter (including subcategories)
    if (categories && categories.length > 0) {
      // TODO: Get all subcategory IDs for hierarchical filtering
      queryBuilder.andWhere('product.categoryId IN (:...categories)', {
        categories,
      });
    }

    // Apply type filter
    if (types && types.length > 0) {
      queryBuilder.andWhere('product.type IN (:...types)', { types });
    }

    // Apply status filter
    if (status !== undefined) {
      if (Array.isArray(status)) {
        const activeStatuses = status.map(s => s === ProductStatus.ACTIVE);
        queryBuilder.andWhere('product.isActive IN (:...activeStatuses)', {
          activeStatuses,
        });
      } else {
        queryBuilder.andWhere('product.isActive = :isActive', {
          isActive: status === ProductStatus.ACTIVE,
        });
      }
    }

    // Apply price range filter
    if (priceMin !== undefined || priceMax !== undefined) {
      if (priceMin !== undefined && priceMax !== undefined) {
        queryBuilder.andWhere('product.price BETWEEN :priceMin AND :priceMax', {
          priceMin,
          priceMax,
        });
      } else if (priceMin !== undefined) {
        queryBuilder.andWhere('product.price >= :priceMin', { priceMin });
      } else if (priceMax !== undefined) {
        queryBuilder.andWhere('product.price <= :priceMax', { priceMax });
      }
    }

    // Apply cost range filter
    if (costMin !== undefined || costMax !== undefined) {
      if (costMin !== undefined && costMax !== undefined) {
        queryBuilder.andWhere('product.cost BETWEEN :costMin AND :costMax', {
          costMin,
          costMax,
        });
      } else if (costMin !== undefined) {
        queryBuilder.andWhere('product.cost >= :costMin', { costMin });
      } else if (costMax !== undefined) {
        queryBuilder.andWhere('product.cost <= :costMax', { costMax });
      }
    }

    // Apply stock filter
    if (inStock !== undefined) {
      if (inStock) {
        // Join with inventory to check stock levels
        queryBuilder
          .leftJoin('product.inventoryItems', 'inventory')
          .andWhere('inventory.quantityOnHand > 0');
      }
    }

    // Apply manufacturable filter
    if (isManufacturable !== undefined) {
      queryBuilder.andWhere('product.isManufacturable = :isManufacturable', {
        isManufacturable,
      });
    }

    // Apply purchasable filter
    if (isPurchasable !== undefined) {
      queryBuilder.andWhere('product.isPurchasable = :isPurchasable', {
        isPurchasable,
      });
    }

    // Apply BOM filter
    if (hasDefaultBom !== undefined) {
      if (hasDefaultBom) {
        queryBuilder.andWhere('product.defaultBomId IS NOT NULL');
      } else {
        queryBuilder.andWhere('product.defaultBomId IS NULL');
      }
    }

    // Apply routing filter
    if (hasDefaultRouting !== undefined) {
      if (hasDefaultRouting) {
        queryBuilder.andWhere('product.defaultRoutingId IS NOT NULL');
      } else {
        queryBuilder.andWhere('product.defaultRoutingId IS NULL');
      }
    }

    // Apply specifications filter (JSONB query)
    if (specifications && Object.keys(specifications).length > 0) {
      for (const [key, value] of Object.entries(specifications)) {
        queryBuilder.andWhere(
          `product.specifications @> :spec_${key}`,
          { [`spec_${key}`]: JSON.stringify({ [key]: value }) },
        );
      }
    }

    // Apply tags filter (if stored in specifications or separate field)
    if (tags && tags.length > 0) {
      queryBuilder.andWhere(
        `product.specifications @> :tags`,
        { tags: JSON.stringify({ tags }) },
      );
    }

    // Apply sorting
    this.applySorting(queryBuilder, sortBy, sortOrder, query);

    // Execute count query for total
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize);

    // Execute main query
    const products = await queryBuilder.getMany();

    // Generate facets if requested
    let facets = {};
    if (includeFacets) {
      facets = await this.generateFacets(tenantId, searchDto);
    }

    // Calculate search metadata
    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      products,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
      facets,
      searchMetadata: {
        query: query || '',
        executionTime: 0, // TODO: Measure actual execution time
        appliedFilters: this.getAppliedFilters(searchDto),
      },
    };
  }

  /**
   * Search products with autocomplete/typeahead functionality
   */
  async autocomplete(
    query: string,
    tenantId: string,
    limit = 10,
  ): Promise<Product[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .select([
        'product.id',
        'product.sku',
        'product.name',
        'product.type',
        'product.price',
      ])
      .leftJoinAndSelect('product.category', 'category')
      .where('product.tenantId = :tenantId', { tenantId })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .andWhere(
        new Brackets((qb) => {
          qb.where('product.name ILIKE :query', { query: `${query}%` })
            .orWhere('product.sku ILIKE :query', { query: `${query}%` })
            .orWhere('product.barcode LIKE :query', { query: `${query}%` });
        }),
      )
      .orderBy(
        `CASE
          WHEN product.sku ILIKE '${query}%' THEN 1
          WHEN product.name ILIKE '${query}%' THEN 2
          ELSE 3
        END`,
      )
      .addOrderBy('product.name', 'ASC')
      .limit(limit);

    return queryBuilder.getMany();
  }

  /**
   * Get similar products based on various criteria
   */
  async findSimilarProducts(
    productId: string,
    tenantId: string,
    limit = 10,
  ): Promise<Product[]> {
    // First get the reference product
    const product = await this.productRepository.findOne({
      where: { id: productId, tenantId },
      relations: ['category'],
    });

    if (!product) {
      return [];
    }

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.unitOfMeasure', 'uom')
      .where('product.tenantId = :tenantId', { tenantId })
      .andWhere('product.id != :productId', { productId })
      .andWhere('product.isActive = :isActive', { isActive: true });

    // Add similarity criteria
    const similarityConditions = [];

    // Same category
    if (product.categoryId) {
      similarityConditions.push(
        `(product.categoryId = '${product.categoryId}')::int * 3`,
      );
    }

    // Same type
    similarityConditions.push(
      `(product.type = '${product.type}')::int * 2`,
    );

    // Similar price range (within 20%)
    if (product.price) {
      const minPrice = product.price * 0.8;
      const maxPrice = product.price * 1.2;
      similarityConditions.push(
        `(product.price BETWEEN ${minPrice} AND ${maxPrice})::int * 2`,
      );
    }

    // Similar specifications (if using JSONB)
    if (product.specifications) {
      similarityConditions.push(
        `(product.specifications @> '${JSON.stringify(product.specifications)}')::int * 1`,
      );
    }

    if (similarityConditions.length > 0) {
      const similarityScore = similarityConditions.join(' + ');
      queryBuilder
        .addSelect(`(${similarityScore})`, 'similarity_score')
        .orderBy('similarity_score', 'DESC');
    }

    queryBuilder.limit(limit);

    return queryBuilder.getMany();
  }

  /**
   * Generate search facets for filtering
   */
  private async generateFacets(
    tenantId: string,
    searchDto: ProductSearchDto,
  ): Promise<Record<string, any>> {
    const facets: Record<string, any> = {};

    // Category facets
    const categoryFacets = await this.productRepository
      .createQueryBuilder('product')
      .select('product.categoryId', 'categoryId')
      .addSelect('category.name', 'categoryName')
      .addSelect('COUNT(product.id)', 'count')
      .leftJoin('product.category', 'category')
      .where('product.tenantId = :tenantId', { tenantId })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .groupBy('product.categoryId')
      .addGroupBy('category.name')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    facets.categories = categoryFacets;

    // Type facets
    const typeFacets = await this.productRepository
      .createQueryBuilder('product')
      .select('product.type', 'type')
      .addSelect('COUNT(product.id)', 'count')
      .where('product.tenantId = :tenantId', { tenantId })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .groupBy('product.type')
      .orderBy('count', 'DESC')
      .getRawMany();

    facets.types = typeFacets;

    // Price range facets
    const priceStats = await this.productRepository
      .createQueryBuilder('product')
      .select('MIN(product.price)', 'min')
      .addSelect('MAX(product.price)', 'max')
      .addSelect('AVG(product.price)', 'avg')
      .where('product.tenantId = :tenantId', { tenantId })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .andWhere('product.price IS NOT NULL')
      .getRawOne();

    facets.priceRange = priceStats;

    // Availability facets
    facets.availability = {
      manufacturable: await this.productRepository.count({
        where: { tenantId, isManufacturable: true, isActive: true },
      }),
      purchasable: await this.productRepository.count({
        where: { tenantId, isPurchasable: true, isActive: true },
      }),
      withBom: await this.productRepository
        .createQueryBuilder('product')
        .where('product.tenantId = :tenantId', { tenantId })
        .andWhere('product.isActive = :isActive', { isActive: true })
        .andWhere('product.defaultBomId IS NOT NULL')
        .getCount(),
      withRouting: await this.productRepository
        .createQueryBuilder('product')
        .where('product.tenantId = :tenantId', { tenantId })
        .andWhere('product.isActive = :isActive', { isActive: true })
        .andWhere('product.defaultRoutingId IS NOT NULL')
        .getCount(),
    };

    return facets;
  }

  /**
   * Apply sorting to query builder
   */
  private applySorting(
    queryBuilder: SelectQueryBuilder<Product>,
    sortBy: string,
    sortOrder: 'ASC' | 'DESC',
    searchQuery?: string,
  ): void {
    switch (sortBy) {
      case 'relevance':
        if (searchQuery) {
          // Sort by relevance (exact matches first, then partial matches)
          queryBuilder.orderBy(
            `CASE
              WHEN product.sku = :exactQuery THEN 1
              WHEN product.name = :exactQuery THEN 2
              WHEN product.sku ILIKE :startQuery THEN 3
              WHEN product.name ILIKE :startQuery THEN 4
              ELSE 5
            END`,
            'ASC',
          );
          queryBuilder.setParameter('exactQuery', searchQuery);
          queryBuilder.setParameter('startQuery', `${searchQuery}%`);
        }
        queryBuilder.addOrderBy('product.name', 'ASC');
        break;
      case 'name':
        queryBuilder.orderBy('product.name', sortOrder);
        break;
      case 'sku':
        queryBuilder.orderBy('product.sku', sortOrder);
        break;
      case 'price':
        queryBuilder.orderBy('product.price', sortOrder);
        break;
      case 'cost':
        queryBuilder.orderBy('product.cost', sortOrder);
        break;
      case 'createdAt':
        queryBuilder.orderBy('product.createdAt', sortOrder);
        break;
      case 'updatedAt':
        queryBuilder.orderBy('product.updatedAt', sortOrder);
        break;
      default:
        queryBuilder.orderBy('product.name', 'ASC');
    }
  }

  /**
   * Get list of applied filters for metadata
   */
  private getAppliedFilters(searchDto: ProductSearchDto): string[] {
    const filters: string[] = [];

    if (searchDto.categories?.length) filters.push('categories');
    if (searchDto.types?.length) filters.push('types');
    if (searchDto.status !== undefined) filters.push('status');
    if (searchDto.priceMin !== undefined || searchDto.priceMax !== undefined) {
      filters.push('price');
    }
    if (searchDto.isManufacturable !== undefined) filters.push('manufacturable');
    if (searchDto.isPurchasable !== undefined) filters.push('purchasable');
    if (searchDto.hasDefaultBom !== undefined) filters.push('bom');
    if (searchDto.hasDefaultRouting !== undefined) filters.push('routing');
    if (searchDto.tags?.length) filters.push('tags');
    if (searchDto.specifications) filters.push('specifications');

    return filters;
  }
}