import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductCompositeIndexes1758043000000
  implements MigrationInterface
{
  name = 'CreateProductCompositeIndexes1758043000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ========================================
    // 1. PRODUCT ENTITY COMPOSITE INDEXES
    // ========================================

    // Core product query patterns
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_products_tenant_active_type" ON "products" ("tenant_id", "is_active", "type")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_products_tenant_manufacturable_active" ON "products" ("tenant_id", "is_manufacturable", "is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_products_tenant_created_type" ON "products" ("tenant_id", "created_at" DESC, "type")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_products_tenant_sku_active" ON "products" ("tenant_id", "sku", "is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_products_tenant_category_active" ON "products" ("tenant_id", "category_id", "is_active") WHERE "category_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_products_tenant_cost_range" ON "products" ("tenant_id", "cost") WHERE "cost" IS NOT NULL`,
    );

    // Full-text search indexes
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_products_name_gin" ON "products" USING gin(to_tsvector('english', "name"))`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_products_description_gin" ON "products" USING gin(to_tsvector('english', "description")) WHERE "description" IS NOT NULL`,
    );

    // JSONB search optimization
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_products_specifications_gin" ON "products" USING gin("specifications") WHERE "specifications" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_products_dimensions_gin" ON "products" USING gin("dimensions") WHERE "dimensions" IS NOT NULL`,
    );

    // Production planning optimization
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_products_tenant_manufacturable_lead_time" ON "products" ("tenant_id", "is_manufacturable", "lead_time_days", "is_active") WHERE "is_manufacturable" = true`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_products_tenant_stock_levels" ON "products" ("tenant_id", "min_stock_level", "reorder_point", "is_active") WHERE "min_stock_level" IS NOT NULL`,
    );

    // Relationship optimization
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_products_tenant_default_bom" ON "products" ("tenant_id", "default_bom_id", "is_active") WHERE "default_bom_id" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_products_tenant_default_routing" ON "products" ("tenant_id", "default_routing_id", "is_active") WHERE "default_routing_id" IS NOT NULL`,
    );

    // Soft delete optimization
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_products_tenant_active_not_deleted" ON "products" ("tenant_id", "is_active") WHERE "deleted_at" IS NULL`,
    );

    // ========================================
    // 2. BILL OF MATERIALS COMPOSITE INDEXES
    // ========================================

    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_bom_tenant_product_status_active" ON "bills_of_materials" ("tenant_id", "product_id", "status", "is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_bom_tenant_product_effective" ON "bills_of_materials" ("tenant_id", "product_id", "effective_date" DESC, "expiry_date") WHERE "is_active" = true`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_bom_tenant_status_effective" ON "bills_of_materials" ("tenant_id", "status", "effective_date" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_bom_tenant_default_active" ON "bills_of_materials" ("tenant_id", "is_default", "is_active") WHERE "is_default" = true`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_bom_tenant_approved_effective" ON "bills_of_materials" ("tenant_id", "approved_at" DESC, "effective_date") WHERE "approved_at" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_bom_tenant_active_not_deleted" ON "bills_of_materials" ("tenant_id", "is_active") WHERE "deleted_at" IS NULL`,
    );

    // BOM Components optimization
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_bom_components_tenant_bom_sequence" ON "bom_components" ("tenant_id", "bill_of_materials_id", "sequence")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_bom_components_tenant_component_required" ON "bom_components" ("tenant_id", "component_id", "is_required", "is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_bom_components_tenant_phantom_required" ON "bom_components" ("tenant_id", "is_phantom", "is_required")`,
    );

    // ========================================
    // 3. ROUTING COMPOSITE INDEXES
    // ========================================

    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_routing_tenant_product_status_active" ON "routings" ("tenant_id", "product_id", "status", "is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_routing_tenant_product_effective" ON "routings" ("tenant_id", "product_id", "effective_date" DESC, "expiry_date") WHERE "is_active" = true`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_routing_tenant_default_active" ON "routings" ("tenant_id", "is_default", "is_active") WHERE "is_default" = true`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_routing_tenant_yield_cost" ON "routings" ("tenant_id", "expected_yield" DESC, "total_cost_per_unit")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_routing_tenant_time_analysis" ON "routings" ("tenant_id", "total_setup_time_minutes", "total_run_time_per_unit_minutes")`,
    );

    // ========================================
    // 4. PRODUCTION STEP COMPOSITE INDEXES
    // ========================================

    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_production_steps_tenant_routing_sequence" ON "production_steps" ("tenant_id", "routing_id", "sequence_number")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_production_steps_tenant_workcenter_type" ON "production_steps" ("tenant_id", "work_center_id", "type", "is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_production_steps_tenant_critical_bottleneck" ON "production_steps" ("tenant_id", "is_critical", "is_bottleneck", "is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_production_steps_tenant_type_status" ON "production_steps" ("tenant_id", "type", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_production_steps_tenant_routing_type_sequence" ON "production_steps" ("tenant_id", "routing_id", "type", "sequence_number")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_production_steps_tenant_approval_required" ON "production_steps" ("tenant_id", "requires_approval", "status") WHERE "requires_approval" = true`,
    );

    // Time-based optimization
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_production_steps_tenant_setup_time" ON "production_steps" ("tenant_id", "setup_time" DESC) WHERE "setup_time" > 0`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_production_steps_tenant_run_time" ON "production_steps" ("tenant_id", "run_time" DESC) WHERE "run_time" > 0`,
    );

    // ========================================
    // 5. WORK INSTRUCTION COMPOSITE INDEXES
    // ========================================

    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_work_instructions_tenant_step_type_active" ON "work_instructions" ("tenant_id", "production_step_id", "type", "is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_work_instructions_tenant_status_priority" ON "work_instructions" ("tenant_id", "status", "priority", "is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_work_instructions_tenant_type_status_effective" ON "work_instructions" ("tenant_id", "type", "status", "effective_date" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_work_instructions_tenant_approval_workflow" ON "work_instructions" ("tenant_id", "status", "approved_at" DESC) WHERE "approved_at" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_work_instructions_tenant_skill_level" ON "work_instructions" ("tenant_id", "required_skill_level", "type")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_work_instructions_tenant_language_active" ON "work_instructions" ("tenant_id", "language", "is_active")`,
    );

    // Usage tracking
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_work_instructions_tenant_usage" ON "work_instructions" ("tenant_id", "view_count" DESC, "last_viewed_at" DESC)`,
    );

    // Full-text search
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_work_instructions_title_gin" ON "work_instructions" USING gin(to_tsvector('english', "title"))`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_work_instructions_content_gin" ON "work_instructions" USING gin(to_tsvector('english', "content")) WHERE "content" IS NOT NULL`,
    );

    // ========================================
    // 6. PROCESS PARAMETER COMPOSITE INDEXES
    // ========================================

    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_process_parameters_tenant_step_category" ON "process_parameters" ("tenant_id", "production_step_id", "category", "is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_process_parameters_tenant_required_priority" ON "process_parameters" ("tenant_id", "is_required", "priority", "is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_process_parameters_tenant_critical_control" ON "process_parameters" ("tenant_id", "is_critical_to_quality", "is_control_parameter", "is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_process_parameters_tenant_monitoring" ON "process_parameters" ("tenant_id", "is_monitored", "frequency", "is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_process_parameters_tenant_validation" ON "process_parameters" ("tenant_id", "requires_validation", "requires_approval")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_process_parameters_tenant_data_source" ON "process_parameters" ("tenant_id", "data_source", "is_active") WHERE "data_source" IS NOT NULL`,
    );

    // Value-based queries
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_process_parameters_tenant_value_range" ON "process_parameters" ("tenant_id", "min_value", "max_value") WHERE "min_value" IS NOT NULL AND "max_value" IS NOT NULL`,
    );

    // ========================================
    // 7. PRODUCT REVISION COMPOSITE INDEXES
    // ========================================

    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_product_revisions_tenant_product_status" ON "product_revisions" ("tenant_id", "product_id", "status", "revision_number" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_product_revisions_tenant_product_active" ON "product_revisions" ("tenant_id", "product_id", "is_current_revision", "is_effective")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_product_revisions_tenant_type_created" ON "product_revisions" ("tenant_id", "revision_type", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_product_revisions_tenant_effective_dates" ON "product_revisions" ("tenant_id", "effective_from", "effective_to", "is_effective")`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_product_revisions_tenant_approval_workflow" ON "product_revisions" ("tenant_id", "status", "approved_at" DESC, "created_at" DESC)`,
    );

    // ========================================
    // 8. CROSS-ENTITY AUDIT INDEXES
    // ========================================

    // Audit tracking for all major entities
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_products_tenant_created_at" ON "products" ("tenant_id", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_products_tenant_updated_at" ON "products" ("tenant_id", "updated_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_products_tenant_version" ON "products" ("tenant_id", "version" DESC)`,
    );

    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_bom_tenant_created_at" ON "bills_of_materials" ("tenant_id", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_bom_tenant_updated_at" ON "bills_of_materials" ("tenant_id", "updated_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_bom_tenant_version" ON "bills_of_materials" ("tenant_id", "version" DESC)`,
    );

    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_routing_tenant_created_at" ON "routings" ("tenant_id", "created_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_routing_tenant_updated_at" ON "routings" ("tenant_id", "updated_at" DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX  IF NOT EXISTS "idx_routing_tenant_version" ON "routings" ("tenant_id", "version" DESC)`,
    );

    // ========================================
    // 9. QUERY OPTIMIZATION STATISTICS
    // ========================================

    // Update statistics for all indexed tables
    await queryRunner.query(`ANALYZE "products"`);
    await queryRunner.query(`ANALYZE "bills_of_materials"`);
    await queryRunner.query(`ANALYZE "bom_components"`);
    await queryRunner.query(`ANALYZE "routings"`);
    await queryRunner.query(`ANALYZE "production_steps"`);
    await queryRunner.query(`ANALYZE "work_instructions"`);
    await queryRunner.query(`ANALYZE "process_parameters"`);
    await queryRunner.query(`ANALYZE "product_revisions"`);

    // ========================================
    // 10. CREATE INDEX USAGE MONITORING VIEW
    // ========================================

    await queryRunner.query(`
            CREATE OR REPLACE VIEW v_index_usage_statistics AS
            SELECT
                s.schemaname,
                s.relname as tablename,
                s.indexrelname as indexname,
                s.idx_scan as index_scans,
                s.idx_tup_read as tuples_read,
                s.idx_tup_fetch as tuples_fetched,
                pg_size_pretty(pg_relation_size(s.indexrelid)) as index_size,
                CASE
                    WHEN s.idx_scan = 0 THEN 'UNUSED'
                    WHEN s.idx_scan < 100 THEN 'RARELY_USED'
                    WHEN s.idx_scan < 1000 THEN 'OCCASIONALLY_USED'
                    ELSE 'FREQUENTLY_USED'
                END as usage_category,
                ROUND(100.0 * s.idx_scan / NULLIF(SUM(s.idx_scan) OVER (PARTITION BY s.relname), 0), 2) as percent_of_table_scans
            FROM pg_stat_user_indexes s
            WHERE s.schemaname = 'public'
            ORDER BY s.relname, s.idx_scan DESC;
        `);

    // Note: Query performance monitoring function removed as it requires pg_stat_statements extension
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop monitoring view
    await queryRunner.query(`DROP VIEW IF EXISTS v_index_usage_statistics`);

    // ========================================
    // 1. DROP PRODUCT INDEXES
    // ========================================

    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_products_tenant_active_type"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_products_tenant_manufacturable_active"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_products_tenant_created_type"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_products_tenant_sku_active"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_products_tenant_category_active"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_products_tenant_cost_range"`,
    );
    await queryRunner.query(`DROP INDEX  IF EXISTS "idx_products_name_gin"`);
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_products_description_gin"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_products_specifications_gin"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_products_dimensions_gin"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_products_tenant_manufacturable_lead_time"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_products_tenant_stock_levels"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_products_tenant_default_bom"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_products_tenant_default_routing"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_products_tenant_active_not_deleted"`,
    );

    // ========================================
    // 2. DROP BOM INDEXES
    // ========================================

    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_bom_tenant_product_status_active"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_bom_tenant_product_effective"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_bom_tenant_status_effective"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_bom_tenant_default_active"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_bom_tenant_approved_effective"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_bom_tenant_active_not_deleted"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_bom_components_tenant_bom_sequence"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_bom_components_tenant_component_required"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_bom_components_tenant_phantom_required"`,
    );

    // ========================================
    // 3. DROP ROUTING INDEXES
    // ========================================

    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_routing_tenant_product_status_active"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_routing_tenant_product_effective"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_routing_tenant_default_active"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_routing_tenant_yield_cost"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_routing_tenant_time_analysis"`,
    );

    // ========================================
    // 4. DROP PRODUCTION STEP INDEXES
    // ========================================

    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_production_steps_tenant_routing_sequence"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_production_steps_tenant_workcenter_type"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_production_steps_tenant_critical_bottleneck"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_production_steps_tenant_type_status"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_production_steps_tenant_routing_type_sequence"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_production_steps_tenant_approval_required"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_production_steps_tenant_setup_time"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_production_steps_tenant_run_time"`,
    );

    // ========================================
    // 5. DROP WORK INSTRUCTION INDEXES
    // ========================================

    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_work_instructions_tenant_step_type_active"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_work_instructions_tenant_status_priority"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_work_instructions_tenant_type_status_effective"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_work_instructions_tenant_approval_workflow"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_work_instructions_tenant_skill_level"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_work_instructions_tenant_language_active"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_work_instructions_tenant_usage"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_work_instructions_title_gin"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_work_instructions_content_gin"`,
    );

    // ========================================
    // 6. DROP PROCESS PARAMETER INDEXES
    // ========================================

    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_process_parameters_tenant_step_category"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_process_parameters_tenant_required_priority"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_process_parameters_tenant_critical_control"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_process_parameters_tenant_monitoring"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_process_parameters_tenant_validation"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_process_parameters_tenant_data_source"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_process_parameters_tenant_value_range"`,
    );

    // ========================================
    // 7. DROP PRODUCT REVISION INDEXES
    // ========================================

    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_product_revisions_tenant_product_status"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_product_revisions_tenant_product_active"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_product_revisions_tenant_type_created"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_product_revisions_tenant_effective_dates"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_product_revisions_tenant_approval_workflow"`,
    );

    // ========================================
    // 8. DROP AUDIT INDEXES
    // ========================================

    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_products_tenant_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_products_tenant_updated_at"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_products_tenant_version"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_bom_tenant_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_bom_tenant_updated_at"`,
    );
    await queryRunner.query(`DROP INDEX  IF EXISTS "idx_bom_tenant_version"`);
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_routing_tenant_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_routing_tenant_updated_at"`,
    );
    await queryRunner.query(
      `DROP INDEX  IF EXISTS "idx_routing_tenant_version"`,
    );
  }
}
