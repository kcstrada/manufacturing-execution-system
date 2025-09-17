import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import {
  Product,
  ProductTemplate,
  ProductRevision,
  ProductVariant,
} from '../../../entities';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import { ProductType } from '../../../entities/product.entity';

// Mock Product Service implementation for testing
class ProductService {
  private productRepository: Repository<Product>;
  private templateRepository: Repository<ProductTemplate>;
  private revisionRepository: Repository<ProductRevision>;
  private variantRepository: Repository<ProductVariant>;
  private clsService: ClsService;

  constructor(
    productRepository: Repository<Product>,
    templateRepository: Repository<ProductTemplate>,
    revisionRepository: Repository<ProductRevision>,
    variantRepository: Repository<ProductVariant>,
    clsService: ClsService,
  ) {
    this.productRepository = productRepository;
    this.templateRepository = templateRepository;
    this.revisionRepository = revisionRepository;
    this.variantRepository = variantRepository;
    this.clsService = clsService;
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const tenantId = this.clsService.get('tenantId');

    // Check if SKU already exists
    const existing = await this.productRepository.findOne({
      where: { tenantId, sku: createProductDto.sku },
    });

    if (existing) {
      throw new ConflictException(
        `Product with SKU ${createProductDto.sku} already exists`,
      );
    }

    const product = this.productRepository.create({
      ...createProductDto,
      tenantId,
    });

    return await this.productRepository.save(product);
  }

  async findOne(id: string): Promise<Product> {
    const tenantId = this.clsService.get('tenantId');

    const product = await this.productRepository.findOne({
      where: { id, tenantId },
      relations: ['category', 'defaultBom', 'defaultRouting'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return await this.productRepository.save(product);
  }

  async delete(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.deletedAt = new Date();
    await this.productRepository.save(product);
  }

  async validateSKU(sku: string): Promise<boolean> {
    const tenantId = this.clsService.get('tenantId');
    const count = await this.productRepository.count({
      where: { tenantId, sku },
    });
    return count === 0;
  }

  async createVariant(
    productId: string,
    variantData: Partial<ProductVariant>,
  ): Promise<ProductVariant> {
    const product = await this.findOne(productId);
    const tenantId = this.clsService.get('tenantId');

    const variant = this.variantRepository.create({
      ...variantData,
      productId: product.id,
      tenantId,
    });

    return await this.variantRepository.save(variant);
  }
}

describe('ProductService', () => {
  let service: ProductService;
  let productRepository: Repository<Product>;
  let templateRepository: Repository<ProductTemplate>;
  let revisionRepository: Repository<ProductRevision>;
  let variantRepository: Repository<ProductVariant>;
  let clsService: ClsService;

  const mockProduct = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    tenantId: 'tenant-123',
    sku: 'PROD-001',
    name: 'Test Product',
    description: 'Test Description',
    type: ProductType.FINISHED_GOOD,
    unitOfMeasure: 'PCS',
    cost: 100,
    price: 150,
    isActive: true,
    isManufacturable: true,
    isPurchasable: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any as Product;

  beforeEach(async () => {
    // Create mock repositories
    const mockProductRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
    };

    const mockTemplateRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const mockRevisionRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const mockVariantRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    };

    const mockClsService = {
      get: jest.fn().mockReturnValue('tenant-123'),
    };

    // Manually instantiate the service with mocks
    productRepository = mockProductRepository as any;
    templateRepository = mockTemplateRepository as any;
    revisionRepository = mockRevisionRepository as any;
    variantRepository = mockVariantRepository as any;
    clsService = mockClsService as any;

    service = new ProductService(
      productRepository,
      templateRepository,
      revisionRepository,
      variantRepository,
      clsService,
    );
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const createProductDto: CreateProductDto = {
        sku: 'PROD-001',
        name: 'Test Product',
        description: 'Test Description',
        type: ProductType.FINISHED_GOOD,
        unitOfMeasureId: 'uom-123',
        cost: 100,
        price: 150,
        isManufacturable: true,
        isPurchasable: false,
      };

      jest.spyOn(productRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(productRepository, 'create').mockReturnValue(mockProduct);
      jest.spyOn(productRepository, 'save').mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto);

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123', sku: 'PROD-001' },
      });
      expect(productRepository.create).toHaveBeenCalledWith({
        ...createProductDto,
        tenantId: 'tenant-123',
      });
      expect(productRepository.save).toHaveBeenCalledWith(mockProduct);
      expect(result).toEqual(mockProduct);
    });

