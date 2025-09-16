import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductManufacturingFields1758036169186 implements MigrationInterface {
    name = 'AddProductManufacturingFields1758036169186'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns to products table
        await queryRunner.query(`ALTER TABLE "products" ADD "is_manufacturable" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "products" ADD "is_purchasable" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "products" ADD "barcode" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "products" ADD "default_bom_id" uuid`);
        await queryRunner.query(`ALTER TABLE "products" ADD "default_routing_id" uuid`);

        // Create indexes for better query performance
        await queryRunner.query(`CREATE INDEX "idx_products_tenant_id_barcode" ON "products" ("tenant_id", "barcode")`);
        await queryRunner.query(`CREATE INDEX "idx_products_tenant_id_is_manufacturable" ON "products" ("tenant_id", "is_manufacturable")`);
        await queryRunner.query(`CREATE INDEX "idx_products_tenant_id_is_purchasable" ON "products" ("tenant_id", "is_purchasable")`);

        // Note: Foreign key constraints will be added after bill_of_materials and routings tables are created
        // await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "fk_products_default_bom_id" FOREIGN KEY ("default_bom_id") REFERENCES "bill_of_materials"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        // await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "fk_products_default_routing_id" FOREIGN KEY ("default_routing_id") REFERENCES "routings"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints (if they exist)
        // await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "fk_products_default_routing_id"`);
        // await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT IF EXISTS "fk_products_default_bom_id"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."idx_products_tenant_id_is_purchasable"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_tenant_id_is_manufacturable"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_tenant_id_barcode"`);

        // Drop columns
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "default_routing_id"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "default_bom_id"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "barcode"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "is_purchasable"`);
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "is_manufacturable"`);
    }
}