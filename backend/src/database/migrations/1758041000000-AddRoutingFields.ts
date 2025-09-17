import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoutingFields1758041000000 implements MigrationInterface {
  name = 'AddRoutingFields1758041000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new fields to routings table
    await queryRunner.query(
      `ALTER TABLE "routings" ADD "is_default" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "routings" ADD "expected_yield" numeric(5,2) NOT NULL DEFAULT '100'`,
    );
    await queryRunner.query(
      `ALTER TABLE "routings" ADD "alternate_routes" jsonb`,
    );

    // Create index for isDefault to ensure only one default routing per product
    await queryRunner.query(
      `CREATE INDEX "idx_routings_tenant_id_product_id_is_default" ON "routings" ("tenant_id", "product_id", "is_default")`,
    );

    // Create partial unique index to ensure only one default routing per product
    await queryRunner.query(`
            CREATE UNIQUE INDEX "uq_routings_default_per_product" 
            ON "routings" ("tenant_id", "product_id") 
            WHERE "is_default" = true AND "deleted_at" IS NULL
        `);

    // Create index for expected_yield for performance queries
    await queryRunner.query(
      `CREATE INDEX "idx_routings_expected_yield" ON "routings" ("expected_yield")`,
    );

    // Create GIN index for alternate_routes JSONB search
    await queryRunner.query(
      `CREATE INDEX "idx_routings_alternate_routes_gin" ON "routings" USING gin("alternate_routes") WHERE "alternate_routes" IS NOT NULL`,
    );

    // Add check constraint for expected_yield
    await queryRunner.query(`
            ALTER TABLE "routings" 
            ADD CONSTRAINT "chk_routings_expected_yield" 
            CHECK ("expected_yield" >= 0 AND "expected_yield" <= 100)
        `);

    // Create function to validate only one default routing
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION validate_single_default_routing()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.is_default = true THEN
                    -- Set all other routings for this product to non-default
                    UPDATE routings
                    SET is_default = false,
                        updated_at = NOW()
                    WHERE tenant_id = NEW.tenant_id
                    AND product_id = NEW.product_id
                    AND id != NEW.id
                    AND deleted_at IS NULL;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

    await queryRunner.query(`
            CREATE TRIGGER ensure_single_default_routing_trigger
            BEFORE INSERT OR UPDATE OF is_default
            ON routings
            FOR EACH ROW
            WHEN (NEW.is_default = true)
            EXECUTE FUNCTION validate_single_default_routing();
        `);

    // Create function to calculate cumulative yield through routing steps
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION calculate_routing_cumulative_yield(routing_id UUID)
            RETURNS NUMERIC AS $$
            DECLARE
                cumulative_yield NUMERIC(5,2) := 100;
                step_yield NUMERIC(5,2);
            BEGIN
                -- Calculate cumulative yield by multiplying all step yields
                FOR step_yield IN 
                    SELECT yield_percentage 
                    FROM production_steps 
                    WHERE routing_id = routing_id 
                    AND deleted_at IS NULL
                    ORDER BY sequence_number
                LOOP
                    cumulative_yield := cumulative_yield * (step_yield / 100);
                END LOOP;
                
                RETURN cumulative_yield;
            END;
            $$ LANGUAGE plpgsql;
        `);

    // Create function to track alternate route usage
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION track_alternate_route_usage(
                p_routing_id UUID,
                p_alternate_routing_id TEXT
            )
            RETURNS VOID AS $$
            DECLARE
                current_routes jsonb;
                updated_routes jsonb := '[]'::jsonb;
                route jsonb;
                i INTEGER;
            BEGIN
                -- Get current alternate routes
                SELECT alternate_routes INTO current_routes
                FROM routings
                WHERE id = p_routing_id;
                
                IF current_routes IS NOT NULL THEN
                    -- Update usage count and last used date for the specific alternate
                    FOR i IN 0..jsonb_array_length(current_routes) - 1
                    LOOP
                        route := current_routes->i;
                        
                        IF route->>'alternateRoutingId' = p_alternate_routing_id THEN
                            route := route || 
                                jsonb_build_object(
                                    'lastUsedDate', NOW(),
                                    'usageCount', COALESCE((route->>'usageCount')::INTEGER, 0) + 1
                                );
                        END IF;
                        
                        updated_routes := updated_routes || route;
                    END LOOP;
                    
                    -- Update the routing record
                    UPDATE routings
                    SET alternate_routes = updated_routes,
                        updated_at = NOW()
                    WHERE id = p_routing_id;
                END IF;
            END;
            $$ LANGUAGE plpgsql;
        `);

    // Create view for routing performance analysis
    await queryRunner.query(`
            CREATE OR REPLACE VIEW v_routing_performance AS
            SELECT 
                r.id,
                r.tenant_id,
                r.product_id,
                p.sku as product_sku,
                p.name as product_name,
                r.name as routing_name,
                r.is_default,
                r.expected_yield,
                r.total_setup_time_minutes,
                r.total_run_time_per_unit_minutes,
                r.total_cost_per_unit,
                r.status,
                COUNT(ps.id) as step_count,
                SUM(ps.setup_time) as total_setup_time,
                SUM(ps.run_time) as total_run_time,
                AVG(ps.yield_percentage) as average_step_yield,
                jsonb_array_length(COALESCE(r.alternate_routes, '[]'::jsonb)) as alternate_count
            FROM routings r
            LEFT JOIN products p ON r.product_id = p.id
            LEFT JOIN production_steps ps ON r.id = ps.routing_id AND ps.deleted_at IS NULL
            WHERE r.deleted_at IS NULL
            GROUP BY 
                r.id, r.tenant_id, r.product_id, p.sku, p.name, 
                r.name, r.is_default, r.expected_yield,
                r.total_setup_time_minutes, r.total_run_time_per_unit_minutes,
                r.total_cost_per_unit, r.status, r.alternate_routes;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop view
    await queryRunner.query(`DROP VIEW IF EXISTS v_routing_performance`);

    // Drop functions
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS track_alternate_route_usage(UUID, TEXT)`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS calculate_routing_cumulative_yield(UUID)`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS validate_single_default_routing()`,
    );

    // Drop trigger
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS ensure_single_default_routing_trigger ON routings`,
    );

    // Drop constraint
    await queryRunner.query(
      `ALTER TABLE "routings" DROP CONSTRAINT IF EXISTS "chk_routings_expected_yield"`,
    );

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_routings_alternate_routes_gin"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_routings_expected_yield"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_routings_default_per_product"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_routings_tenant_id_product_id_is_default"`,
    );

    // Remove fields from routings
    await queryRunner.query(
      `ALTER TABLE "routings" DROP COLUMN "alternate_routes"`,
    );
    await queryRunner.query(
      `ALTER TABLE "routings" DROP COLUMN "expected_yield"`,
    );
    await queryRunner.query(`ALTER TABLE "routings" DROP COLUMN "is_default"`);
  }
}
