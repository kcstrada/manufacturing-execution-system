import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('Product Manufacturing Fields (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Database Schema', () => {
    it('should have manufacturing fields in products table', async () => {
      const result = await dataSource.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name IN ('is_manufacturable', 'is_purchasable', 'barcode', 'default_bom_id', 'default_routing_id')
        ORDER BY column_name;
      `);

      expect(result).toHaveLength(5);

      const fields = result.reduce((acc: any, row: any) => {
        acc[row.column_name] = row;
        return acc;
      }, {});

      // Check isManufacturable field
      expect(fields.is_manufacturable).toBeDefined();
      expect(fields.is_manufacturable.data_type).toBe('boolean');
      expect(fields.is_manufacturable.is_nullable).toBe('NO');
      expect(fields.is_manufacturable.column_default).toBe('true');

      // Check isPurchasable field
      expect(fields.is_purchasable).toBeDefined();
      expect(fields.is_purchasable.data_type).toBe('boolean');
      expect(fields.is_purchasable.is_nullable).toBe('NO');
      expect(fields.is_purchasable.column_default).toBe('false');

      // Check barcode field
      expect(fields.barcode).toBeDefined();
      expect(fields.barcode.data_type).toBe('character varying');
      expect(fields.barcode.is_nullable).toBe('YES');

      // Check defaultBomId field
      expect(fields.default_bom_id).toBeDefined();
      expect(fields.default_bom_id.data_type).toBe('uuid');
      expect(fields.default_bom_id.is_nullable).toBe('YES');

      // Check defaultRoutingId field
      expect(fields.default_routing_id).toBeDefined();
      expect(fields.default_routing_id.data_type).toBe('uuid');
      expect(fields.default_routing_id.is_nullable).toBe('YES');
    });

    it('should have proper indexes for manufacturing fields', async () => {
      const indexes = await dataSource.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'products'
        AND (indexname LIKE '%manufacturable%'
          OR indexname LIKE '%purchasable%'
          OR indexname LIKE '%barcode%');
      `);

      const indexNames = indexes.map((idx: any) => idx.indexname);

      expect(indexNames).toContain('idx_products_tenant_id_barcode');
      expect(indexNames).toContain('idx_products_tenant_id_is_manufacturable');
      expect(indexNames).toContain('idx_products_tenant_id_is_purchasable');
    });
  });

  describe('Product Creation with Manufacturing Fields', () => {
    it('should create a manufacturable product', async () => {
      const testProduct = {
        tenantId: 'test-tenant-mfg',
        sku: 'MFG-TEST-001',
        name: 'Manufacturable Test Product',
        type: 'finished_good',
        isManufacturable: true,
        isPurchasable: false,
        barcode: '1234567890123',
      };

      // Insert directly via SQL to test database constraints
      const insertResult = await dataSource.query(`
        INSERT INTO products (
          tenant_id, sku, name, type,
          is_manufacturable, is_purchasable, barcode,
          unit_of_measure_id, created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4::products_type_enum,
          $5, $6, $7,
          (SELECT id FROM unit_of_measures LIMIT 1),
          'test-user', 'test-user'
        ) RETURNING id, is_manufacturable, is_purchasable, barcode;
      `, [
        testProduct.tenantId,
        testProduct.sku,
        testProduct.name,
        testProduct.type,
        testProduct.isManufacturable,
        testProduct.isPurchasable,
        testProduct.barcode,
      ]);

      expect(insertResult).toHaveLength(1);
      expect(insertResult[0].is_manufacturable).toBe(true);
      expect(insertResult[0].is_purchasable).toBe(false);
      expect(insertResult[0].barcode).toBe('1234567890123');

      // Clean up
      await dataSource.query(
        'DELETE FROM products WHERE id = $1',
        [insertResult[0].id]
      );
    });

    it('should apply default values when not specified', async () => {
      const insertResult = await dataSource.query(`
        INSERT INTO products (
          tenant_id, sku, name, type,
          unit_of_measure_id, created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4::products_type_enum,
          (SELECT id FROM unit_of_measures LIMIT 1),
          'test-user', 'test-user'
        ) RETURNING id, is_manufacturable, is_purchasable;
      `, [
        'test-tenant-default',
        'DEFAULT-TEST-001',
        'Default Test Product',
        'component',
      ]);

      expect(insertResult).toHaveLength(1);
      expect(insertResult[0].is_manufacturable).toBe(true); // Default value
      expect(insertResult[0].is_purchasable).toBe(false);    // Default value

      // Clean up
      await dataSource.query(
        'DELETE FROM products WHERE id = $1',
        [insertResult[0].id]
      );
    });

    it('should handle purchasable raw materials', async () => {
      const insertResult = await dataSource.query(`
        INSERT INTO products (
          tenant_id, sku, name, type,
          is_manufacturable, is_purchasable,
          unit_of_measure_id, created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4::products_type_enum,
          $5, $6,
          (SELECT id FROM unit_of_measures LIMIT 1),
          'test-user', 'test-user'
        ) RETURNING id, type, is_manufacturable, is_purchasable;
      `, [
        'test-tenant-raw',
        'RAW-TEST-001',
        'Raw Material Test',
        'raw_material',
        false,
        true,
      ]);

      expect(insertResult).toHaveLength(1);
      expect(insertResult[0].type).toBe('raw_material');
      expect(insertResult[0].is_manufacturable).toBe(false);
      expect(insertResult[0].is_purchasable).toBe(true);

      // Clean up
      await dataSource.query(
        'DELETE FROM products WHERE id = $1',
        [insertResult[0].id]
      );
    });
  });
});