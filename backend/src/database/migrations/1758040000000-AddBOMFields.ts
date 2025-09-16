import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBOMFields1758040000000 implements MigrationInterface {
    name = 'AddBOMFields1758040000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new fields to bills_of_materials table
        await queryRunner.query(`ALTER TABLE "bills_of_materials" ADD "is_default" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "bills_of_materials" ADD "total_cost" numeric(15,2)`);
        await queryRunner.query(`ALTER TABLE "bills_of_materials" ADD "alternate_components" jsonb`);

        // Add new fields to bom_components table
        await queryRunner.query(`ALTER TABLE "bom_components" ADD "unit_cost" numeric(15,4)`);
        await queryRunner.query(`ALTER TABLE "bom_components" ADD "extended_cost" numeric(15,4)`);
        await queryRunner.query(`ALTER TABLE "bom_components" ADD "is_alternate_allowed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "bom_components" ADD "supply_type" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "bom_components" ADD "lead_time_days" integer`);

        // Create index for isDefault to ensure only one default BOM per product
        await queryRunner.query(`CREATE INDEX "idx_bills_of_materials_tenant_id_product_id_is_default" ON "bills_of_materials" ("tenant_id", "product_id", "is_default")`);
        
        // Create partial unique index to ensure only one default BOM per product
        await queryRunner.query(`
            CREATE UNIQUE INDEX "uq_bills_of_materials_default_per_product" 
            ON "bills_of_materials" ("tenant_id", "product_id") 
            WHERE "is_default" = true AND "deleted_at" IS NULL
        `);

        // Create index for cost queries
        await queryRunner.query(`CREATE INDEX "idx_bills_of_materials_total_cost" ON "bills_of_materials" ("total_cost") WHERE "total_cost" IS NOT NULL`);

        // Create GIN index for alternate_components JSONB search
        await queryRunner.query(`CREATE INDEX "idx_bills_of_materials_alternate_components_gin" ON "bills_of_materials" USING gin("alternate_components") WHERE "alternate_components" IS NOT NULL`);

        // Create index for supply_type on bom_components
        await queryRunner.query(`CREATE INDEX "idx_bom_components_supply_type" ON "bom_components" ("supply_type") WHERE "supply_type" IS NOT NULL`);

        // Create function to calculate BOM total cost
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION calculate_bom_total_cost(bom_id UUID)
            RETURNS NUMERIC AS $$
            DECLARE
                total NUMERIC(15,2) := 0;
            BEGIN
                SELECT COALESCE(SUM(
                    bc.quantity * (1 + bc.scrap_percentage / 100) * COALESCE(bc.unit_cost, 0)
                ), 0) INTO total
                FROM bom_components bc
                WHERE bc.bill_of_materials_id = bom_id
                AND bc.deleted_at IS NULL;
                
                RETURN total;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Create trigger to update total_cost when components change
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_bom_total_cost()
            RETURNS TRIGGER AS $$
            BEGIN
                IF TG_OP = 'DELETE' THEN
                    UPDATE bills_of_materials 
                    SET total_cost = calculate_bom_total_cost(OLD.bill_of_materials_id),
                        updated_at = NOW()
                    WHERE id = OLD.bill_of_materials_id;
                    RETURN OLD;
                ELSE
                    UPDATE bills_of_materials 
                    SET total_cost = calculate_bom_total_cost(NEW.bill_of_materials_id),
                        updated_at = NOW()
                    WHERE id = NEW.bill_of_materials_id;
                    RETURN NEW;
                END IF;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            CREATE TRIGGER update_bom_total_cost_trigger
            AFTER INSERT OR UPDATE OF quantity, scrap_percentage, unit_cost OR DELETE
            ON bom_components
            FOR EACH ROW
            EXECUTE FUNCTION update_bom_total_cost();
        `);

        // Create function to validate only one default BOM
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION validate_single_default_bom()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.is_default = true THEN
                    -- Set all other BOMs for this product to non-default
                    UPDATE bills_of_materials
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
            CREATE TRIGGER ensure_single_default_bom_trigger
            BEFORE INSERT OR UPDATE OF is_default
            ON bills_of_materials
            FOR EACH ROW
            WHEN (NEW.is_default = true)
            EXECUTE FUNCTION validate_single_default_bom();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop triggers
        await queryRunner.query(`DROP TRIGGER IF EXISTS ensure_single_default_bom_trigger ON bills_of_materials`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_bom_total_cost_trigger ON bom_components`);
        
        // Drop functions
        await queryRunner.query(`DROP FUNCTION IF EXISTS validate_single_default_bom()`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_bom_total_cost()`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS calculate_bom_total_cost(UUID)`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_bom_components_supply_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_bills_of_materials_alternate_components_gin"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_bills_of_materials_total_cost"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "uq_bills_of_materials_default_per_product"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_bills_of_materials_tenant_id_product_id_is_default"`);

        // Remove fields from bom_components
        await queryRunner.query(`ALTER TABLE "bom_components" DROP COLUMN "lead_time_days"`);
        await queryRunner.query(`ALTER TABLE "bom_components" DROP COLUMN "supply_type"`);
        await queryRunner.query(`ALTER TABLE "bom_components" DROP COLUMN "is_alternate_allowed"`);
        await queryRunner.query(`ALTER TABLE "bom_components" DROP COLUMN "extended_cost"`);
        await queryRunner.query(`ALTER TABLE "bom_components" DROP COLUMN "unit_cost"`);

        // Remove fields from bills_of_materials
        await queryRunner.query(`ALTER TABLE "bills_of_materials" DROP COLUMN "alternate_components"`);
        await queryRunner.query(`ALTER TABLE "bills_of_materials" DROP COLUMN "total_cost"`);
        await queryRunner.query(`ALTER TABLE "bills_of_materials" DROP COLUMN "is_default"`);
    }
}
