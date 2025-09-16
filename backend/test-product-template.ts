#!/usr/bin/env ts-node

import { DataSource } from 'typeorm';

async function testProductTemplate() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'postgres',
    database: 'manufacturing_execution_system_db',
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database\n');

    // Test 1: Verify table exists
    console.log('📋 Test 1: Verifying product_templates table exists...');
    const tableCheck = await dataSource.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'product_templates';
    `);

    if (tableCheck.length > 0) {
      console.log('✅ product_templates table exists');
    } else {
      console.log('❌ product_templates table not found');
      return;
    }

    // Test 2: Verify columns
    console.log('\n📋 Test 2: Verifying table columns...');
    const columns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'product_templates'
      AND column_name IN (
        'template_code', 'template_name', 'sku_pattern',
        'default_is_manufacturable', 'default_is_purchasable',
        'usage_count', 'last_sequence_number'
      )
      ORDER BY column_name;
    `);

    console.log('Key columns:');
    console.table(columns);

    // Test 3: Verify indexes
    console.log('\n📋 Test 3: Verifying indexes...');
    const indexes = await dataSource.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'product_templates'
      ORDER BY indexname;
    `);

    console.log('✅ Found', indexes.length, 'indexes:');
    indexes.forEach((idx: any) => console.log(`   - ${idx.indexname}`));

    // Test 4: Insert test template
    console.log('\n📋 Test 4: Testing template insertion...');

    // Get tenant for testing
    const tenant = await dataSource.query('SELECT id FROM tenants LIMIT 1');
    if (tenant.length === 0) {
      console.log('⚠️  No tenants found, skipping insertion test');
      return;
    }

    const testTemplate = await dataSource.query(`
      INSERT INTO product_templates (
        tenant_id,
        template_code,
        template_name,
        template_description,
        sku_pattern,
        sku_prefix,
        product_type,
        default_is_manufacturable,
        default_is_purchasable,
        template_rules
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::product_templates_product_type_enum, $8, $9, $10::jsonb
      ) RETURNING id, template_code, template_name, usage_count, last_sequence_number;
    `, [
      tenant[0].id,
      `TMPL-${Date.now()}`,
      'Test Product Template',
      'Template for testing quick product creation',
      'PROD-{YYYY}-{0000}',
      'TEST',
      'finished_good',
      true,
      false,
      JSON.stringify({
        autoGenerateSku: true,
        autoGenerateBarcode: false,
        requireApproval: false
      })
    ]);

    if (testTemplate.length > 0) {
      console.log('✅ Successfully created template:');
      console.table(testTemplate[0]);

      // Clean up
      await dataSource.query('DELETE FROM product_templates WHERE id = $1', [testTemplate[0].id]);
      console.log('🧹 Test data cleaned up');
    }

    // Test 5: Verify enum types
    console.log('\n📋 Test 5: Verifying enum types...');
    const enumTypes = await dataSource.query(`
      SELECT typname, enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE typname IN ('product_templates_product_type_enum', 'product_templates_status_enum')
      ORDER BY typname, enumsortorder;
    `);

    const productTypes = enumTypes
      .filter((e: any) => e.typname === 'product_templates_product_type_enum')
      .map((e: any) => e.enumlabel);

    const statusTypes = enumTypes
      .filter((e: any) => e.typname === 'product_templates_status_enum')
      .map((e: any) => e.enumlabel);

    console.log('✅ Product type enum values:', productTypes.join(', '));
    console.log('✅ Status enum values:', statusTypes.join(', '));

    // Test 6: Test unique constraint
    console.log('\n📋 Test 6: Testing unique constraint...');
    const constraints = await dataSource.query(`
      SELECT conname, contype
      FROM pg_constraint
      WHERE conrelid = 'product_templates'::regclass
      AND contype IN ('u', 'p');
    `);

    console.log('✅ Constraints:');
    constraints.forEach((c: any) => {
      const type = c.contype === 'p' ? 'PRIMARY KEY' : 'UNIQUE';
      console.log(`   - ${c.conname} (${type})`);
    });

    console.log('\n🎉 All ProductTemplate tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Run the tests
testProductTemplate();