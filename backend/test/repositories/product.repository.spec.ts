import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { ProductRepository } from '../../src/repositories/product.repository';
import { Product, ProductType } from '../../src/entities/product.entity';
import {
  mockRepository,
  mockClsService,
  createMockQueryBuilder,
  createTestEntity,
} from './repository-test.helper';

describe('ProductRepository', () => {
  let repository: ProductRepository;
  let typeOrmRepository: jest.Mocked<Repository<Product>>;
  let clsService: jest.Mocked<ClsService>;

  const createProduct = (overrides = {}): Product =>
    createTestEntity({
      sku: 'TEST-SKU-001',
      name: 'Test Product',
      description: 'Test Description',
      type: ProductType.FINISHED_GOOD,
      cost: 100,
      price: 150,
      minStockLevel: 10,
      maxStockLevel: 100,
      reorderPoint: 20,
      categoryId: 'category-id',
      unitOfMeasureId: 'uom-id',
      ...overrides,
    }) as Product;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductRepository,
        {
          provide: getRepositoryToken(Product),
          useValue: mockRepository(),
        },
        {
          provide: ClsService,
          useValue: mockClsService(),
        },
      ],
    }).compile();

    repository = module.get<ProductRepository>(ProductRepository);
    typeOrmRepository = module.get(getRepositoryToken(Product));
    clsService = module.get(ClsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findBySku', () => {
    it('should find a product by SKU', async () => {
      const product = createProduct();
      typeOrmRepository.findOne.mockResolvedValue(product);

      const result = await repository.findBySku('TEST-SKU-001');

      expect(result).toEqual(product);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { sku: 'TEST-SKU-001', tenantId: 'test-tenant-id' },
        relations: ['category', 'unitOfMeasure'],
      });
    });

    it('should return null if product not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findBySku('NON-EXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('findByCategory', () => {
    it('should find products by category', async () => {
      const products = [
        createProduct(),
        createProduct({ sku: 'TEST-SKU-002' }),
      ];
      typeOrmRepository.find.mockResolvedValue(products);

      const result = await repository.findByCategory('category-id');

      expect(result).toEqual(products);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { categoryId: 'category-id', tenantId: 'test-tenant-id' },
        relations: ['category', 'unitOfMeasure'],
      });
    });
  });

  describe('findByType', () => {
    it('should find products by type', async () => {
      const products = [createProduct({ type: ProductType.RAW_MATERIAL })];
      typeOrmRepository.find.mockResolvedValue(products);

      const result = await repository.findByType(ProductType.RAW_MATERIAL);

      expect(result).toEqual(products);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { type: ProductType.RAW_MATERIAL, tenantId: 'test-tenant-id' },
        relations: ['category', 'unitOfMeasure'],
      });
    });
  });

  describe('searchProducts', () => {
    it('should search products by name or SKU', async () => {
      const products = [createProduct()];
      typeOrmRepository.find.mockResolvedValue(products);

      const result = await repository.searchProducts('TEST');

      expect(result).toEqual(products);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: [
          {
            name: expect.objectContaining({ _value: '%TEST%' }),
            tenantId: 'test-tenant-id',
          },
          {
            sku: expect.objectContaining({ _value: '%TEST%' }),
            tenantId: 'test-tenant-id',
          },
        ],
        relations: ['category', 'unitOfMeasure'],
      });
    });
  });

  describe('findWithInventory', () => {
    it('should find product with inventory items', async () => {
      const product = createProduct();
      typeOrmRepository.findOne.mockResolvedValue(product);

      const result = await repository.findWithInventory('product-id');

      expect(result).toEqual(product);
      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'product-id', tenantId: 'test-tenant-id' },
        relations: ['inventoryItems'],
      });
    });
  });

  describe('updateStock', () => {
    it('should update stock levels', async () => {
      const product = createProduct();
      typeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      typeOrmRepository.findOne.mockResolvedValue(product);

      const result = await repository.updateStock('product-id', 10, 100, 20);

      expect(result).toEqual(product);
      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: 'product-id', tenantId: 'test-tenant-id' },
        { minStockLevel: 10, maxStockLevel: 100, reorderPoint: 20 },
      );
    });

    it('should throw error if product not found after update', async () => {
      typeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      typeOrmRepository.findOne.mockResolvedValue(null);

      await expect(
        repository.updateStock('product-id', 10, 100, 20),
      ).rejects.toThrow('Product not found');
    });
  });

  describe('findActiveProducts', () => {
    it('should find active products', async () => {
      const products = [createProduct({ isActive: true })];
      typeOrmRepository.find.mockResolvedValue(products);

      const result = await repository.findActiveProducts();

      expect(result).toEqual(products);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: { isActive: true, tenantId: 'test-tenant-id' },
        relations: ['category', 'unitOfMeasure'],
      });
    });
  });

  describe('findByIds', () => {
    it('should find products by multiple IDs', async () => {
      const products = [
        createProduct({ id: 'id1' }),
        createProduct({ id: 'id2' }),
      ];
      typeOrmRepository.find.mockResolvedValue(products);

      const result = await repository.findByIds(['id1', 'id2']);

      expect(result).toEqual(products);
      expect(typeOrmRepository.find).toHaveBeenCalledWith({
        where: {
          id: expect.objectContaining({ _value: ['id1', 'id2'] }),
          tenantId: 'test-tenant-id',
        },
        relations: ['category', 'unitOfMeasure'],
      });
    });
  });

  describe('updatePricing', () => {
    it('should update product pricing', async () => {
      const product = createProduct({ cost: 120, price: 180 });
      typeOrmRepository.update.mockResolvedValue({ affected: 1 } as any);
      typeOrmRepository.findOne.mockResolvedValue(product);

      const result = await repository.updatePricing('product-id', 120, 180);

      expect(result).toEqual(product);
      expect(typeOrmRepository.update).toHaveBeenCalledWith(
        { id: 'product-id', tenantId: 'test-tenant-id' },
        { cost: 120, price: 180 },
      );
    });
  });

  describe('findBelowReorderPoint', () => {
    it('should find products below reorder point', async () => {
      const products = [createProduct()];
      const queryBuilder = createMockQueryBuilder();
      queryBuilder.getMany.mockResolvedValue(products);
      typeOrmRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.findBelowReorderPoint();

      expect(result).toEqual(products);
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'product.inventoryItems',
        'inventory',
      );
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'product.tenantId = :tenantId',
        { tenantId: 'test-tenant-id' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'product.reorderPoint IS NOT NULL',
      );
      expect(queryBuilder.groupBy).toHaveBeenCalledWith('product.id');
      expect(queryBuilder.having).toHaveBeenCalledWith(
        'SUM(inventory.quantityAvailable) < product.reorderPoint',
      );
    });
  });

  describe('getTenantId', () => {
    it('should get tenant ID from ClsService', async () => {
      const result = (repository as any).getTenantId();
      expect(result).toBe('test-tenant-id');
      expect(clsService.get).toHaveBeenCalledWith('tenantId');
    });

    it('should throw error if tenant ID not found', async () => {
      clsService.get.mockReturnValue(undefined);
      expect(() => (repository as any).getTenantId()).toThrow(
        'Tenant context not found',
      );
    });
  });
});
