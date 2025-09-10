import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Product, ProductType } from '../entities/product.entity';
import { TenantAwareRepository } from '../common/repositories/tenant-aware.repository';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class ProductRepository extends TenantAwareRepository<Product> {
  constructor(
    @InjectRepository(Product)
    productRepository: Repository<Product>,
    protected override readonly clsService: ClsService,
  ) {
    super(productRepository, 'Product', clsService);
  }

  async findBySku(sku: string): Promise<Product | null> {
    const tenantId = this.getTenantId();
    return this.repository.findOne({
      where: { sku, tenantId },
      relations: ['category', 'unitOfMeasure'],
    });
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { categoryId, tenantId },
      relations: ['category', 'unitOfMeasure'],
    });
  }

  async findByType(type: ProductType): Promise<Product[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { type, tenantId },
      relations: ['category', 'unitOfMeasure'],
    });
  }

  async searchProducts(searchTerm: string): Promise<Product[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: [
        { name: Like(`%${searchTerm}%`), tenantId },
        { sku: Like(`%${searchTerm}%`), tenantId },
      ],
      relations: ['category', 'unitOfMeasure'],
    });
  }

  async findWithInventory(productId: string): Promise<Product | null> {
    const tenantId = this.getTenantId();
    return this.repository.findOne({
      where: { id: productId, tenantId },
      relations: ['inventoryItems'],
    });
  }

  async updateStock(
    productId: string,
    minStockLevel: number,
    maxStockLevel: number,
    reorderPoint: number,
  ): Promise<Product> {
    const tenantId = this.getTenantId();
    await this.repository.update(
      { id: productId, tenantId },
      { minStockLevel, maxStockLevel, reorderPoint },
    );
    const updated = await this.repository.findOne({
      where: { id: productId, tenantId },
    });
    if (!updated) {
      throw new Error('Product not found');
    }
    return updated;
  }

  async findActiveProducts(): Promise<Product[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { isActive: true, tenantId },
      relations: ['category', 'unitOfMeasure'],
    });
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    const tenantId = this.getTenantId();
    return this.repository.find({
      where: { id: In(ids), tenantId },
      relations: ['category', 'unitOfMeasure'],
    });
  }

  async updatePricing(
    productId: string,
    cost: number,
    price: number,
  ): Promise<Product> {
    const tenantId = this.getTenantId();
    await this.repository.update(
      { id: productId, tenantId },
      { cost, price },
    );
    const updated = await this.repository.findOne({
      where: { id: productId, tenantId },
    });
    if (!updated) {
      throw new Error('Product not found');
    }
    return updated;
  }

  async findBelowReorderPoint(): Promise<Product[]> {
    const tenantId = this.getTenantId();
    const query = this.repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.inventoryItems', 'inventory')
      .where('product.tenantId = :tenantId', { tenantId })
      .andWhere('product.reorderPoint IS NOT NULL')
      .groupBy('product.id')
      .having('SUM(inventory.quantityAvailable) < product.reorderPoint');
    
    return query.getMany();
  }
}