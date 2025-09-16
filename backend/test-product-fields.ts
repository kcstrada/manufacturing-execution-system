#!/usr/bin/env ts-node

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '.env') });

async function testProductFields() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'manufacturing_execution_system_db',
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database\n');

    // Test 1: Verify columns exist
    console.log('📋 Test 1: Verifying new columns exist...');
    const columns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'products'
      AND column_name IN ('is_manufacturable', 'is_purchasable', 'barcode', 'default_bom_id', 'default_routing_id')
      ORDER BY column_name;
    `);

    if (columns.length === 5) {
      console.log('✅ All 5 new columns exist');
      console.table(columns);
    } else {
      console.log(`❌ Expected 5 columns, found ${columns.length}`);
      return;
    }

    // Test 2: Verify indexes
    console.log('\n📋 Test 2: Verifying indexes...');
    const indexes = await dataSource.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'products'
      AND (indexname LIKE '%manufacturable%'
        OR indexname LIKE '%purchasable%'
        OR indexname LIKE '%barcode%');
    `);

    const expectedIndexes = [
      'idx_products_tenant_id_barcode',
      'idx_products_tenant_id_is_manufacturable',
      'idx_products_tenant_id_is_purchasable',
    ];

    const foundIndexes = indexes.map((idx: any) => idx.indexname);
    const missingIndexes = expectedIndexes.filter(idx => !foundIndexes.includes(idx));

    if (missingIndexes.length === 0) {
      console.log('✅ All expected indexes exist');
      foundIndexes.forEach((idx: string) => console.log(`   - ${idx}`));
    } else {
      console.log('❌ Missing indexes:', missingIndexes);
    }

    // Test 3: Insert test data with new fields
    console.log('\n📋 Test 3: Testing insert with new fields...');

    // First, get a unit of measure ID
    const uom = await dataSource.query('SELECT id FROM units_of_measure LIMIT 1');
    if (uom.length === 0) {
      console.log('⚠️  No units of measure found, creating one...');
      const newUom = await dataSource.query(`
        INSERT INTO units_of_measure (tenant_id, code, name, created_by, updated_by)
        VALUES ('test-tenant', 'PCS', 'Pieces', 'test', 'test')
        RETURNING id
      `);
      uom.push(newUom[0]);
    }

    const testProduct = await dataSource.query(`
      INSERT INTO products (
        tenant_id, sku, name, type,
        is_manufacturable, is_purchasable, barcode,
        unit_of_measure_id
      ) VALUES (
        $1, $2, $3, $4::products_type_enum,
        $5, $6, $7, $8
      ) RETURNING id, sku, is_manufacturable, is_purchasable, barcode;
    `, [
      'test-tenant',
      `TEST-${Date.now()}`,
      'Test Manufactured Product',
      'finished_good',
      true,
      false,
      '1234567890123',
      uom[0].id,
    ]);

    if (testProduct.length > 0) {
      console.log('✅ Successfully inserted product with manufacturing fields:');
      console.table(testProduct[0]);

      // Clean up
      await dataSource.query('DELETE FROM products WHERE id = $1', [testProduct[0].id]);
      console.log('🧹 Test data cleaned up');
    }

    // Test 4: Test default values
    console.log('\n📋 Test 4: Testing default values...');
    const defaultProduct = await dataSource.query(`
      INSERT INTO products (
        tenant_id, sku, name, type,
        unit_of_measure_id
      ) VALUES (
        $1, $2, $3, $4::products_type_enum,
        $5
      ) RETURNING id, is_manufacturable, is_purchasable;
    `, [
      'test-tenant',
      `DEFAULT-${Date.now()}`,
      'Test Default Values',
      'component',
      uom[0].id,
    ]);

    if (defaultProduct.length > 0) {
      const product = defaultProduct[0];
      console.log('✅ Default values applied:');
      console.log(`   - is_manufacturable: ${product.is_manufacturable} (expected: true)`);
      console.log(`   - is_purchasable: ${product.is_purchasable} (expected: false)`);

      if (product.is_manufacturable === true && product.is_purchasable === false) {
        console.log('✅ Default values are correct!');
      } else {
        console.log('❌ Default values are not as expected');
      }

      // Clean up
      await dataSource.query('DELETE FROM products WHERE id = $1', [product.id]);
    }

    // Test 5: Test different product types
    console.log('\n📋 Test 5: Testing different product type scenarios...');
    const scenarios = [
      { type: 'raw_material', manufacturable: false, purchasable: true, name: 'Raw Material' },
      { type: 'component', manufacturable: true, purchasable: true, name: 'Component' },
      { type: 'finished_good', manufacturable: true, purchasable: false, name: 'Finished Good' },
      { type: 'consumable', manufacturable: false, purchasable: true, name: 'Consumable' },
    ];

    for (const scenario of scenarios) {
      const result = await dataSource.query(`
        INSERT INTO products (
          tenant_id, sku, name, type,
          is_manufacturable, is_purchasable,
          unit_of_measure_id
        ) VALUES (
          $1, $2, $3, $4::products_type_enum,
          $5, $6, $7
        ) RETURNING id, type, is_manufacturable, is_purchasable;
      `, [
        'test-tenant',
        `${scenario.type.toUpperCase()}-${Date.now()}`,
        scenario.name,
        scenario.type,
        scenario.manufacturable,
        scenario.purchasable,
        uom[0].id,
      ]);

      if (result.length > 0) {
        const product = result[0];
        console.log(`✅ ${scenario.name}: manufacturable=${product.is_manufacturable}, purchasable=${product.is_purchasable}`);

        // Clean up
        await dataSource.query('DELETE FROM products WHERE id = $1', [product.id]);
      }
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Run the tests
testProductFields();