import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTenantTables1757363559768 implements MigrationInterface {
    name = 'CreateTenantTables1757363559768'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "logo" character varying, "website" character varying, "subdomain" character varying, "custom_domain" character varying, "settings" jsonb, "billing" jsonb, "is_active" boolean NOT NULL DEFAULT true, "suspended_at" TIMESTAMP, "suspended_reason" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "expires_at" TIMESTAMP, "user_count" integer NOT NULL DEFAULT '0', "order_count" integer NOT NULL DEFAULT '0', "storage_used" integer NOT NULL DEFAULT '0', "last_activity_at" TIMESTAMP, CONSTRAINT "uq_tenants_slug" UNIQUE ("slug"), CONSTRAINT "pk_tenants_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_tenants_slug" ON "tenants" ("slug") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."idx_tenants_slug"`);
        await queryRunner.query(`DROP TABLE "tenants"`);
    }

}
