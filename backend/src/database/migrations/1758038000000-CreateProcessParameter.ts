import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProcessParameter1758038000000 implements MigrationInterface {
    name = 'CreateProcessParameter1758038000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types for ProcessParameter
        await queryRunner.query(`CREATE TYPE "public"."process_parameters_type_enum" AS ENUM('numeric', 'text', 'boolean', 'date', 'time', 'datetime', 'select', 'multiselect', 'range', 'file', 'json')`);
        await queryRunner.query(`CREATE TYPE "public"."process_parameters_category_enum" AS ENUM('machine_setting', 'process_control', 'quality_spec', 'safety_requirement', 'environmental', 'material_spec', 'tool_setting', 'inspection', 'documentation')`);
        await queryRunner.query(`CREATE TYPE "public"."process_parameters_frequency_enum" AS ENUM('once_per_batch', 'once_per_shift', 'hourly', 'every_piece', 'random_sample', 'start_of_run', 'end_of_run', 'continuous')`);
        await queryRunner.query(`CREATE TYPE "public"."process_parameters_priority_enum" AS ENUM('critical', 'high', 'medium', 'low', 'optional')`);

        // Create process_parameters table
        await queryRunner.query(`CREATE TABLE "process_parameters" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP WITH TIME ZONE,
            "version" integer NOT NULL DEFAULT '1',
            "is_active" boolean NOT NULL DEFAULT true,
            "metadata" jsonb,
            "tenant_id" uuid NOT NULL,
            "parameter_code" character varying(50) NOT NULL,
            "name" character varying(255) NOT NULL,
            "description" text,
            "type" "public"."process_parameters_type_enum" NOT NULL DEFAULT 'numeric',
            "category" "public"."process_parameters_category_enum" NOT NULL DEFAULT 'process_control',
            "frequency" "public"."process_parameters_frequency_enum" NOT NULL DEFAULT 'once_per_batch',
            "priority" "public"."process_parameters_priority_enum" NOT NULL DEFAULT 'medium',
            "value_constraints" jsonb,
            "unit" character varying(50),
            "default_value" jsonb,
            "target_value" jsonb,
            "nominal_value" numeric(15,6),
            "min_value" numeric(15,6),
            "max_value" numeric(15,6),
            "tolerance_plus" numeric(15,6),
            "tolerance_minus" numeric(15,6),
            "upper_control_limit" numeric(15,6),
            "lower_control_limit" numeric(15,6),
            "upper_warning_limit" numeric(15,6),
            "lower_warning_limit" numeric(15,6),
            "is_required" boolean NOT NULL DEFAULT true,
            "is_control_parameter" boolean NOT NULL DEFAULT false,
            "is_critical_to_quality" boolean NOT NULL DEFAULT false,
            "requires_validation" boolean NOT NULL DEFAULT false,
            "requires_approval" boolean NOT NULL DEFAULT false,
            "is_monitored" boolean NOT NULL DEFAULT true,
            "is_calculated" boolean NOT NULL DEFAULT false,
            "calculation_formula" text,
            "calculation_dependencies" jsonb,
            "display_order" integer NOT NULL DEFAULT '0',
            "display_group" character varying(100),
            "display_conditions" jsonb,
            "instructions" text,
            "help_text" text,
            "warning_messages" jsonb,
            "validation_rules" jsonb,
            "data_source" character varying(100),
            "sensor_id" character varying(255),
            "plc_tag" character varying(255),
            "sampling_rate" integer,
            "retention_days" integer,
            "alarm_config" jsonb,
            "include_in_report" boolean NOT NULL DEFAULT false,
            "include_in_certificate" boolean NOT NULL DEFAULT false,
            "report_label" character varying(100),
            "compliance_standards" jsonb,
            "regulatory_requirements" jsonb,
            "track_history" boolean NOT NULL DEFAULT true,
            "requires_signature" boolean NOT NULL DEFAULT false,
            "change_control" jsonb,
            "production_step_id" uuid NOT NULL,
            "product_id" uuid,
            "work_center_id" uuid,
            "equipment_id" character varying(100),
            "equipment_type" character varying(100),
            "version_number" integer NOT NULL DEFAULT '1',
            "effective_from" TIMESTAMP,
            "effective_to" TIMESTAMP,
            "custom_fields" jsonb,
            "notes" text,
            CONSTRAINT "uq_process_parameters_tenant_id_parameter_code" UNIQUE ("tenant_id", "parameter_code"),
            CONSTRAINT "pk_process_parameters_id" PRIMARY KEY ("id")
        )`);

        // Create indexes for performance
        await queryRunner.query(`CREATE INDEX "idx_process_parameters_tenant_id_parameter_code" ON "process_parameters" ("tenant_id", "parameter_code")`);
        await queryRunner.query(`CREATE INDEX "idx_process_parameters_tenant_id_production_step_id" ON "process_parameters" ("tenant_id", "production_step_id")`);
        await queryRunner.query(`CREATE INDEX "idx_process_parameters_tenant_id_category" ON "process_parameters" ("tenant_id", "category")`);
        await queryRunner.query(`CREATE INDEX "idx_process_parameters_tenant_id_is_required" ON "process_parameters" ("tenant_id", "is_required")`);
        await queryRunner.query(`CREATE INDEX "idx_process_parameters_tenant_id_priority" ON "process_parameters" ("tenant_id", "priority")`);

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "process_parameters" ADD CONSTRAINT "fk_process_parameters_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "process_parameters" ADD CONSTRAINT "fk_process_parameters_production_step_id" FOREIGN KEY ("production_step_id") REFERENCES "production_steps"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "process_parameters" ADD CONSTRAINT "fk_process_parameters_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "process_parameters" ADD CONSTRAINT "fk_process_parameters_work_center_id" FOREIGN KEY ("work_center_id") REFERENCES "work_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "process_parameters" DROP CONSTRAINT "fk_process_parameters_work_center_id"`);
        await queryRunner.query(`ALTER TABLE "process_parameters" DROP CONSTRAINT "fk_process_parameters_product_id"`);
        await queryRunner.query(`ALTER TABLE "process_parameters" DROP CONSTRAINT "fk_process_parameters_production_step_id"`);
        await queryRunner.query(`ALTER TABLE "process_parameters" DROP CONSTRAINT "fk_process_parameters_tenant_id"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."idx_process_parameters_tenant_id_priority"`);
        await queryRunner.query(`DROP INDEX "public"."idx_process_parameters_tenant_id_is_required"`);
        await queryRunner.query(`DROP INDEX "public"."idx_process_parameters_tenant_id_category"`);
        await queryRunner.query(`DROP INDEX "public"."idx_process_parameters_tenant_id_production_step_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_process_parameters_tenant_id_parameter_code"`);

        // Drop table
        await queryRunner.query(`DROP TABLE "process_parameters"`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE "public"."process_parameters_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."process_parameters_frequency_enum"`);
        await queryRunner.query(`DROP TYPE "public"."process_parameters_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."process_parameters_type_enum"`);
    }
}