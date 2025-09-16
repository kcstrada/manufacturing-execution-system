import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductionStepFields1758042000000 implements MigrationInterface {
    name = 'AddProductionStepFields1758042000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new fields to production_steps table
        await queryRunner.query(`ALTER TABLE "production_steps" ADD "validation_rules" jsonb`);
        await queryRunner.query(`ALTER TABLE "production_steps" ADD "media_files" jsonb`);
        await queryRunner.query(`ALTER TABLE "production_steps" ADD "alternate_work_center_id" uuid`);

        // Create GIN indexes for JSONB search
        await queryRunner.query(`CREATE INDEX "idx_production_steps_validation_rules_gin" ON "production_steps" USING gin("validation_rules") WHERE "validation_rules" IS NOT NULL`);
        await queryRunner.query(`CREATE INDEX "idx_production_steps_media_files_gin" ON "production_steps" USING gin("media_files") WHERE "media_files" IS NOT NULL`);

        // Create index for alternate work center
        await queryRunner.query(`CREATE INDEX "idx_production_steps_tenant_id_alternate_work_center_id" ON "production_steps" ("tenant_id", "alternate_work_center_id") WHERE "alternate_work_center_id" IS NOT NULL`);

        // Add foreign key constraint for alternate work center
        await queryRunner.query(`ALTER TABLE "production_steps" ADD CONSTRAINT "fk_production_steps_alternate_work_center_id" FOREIGN KEY ("alternate_work_center_id") REFERENCES "work_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        // Create function to validate step parameters
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION validate_step_parameters(
                p_step_id UUID,
                p_parameter_name TEXT,
                p_value NUMERIC
            )
            RETURNS TABLE(
                is_valid BOOLEAN,
                error_count INTEGER,
                errors JSONB
            ) AS $$
            DECLARE
                v_rules JSONB;
                v_rule JSONB;
                v_errors JSONB := '[]'::JSONB;
                v_is_valid BOOLEAN := true;
                i INTEGER;
            BEGIN
                -- Get validation rules for the step
                SELECT validation_rules INTO v_rules
                FROM production_steps
                WHERE id = p_step_id;
                
                IF v_rules IS NOT NULL THEN
                    -- Check each rule
                    FOR i IN 0..jsonb_array_length(v_rules) - 1
                    LOOP
                        v_rule := v_rules->i;
                        
                        -- Only check active rules for this parameter
                        IF (v_rule->>'isActive')::BOOLEAN = true AND 
                           v_rule->>'parameter' = p_parameter_name THEN
                            
                            -- Check based on rule type
                            IF v_rule->>'ruleType' = 'range' THEN
                                IF (v_rule->>'minValue' IS NOT NULL AND 
                                    p_value < (v_rule->>'minValue')::NUMERIC) OR
                                   (v_rule->>'maxValue' IS NOT NULL AND 
                                    p_value > (v_rule->>'maxValue')::NUMERIC) THEN
                                    
                                    v_is_valid := false;
                                    v_errors := v_errors || jsonb_build_object(
                                        'rule', v_rule->>'ruleName',
                                        'severity', v_rule->>'severity',
                                        'message', v_rule->>'errorMessage',
                                        'value', p_value
                                    );
                                END IF;
                            END IF;
                        END IF;
                    END LOOP;
                END IF;
                
                RETURN QUERY SELECT 
                    v_is_valid,
                    jsonb_array_length(v_errors),
                    v_errors;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Create function to track media file access
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION track_media_file_access(
                p_step_id UUID,
                p_file_id TEXT
            )
            RETURNS VOID AS $$
            DECLARE
                v_media_files JSONB;
                v_updated_files JSONB := '[]'::JSONB;
                v_file JSONB;
                i INTEGER;
            BEGIN
                -- Get current media files
                SELECT media_files INTO v_media_files
                FROM production_steps
                WHERE id = p_step_id;
                
                IF v_media_files IS NOT NULL THEN
                    -- Update access info for the specific file
                    FOR i IN 0..jsonb_array_length(v_media_files) - 1
                    LOOP
                        v_file := v_media_files->i;
                        
                        IF v_file->>'fileId' = p_file_id THEN
                            v_file := v_file || 
                                jsonb_build_object(
                                    'lastAccessedAt', NOW(),
                                    'accessCount', COALESCE((v_file->>'accessCount')::INTEGER, 0) + 1
                                );
                        END IF;
                        
                        v_updated_files := v_updated_files || v_file;
                    END LOOP;
                    
                    -- Update the step record
                    UPDATE production_steps
                    SET media_files = v_updated_files,
                        updated_at = NOW()
                    WHERE id = p_step_id;
                END IF;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Create view for steps with validation rules
        await queryRunner.query(`
            CREATE OR REPLACE VIEW v_production_steps_with_validations AS
            SELECT 
                ps.id,
                ps.tenant_id,
                ps.step_code,
                ps.name,
                ps.type,
                ps.status,
                ps.sequence_number,
                ps.routing_id,
                ps.work_center_id,
                ps.alternate_work_center_id,
                wc1.code as primary_work_center_code,
                wc1.name as primary_work_center_name,
                wc2.code as alternate_work_center_code,
                wc2.name as alternate_work_center_name,
                CASE 
                    WHEN ps.work_center_id IS NOT NULL THEN ps.work_center_id
                    ELSE ps.alternate_work_center_id
                END as preferred_work_center_id,
                jsonb_array_length(COALESCE(ps.validation_rules, '[]'::jsonb)) as validation_rule_count,
                jsonb_array_length(
                    COALESCE(
                        (SELECT jsonb_agg(rule) 
                         FROM jsonb_array_elements(ps.validation_rules) rule 
                         WHERE (rule->>'severity' = 'error' OR 
                                (rule->>'autoStop')::boolean = true)),
                        '[]'::jsonb
                    )
                ) as critical_rule_count,
                jsonb_array_length(COALESCE(ps.media_files, '[]'::jsonb)) as media_file_count,
                jsonb_array_length(
                    COALESCE(
                        (SELECT jsonb_agg(file) 
                         FROM jsonb_array_elements(ps.media_files) file 
                         WHERE (file->>'isRequired')::boolean = true),
                        '[]'::jsonb
                    )
                ) as required_file_count
            FROM production_steps ps
            LEFT JOIN work_centers wc1 ON ps.work_center_id = wc1.id
            LEFT JOIN work_centers wc2 ON ps.alternate_work_center_id = wc2.id
            WHERE ps.deleted_at IS NULL;
        `);

        // Create materialized view for media file statistics
        await queryRunner.query(`
            CREATE MATERIALIZED VIEW mv_media_file_statistics AS
            SELECT 
                ps.tenant_id,
                ps.routing_id,
                r.name as routing_name,
                COUNT(DISTINCT ps.id) as step_count,
                SUM(jsonb_array_length(COALESCE(ps.media_files, '[]'::jsonb))) as total_media_files,
                SUM(
                    (SELECT COUNT(*)
                     FROM jsonb_array_elements(COALESCE(ps.media_files, '[]'::jsonb)) f
                     WHERE f->>'fileType' = 'image')
                ) as image_count,
                SUM(
                    (SELECT COUNT(*)
                     FROM jsonb_array_elements(COALESCE(ps.media_files, '[]'::jsonb)) f
                     WHERE f->>'fileType' = 'video')
                ) as video_count,
                SUM(
                    (SELECT COUNT(*)
                     FROM jsonb_array_elements(COALESCE(ps.media_files, '[]'::jsonb)) f
                     WHERE f->>'fileType' = 'pdf')
                ) as pdf_count,
                SUM(
                    (SELECT COUNT(*)
                     FROM jsonb_array_elements(COALESCE(ps.media_files, '[]'::jsonb)) f
                     WHERE (f->>'isRequired')::boolean = true)
                ) as required_file_count,
                AVG(
                    (SELECT AVG((f->>'fileSize')::BIGINT)
                     FROM jsonb_array_elements(COALESCE(ps.media_files, '[]'::jsonb)) f)
                ) as avg_file_size,
                SUM(
                    (SELECT SUM((f->>'fileSize')::BIGINT)
                     FROM jsonb_array_elements(COALESCE(ps.media_files, '[]'::jsonb)) f)
                ) as total_storage_size
            FROM production_steps ps
            LEFT JOIN routings r ON ps.routing_id = r.id
            WHERE ps.deleted_at IS NULL
            GROUP BY ps.tenant_id, ps.routing_id, r.name;
        `);

        // Create index on materialized view
        await queryRunner.query(`CREATE INDEX idx_mv_media_file_statistics_tenant_routing ON mv_media_file_statistics(tenant_id, routing_id)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop materialized view and index
        await queryRunner.query(`DROP INDEX IF EXISTS idx_mv_media_file_statistics_tenant_routing`);
        await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS mv_media_file_statistics`);

        // Drop views
        await queryRunner.query(`DROP VIEW IF EXISTS v_production_steps_with_validations`);

        // Drop functions
        await queryRunner.query(`DROP FUNCTION IF EXISTS track_media_file_access(UUID, TEXT)`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS validate_step_parameters(UUID, TEXT, NUMERIC)`);

        // Drop foreign key constraint
        await queryRunner.query(`ALTER TABLE "production_steps" DROP CONSTRAINT IF EXISTS "fk_production_steps_alternate_work_center_id"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_production_steps_tenant_id_alternate_work_center_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_production_steps_media_files_gin"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_production_steps_validation_rules_gin"`);

        // Remove fields from production_steps
        await queryRunner.query(`ALTER TABLE "production_steps" DROP COLUMN IF EXISTS "alternate_work_center_id"`);
        await queryRunner.query(`ALTER TABLE "production_steps" DROP COLUMN IF EXISTS "media_files"`);
        await queryRunner.query(`ALTER TABLE "production_steps" DROP COLUMN IF EXISTS "validation_rules"`);
    }
}
