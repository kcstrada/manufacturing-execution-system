import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1757470370065 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ============================================
    // COMPOSITE INDEXES FOR FREQUENT QUERY PATTERNS
    // ============================================

    // Production Orders - High frequency queries
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_production_orders_status_priority" 
            ON "production_orders" ("tenant_id", "status", "priority" DESC)
            WHERE "is_active" = true;
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_production_orders_date_range" 
            ON "production_orders" ("tenant_id", "planned_start_date", "planned_end_date")
            WHERE "status" NOT IN ('completed', 'cancelled');
        `);

    // Work Orders - Complex queries with joins
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_work_orders_production_sequence" 
            ON "work_orders" ("tenant_id", "production_order_id", "sequence");
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_work_orders_assigned_status" 
            ON "work_orders" ("tenant_id", "assigned_to_id", "status")
            WHERE "status" IN ('scheduled', 'released', 'in_progress');
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_work_orders_completion" 
            ON "work_orders" ("tenant_id", "status", "actual_end_date")
            WHERE "status" = 'completed';
        `);

    // Inventory - Stock level queries
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_inventory_available_quantity" 
            ON "inventory" ("tenant_id", "product_id", "quantity_available")
            WHERE "status" = 'available';
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_inventory_expiration" 
            ON "inventory" ("tenant_id", "expiration_date")
            WHERE "expiration_date" IS NOT NULL;
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_inventory_reorder" 
            ON "inventory" ("tenant_id", "product_id", "quantity_on_hand");
        `);

    // Tasks - Assignment and status queries
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_tasks_worker_status" 
            ON "tasks" ("tenant_id", "assigned_to_id", "status", "scheduled_start_date")
            WHERE "status" NOT IN ('completed', 'cancelled');
        `);

    // Task dependencies are handled through a join table, so index that instead
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_task_dependencies_task" 
            ON "task_dependencies" ("task_id");
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_task_dependencies_depends_on" 
            ON "task_dependencies" ("depends_on_task_id");
        `);

    // Quality Metrics - Inspection queries
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_quality_inspections_date_result" 
            ON "quality_inspections" ("tenant_id", "inspection_date", "result");
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_quality_inspections_product_type" 
            ON "quality_inspections" ("tenant_id", "product_id", "type");
        `);

    // Customer Orders - Status and date queries
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_customer_orders_status_date" 
            ON "customer_orders" ("tenant_id", "status", "order_date" DESC)
            WHERE "is_active" = true;
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_customer_orders_customer_status" 
            ON "customer_orders" ("tenant_id", "customer_id", "status");
        `);

    // Equipment - Maintenance scheduling
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_equipment_next_maintenance" 
            ON "equipment" ("tenant_id", "next_maintenance_date")
            WHERE "status" = 'operational';
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_maintenance_records_history" 
            ON "maintenance_records" ("tenant_id", "equipment_id", "start_date" DESC);
        `);

    // Workers - Shift and department queries
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_workers_department_active" 
            ON "workers" ("tenant_id", "department_id", "is_active")
            WHERE "is_active" = true;
        `);

    // Activity Logs - Audit trail queries
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_activity_logs_entity_date" 
            ON "activity_logs" ("tenant_id", "entity_type", "entity_id", "timestamp" DESC);
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_activity_logs_user_date" 
            ON "activity_logs" ("tenant_id", "user_id", "timestamp" DESC);
        `);

    // ============================================
    // PARTIAL INDEXES FOR SPECIFIC CONDITIONS
    // ============================================

    // Products - Active products with low stock
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_products_low_stock" 
            ON "products" ("tenant_id", "reorder_point", "min_stock_level")
            WHERE "is_active" = true AND "reorder_point" IS NOT NULL;
        `);

    // Bill of Materials - Active BOMs
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_bom_active_version" 
            ON "bills_of_materials" ("tenant_id", "product_id", "version")
            WHERE "is_active" = true;
        `);

    // ============================================
    // FULL TEXT SEARCH INDEXES
    // ============================================

    // Products - Name and description search
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_products_fulltext" 
            ON "products" USING gin(to_tsvector('english', 
                coalesce(name, '') || ' ' || coalesce(description, '')));
        `);

    // Customers - Name and email search
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_customers_fulltext" 
            ON "customers" USING gin(to_tsvector('english', 
                coalesce(name, '') || ' ' || coalesce(email, '')));
        `);

    // ============================================
    // JSONB INDEXES FOR METADATA
    // ============================================

    // Products - Specifications JSONB
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_products_specifications" 
            ON "products" USING gin("specifications") 
            WHERE "specifications" IS NOT NULL;
        `);

    // Quality Metrics - Measurements JSONB
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_quality_inspections_measurements" 
            ON "quality_inspections" USING gin("measurements") 
            WHERE "measurements" IS NOT NULL;
        `);

    // ============================================
    // FOREIGN KEY PERFORMANCE INDEXES
    // ============================================

    // Ensure all foreign keys have indexes (if not already created by decorators)
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_work_orders_product_id" 
            ON "work_orders" ("product_id");
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_production_orders_product_id" 
            ON "production_orders" ("product_id");
        `);

    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_tasks_work_order_id" 
            ON "tasks" ("work_order_id");
        `);

    // ============================================
    // COVERING INDEXES FOR COMMON QUERIES
    // ============================================

    // Work orders with all commonly accessed fields
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_work_orders_covering" 
            ON "work_orders" ("tenant_id", "status", "scheduled_start_date") 
            INCLUDE ("work_order_number", "quantity_ordered", "quantity_completed");
        `);

    // Production orders covering index
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_production_orders_covering" 
            ON "production_orders" ("tenant_id", "status", "priority") 
            INCLUDE ("order_number", "quantity_ordered", "quantity_produced");
        `);

    // ============================================
    // STATISTICS UPDATE
    // ============================================

    // Update table statistics for query planner
    await queryRunner.query(`ANALYZE production_orders;`);
    await queryRunner.query(`ANALYZE work_orders;`);
    await queryRunner.query(`ANALYZE inventory;`);
    await queryRunner.query(`ANALYZE tasks;`);
    await queryRunner.query(`ANALYZE quality_inspections;`);
    await queryRunner.query(`ANALYZE customer_orders;`);
    await queryRunner.query(`ANALYZE products;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_production_orders_covering";`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_work_orders_covering";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_work_order_id";`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_production_orders_product_id";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_work_orders_product_id";`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_quality_inspections_measurements";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_products_specifications";`,
    );

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_customers_fulltext";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_fulltext";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bom_active_version";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_low_stock";`);

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_activity_logs_user_date";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_activity_logs_entity_date";`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_workers_department_active";`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_maintenance_records_history";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_equipment_next_maintenance";`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_customer_orders_customer_status";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_customer_orders_status_date";`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_quality_inspections_product_type";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_quality_inspections_date_result";`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_task_dependencies_depends_on";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_task_dependencies_task";`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_worker_status";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_reorder";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_inventory_expiration";`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_inventory_available_quantity";`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_work_orders_completion";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_work_orders_assigned_status";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_work_orders_production_sequence";`,
    );

    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_production_orders_date_range";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_production_orders_status_priority";`,
    );
  }
}
