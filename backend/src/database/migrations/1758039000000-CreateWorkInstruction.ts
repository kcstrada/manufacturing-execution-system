import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkInstruction1758039000000 implements MigrationInterface {
  name = 'CreateWorkInstruction1758039000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types for WorkInstruction
    await queryRunner.query(
      `CREATE TYPE "public"."work_instructions_type_enum" AS ENUM('setup', 'operation', 'quality', 'safety', 'maintenance', 'troubleshooting', 'changeover', 'cleaning')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."work_instructions_format_enum" AS ENUM('text', 'html', 'markdown', 'pdf', 'video', 'image', 'interactive')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."work_instructions_status_enum" AS ENUM('draft', 'under_review', 'approved', 'obsolete', 'archived')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."work_instructions_skill_level_enum" AS ENUM('beginner', 'intermediate', 'advanced', 'expert')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."work_instructions_priority_enum" AS ENUM('critical', 'high', 'medium', 'low', 'optional')`,
    );

    // Create work_instructions table
    await queryRunner.query(`CREATE TABLE "work_instructions" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "deleted_at" TIMESTAMP WITH TIME ZONE,
            "version" integer NOT NULL DEFAULT '1',
            "is_active" boolean NOT NULL DEFAULT true,
            "metadata" jsonb,
            "tenant_id" uuid NOT NULL,
            "instruction_code" character varying(50) NOT NULL,
            "title" character varying(255) NOT NULL,
            "summary" text,
            "type" "public"."work_instructions_type_enum" NOT NULL DEFAULT 'operation',
            "format" "public"."work_instructions_format_enum" NOT NULL DEFAULT 'text',
            "status" "public"."work_instructions_status_enum" NOT NULL DEFAULT 'draft',
            "priority" "public"."work_instructions_priority_enum" NOT NULL DEFAULT 'medium',
            "sequence_number" integer NOT NULL DEFAULT '0',
            "content" text,
            "steps" jsonb,
            "media" jsonb,
            "prerequisites" jsonb,
            "safety_info" jsonb,
            "quality_checkpoints" jsonb,
            "troubleshooting" jsonb,
            "estimated_duration" integer,
            "setup_time" integer,
            "cleanup_time" integer,
            "required_skill_level" "public"."work_instructions_skill_level_enum" NOT NULL DEFAULT 'intermediate',
            "required_operators" integer NOT NULL DEFAULT '1',
            "required_certifications" jsonb,
            "language" character varying(10) NOT NULL DEFAULT 'en',
            "translations" jsonb,
            "warnings" jsonb,
            "interactive_elements" jsonb,
            "references" jsonb,
            "training_info" jsonb,
            "version_number" character varying(20) NOT NULL DEFAULT '1.0.0',
            "change_description" text,
            "previous_version_id" uuid,
            "effective_date" TIMESTAMP,
            "expiry_date" TIMESTAMP,
            "author_id" uuid,
            "author_name" character varying(255),
            "reviewed_by" uuid,
            "reviewed_at" TIMESTAMP,
            "review_comments" text,
            "approved_by" uuid,
            "approved_at" TIMESTAMP,
            "approval_notes" text,
            "view_count" integer NOT NULL DEFAULT '0',
            "last_viewed_at" TIMESTAMP,
            "last_viewed_by" uuid,
            "usage_statistics" jsonb,
            "feedback" jsonb,
            "access_control" jsonb,
            "tags" jsonb,
            "search_vector" tsvector,
            "requires_sign_off" boolean NOT NULL DEFAULT false,
            "requires_witnessing" boolean NOT NULL DEFAULT false,
            "sign_offs" jsonb,
            "audit_trail" jsonb,
            "production_step_id" uuid,
            "product_id" uuid,
            "work_center_id" uuid,
            "equipment_id" character varying(100),
            "equipment_type" character varying(100),
            "equipment_model" character varying(100),
            "custom_fields" jsonb,
            "notes" text,
            CONSTRAINT "uq_work_instructions_tenant_id_instruction_code" UNIQUE ("tenant_id", "instruction_code"),
            CONSTRAINT "pk_work_instructions_id" PRIMARY KEY ("id")
        )`);

    // Create indexes for performance
    await queryRunner.query(
      `CREATE INDEX "idx_work_instructions_tenant_id_instruction_code" ON "work_instructions" ("tenant_id", "instruction_code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_work_instructions_tenant_id_production_step_id" ON "work_instructions" ("tenant_id", "production_step_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_work_instructions_tenant_id_type" ON "work_instructions" ("tenant_id", "type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_work_instructions_tenant_id_status" ON "work_instructions" ("tenant_id", "status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_work_instructions_tenant_id_is_active" ON "work_instructions" ("tenant_id", "is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_work_instructions_tenant_id_priority" ON "work_instructions" ("tenant_id", "priority")`,
    );

    // Create GIN index for JSONB search
    await queryRunner.query(
      `CREATE INDEX "idx_work_instructions_tags_gin" ON "work_instructions" USING gin("tags")`,
    );

    // Create GIN index for full-text search
    await queryRunner.query(
      `CREATE INDEX "idx_work_instructions_search_vector_gin" ON "work_instructions" USING gin("search_vector")`,
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "work_instructions" ADD CONSTRAINT "fk_work_instructions_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_instructions" ADD CONSTRAINT "fk_work_instructions_production_step_id" FOREIGN KEY ("production_step_id") REFERENCES "production_steps"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_instructions" ADD CONSTRAINT "fk_work_instructions_product_id" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_instructions" ADD CONSTRAINT "fk_work_instructions_work_center_id" FOREIGN KEY ("work_center_id") REFERENCES "work_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_instructions" ADD CONSTRAINT "fk_work_instructions_author_id" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_instructions" ADD CONSTRAINT "fk_work_instructions_reviewed_by" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_instructions" ADD CONSTRAINT "fk_work_instructions_approved_by" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_instructions" ADD CONSTRAINT "fk_work_instructions_last_viewed_by" FOREIGN KEY ("last_viewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_instructions" ADD CONSTRAINT "fk_work_instructions_previous_version_id" FOREIGN KEY ("previous_version_id") REFERENCES "work_instructions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );

    // Create trigger function for updating search vector
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_work_instruction_search_vector()
            RETURNS trigger AS $$
            BEGIN
                NEW.search_vector :=
                    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
                    setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B') ||
                    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'C') ||
                    setweight(to_tsvector('english', coalesce(NEW.instruction_code, '')), 'D');
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

    // Create trigger for updating search vector
    await queryRunner.query(`
            CREATE TRIGGER update_work_instruction_search_vector_trigger
            BEFORE INSERT OR UPDATE OF title, summary, content, instruction_code
            ON work_instructions
            FOR EACH ROW
            EXECUTE FUNCTION update_work_instruction_search_vector();
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger and function
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_work_instruction_search_vector_trigger ON work_instructions`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_work_instruction_search_vector()`,
    );

    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "work_instructions" DROP CONSTRAINT "fk_work_instructions_previous_version_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_instructions" DROP CONSTRAINT "fk_work_instructions_last_viewed_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_instructions" DROP CONSTRAINT "fk_work_instructions_approved_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_instructions" DROP CONSTRAINT "fk_work_instructions_reviewed_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_instructions" DROP CONSTRAINT "fk_work_instructions_author_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_instructions" DROP CONSTRAINT "fk_work_instructions_work_center_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_instructions" DROP CONSTRAINT "fk_work_instructions_product_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_instructions" DROP CONSTRAINT "fk_work_instructions_production_step_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_instructions" DROP CONSTRAINT "fk_work_instructions_tenant_id"`,
    );

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_instructions_search_vector_gin"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_instructions_tags_gin"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_instructions_tenant_id_priority"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_instructions_tenant_id_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_instructions_tenant_id_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_instructions_tenant_id_type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_instructions_tenant_id_production_step_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_instructions_tenant_id_instruction_code"`,
    );

    // Drop table
    await queryRunner.query(`DROP TABLE "work_instructions"`);

    // Drop enum types
    await queryRunner.query(
      `DROP TYPE "public"."work_instructions_priority_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."work_instructions_skill_level_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."work_instructions_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."work_instructions_format_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."work_instructions_type_enum"`);
  }
}
