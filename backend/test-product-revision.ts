#!/usr/bin/env ts-node

import { DataSource } from 'typeorm';

async function testProductRevision() {
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
    console.log('📋 Test 1: Verifying product_revisions table exists...');
    const tableCheck = await dataSource.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'product_revisions';
    `);

    if (tableCheck.length > 0) {
      console.log('✅ product_revisions table exists');
    } else {
      console.log('❌ product_revisions table not found');
      return;
    }

    // Test 2: Verify key columns
    console.log('\n📋 Test 2: Verifying table columns...');
    const columns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'product_revisions'
      AND column_name IN (
        'revision_number', 'revision_code', 'revision_type', 'status',
        'change_description', 'approved_by', 'is_current_revision', 'is_effective'
      )
      ORDER BY column_name;
    `);

    console.log('Key revision tracking columns:');
    console.table(columns);

    // Test 3: Verify indexes
    console.log('\n📋 Test 3: Verifying indexes...');
    const indexes = await dataSource.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'product_revisions'
      ORDER BY indexname;
    `);

    console.log('✅ Found', indexes.length, 'indexes:');
    indexes.forEach((idx: any) => console.log(`   - ${idx.indexname}`));

    // Test 4: Verify enum types
    console.log('\n📋 Test 4: Verifying enum types...');
    const enumTypes = await dataSource.query(`
      SELECT typname, enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE typname IN ('product_revisions_revision_type_enum', 'product_revisions_revision_status_enum')
      ORDER BY typname, enumsortorder;
    `);

    const revisionTypes = enumTypes
      .filter((e: any) => e.typname === 'product_revisions_revision_type_enum')
      .map((e: any) => e.enumlabel);

    const statusTypes = enumTypes
      .filter((e: any) => e.typname === 'product_revisions_revision_status_enum')
      .map((e: any) => e.enumlabel);

    console.log('✅ Revision type enum values:', revisionTypes.join(', '));
    console.log('✅ Status enum values:', statusTypes.join(', '));

    // Test 5: Verify products table modifications
    console.log('\n📋 Test 5: Verifying products table revision fields...');
    const productColumns = await dataSource.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'products'
      AND column_name IN ('current_revision_number', 'current_revision_id')
      ORDER BY column_name;
    `);

    console.log('Product revision tracking columns:');
    console.table(productColumns);

    // Test 6: Test inserting a revision
    console.log('\n📋 Test 6: Testing revision insertion...');

    // Get required IDs
    const tenant = await dataSource.query('SELECT id FROM tenants LIMIT 1');
    const product = await dataSource.query('SELECT id, tenant_id, sku, name, type, unit_of_measure_id FROM products LIMIT 1');
    const user = await dataSource.query('SELECT id FROM users LIMIT 1');

    if (tenant.length === 0 || product.length === 0) {
      console.log('⚠️  Missing required data for insertion test');
      return;
    }

    const testRevision = await dataSource.query(`
      INSERT INTO product_revisions (
        tenant_id, product_id, revision_number, revision_code,
        revision_type, status, change_description, change_reason,
        sku, name, type, unit_of_measure_id,
        is_manufacturable, is_purchasable, created_by,
        is_current_revision, is_effective
      ) VALUES (
        $1, $2, $3, $4,
        $5::product_revisions_revision_type_enum,
        $6::product_revisions_revision_status_enum,
        $7, $8, $9, $10,
        $11::product_revisions_type_enum,
        $12, $13, $14, $15, $16, $17
      ) RETURNING id, revision_number, revision_code, status;
    `, [
      product[0].tenant_id,
      product[0].id,
      1,
      'REV-001',
      'create',
      'draft',
      'Initial product revision',
      'Product creation',
      product[0].sku,
      product[0].name,
      product[0].type,
      product[0].unit_of_measure_id,
      true,
      false,
      user[0]?.id || null,
      true,
      false
    ]);

    if (testRevision.length > 0) {
      console.log('✅ Successfully created revision:');
      console.table(testRevision[0]);

      // Clean up
      await dataSource.query('DELETE FROM product_revisions WHERE id = $1', [testRevision[0].id]);
      console.log('🧹 Test data cleaned up');
    }

    // Test 7: Verify foreign key constraints
    console.log('\n📋 Test 7: Verifying foreign key constraints...');
    const foreignKeys = await dataSource.query(`
      SELECT conname, confrelid::regclass AS references
      FROM pg_constraint
      WHERE conrelid = 'product_revisions'::regclass
      AND contype = 'f'
      ORDER BY conname;
    `);

    console.log('✅ Foreign key constraints:');
    foreignKeys.forEach((fk: any) => console.log(`   - ${fk.conname} -> ${fk.references}`));

    console.log('\n🎉 All ProductRevision tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Run the tests
testProductRevision();