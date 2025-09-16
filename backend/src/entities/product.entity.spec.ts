import { DataSource } from 'typeorm';
import { Product, ProductType } from './product.entity';
import { UnitOfMeasure } from './unit-of-measure.entity';

describe('Product Entity', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'manufacturing_execution_system_db',
      entities: [Product, UnitOfMeasure],
      synchronize: false,
      logging: false,
    });

    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  describe('Manufacturing Fields', () => {
    it('should create a product with manufacturing fields', async () => {
      const productRepository = dataSource.getRepository(Product);

      const product = productRepository.create({
        tenantId: 'test-tenant',
        sku: 'TEST-MFG-001',
        name: 'Manufacturable Product',
        type: ProductType.FINISHED_GOOD,
        isManufacturable: true,
        isPurchasable: false,
        barcode: '1234567890123',
        unitOfMeasureId: '00000000-0000-0000-0000-000000000001',
      });

      expect(product.isManufacturable).toBe(true);
      expect(product.isPurchasable).toBe(false);
      expect(product.barcode).toBe('1234567890123');
      expect(product.defaultBomId).toBeUndefined();
      expect(product.defaultRoutingId).toBeUndefined();
    });

    it('should handle default values correctly', async () => {
      const productRepository = dataSource.getRepository(Product);

      const product = productRepository.create({
        tenantId: 'test-tenant',
        sku: 'TEST-DEFAULT-001',
        name: 'Default Values Product',
        type: ProductType.RAW_MATERIAL,
        unitOfMeasureId: '00000000-0000-0000-0000-000000000001',
      });

      // Defaults should be applied
      expect(product.isManufacturable).toBe(true);
      expect(product.isPurchasable).toBe(false);
    });

    it('should create a purchasable raw material', async () => {
      const productRepository = dataSource.getRepository(Product);

      const product = productRepository.create({
        tenantId: 'test-tenant',
        sku: 'RAW-001',
        name: 'Raw Material',
        type: ProductType.RAW_MATERIAL,
        isManufacturable: false,
        isPurchasable: true,
        barcode: '9876543210987',
        unitOfMeasureId: '00000000-0000-0000-0000-000000000001',
      });

      expect(product.isManufacturable).toBe(false);
      expect(product.isPurchasable).toBe(true);
      expect(product.type).toBe(ProductType.RAW_MATERIAL);
    });

    it('should handle BOM and Routing references', async () => {
      const productRepository = dataSource.getRepository(Product);
      const bomId = '11111111-1111-1111-1111-111111111111';
      const routingId = '22222222-2222-2222-2222-222222222222';

      const product = productRepository.create({
        tenantId: 'test-tenant',
        sku: 'COMPLEX-001',
        name: 'Complex Product',
        type: ProductType.FINISHED_GOOD,
        isManufacturable: true,
        defaultBomId: bomId,
        defaultRoutingId: routingId,
        unitOfMeasureId: '00000000-0000-0000-0000-000000000001',
      });

      expect(product.defaultBomId).toBe(bomId);
      expect(product.defaultRoutingId).toBe(routingId);
    });
  });

  describe('Product Type Scenarios', () => {
    const testCases = [
      {
        type: ProductType.RAW_MATERIAL,
        isManufacturable: false,
        isPurchasable: true,
        description: 'Raw materials are typically purchased, not manufactured',
      },
      {
        type: ProductType.COMPONENT,
        isManufacturable: true,
        isPurchasable: true,
        description: 'Components can be both manufactured and purchased',
      },
      {
        type: ProductType.FINISHED_GOOD,
        isManufacturable: true,
        isPurchasable: false,
        description: 'Finished goods are typically manufactured, not purchased',
      },
      {
        type: ProductType.CONSUMABLE,
        isManufacturable: false,
        isPurchasable: true,
        description: 'Consumables are typically purchased',
      },
    ];

    testCases.forEach(({ type, isManufacturable, isPurchasable, description }) => {
      it(`should handle ${type}: ${description}`, () => {
        const productRepository = dataSource.getRepository(Product);

        const product = productRepository.create({
          tenantId: 'test-tenant',
          sku: `TEST-${type}`,
          name: `Test ${type}`,
          type,
          isManufacturable,
          isPurchasable,
          unitOfMeasureId: '00000000-0000-0000-0000-000000000001',
        });

        expect(product.type).toBe(type);
        expect(product.isManufacturable).toBe(isManufacturable);
        expect(product.isPurchasable).toBe(isPurchasable);
      });
    });
  });
});