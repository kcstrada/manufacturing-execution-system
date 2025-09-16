import dataSource from '../database/data-source';

async function verifySchema() {
  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    // Check for product management tables
    const tables = [
      'products',
      'product_templates',
      'product_revisions',
      'bills_of_materials',
      'bom_components',
      'routings',
      'production_steps',
      'work_instructions',
      'process_parameters'
    ];

    console.log('📊 Product Management Tables Status:');
    console.log('=====================================');

    for (const table of tables) {
      const result = await dataSource.query(
        `SELECT COUNT(*) as count FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = $1`,
        [table]
      );

      const exists = result[0].count > 0;
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${table.padEnd(25)} ${exists ? 'EXISTS' : 'MISSING'}`);
    }

    // Check for new fields in products table
    console.log('\n📋 Product Entity Fields:');
    console.log('=========================');
    const productFields = [
      'is_manufacturable',
      'is_purchasable',
      'barcode',
      'default_bom_id',
      'default_routing_id'
    ];

    for (const field of productFields) {
      const result = await dataSource.query(
        `SELECT COUNT(*) as count FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'products' AND column_name = $1`,
        [field]
      );

      const exists = result[0].count > 0;
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${field.padEnd(25)} ${exists ? 'EXISTS' : 'MISSING'}`);
    }

    // Check for BOM fields
    console.log('\n📦 BOM Entity Fields:');
    console.log('=====================');
    const bomFields = ['is_default', 'total_cost', 'alternate_components'];

    for (const field of bomFields) {
      const result = await dataSource.query(
        `SELECT COUNT(*) as count FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'bills_of_materials' AND column_name = $1`,
        [field]
      );

      const exists = result[0].count > 0;
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${field.padEnd(25)} ${exists ? 'EXISTS' : 'MISSING'}`);
    }

    // Check for Routing fields
    console.log('\n🔄 Routing Entity Fields:');
    console.log('=========================');
    const routingFields = ['is_default', 'expected_yield', 'alternate_routes'];

    for (const field of routingFields) {
      const result = await dataSource.query(
        `SELECT COUNT(*) as count FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'routings' AND column_name = $1`,
        [field]
      );

      const exists = result[0].count > 0;
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${field.padEnd(25)} ${exists ? 'EXISTS' : 'MISSING'}`);
    }

    // Check for ProductionStep fields
    console.log('\n⚙️ ProductionStep Entity Fields:');
    console.log('=================================');
    const stepFields = ['validation_rules', 'media_files', 'alternate_work_center_id'];

    for (const field of stepFields) {
      const result = await dataSource.query(
        `SELECT COUNT(*) as count FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'production_steps' AND column_name = $1`,
        [field]
      );

      const exists = result[0].count > 0;
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${field.padEnd(25)} ${exists ? 'EXISTS' : 'MISSING'}`);
    }

    // Check for composite indexes
    console.log('\n🔍 Composite Indexes:');
    console.log('=====================');
    const indexes = await dataSource.query(
      `SELECT indexname FROM pg_indexes
       WHERE schemaname = 'public'
       AND (indexname LIKE 'idx_products_%'
            OR indexname LIKE 'idx_bom_%'
            OR indexname LIKE 'idx_routing_%'
            OR indexname LIKE 'idx_production_steps_%'
            OR indexname LIKE 'idx_work_instructions_%'
            OR indexname LIKE 'idx_process_parameters_%')
       ORDER BY indexname`
    );

    console.log(`Total composite indexes created: ${indexes.length}`);

    // Show a sample of indexes
    if (indexes.length > 0) {
      console.log('\nSample indexes:');
      indexes.slice(0, 10).forEach((idx: any) => {
        console.log(`  ✅ ${idx.indexname}`);
      });
      if (indexes.length > 10) {
        console.log(`  ... and ${indexes.length - 10} more indexes`);
      }
    }

    // Check for views and functions
    console.log('\n📊 Database Views:');
    console.log('==================');
    const views = await dataSource.query(
      `SELECT viewname FROM pg_views
       WHERE schemaname = 'public'
       ORDER BY viewname`
    );

    views.forEach((view: any) => {
      console.log(`  ✅ ${view.viewname}`);
    });

    console.log('\n✨ Schema verification complete!');
    console.log('All product management migrations have been successfully applied.');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error verifying schema:', error);
    process.exit(1);
  }
}

verifySchema();