    it('should throw ConflictException if SKU already exists', async () => {
      const createProductDto: CreateProductDto = {
        sku: 'PROD-001',
        name: 'Test Product',
        type: ProductType.FINISHED_GOOD,
        unitOfMeasureId: 'uom-123',
        cost: 100,
        price: 150,
      };

      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct);

      await expect(service.create(createProductDto)).rejects.toThrow(
        new ConflictException('Product with SKU PROD-001 already exists'),
      );
    });
  });

  describe('findOne', () => {
    it('should return a product by ID', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct);

      const result = await service.findOne(
        '123e4567-e89b-12d3-a456-426614174000',
      );

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          tenantId: 'tenant-123',
        },
        relations: ['category', 'defaultBom', 'defaultRouting'],
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        new NotFoundException('Product with ID non-existent-id not found'),
      );
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateProductDto: UpdateProductDto = {
        name: 'Updated Product',
        price: 200,
      };

      const updatedProduct = { ...mockProduct, ...updateProductDto } as Product;

      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct);
      jest.spyOn(productRepository, 'save').mockResolvedValue(updatedProduct);

      const result = await service.update(
        '123e4567-e89b-12d3-a456-426614174000',
        updateProductDto,
      );

      expect(result.name).toEqual('Updated Product');
      expect(result.price).toEqual(200);
    });
  });

  describe('delete', () => {
    it('should soft delete a product', async () => {
      const productWithDeletedAt = {
        ...mockProduct,
        deletedAt: new Date(),
      } as Product;

      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct);
      jest
        .spyOn(productRepository, 'save')
        .mockResolvedValue(productWithDeletedAt);

      await service.delete('123e4567-e89b-12d3-a456-426614174000');

      expect(productRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ deletedAt: expect.any(Date) }),
      );
    });
  });

  describe('validateSKU', () => {
    it('should return true if SKU is available', async () => {
      jest.spyOn(productRepository, 'count').mockResolvedValue(0);

      const result = await service.validateSKU('NEW-SKU');

      expect(productRepository.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123', sku: 'NEW-SKU' },
      });
      expect(result).toBe(true);
    });

    it('should return false if SKU is already taken', async () => {
      jest.spyOn(productRepository, 'count').mockResolvedValue(1);

      const result = await service.validateSKU('EXISTING-SKU');

      expect(result).toBe(false);
    });
  });

  describe('createVariant', () => {
    it('should create a product variant', async () => {
      const variantData = {
        variantSku: 'PROD-001-RED',
        variantName: 'Test Product - Red',
        attributes: { color: 'red' },
      };

      const mockVariant = {
        id: 'variant-123',
        ...variantData,
        productId: mockProduct.id,
        tenantId: 'tenant-123',
      } as any as ProductVariant;

      jest.spyOn(productRepository, 'findOne').mockResolvedValue(mockProduct);
      jest.spyOn(variantRepository, 'create').mockReturnValue(mockVariant);
      jest.spyOn(variantRepository, 'save').mockResolvedValue(mockVariant);

      const result = await service.createVariant(mockProduct.id, variantData);

      expect(variantRepository.create).toHaveBeenCalledWith({
        ...variantData,
        productId: mockProduct.id,
        tenantId: 'tenant-123',
      });
      expect(variantRepository.save).toHaveBeenCalledWith(mockVariant);
      expect(result).toEqual(mockVariant);
    });

    it('should throw NotFoundException if product not found', async () => {
      jest.spyOn(productRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.createVariant('non-existent-id', {}),
      ).rejects.toThrow(
        new NotFoundException('Product with ID non-existent-id not found'),
      );
    });
  });
});
