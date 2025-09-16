import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductRevision1758037500000 implements MigrationInterface {
    name = 'CreateProductRevision1758037500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types for ProductRevision
        await queryRunner.query(`CREATE TYPE "public"."product_revisions_revision_type_enum" AS ENUM('create', 'update', 'major_change', 'minor_change', 'bom_change', 'routing_change', 'price_change', 'specification_change', 'status_change', 'rollback')`);
        await queryRunner.query(`CREATE TYPE "public"."product_revisions_revision_status_enum" AS ENUM('draft', 'pending_approval', 'approved', 'rejected', 'active', 'superseded', 'archived')`);
        await queryRunner.query(`CREATE TYPE "public"."product_revisions_type_enum" AS ENUM('raw_material', 'component', 'finished_good', 'consumable')`);

        // Create product_revisions table
        await queryRunner.query(`CREATE TABLE "product_revisions" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP WITH TIME ZONE,
            "version" integer NOT NULL DEFAULT '1',
            "is_active" boolean NOT NULL DEFAULT true,
            "metadata" jsonb,
            "tenant_id" uuid NOT NULL,
            "product_id" uuid NOT NULL,
            "revision_number" integer NOT NULL,
            "revision_code" character varying(20) NOT NULL,
            "revision_type" "public"."product_revisions_revision_type_enum" NOT NULL DEFAULT 'update',
            "status" "public"."product_revisions_revision_status_enum" NOT NULL DEFAULT 'draft',
            "change_description" text,
            "change_reason" text,
            "sku" character varying(100) NOT NULL,
            "name" character varying(255) NOT NULL,
            "description" text,
            "type" "public"."product_revisions_type_enum" NOT NULL,
            "dimensions" jsonb,
            "specifications" jsonb,
            "weight" numeric(10,3),
            "cost" numeric(15,2),
            "price" numeric(15,2),
            "lead_time_days" integer,
            "min_stock_level" numeric(15,3),
            "max_stock_level" numeric(15,3),
            "reorder_point" numeric(15,3),
            "reorder_quantity" numeric(15,3),
            "is_manufacturable" boolean NOT NULL DEFAULT true,
            "is_purchasable" boolean NOT NULL DEFAULT false,
            "barcode" character varying(100),
            "bom_id" uuid,
            "routing_id" uuid,
            "category_id" uuid,
            "unit_of_measure_id" uuid NOT NULL,
            "changed_fields" jsonb,
            "bom_snapshot" jsonb,
            "routing_snapshot" jsonb,
            "created_by" uuid,
            "approved_by" uuid,
            "approved_at" TIMESTAMP,
            "approval_notes" text,
            "rejected_by" uuid,
            "rejected_at" TIMESTAMP,
            "rejection_reason" text,
            "activated_at" TIMESTAMP,
            "deactivated_at" TIMESTAMP,
            "superseded_by_revision_id" uuid,
            "eco_number" character varying(100),
            "eco_reference" character varying(100),
            "attachments" jsonb,
            "compliance_data" jsonb,
            "quality_specs" jsonb,
            "impact_analysis" jsonb,
            "rollback_from_revision_id" uuid,
            "rollback_reason" text,
            "effective_from" date,
            "effective_to" date,
            "custom_fields" jsonb,
            "notes" text,
            "is_current_revision" boolean NOT NULL DEFAULT false,
            "is_effective" boolean NOT NULL DEFAULT false,
            CONSTRAINT "pk_product_revisions_id" PRIMARY KEY ("id")
        )`);

        // Create indexes for performance
        await queryRunner.query(`CREATE INDEX "idx_product_revisions_tenant_id_product_id_revision_number" ON "product_revisions" ("tenant_id", "product_id", "revision_number")`);
        await queryRunner.query(`CREATE INDEX "idx_product_revisions_tenant_id_product_id_status" ON "product_revisions" ("tenant_id", "product_id", "status")`);
        await queryRunner.query(`CREATE INDEX "idx_product_revisions_tenant_id_product_id_created_at" ON "product_revisions" ("tenant_id", "product_id", "created_at")`);
        await queryRunner.query(`CREATE INDEX "idx_product_revisions_tenant_id_revision_type" ON "product_revisions" ("tenant_id", "revision_type")`);
        await queryRunner.query(`CREATE INDEX "idx_product_revisions_tenant_id_is_active" ON "product_revisions" ("tenant_id", "is_active")`);

        // Add columns to products table for revision tracking
        await queryRunner.query(`ALTER TABLE "products" ADD "current_revision_number" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "products" ADD "current_revision_id" uuid`);

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "product_revisions" ADD CONSTRAINT "fk_product_revisions_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_revisions" ADD CONSTRAINT "fk_product_revisions_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_revisions" ADD CONSTRAINT "fk_product_revisions_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_revisions" ADD CONSTRAINT "fk_product_revisions_approved_by" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_revisions" ADD CONSTRAINT "fk_product_revisions_rejected_by" FOREIGN KEY ("rejected_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_revisions" ADD CONSTRAINT "fk_product_revisions_superseded_by_revision_id" FOREIGN KEY ("superseded_by_revision_id") REFERENCES "product_revisions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_revisions" ADD CONSTRAINT "fk_product_revisions_rollback_from_revision_id" FOREIGN KEY ("rollback_from_revision_id") REFERENCES "product_revisions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "fk_products_current_revision_id" FOREIGN KEY ("current_revision_id") REFERENCES "product_revisions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "fk_products_current_revision_id"`);
        await queryRunner.query(`ALTER TABLE "product_revisions" DROP CONSTRAINT "fk_product_revisions_rollback_from_revision_id"`);
        await queryRunner.query(`ALTER TABLE "product_revisions" DROP CONSTRAINT "fk_product_revisions_superseded_by_revision_id"`);
        await queryRunner.query(`ALTER TABLE "product_revisions" DROP CONSTRAINT "fk_product_revisions_rejected_by"`);
        await queryRunner.query(`ALTER TABLE "product_revisions" DROP CONSTRAINT "fk_product_revisions_approved_by"`);
        await queryRunner.query(`ALTER TABLE "product_revisions" DROP CONSTRAINT "fk_product_revisions_created_by"`);
        await queryRunner.query(`ALTER TABLE "product_revisions" DROP CONSTRAINT "fk_product_revisions_product_id"`);
        await queryRunner.query(`ALTER TABLE "product_revisions" DROP CONSTRAINT "fk_product_revisions_tenant_id"`);

        // Drop columns from products table
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "current_revision_id"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "current_revision_number"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."idx_product_revisions_tenant_id_is_active"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_revisions_tenant_id_revision_type"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_revisions_tenant_id_product_id_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_revisions_tenant_id_product_id_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_revisions_tenant_id_product_id_revision_number"`);

        // Drop table
        await queryRunner.query(`DROP TABLE "product_revisions"`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE "public"."product_revisions_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."product_revisions_revision_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."product_revisions_revision_type_enum"`);
    }
}