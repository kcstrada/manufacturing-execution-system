import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductTemplate1758037136427 implements MigrationInterface {
    name = 'CreateProductTemplate1758037136427'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types for ProductTemplate
        await queryRunner.query(`CREATE TYPE "public"."product_templates_product_type_enum" AS ENUM('raw_material', 'component', 'finished_good', 'consumable')`);
        await queryRunner.query(`CREATE TYPE "public"."product_templates_status_enum" AS ENUM('active', 'inactive', 'draft')`);

        // Create product_templates table
        await queryRunner.query(`CREATE TABLE "product_templates" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP WITH TIME ZONE,
            "version" integer NOT NULL DEFAULT '1',
            "is_active" boolean NOT NULL DEFAULT true,
            "metadata" jsonb,
            "tenant_id" uuid NOT NULL,
            "template_code" character varying(50) NOT NULL,
            "template_name" character varying(255) NOT NULL,
            "template_description" text,
            "name_pattern" character varying(255),
            "sku_pattern" character varying(100),
            "sku_prefix" character varying(50),
            "sku_suffix" character varying(50),
            "last_sequence_number" integer NOT NULL DEFAULT '0',
            "default_description" text,
            "product_type" "public"."product_templates_product_type_enum",
            "default_dimensions" jsonb,
            "default_specifications" jsonb,
            "default_cost" numeric(15,2),
            "default_price" numeric(15,2),
            "default_lead_time_days" integer,
            "default_min_stock_level" numeric(15,3),
            "default_max_stock_level" numeric(15,3),
            "default_reorder_point" numeric(15,3),
            "default_reorder_quantity" numeric(15,3),
            "default_weight" numeric(10,3),
            "default_is_manufacturable" boolean NOT NULL DEFAULT true,
            "default_is_purchasable" boolean NOT NULL DEFAULT false,
            "barcode_pattern" character varying(100),
            "template_rules" jsonb,
            "custom_fields" jsonb,
            "status" "public"."product_templates_status_enum" NOT NULL DEFAULT 'active',
            "usage_count" integer NOT NULL DEFAULT '0',
            "last_used_at" TIMESTAMP,
            "default_bom_template_id" uuid,
            "default_routing_template_id" uuid,
            "default_category_id" uuid,
            "default_unit_of_measure_id" uuid,
            CONSTRAINT "uq_product_templates_tenant_id_template_code" UNIQUE ("tenant_id", "template_code"),
            CONSTRAINT "pk_product_templates_id" PRIMARY KEY ("id")
        )`);

        // Create indexes for performance
        await queryRunner.query(`CREATE INDEX "idx_product_templates_tenant_id" ON "product_templates" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX "idx_product_templates_tenant_id_product_type" ON "product_templates" ("tenant_id", "product_type")`);
        await queryRunner.query(`CREATE INDEX "idx_product_templates_tenant_id_is_active" ON "product_templates" ("tenant_id", "is_active")`);
        await queryRunner.query(`CREATE INDEX "idx_product_templates_tenant_id_template_name" ON "product_templates" ("tenant_id", "template_name")`);
        await queryRunner.query(`CREATE INDEX "idx_product_templates_tenant_id_template_code" ON "product_templates" ("tenant_id", "template_code")`);

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "product_templates" ADD CONSTRAINT "fk_product_templates_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_templates" ADD CONSTRAINT "fk_product_templates_default_category_id" FOREIGN KEY ("default_category_id") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_templates" ADD CONSTRAINT "fk_product_templates_default_unit_of_measure_id" FOREIGN KEY ("default_unit_of_measure_id") REFERENCES "units_of_measure"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "product_templates" DROP CONSTRAINT "fk_product_templates_default_unit_of_measure_id"`);
        await queryRunner.query(`ALTER TABLE "product_templates" DROP CONSTRAINT "fk_product_templates_default_category_id"`);
        await queryRunner.query(`ALTER TABLE "product_templates" DROP CONSTRAINT "fk_product_templates_tenant_id"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."idx_product_templates_tenant_id_template_code"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_templates_tenant_id_template_name"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_templates_tenant_id_is_active"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_templates_tenant_id_product_type"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_templates_tenant_id"`);

        // Drop table
        await queryRunner.query(`DROP TABLE "product_templates"`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE "public"."product_templates_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."product_templates_product_type_enum"`);
    }
}