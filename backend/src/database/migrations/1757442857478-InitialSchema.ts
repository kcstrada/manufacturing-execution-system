import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1757442857478 implements MigrationInterface {
  name = 'InitialSchema1757442857478';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "code" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "image_path" character varying(500), "attributes" jsonb, "sort_order" integer NOT NULL DEFAULT '0', "parent_category_id" uuid, CONSTRAINT "uq_product_categories_tenant_id_code" UNIQUE ("tenant_id", "code"), CONSTRAINT "pk_product_categories_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_categories_tenant_id" ON "product_categories" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_categories_tenant_id_is_active" ON "product_categories" ("tenant_id", "is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_categories_tenant_id_parent_category_id" ON "product_categories" ("tenant_id", "parent_category_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_categories_tenant_id_name" ON "product_categories" ("tenant_id", "name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_categories_tenant_id_code" ON "product_categories" ("tenant_id", "code") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."units_of_measure_category_enum" AS ENUM('weight', 'length', 'volume', 'area', 'time', 'quantity', 'temperature', 'currency')`,
    );
    await queryRunner.query(
      `CREATE TABLE "units_of_measure" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "code" character varying(20) NOT NULL, "name" character varying(100) NOT NULL, "description" text, "category" "public"."units_of_measure_category_enum" NOT NULL DEFAULT 'quantity', "symbol" character varying(20), "conversion_factor" numeric(20,10) NOT NULL DEFAULT '1', "base_unit_id" uuid, "decimal_places" integer NOT NULL DEFAULT '2', CONSTRAINT "uq_units_of_measure_tenant_id_code" UNIQUE ("tenant_id", "code"), CONSTRAINT "pk_units_of_measure_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_units_of_measure_tenant_id" ON "units_of_measure" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_units_of_measure_tenant_id_is_active" ON "units_of_measure" ("tenant_id", "is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_units_of_measure_tenant_id_category" ON "units_of_measure" ("tenant_id", "category") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_units_of_measure_tenant_id_code" ON "units_of_measure" ("tenant_id", "code") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."work_centers_type_enum" AS ENUM('production', 'assembly', 'packaging', 'quality', 'maintenance')`,
    );
    await queryRunner.query(
      `CREATE TABLE "work_centers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "code" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "type" "public"."work_centers_type_enum" NOT NULL DEFAULT 'production', "capacity_per_hour" numeric(10,2) NOT NULL DEFAULT '0', "setup_cost_per_hour" numeric(10,2) NOT NULL DEFAULT '0', "run_cost_per_hour" numeric(10,2) NOT NULL DEFAULT '0', "number_of_machines" integer NOT NULL DEFAULT '1', "number_of_operators" integer NOT NULL DEFAULT '1', "efficiency" numeric(5,2) NOT NULL DEFAULT '100', "utilization" numeric(5,2) NOT NULL DEFAULT '100', "operating_hours" jsonb, "department_id" uuid NOT NULL, CONSTRAINT "uq_work_centers_tenant_id_code" UNIQUE ("tenant_id", "code"), CONSTRAINT "pk_work_centers_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_work_centers_tenant_id" ON "work_centers" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_work_centers_tenant_id_is_active" ON "work_centers" ("tenant_id", "is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_work_centers_tenant_id_type" ON "work_centers" ("tenant_id", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_work_centers_tenant_id_department_id" ON "work_centers" ("tenant_id", "department_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_work_centers_tenant_id_name" ON "work_centers" ("tenant_id", "name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_work_centers_tenant_id_code" ON "work_centers" ("tenant_id", "code") `,
    );
    await queryRunner.query(
      `CREATE TABLE "departments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "code" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "location" character varying(255), "cost_center" character varying(100), "parent_department_id" uuid, "manager_id" uuid, CONSTRAINT "uq_departments_tenant_id_code" UNIQUE ("tenant_id", "code"), CONSTRAINT "pk_departments_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_departments_tenant_id" ON "departments" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_departments_tenant_id_is_active" ON "departments" ("tenant_id", "is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_departments_tenant_id_parent_department_id" ON "departments" ("tenant_id", "parent_department_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_departments_tenant_id_name" ON "departments" ("tenant_id", "name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_departments_tenant_id_code" ON "departments" ("tenant_id", "code") `,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "code" character varying(50) NOT NULL, "description" text, "permissions" jsonb, "is_system" boolean NOT NULL DEFAULT false, CONSTRAINT "uq_roles_tenant_id_code" UNIQUE ("tenant_id", "code"), CONSTRAINT "pk_roles_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_roles_tenant_id" ON "roles" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_roles_tenant_id_is_system" ON "roles" ("tenant_id", "is_system") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_roles_tenant_id_name" ON "roles" ("tenant_id", "name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_roles_tenant_id_code" ON "roles" ("tenant_id", "code") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role_id" uuid NOT NULL, "assigned_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "assigned_by_id" uuid, "assigned_by" uuid, CONSTRAINT "uq_user_roles_user_id_role_id" UNIQUE ("user_id", "role_id"), CONSTRAINT "pk_user_roles_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_roles_tenant_id" ON "user_roles" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_roles_tenant_id_role_id" ON "user_roles" ("tenant_id", "role_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_roles_tenant_id_user_id" ON "user_roles" ("tenant_id", "user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "tenants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, "logo" character varying, "website" character varying, "subdomain" character varying, "custom_domain" character varying, "settings" jsonb, "billing" jsonb, "is_active" boolean NOT NULL DEFAULT true, "suspended_at" TIMESTAMP, "suspended_reason" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "expires_at" TIMESTAMP, "user_count" integer NOT NULL DEFAULT '0', "order_count" integer NOT NULL DEFAULT '0', "storage_used" integer NOT NULL DEFAULT '0', "last_activity_at" TIMESTAMP, CONSTRAINT "uq_tenants_slug" UNIQUE ("slug"), CONSTRAINT "pk_tenants_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tenants_slug" ON "tenants" ("slug") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'inactive', 'suspended')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "email" character varying(255) NOT NULL, "username" character varying(100) NOT NULL, "first_name" character varying(100), "last_name" character varying(100), "phone" character varying(20), "position" character varying(100), "employee_id" character varying(50), "status" "public"."users_status_enum" NOT NULL DEFAULT 'active', "last_login_at" TIMESTAMP WITH TIME ZONE, "preferences" jsonb, "department_id" uuid, CONSTRAINT "uq_users_tenant_id_employee_id" UNIQUE ("tenant_id", "employee_id"), CONSTRAINT "uq_users_tenant_id_username" UNIQUE ("tenant_id", "username"), CONSTRAINT "uq_users_tenant_id_email" UNIQUE ("tenant_id", "email"), CONSTRAINT "pk_users_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_tenant_id" ON "users" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_tenant_id_department_id" ON "users" ("tenant_id", "department_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_tenant_id_status" ON "users" ("tenant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_tenant_id_username" ON "users" ("tenant_id", "username") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_tenant_id_email" ON "users" ("tenant_id", "email") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."bills_of_materials_status_enum" AS ENUM('draft', 'active', 'obsolete', 'pending')`,
    );
    await queryRunner.query(
      `CREATE TABLE "bills_of_materials" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "name" character varying(255), "description" text, "status" "public"."bills_of_materials_status_enum" NOT NULL DEFAULT 'draft', "effective_date" date NOT NULL, "expiry_date" date, "yield_quantity" numeric(15,3) NOT NULL DEFAULT '1', "scrap_percentage" numeric(5,2) NOT NULL DEFAULT '0', "notes" jsonb, "product_id" uuid NOT NULL, "created_by" uuid, "approved_by_id" uuid, "approved_at" TIMESTAMP WITH TIME ZONE, "approved_by" uuid, CONSTRAINT "uq_bills_of_materials_tenant_id_product_id_version" UNIQUE ("tenant_id", "product_id", "version"), CONSTRAINT "pk_bills_of_materials_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bills_of_materials_tenant_id" ON "bills_of_materials" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bills_of_materials_tenant_id_effective_date" ON "bills_of_materials" ("tenant_id", "effective_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bills_of_materials_tenant_id_status" ON "bills_of_materials" ("tenant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bills_of_materials_tenant_id_is_active" ON "bills_of_materials" ("tenant_id", "is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bills_of_materials_tenant_id_product_id" ON "bills_of_materials" ("tenant_id", "product_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "bom_components" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "sequence" integer NOT NULL, "quantity" numeric(15,6) NOT NULL, "scrap_percentage" numeric(5,2) NOT NULL DEFAULT '0', "reference_designator" character varying(255), "is_phantom" boolean NOT NULL DEFAULT false, "is_required" boolean NOT NULL DEFAULT true, "notes" text, "bill_of_materials_id" uuid NOT NULL, "component_id" uuid NOT NULL, "unit_of_measure_id" uuid NOT NULL, CONSTRAINT "uq_bom_components_bill_of_materials_id_component_id" UNIQUE ("bill_of_materials_id", "component_id"), CONSTRAINT "pk_bom_components_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bom_components_tenant_id" ON "bom_components" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bom_components_tenant_id_sequence" ON "bom_components" ("tenant_id", "sequence") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bom_components_tenant_id_component_id" ON "bom_components" ("tenant_id", "component_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_bom_components_tenant_id_bill_of_materials_id" ON "bom_components" ("tenant_id", "bill_of_materials_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."inventory_status_enum" AS ENUM('available', 'reserved', 'quarantine', 'damaged', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "warehouse_code" character varying(50) NOT NULL, "location_code" character varying(50) NOT NULL, "lot_number" character varying(100), "serial_number" character varying(100), "quantity_on_hand" numeric(15,3) NOT NULL DEFAULT '0', "quantity_available" numeric(15,3) NOT NULL DEFAULT '0', "quantity_reserved" numeric(15,3) NOT NULL DEFAULT '0', "quantity_in_transit" numeric(15,3) NOT NULL DEFAULT '0', "status" "public"."inventory_status_enum" NOT NULL DEFAULT 'available', "expiration_date" date, "manufacture_date" date, "received_date" date, "unit_cost" numeric(15,4), "notes" text, "attributes" jsonb, "product_id" uuid NOT NULL, CONSTRAINT "uq_inventory_tenant_id_product_id_warehouse_code_location_code_lot_number" UNIQUE ("tenant_id", "product_id", "warehouse_code", "location_code", "lot_number"), CONSTRAINT "pk_inventory_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_tenant_id" ON "inventory" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_tenant_id_status" ON "inventory" ("tenant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_tenant_id_lot_number" ON "inventory" ("tenant_id", "lot_number") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_tenant_id_location_code" ON "inventory" ("tenant_id", "location_code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_tenant_id_warehouse_code" ON "inventory" ("tenant_id", "warehouse_code") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_tenant_id_product_id" ON "inventory" ("tenant_id", "product_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."production_steps_type_enum" AS ENUM('setup', 'operation', 'inspection', 'move', 'wait', 'outsource')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."production_steps_status_enum" AS ENUM('draft', 'approved', 'obsolete')`,
    );
    await queryRunner.query(
      `CREATE TABLE "production_steps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "step_code" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "type" "public"."production_steps_type_enum" NOT NULL DEFAULT 'operation', "status" "public"."production_steps_status_enum" NOT NULL DEFAULT 'draft', "sequence_number" integer NOT NULL, "setup_time" numeric(10,2) NOT NULL DEFAULT '0', "run_time" numeric(10,2) NOT NULL DEFAULT '0', "wait_time" numeric(10,2) NOT NULL DEFAULT '0', "move_time" numeric(10,2) NOT NULL DEFAULT '0', "batch_size" integer NOT NULL DEFAULT '1', "crew_size" integer NOT NULL DEFAULT '1', "yield_percentage" numeric(5,2) NOT NULL DEFAULT '100', "scrap_percentage" numeric(5,2) NOT NULL DEFAULT '0', "instructions" jsonb, "required_tools" jsonb, "required_skills" jsonb, "materials" jsonb, "quality_checks" jsonb, "parameters" jsonb, "is_critical" boolean NOT NULL DEFAULT false, "is_bottleneck" boolean NOT NULL DEFAULT false, "can_be_parallel" boolean NOT NULL DEFAULT false, "requires_approval" boolean NOT NULL DEFAULT false, "notes" text, "documents" jsonb, "approved_by" uuid, "approved_at" TIMESTAMP WITH TIME ZONE, "routing_id" uuid NOT NULL, "work_center_id" uuid, "product_id" uuid, CONSTRAINT "uq_production_steps_tenant_id_step_code" UNIQUE ("tenant_id", "step_code"), CONSTRAINT "pk_production_steps_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_production_steps_tenant_id" ON "production_steps" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_production_steps_tenant_id_status" ON "production_steps" ("tenant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_production_steps_tenant_id_type" ON "production_steps" ("tenant_id", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_production_steps_tenant_id_sequence_number" ON "production_steps" ("tenant_id", "sequence_number") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_production_steps_tenant_id_work_center_id" ON "production_steps" ("tenant_id", "work_center_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_production_steps_tenant_id_routing_id" ON "production_steps" ("tenant_id", "routing_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_production_steps_tenant_id_step_code" ON "production_steps" ("tenant_id", "step_code") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."routings_status_enum" AS ENUM('draft', 'active', 'obsolete', 'pending')`,
    );
    await queryRunner.query(
      `CREATE TABLE "routings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "name" character varying(255), "description" text, "status" "public"."routings_status_enum" NOT NULL DEFAULT 'draft', "effective_date" date NOT NULL, "expiry_date" date, "total_setup_time_minutes" integer NOT NULL DEFAULT '0', "total_run_time_per_unit_minutes" numeric(10,2) NOT NULL DEFAULT '0', "total_cost_per_unit" numeric(10,2) NOT NULL DEFAULT '0', "notes" jsonb, "product_id" uuid NOT NULL, "created_by" uuid, "approved_by_id" uuid, "approved_at" TIMESTAMP WITH TIME ZONE, "approved_by" uuid, CONSTRAINT "uq_routings_tenant_id_product_id_version" UNIQUE ("tenant_id", "product_id", "version"), CONSTRAINT "pk_routings_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_routings_tenant_id" ON "routings" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_routings_tenant_id_effective_date" ON "routings" ("tenant_id", "effective_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_routings_tenant_id_status" ON "routings" ("tenant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_routings_tenant_id_is_active" ON "routings" ("tenant_id", "is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_routings_tenant_id_product_id" ON "routings" ("tenant_id", "product_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_type_enum" AS ENUM('raw_material', 'component', 'finished_good', 'consumable')`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "sku" character varying(100) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "type" "public"."products_type_enum" NOT NULL DEFAULT 'finished_good', "weight" numeric(10,3), "dimensions" jsonb, "specifications" jsonb, "cost" numeric(15,2), "price" numeric(15,2), "lead_time_days" integer, "min_stock_level" numeric(15,3), "max_stock_level" numeric(15,3), "reorder_point" numeric(15,3), "reorder_quantity" numeric(15,3), "category_id" uuid, "unit_of_measure_id" uuid NOT NULL, CONSTRAINT "uq_products_tenant_id_sku" UNIQUE ("tenant_id", "sku"), CONSTRAINT "pk_products_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_tenant_id" ON "products" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_tenant_id_is_active" ON "products" ("tenant_id", "is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_tenant_id_type" ON "products" ("tenant_id", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_tenant_id_name" ON "products" ("tenant_id", "name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_tenant_id_sku" ON "products" ("tenant_id", "sku") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customers_payment_terms_enum" AS ENUM('net_30', 'net_60', 'net_90', 'cod', 'prepaid', 'custom')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customers_status_enum" AS ENUM('active', 'inactive', 'suspended', 'prospect')`,
    );
    await queryRunner.query(
      `CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "customer_code" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "legal_name" character varying(255), "tax_id" character varying(50), "email" character varying(255), "phone" character varying(20), "fax" character varying(20), "website" character varying(255), "billing_address" jsonb, "shipping_address" jsonb, "payment_terms" "public"."customers_payment_terms_enum" NOT NULL DEFAULT 'net_30', "custom_payment_days" integer, "credit_limit" numeric(15,2) NOT NULL DEFAULT '0', "current_balance" numeric(15,2) NOT NULL DEFAULT '0', "currency" character varying(3) NOT NULL DEFAULT 'USD', "status" "public"."customers_status_enum" NOT NULL DEFAULT 'active', "notes" text, "contacts" jsonb, CONSTRAINT "uq_customers_tenant_id_customer_code" UNIQUE ("tenant_id", "customer_code"), CONSTRAINT "pk_customers_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_customers_tenant_id" ON "customers" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_customers_tenant_id_status" ON "customers" ("tenant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_customers_tenant_id_email" ON "customers" ("tenant_id", "email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_customers_tenant_id_name" ON "customers" ("tenant_id", "name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_customers_tenant_id_customer_code" ON "customers" ("tenant_id", "customer_code") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customer_orders_status_enum" AS ENUM('draft', 'confirmed', 'in_production', 'partially_shipped', 'shipped', 'delivered', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."customer_orders_priority_enum" AS ENUM('low', 'normal', 'high', 'urgent')`,
    );
    await queryRunner.query(
      `CREATE TABLE "customer_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "order_number" character varying(50) NOT NULL, "customer_po_number" character varying(100), "order_date" date NOT NULL, "required_date" date NOT NULL, "promised_date" date, "shipped_date" date, "status" "public"."customer_orders_status_enum" NOT NULL DEFAULT 'draft', "priority" "public"."customer_orders_priority_enum" NOT NULL DEFAULT 'normal', "shipping_address" jsonb, "shipping_method" character varying(100), "shipping_cost" numeric(15,2) NOT NULL DEFAULT '0', "subtotal" numeric(15,2) NOT NULL DEFAULT '0', "tax_amount" numeric(15,2) NOT NULL DEFAULT '0', "discount_percent" numeric(5,2) NOT NULL DEFAULT '0', "discount_amount" numeric(15,2) NOT NULL DEFAULT '0', "total_amount" numeric(15,2) NOT NULL DEFAULT '0', "notes" text, "internal_notes" text, "customer_id" uuid NOT NULL, "sales_rep_id" uuid, "created_by" uuid, CONSTRAINT "uq_customer_orders_tenant_id_order_number" UNIQUE ("tenant_id", "order_number"), CONSTRAINT "pk_customer_orders_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_customer_orders_tenant_id" ON "customer_orders" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_customer_orders_tenant_id_required_date" ON "customer_orders" ("tenant_id", "required_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_customer_orders_tenant_id_order_date" ON "customer_orders" ("tenant_id", "order_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_customer_orders_tenant_id_status" ON "customer_orders" ("tenant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_customer_orders_tenant_id_customer_id" ON "customer_orders" ("tenant_id", "customer_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_customer_orders_tenant_id_order_number" ON "customer_orders" ("tenant_id", "order_number") `,
    );
    await queryRunner.query(
      `CREATE TABLE "customer_order_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "line_number" integer NOT NULL, "description" character varying(255), "quantity" numeric(15,3) NOT NULL, "shipped_quantity" numeric(15,3) NOT NULL DEFAULT '0', "unit_price" numeric(15,4) NOT NULL, "discount_percent" numeric(5,2) NOT NULL DEFAULT '0', "tax_amount" numeric(15,2) NOT NULL DEFAULT '0', "total_amount" numeric(15,2) NOT NULL, "required_date" date, "promised_date" date, "notes" text, "customer_order_id" uuid NOT NULL, "product_id" uuid NOT NULL, CONSTRAINT "uq_customer_order_lines_customer_order_id_line_number" UNIQUE ("customer_order_id", "line_number"), CONSTRAINT "pk_customer_order_lines_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_customer_order_lines_tenant_id" ON "customer_order_lines" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_customer_order_lines_tenant_id_product_id" ON "customer_order_lines" ("tenant_id", "product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_customer_order_lines_tenant_id_customer_order_id" ON "customer_order_lines" ("tenant_id", "customer_order_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."production_orders_status_enum" AS ENUM('draft', 'planned', 'released', 'in_progress', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "production_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "order_number" character varying(50) NOT NULL, "quantity_ordered" numeric(15,3) NOT NULL, "quantity_produced" numeric(15,3) NOT NULL DEFAULT '0', "quantity_scrapped" numeric(15,3) NOT NULL DEFAULT '0', "planned_start_date" TIMESTAMP WITH TIME ZONE, "planned_end_date" TIMESTAMP WITH TIME ZONE, "actual_start_date" TIMESTAMP WITH TIME ZONE, "actual_end_date" TIMESTAMP WITH TIME ZONE, "status" "public"."production_orders_status_enum" NOT NULL DEFAULT 'draft', "priority" integer NOT NULL DEFAULT '0', "notes" text, "product_id" uuid NOT NULL, "unit_of_measure_id" uuid NOT NULL, "customer_order_id" uuid, "created_by" uuid NOT NULL, "approved_by_id" uuid, "approved_by" uuid, CONSTRAINT "uq_production_orders_tenant_id_order_number" UNIQUE ("tenant_id", "order_number"), CONSTRAINT "pk_production_orders_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_production_orders_tenant_id" ON "production_orders" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_production_orders_tenant_id_priority" ON "production_orders" ("tenant_id", "priority") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_production_orders_tenant_id_planned_start_date_planned_end_date" ON "production_orders" ("tenant_id", "planned_start_date", "planned_end_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_production_orders_tenant_id_status" ON "production_orders" ("tenant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_production_orders_tenant_id_order_number" ON "production_orders" ("tenant_id", "order_number") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tasks_type_enum" AS ENUM('setup', 'production', 'quality_check', 'maintenance', 'cleaning', 'packaging', 'inspection')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tasks_status_enum" AS ENUM('pending', 'ready', 'in_progress', 'paused', 'completed', 'cancelled', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."tasks_priority_enum" AS ENUM('low', 'normal', 'high', 'urgent', 'critical')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "task_number" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "type" "public"."tasks_type_enum" NOT NULL DEFAULT 'production', "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'pending', "priority" "public"."tasks_priority_enum" NOT NULL DEFAULT 'normal', "sequence_number" integer NOT NULL, "estimated_hours" numeric(10,2) NOT NULL DEFAULT '0', "actual_hours" numeric(10,2) NOT NULL DEFAULT '0', "target_quantity" numeric(15,3) NOT NULL DEFAULT '0', "completed_quantity" numeric(15,3) NOT NULL DEFAULT '0', "rejected_quantity" numeric(15,3) NOT NULL DEFAULT '0', "scheduled_start_date" TIMESTAMP WITH TIME ZONE, "scheduled_end_date" TIMESTAMP WITH TIME ZONE, "actual_start_date" TIMESTAMP WITH TIME ZONE, "actual_end_date" TIMESTAMP WITH TIME ZONE, "due_date" TIMESTAMP WITH TIME ZONE, "progress_percentage" integer NOT NULL DEFAULT '0', "instructions" jsonb, "required_skills" jsonb, "required_tools" jsonb, "checklist_items" jsonb, "notes" text, "failure_reason" text, "requires_sign_off" boolean NOT NULL DEFAULT false, "signed_off_by" uuid, "signed_off_at" TIMESTAMP WITH TIME ZONE, "work_order_id" uuid NOT NULL, "assigned_to_id" uuid, "work_center_id" uuid, "product_id" uuid, CONSTRAINT "uq_tasks_tenant_id_task_number" UNIQUE ("tenant_id", "task_number"), CONSTRAINT "pk_tasks_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_tenant_id" ON "tasks" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_tenant_id_due_date" ON "tasks" ("tenant_id", "due_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_tenant_id_scheduled_start_date" ON "tasks" ("tenant_id", "scheduled_start_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_tenant_id_type" ON "tasks" ("tenant_id", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_tenant_id_priority" ON "tasks" ("tenant_id", "priority") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_tenant_id_status" ON "tasks" ("tenant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_tenant_id_work_center_id" ON "tasks" ("tenant_id", "work_center_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_tenant_id_assigned_to_id" ON "tasks" ("tenant_id", "assigned_to_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_tenant_id_work_order_id" ON "tasks" ("tenant_id", "work_order_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_tenant_id_task_number" ON "tasks" ("tenant_id", "task_number") `,
    );
    await queryRunner.query(
      `CREATE TABLE "task_time_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "start_time" TIMESTAMP WITH TIME ZONE NOT NULL, "end_time" TIMESTAMP WITH TIME ZONE, "duration" numeric(10,2) NOT NULL DEFAULT '0', "notes" text, "task_id" uuid NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "pk_task_time_logs_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_task_time_logs_tenant_id" ON "task_time_logs" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_task_time_logs_tenant_id_start_time" ON "task_time_logs" ("tenant_id", "start_time") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_task_time_logs_tenant_id_user_id" ON "task_time_logs" ("tenant_id", "user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_task_time_logs_tenant_id_task_id" ON "task_time_logs" ("tenant_id", "task_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."work_orders_status_enum" AS ENUM('pending', 'scheduled', 'released', 'in_progress', 'paused', 'completed', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "work_orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "work_order_number" character varying(50) NOT NULL, "sequence" integer NOT NULL, "operation_description" character varying(255), "quantity_ordered" numeric(15,3) NOT NULL, "quantity_completed" numeric(15,3) NOT NULL DEFAULT '0', "quantity_rejected" numeric(15,3) NOT NULL DEFAULT '0', "setup_time_minutes" integer NOT NULL DEFAULT '0', "run_time_per_unit_minutes" numeric(10,2) NOT NULL DEFAULT '0', "scheduled_start_date" TIMESTAMP WITH TIME ZONE, "scheduled_end_date" TIMESTAMP WITH TIME ZONE, "actual_start_date" TIMESTAMP WITH TIME ZONE, "actual_end_date" TIMESTAMP WITH TIME ZONE, "status" "public"."work_orders_status_enum" NOT NULL DEFAULT 'pending', "notes" text, "production_order_id" uuid NOT NULL, "work_center_id" uuid NOT NULL, "product_id" uuid NOT NULL, "assigned_to_id" uuid, "completed_by_id" uuid, "assigned_to" uuid, "completed_by" uuid, CONSTRAINT "uq_work_orders_tenant_id_work_order_number" UNIQUE ("tenant_id", "work_order_number"), CONSTRAINT "pk_work_orders_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_work_orders_tenant_id" ON "work_orders" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_work_orders_tenant_id_scheduled_start_date" ON "work_orders" ("tenant_id", "scheduled_start_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_work_orders_tenant_id_status" ON "work_orders" ("tenant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_work_orders_tenant_id_work_center_id" ON "work_orders" ("tenant_id", "work_center_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_work_orders_tenant_id_production_order_id" ON "work_orders" ("tenant_id", "production_order_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_work_orders_tenant_id_work_order_number" ON "work_orders" ("tenant_id", "work_order_number") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workers_status_enum" AS ENUM('available', 'working', 'break', 'off_duty', 'sick_leave', 'vacation', 'training')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workers_shift_type_enum" AS ENUM('morning', 'afternoon', 'night', 'rotating', 'flexible')`,
    );
    await queryRunner.query(
      `CREATE TABLE "workers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "employee_id" character varying(50) NOT NULL, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "position" character varying(100), "status" "public"."workers_status_enum" NOT NULL DEFAULT 'available', "shift_type" "public"."workers_shift_type_enum" NOT NULL DEFAULT 'morning', "hourly_rate" numeric(10,2) NOT NULL DEFAULT '0', "overtime_rate" numeric(10,2) NOT NULL DEFAULT '0', "hire_date" date, "phone_number" character varying(20), "email" character varying(255), "emergency_contact" character varying(255), "emergency_phone" character varying(20), "skills" jsonb, "certifications" jsonb, "training_history" jsonb, "weekly_hours_limit" integer NOT NULL DEFAULT '40', "daily_hours_limit" integer NOT NULL DEFAULT '8', "availability" jsonb, "efficiency" numeric(5,2) NOT NULL DEFAULT '100', "quality_score" numeric(5,2) NOT NULL DEFAULT '100', "total_tasks_completed" integer NOT NULL DEFAULT '0', "total_hours_worked" numeric(10,2) NOT NULL DEFAULT '0', "last_clock_in" TIMESTAMP WITH TIME ZONE, "last_clock_out" TIMESTAMP WITH TIME ZONE, "notes" text, "user_id" uuid, "department_id" uuid, "supervisor_id" uuid, CONSTRAINT "uq_workers_tenant_id_employee_id" UNIQUE ("tenant_id", "employee_id"), CONSTRAINT "pk_workers_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_workers_tenant_id" ON "workers" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_workers_tenant_id_shift_type" ON "workers" ("tenant_id", "shift_type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_workers_tenant_id_status" ON "workers" ("tenant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_workers_tenant_id_department_id" ON "workers" ("tenant_id", "department_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_workers_tenant_id_user_id" ON "workers" ("tenant_id", "user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_workers_tenant_id_employee_id" ON "workers" ("tenant_id", "employee_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "worker_schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "date" date NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "scheduled_hours" numeric(5,2) NOT NULL, "is_overtime" boolean NOT NULL DEFAULT false, "shift_name" character varying(100), "notes" text, "worker_id" uuid NOT NULL, "shift_id" uuid, CONSTRAINT "pk_worker_schedules_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_worker_schedules_tenant_id" ON "worker_schedules" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_worker_schedules_tenant_id_date" ON "worker_schedules" ("tenant_id", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_worker_schedules_tenant_id_shift_id" ON "worker_schedules" ("tenant_id", "shift_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_worker_schedules_tenant_id_worker_id" ON "worker_schedules" ("tenant_id", "worker_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "time_clock_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "clock_in" TIMESTAMP WITH TIME ZONE NOT NULL, "clock_out" TIMESTAMP WITH TIME ZONE, "hours_worked" numeric(10,2) NOT NULL DEFAULT '0', "regular_hours" numeric(10,2) NOT NULL DEFAULT '0', "overtime_hours" numeric(10,2) NOT NULL DEFAULT '0', "break_minutes" numeric(10,2) NOT NULL DEFAULT '0', "shift_name" character varying(100), "is_manual_entry" boolean NOT NULL DEFAULT false, "approved_by" uuid, "approved_at" TIMESTAMP WITH TIME ZONE, "notes" text, "clock_in_location" character varying(45), "clock_out_location" character varying(45), "worker_id" uuid NOT NULL, CONSTRAINT "pk_time_clock_entries_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_time_clock_entries_tenant_id" ON "time_clock_entries" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_time_clock_entries_tenant_id_clock_out" ON "time_clock_entries" ("tenant_id", "clock_out") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_time_clock_entries_tenant_id_clock_in" ON "time_clock_entries" ("tenant_id", "clock_in") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_time_clock_entries_tenant_id_worker_id" ON "time_clock_entries" ("tenant_id", "worker_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."suppliers_type_enum" AS ENUM('manufacturer', 'distributor', 'wholesaler', 'service_provider', 'other')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."suppliers_status_enum" AS ENUM('active', 'inactive', 'suspended', 'pending')`,
    );
    await queryRunner.query(
      `CREATE TABLE "suppliers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "supplier_code" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "legal_name" character varying(255), "tax_id" character varying(50), "type" "public"."suppliers_type_enum" NOT NULL DEFAULT 'distributor', "email" character varying(255), "phone" character varying(20), "fax" character varying(20), "website" character varying(255), "address" jsonb, "lead_time_days" integer NOT NULL DEFAULT '0', "minimum_order_value" numeric(5,2) NOT NULL DEFAULT '0', "currency" character varying(3) NOT NULL DEFAULT 'USD', "payment_terms" jsonb, "quality_rating" numeric(5,2), "delivery_rating" numeric(5,2), "price_rating" numeric(5,2), "status" "public"."suppliers_status_enum" NOT NULL DEFAULT 'active', "certifications" jsonb, "contacts" jsonb, "notes" text, CONSTRAINT "uq_suppliers_tenant_id_supplier_code" UNIQUE ("tenant_id", "supplier_code"), CONSTRAINT "pk_suppliers_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_suppliers_tenant_id" ON "suppliers" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_suppliers_tenant_id_type" ON "suppliers" ("tenant_id", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_suppliers_tenant_id_status" ON "suppliers" ("tenant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_suppliers_tenant_id_email" ON "suppliers" ("tenant_id", "email") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_suppliers_tenant_id_name" ON "suppliers" ("tenant_id", "name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_suppliers_tenant_id_supplier_code" ON "suppliers" ("tenant_id", "supplier_code") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quality_metrics_type_enum" AS ENUM('dimension', 'weight', 'temperature', 'pressure', 'visual', 'functional', 'chemical', 'electrical', 'mechanical')`,
    );
    await queryRunner.query(
      `CREATE TABLE "quality_metrics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "metric_code" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "type" "public"."quality_metrics_type_enum" NOT NULL DEFAULT 'dimension', "unit" character varying(50), "target_value" numeric(20,6), "min_value" numeric(20,6), "max_value" numeric(20,6), "tolerance" numeric(20,6), "is_critical" boolean NOT NULL DEFAULT true, "inspection_method" jsonb, "acceptance_criteria" jsonb, "sampling_frequency" integer NOT NULL DEFAULT '1', "reference_standard" text, "product_id" uuid, CONSTRAINT "uq_quality_metrics_tenant_id_metric_code" UNIQUE ("tenant_id", "metric_code"), CONSTRAINT "pk_quality_metrics_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_quality_metrics_tenant_id" ON "quality_metrics" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_quality_metrics_tenant_id_is_active" ON "quality_metrics" ("tenant_id", "is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_quality_metrics_tenant_id_type" ON "quality_metrics" ("tenant_id", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_quality_metrics_tenant_id_product_id" ON "quality_metrics" ("tenant_id", "product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_quality_metrics_tenant_id_metric_code" ON "quality_metrics" ("tenant_id", "metric_code") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quality_inspections_type_enum" AS ENUM('incoming', 'in_process', 'final', 'random', 'customer')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."quality_inspections_result_enum" AS ENUM('pass', 'fail', 'rework', 'scrap', 'hold')`,
    );
    await queryRunner.query(
      `CREATE TABLE "quality_inspections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "inspection_number" character varying(50) NOT NULL, "type" "public"."quality_inspections_type_enum" NOT NULL DEFAULT 'in_process', "inspection_date" TIMESTAMP WITH TIME ZONE NOT NULL, "batch_number" character varying(100), "sample_size" integer NOT NULL DEFAULT '1', "defective_quantity" integer NOT NULL DEFAULT '0', "result" "public"."quality_inspections_result_enum" NOT NULL DEFAULT 'pass', "measurements" jsonb, "defects" jsonb, "notes" text, "corrective_action" text, "images" jsonb, "requires_review" boolean NOT NULL DEFAULT false, "reviewed_by" uuid, "reviewed_at" TIMESTAMP WITH TIME ZONE, "review_notes" text, "metric_id" uuid NOT NULL, "work_order_id" uuid, "production_order_id" uuid, "product_id" uuid, "work_center_id" uuid, "inspector_id" uuid NOT NULL, CONSTRAINT "pk_quality_inspections_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_quality_inspections_tenant_id" ON "quality_inspections" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_quality_inspections_tenant_id_type" ON "quality_inspections" ("tenant_id", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_quality_inspections_tenant_id_result" ON "quality_inspections" ("tenant_id", "result") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_quality_inspections_tenant_id_inspection_date" ON "quality_inspections" ("tenant_id", "inspection_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_quality_inspections_tenant_id_production_order_id" ON "quality_inspections" ("tenant_id", "production_order_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_quality_inspections_tenant_id_work_order_id" ON "quality_inspections" ("tenant_id", "work_order_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "quality_control_plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "plan_code" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "effective_date" date NOT NULL, "expiry_date" date, "inspection_points" jsonb, "sampling_plan" jsonb, "documentation" jsonb, "approved_by" uuid, "approved_at" TIMESTAMP WITH TIME ZONE, "product_id" uuid NOT NULL, CONSTRAINT "pk_quality_control_plans_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_quality_control_plans_tenant_id" ON "quality_control_plans" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_quality_control_plans_tenant_id_is_active" ON "quality_control_plans" ("tenant_id", "is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_quality_control_plans_tenant_id_product_id" ON "quality_control_plans" ("tenant_id", "product_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."non_conformance_reports_severity_enum" AS ENUM('critical', 'major', 'minor', 'cosmetic')`,
    );
    await queryRunner.query(
      `CREATE TABLE "non_conformance_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "report_number" character varying(50) NOT NULL, "report_date" TIMESTAMP WITH TIME ZONE NOT NULL, "title" character varying(255) NOT NULL, "description" text NOT NULL, "severity" "public"."non_conformance_reports_severity_enum" NOT NULL DEFAULT 'major', "source" character varying(100), "affected_items" jsonb, "root_cause" text, "immediate_action" text, "corrective_action" text, "preventive_action" text, "status" character varying(50) NOT NULL DEFAULT 'open', "reported_by_id" uuid, "assigned_to_id" uuid, "target_close_date" TIMESTAMP WITH TIME ZONE, "actual_close_date" TIMESTAMP WITH TIME ZONE, "estimated_cost" numeric(15,2) NOT NULL DEFAULT '0', "actual_cost" numeric(15,2) NOT NULL DEFAULT '0', "attachments" jsonb, "closure_notes" text, "closed_by_id" uuid, CONSTRAINT "uq_non_conformance_reports_report_number" UNIQUE ("report_number"), CONSTRAINT "pk_non_conformance_reports_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_non_conformance_reports_tenant_id" ON "non_conformance_reports" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_non_conformance_reports_tenant_id_status" ON "non_conformance_reports" ("tenant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_non_conformance_reports_tenant_id_report_date" ON "non_conformance_reports" ("tenant_id", "report_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_non_conformance_reports_tenant_id_report_number" ON "non_conformance_reports" ("tenant_id", "report_number") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."shifts_type_enum" AS ENUM('morning', 'afternoon', 'evening', 'night', 'rotating', 'split', 'flexible', 'weekend')`,
    );
    await queryRunner.query(
      `CREATE TABLE "shifts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "shift_code" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "description" text, "type" "public"."shifts_type_enum" NOT NULL DEFAULT 'morning', "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "duration" numeric(5,2) NOT NULL, "break_times" jsonb, "total_break_time" numeric(5,2) NOT NULL DEFAULT '0', "working_hours" numeric(5,2) NOT NULL, "work_days" text NOT NULL DEFAULT 'monday,tuesday,wednesday,thursday,friday', "is_overnight" boolean NOT NULL DEFAULT false, "is_rotating" boolean NOT NULL DEFAULT false, "rotation_period_days" integer, "overtime_multiplier" numeric(5,2) NOT NULL DEFAULT '1', "weekend_multiplier" numeric(5,2) NOT NULL DEFAULT '1', "holiday_multiplier" numeric(5,2) NOT NULL DEFAULT '1', "min_workers" integer NOT NULL DEFAULT '0', "max_workers" integer NOT NULL DEFAULT '0', "target_workers" integer NOT NULL DEFAULT '0', "skill_requirements" jsonb, "effective_from" date, "effective_until" date, "priority" integer NOT NULL DEFAULT '1', "notes" text, "department_id" uuid, CONSTRAINT "uq_shifts_tenant_id_shift_code" UNIQUE ("tenant_id", "shift_code"), CONSTRAINT "pk_shifts_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_shifts_tenant_id" ON "shifts" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_shifts_tenant_id_is_active" ON "shifts" ("tenant_id", "is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_shifts_tenant_id_department_id" ON "shifts" ("tenant_id", "department_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_shifts_tenant_id_type" ON "shifts" ("tenant_id", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_shifts_tenant_id_shift_code" ON "shifts" ("tenant_id", "shift_code") `,
    );
    await queryRunner.query(
      `CREATE TABLE "shift_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "date" date NOT NULL, "actual_start_time" TIME, "actual_end_time" TIME, "status" character varying(50) NOT NULL DEFAULT 'scheduled', "is_overtime" boolean NOT NULL DEFAULT false, "is_temporary" boolean NOT NULL DEFAULT false, "notes" text, "replacement_for_id" uuid, "approved_by_id" uuid, "approved_at" TIMESTAMP WITH TIME ZONE, "shift_id" uuid NOT NULL, "worker_id" uuid NOT NULL, "work_center_id" uuid, CONSTRAINT "pk_shift_assignments_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_shift_assignments_tenant_id" ON "shift_assignments" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_shift_assignments_tenant_id_status" ON "shift_assignments" ("tenant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_shift_assignments_tenant_id_date" ON "shift_assignments" ("tenant_id", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_shift_assignments_tenant_id_worker_id" ON "shift_assignments" ("tenant_id", "worker_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_shift_assignments_tenant_id_shift_id" ON "shift_assignments" ("tenant_id", "shift_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "shift_exceptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "date" date NOT NULL, "type" character varying(50) NOT NULL, "reason" character varying(255) NOT NULL, "alternate_start_time" TIME, "alternate_end_time" TIME, "is_cancelled" boolean NOT NULL DEFAULT false, "reduced_capacity" integer, "notes" text, "created_by_id" uuid, "shift_id" uuid NOT NULL, CONSTRAINT "pk_shift_exceptions_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_shift_exceptions_tenant_id" ON "shift_exceptions" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_shift_exceptions_tenant_id_type" ON "shift_exceptions" ("tenant_id", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_shift_exceptions_tenant_id_date" ON "shift_exceptions" ("tenant_id", "date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_shift_exceptions_tenant_id_shift_id" ON "shift_exceptions" ("tenant_id", "shift_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."production_calendar_day_of_week_enum" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')`,
    );
    await queryRunner.query(
      `CREATE TABLE "production_calendar" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "date" date NOT NULL, "day_of_week" "public"."production_calendar_day_of_week_enum" NOT NULL, "is_working_day" boolean NOT NULL DEFAULT true, "is_holiday" boolean NOT NULL DEFAULT false, "holiday_name" character varying(100), "is_planned_maintenance" boolean NOT NULL DEFAULT false, "capacity_percentage" integer NOT NULL DEFAULT '100', "shift_overrides" jsonb, "notes" text, "year" integer NOT NULL, "month" integer NOT NULL, "week" integer NOT NULL, "quarter" integer NOT NULL, CONSTRAINT "uq_production_calendar_date" UNIQUE ("date"), CONSTRAINT "pk_production_calendar_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_production_calendar_tenant_id" ON "production_calendar" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_production_calendar_tenant_id_is_holiday" ON "production_calendar" ("tenant_id", "is_holiday") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_production_calendar_tenant_id_is_working_day" ON "production_calendar" ("tenant_id", "is_working_day") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_production_calendar_tenant_id_date" ON "production_calendar" ("tenant_id", "date") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."equipment_type_enum" AS ENUM('machine', 'tool', 'vehicle', 'computer', 'measuring', 'safety', 'auxiliary')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."equipment_status_enum" AS ENUM('operational', 'in_use', 'idle', 'maintenance', 'repair', 'out_of_service', 'decommissioned')`,
    );
    await queryRunner.query(
      `CREATE TABLE "equipment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "equipment_code" character varying(50) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "type" "public"."equipment_type_enum" NOT NULL DEFAULT 'machine', "status" "public"."equipment_status_enum" NOT NULL DEFAULT 'operational', "manufacturer" character varying(100), "model" character varying(100), "serial_number" character varying(100), "purchase_date" date, "installation_date" date, "warranty_expiry" date, "purchase_cost" numeric(15,2) NOT NULL DEFAULT '0', "current_value" numeric(15,2) NOT NULL DEFAULT '0', "hourly_operating_cost" numeric(10,2) NOT NULL DEFAULT '0', "location" character varying(255), "specifications" jsonb, "total_operating_hours" integer NOT NULL DEFAULT '0', "maintenance_interval_hours" integer NOT NULL DEFAULT '0', "hours_since_last_maintenance" integer NOT NULL DEFAULT '0', "last_maintenance_date" TIMESTAMP WITH TIME ZONE, "next_maintenance_date" TIMESTAMP WITH TIME ZONE, "total_maintenance_count" integer NOT NULL DEFAULT '0', "total_breakdown_count" integer NOT NULL DEFAULT '0', "availability" numeric(5,2) NOT NULL DEFAULT '100', "performance" numeric(5,2) NOT NULL DEFAULT '100', "quality" numeric(5,2) NOT NULL DEFAULT '100', "oee" numeric(5,2) NOT NULL DEFAULT '100', "documents" jsonb, "notes" text, "is_critical" boolean NOT NULL DEFAULT false, "requires_calibration" boolean NOT NULL DEFAULT false, "last_calibration_date" date, "next_calibration_date" date, "work_center_id" uuid, "department_id" uuid, "supplier_id" uuid, CONSTRAINT "uq_equipment_tenant_id_serial_number" UNIQUE ("tenant_id", "serial_number"), CONSTRAINT "uq_equipment_tenant_id_equipment_code" UNIQUE ("tenant_id", "equipment_code"), CONSTRAINT "pk_equipment_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_equipment_tenant_id" ON "equipment" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_equipment_tenant_id_type" ON "equipment" ("tenant_id", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_equipment_tenant_id_status" ON "equipment" ("tenant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_equipment_tenant_id_department_id" ON "equipment" ("tenant_id", "department_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_equipment_tenant_id_work_center_id" ON "equipment" ("tenant_id", "work_center_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_equipment_tenant_id_equipment_code" ON "equipment" ("tenant_id", "equipment_code") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."maintenance_schedules_type_enum" AS ENUM('preventive', 'corrective', 'predictive', 'emergency', 'calibration')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."maintenance_schedules_status_enum" AS ENUM('scheduled', 'in_progress', 'completed', 'overdue', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "maintenance_schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "title" character varying(255) NOT NULL, "description" text, "type" "public"."maintenance_schedules_type_enum" NOT NULL DEFAULT 'preventive', "status" "public"."maintenance_schedules_status_enum" NOT NULL DEFAULT 'scheduled', "scheduled_date" date NOT NULL, "estimated_duration" numeric(10,2) NOT NULL DEFAULT '0', "estimated_cost" numeric(15,2) NOT NULL DEFAULT '0', "tasks" jsonb, "required_parts" jsonb, "assigned_to_id" uuid, "is_recurring" boolean NOT NULL DEFAULT false, "recurring_interval_days" integer, "notes" text, "equipment_id" uuid NOT NULL, CONSTRAINT "pk_maintenance_schedules_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_maintenance_schedules_tenant_id" ON "maintenance_schedules" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_maintenance_schedules_tenant_id_status" ON "maintenance_schedules" ("tenant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_maintenance_schedules_tenant_id_scheduled_date" ON "maintenance_schedules" ("tenant_id", "scheduled_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_maintenance_schedules_tenant_id_equipment_id" ON "maintenance_schedules" ("tenant_id", "equipment_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."maintenance_records_type_enum" AS ENUM('preventive', 'corrective', 'predictive', 'emergency', 'calibration')`,
    );
    await queryRunner.query(
      `CREATE TABLE "maintenance_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "record_number" character varying(50) NOT NULL, "type" "public"."maintenance_records_type_enum" NOT NULL, "start_date" TIMESTAMP WITH TIME ZONE NOT NULL, "end_date" TIMESTAMP WITH TIME ZONE, "duration" numeric(10,2) NOT NULL DEFAULT '0', "work_performed" text, "parts_replaced" jsonb, "labor_cost" numeric(15,2) NOT NULL DEFAULT '0', "parts_cost" numeric(15,2) NOT NULL DEFAULT '0', "total_cost" numeric(15,2) NOT NULL DEFAULT '0', "performed_by_id" uuid, "performed_by" character varying(255), "findings" text, "recommendations" text, "meter_reading" integer, "was_breakdown" boolean NOT NULL DEFAULT false, "failure_reason" text, "attachments" jsonb, "equipment_id" uuid NOT NULL, "schedule_id" uuid, CONSTRAINT "pk_maintenance_records_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_maintenance_records_tenant_id" ON "maintenance_records" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_maintenance_records_tenant_id_type" ON "maintenance_records" ("tenant_id", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_maintenance_records_tenant_id_start_date" ON "maintenance_records" ("tenant_id", "start_date") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_maintenance_records_tenant_id_equipment_id" ON "maintenance_records" ("tenant_id", "equipment_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."activity_logs_type_enum" AS ENUM('create', 'update', 'delete', 'view', 'export', 'import', 'login', 'logout', 'approve', 'reject', 'submit', 'cancel', 'complete', 'start', 'stop', 'pause', 'resume', 'assign', 'unassign', 'comment', 'attachment', 'email', 'print', 'share', 'archive', 'restore', 'error', 'warning', 'system')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."activity_logs_category_enum" AS ENUM('user', 'order', 'production', 'inventory', 'quality', 'maintenance', 'worker', 'task', 'equipment', 'report', 'settings', 'security', 'system')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."activity_logs_severity_enum" AS ENUM('info', 'warning', 'error', 'critical')`,
    );
    await queryRunner.query(
      `CREATE TABLE "activity_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "type" "public"."activity_logs_type_enum" NOT NULL DEFAULT 'view', "category" "public"."activity_logs_category_enum" NOT NULL DEFAULT 'system', "severity" "public"."activity_logs_severity_enum" NOT NULL DEFAULT 'info', "entity_type" character varying(100), "entity_id" uuid, "action" character varying(255) NOT NULL, "description" text, "changes" jsonb, "ip_address" character varying(45), "session_id" character varying(255), "request_id" character varying(255), "http_method" character varying(10), "endpoint" character varying(500), "status_code" integer, "response_time" integer, "error_message" text, "stack_trace" text, "request_body" jsonb, "response_body" jsonb, "is_system_generated" boolean NOT NULL DEFAULT false, "is_anonymous" boolean NOT NULL DEFAULT false, "tags" jsonb, "parent_activity_id" uuid, "duration" integer NOT NULL DEFAULT '0', "user_id" uuid, "user_name" character varying(255), "user_role" character varying(100), CONSTRAINT "pk_activity_logs_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_activity_logs_tenant_id" ON "activity_logs" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_activity_logs_tenant_id_session_id" ON "activity_logs" ("tenant_id", "session_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_activity_logs_tenant_id_severity" ON "activity_logs" ("tenant_id", "severity") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_activity_logs_tenant_id_category" ON "activity_logs" ("tenant_id", "category") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_activity_logs_tenant_id_type" ON "activity_logs" ("tenant_id", "type") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_activity_logs_tenant_id_entity_type_entity_id" ON "activity_logs" ("tenant_id", "entity_type", "entity_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_activity_logs_tenant_id_user_id" ON "activity_logs" ("tenant_id", "user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_activity_logs_tenant_id_timestamp" ON "activity_logs" ("tenant_id", "timestamp") `,
    );
    await queryRunner.query(
      `CREATE TABLE "audit_trails" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "table_name" character varying(100) NOT NULL, "record_id" uuid NOT NULL, "operation" character varying(20) NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "old_values" jsonb, "new_values" jsonb, "changed_fields" jsonb, "user_id" uuid, "user_name" character varying(255), "ip_address" character varying(45), "session_id" character varying(255), "reason" text, "is_system_change" boolean NOT NULL DEFAULT false, CONSTRAINT "pk_audit_trails_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_trails_tenant_id" ON "audit_trails" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_trails_tenant_id_user_id" ON "audit_trails" ("tenant_id", "user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_trails_tenant_id_timestamp" ON "audit_trails" ("tenant_id", "timestamp") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_trails_tenant_id_operation" ON "audit_trails" ("tenant_id", "operation") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_trails_tenant_id_table_name_record_id" ON "audit_trails" ("tenant_id", "table_name", "record_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "data_change_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, "version" integer NOT NULL DEFAULT '1', "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "tenant_id" uuid NOT NULL, "entity_name" character varying(100) NOT NULL, "entity_id" uuid NOT NULL, "field_name" character varying(100) NOT NULL, "old_value" text, "new_value" text, "data_type" character varying(50) NOT NULL, "changed_at" TIMESTAMP WITH TIME ZONE NOT NULL, "changed_by" uuid, "change_reason" character varying(255), "change_source" character varying(50), "transaction_id" character varying(100), "is_encrypted" boolean NOT NULL DEFAULT false, "context" jsonb, CONSTRAINT "pk_data_change_logs_id" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_data_change_logs_tenant_id" ON "data_change_logs" ("tenant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_data_change_logs_tenant_id_changed_by" ON "data_change_logs" ("tenant_id", "changed_by") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_data_change_logs_tenant_id_changed_at" ON "data_change_logs" ("tenant_id", "changed_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_data_change_logs_tenant_id_entity_name_entity_id" ON "data_change_logs" ("tenant_id", "entity_name", "entity_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "production_step_dependencies" ("step_id" uuid NOT NULL, "depends_on_step_id" uuid NOT NULL, CONSTRAINT "pk_production_step_dependencies_step_id_depends_on_step_id" PRIMARY KEY ("step_id", "depends_on_step_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_production_step_dependencies_step_id" ON "production_step_dependencies" ("step_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_production_step_dependencies_depends_on_step_id" ON "production_step_dependencies" ("depends_on_step_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "task_dependencies" ("task_id" uuid NOT NULL, "depends_on_task_id" uuid NOT NULL, CONSTRAINT "pk_task_dependencies_task_id_depends_on_task_id" PRIMARY KEY ("task_id", "depends_on_task_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_task_dependencies_task_id" ON "task_dependencies" ("task_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_task_dependencies_depends_on_task_id" ON "task_dependencies" ("depends_on_task_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "worker_work_centers" ("worker_id" uuid NOT NULL, "work_center_id" uuid NOT NULL, CONSTRAINT "pk_worker_work_centers_worker_id_work_center_id" PRIMARY KEY ("worker_id", "work_center_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_worker_work_centers_worker_id" ON "worker_work_centers" ("worker_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_worker_work_centers_work_center_id" ON "worker_work_centers" ("work_center_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "shift_work_centers" ("shift_id" uuid NOT NULL, "work_center_id" uuid NOT NULL, CONSTRAINT "pk_shift_work_centers_shift_id_work_center_id" PRIMARY KEY ("shift_id", "work_center_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_shift_work_centers_shift_id" ON "shift_work_centers" ("shift_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_shift_work_centers_work_center_id" ON "shift_work_centers" ("work_center_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ADD CONSTRAINT "fk_product_categories_parent_category_id_product_categories" FOREIGN KEY ("parent_category_id") REFERENCES "product_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_centers" ADD CONSTRAINT "fk_work_centers_department_id_departments" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "fk_departments_parent_department_id_departments" FOREIGN KEY ("parent_department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "fk_departments_manager_id_users" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "fk_user_roles_user_id_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "fk_user_roles_role_id_roles" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" ADD CONSTRAINT "fk_user_roles_assigned_by_users" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "fk_users_department_id_departments" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "fk_users_tenant_id_tenants" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bills_of_materials" ADD CONSTRAINT "fk_bills_of_materials_product_id_products" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bills_of_materials" ADD CONSTRAINT "fk_bills_of_materials_created_by_users" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bills_of_materials" ADD CONSTRAINT "fk_bills_of_materials_approved_by_users" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bom_components" ADD CONSTRAINT "fk_bom_components_bill_of_materials_id_bills_of_materials" FOREIGN KEY ("bill_of_materials_id") REFERENCES "bills_of_materials"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bom_components" ADD CONSTRAINT "fk_bom_components_component_id_products" FOREIGN KEY ("component_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bom_components" ADD CONSTRAINT "fk_bom_components_unit_of_measure_id_units_of_measure" FOREIGN KEY ("unit_of_measure_id") REFERENCES "units_of_measure"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD CONSTRAINT "fk_inventory_product_id_products" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_steps" ADD CONSTRAINT "fk_production_steps_routing_id_routings" FOREIGN KEY ("routing_id") REFERENCES "routings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_steps" ADD CONSTRAINT "fk_production_steps_work_center_id_work_centers" FOREIGN KEY ("work_center_id") REFERENCES "work_centers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_steps" ADD CONSTRAINT "fk_production_steps_product_id_products" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "routings" ADD CONSTRAINT "fk_routings_product_id_products" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "routings" ADD CONSTRAINT "fk_routings_created_by_users" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "routings" ADD CONSTRAINT "fk_routings_approved_by_users" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "fk_products_category_id_product_categories" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "fk_products_unit_of_measure_id_units_of_measure" FOREIGN KEY ("unit_of_measure_id") REFERENCES "units_of_measure"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_orders" ADD CONSTRAINT "fk_customer_orders_customer_id_customers" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_orders" ADD CONSTRAINT "fk_customer_orders_sales_rep_id_users" FOREIGN KEY ("sales_rep_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_orders" ADD CONSTRAINT "fk_customer_orders_created_by_users" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_order_lines" ADD CONSTRAINT "fk_customer_order_lines_customer_order_id_customer_orders" FOREIGN KEY ("customer_order_id") REFERENCES "customer_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_order_lines" ADD CONSTRAINT "fk_customer_order_lines_product_id_products" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_orders" ADD CONSTRAINT "fk_production_orders_product_id_products" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_orders" ADD CONSTRAINT "fk_production_orders_unit_of_measure_id_units_of_measure" FOREIGN KEY ("unit_of_measure_id") REFERENCES "units_of_measure"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_orders" ADD CONSTRAINT "fk_production_orders_customer_order_id_customer_orders" FOREIGN KEY ("customer_order_id") REFERENCES "customer_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_orders" ADD CONSTRAINT "fk_production_orders_created_by_users" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_orders" ADD CONSTRAINT "fk_production_orders_approved_by_users" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "fk_tasks_work_order_id_work_orders" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "fk_tasks_assigned_to_id_users" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "fk_tasks_work_center_id_work_centers" FOREIGN KEY ("work_center_id") REFERENCES "work_centers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "fk_tasks_product_id_products" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_time_logs" ADD CONSTRAINT "fk_task_time_logs_task_id_tasks" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_time_logs" ADD CONSTRAINT "fk_task_time_logs_user_id_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" ADD CONSTRAINT "fk_work_orders_production_order_id_production_orders" FOREIGN KEY ("production_order_id") REFERENCES "production_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" ADD CONSTRAINT "fk_work_orders_work_center_id_work_centers" FOREIGN KEY ("work_center_id") REFERENCES "work_centers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" ADD CONSTRAINT "fk_work_orders_product_id_products" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" ADD CONSTRAINT "fk_work_orders_assigned_to_users" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" ADD CONSTRAINT "fk_work_orders_completed_by_users" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workers" ADD CONSTRAINT "fk_workers_user_id_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workers" ADD CONSTRAINT "fk_workers_department_id_departments" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "workers" ADD CONSTRAINT "fk_workers_supervisor_id_workers" FOREIGN KEY ("supervisor_id") REFERENCES "workers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "worker_schedules" ADD CONSTRAINT "fk_worker_schedules_worker_id_workers" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_clock_entries" ADD CONSTRAINT "fk_time_clock_entries_worker_id_workers" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quality_metrics" ADD CONSTRAINT "fk_quality_metrics_product_id_products" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quality_inspections" ADD CONSTRAINT "fk_quality_inspections_metric_id_quality_metrics" FOREIGN KEY ("metric_id") REFERENCES "quality_metrics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quality_inspections" ADD CONSTRAINT "fk_quality_inspections_work_order_id_work_orders" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quality_inspections" ADD CONSTRAINT "fk_quality_inspections_production_order_id_production_orders" FOREIGN KEY ("production_order_id") REFERENCES "production_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quality_inspections" ADD CONSTRAINT "fk_quality_inspections_product_id_products" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quality_inspections" ADD CONSTRAINT "fk_quality_inspections_work_center_id_work_centers" FOREIGN KEY ("work_center_id") REFERENCES "work_centers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quality_inspections" ADD CONSTRAINT "fk_quality_inspections_inspector_id_users" FOREIGN KEY ("inspector_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quality_control_plans" ADD CONSTRAINT "fk_quality_control_plans_product_id_products" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shifts" ADD CONSTRAINT "fk_shifts_department_id_departments" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shift_assignments" ADD CONSTRAINT "fk_shift_assignments_shift_id_shifts" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shift_assignments" ADD CONSTRAINT "fk_shift_assignments_work_center_id_work_centers" FOREIGN KEY ("work_center_id") REFERENCES "work_centers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shift_exceptions" ADD CONSTRAINT "fk_shift_exceptions_shift_id_shifts" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" ADD CONSTRAINT "fk_equipment_work_center_id_work_centers" FOREIGN KEY ("work_center_id") REFERENCES "work_centers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" ADD CONSTRAINT "fk_equipment_department_id_departments" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" ADD CONSTRAINT "fk_equipment_supplier_id_suppliers" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_schedules" ADD CONSTRAINT "fk_maintenance_schedules_equipment_id_equipment" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_records" ADD CONSTRAINT "fk_maintenance_records_equipment_id_equipment" FOREIGN KEY ("equipment_id") REFERENCES "equipment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" ADD CONSTRAINT "fk_activity_logs_user_id_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_trails" ADD CONSTRAINT "fk_audit_trails_user_id_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_step_dependencies" ADD CONSTRAINT "fk_production_step_dependencies_step_id_production_steps" FOREIGN KEY ("step_id") REFERENCES "production_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_step_dependencies" ADD CONSTRAINT "fk_production_step_dependencies_depends_on_step_id_production_steps" FOREIGN KEY ("depends_on_step_id") REFERENCES "production_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_dependencies" ADD CONSTRAINT "fk_task_dependencies_task_id_tasks" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_dependencies" ADD CONSTRAINT "fk_task_dependencies_depends_on_task_id_tasks" FOREIGN KEY ("depends_on_task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "worker_work_centers" ADD CONSTRAINT "fk_worker_work_centers_worker_id_workers" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "worker_work_centers" ADD CONSTRAINT "fk_worker_work_centers_work_center_id_work_centers" FOREIGN KEY ("work_center_id") REFERENCES "work_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "shift_work_centers" ADD CONSTRAINT "fk_shift_work_centers_shift_id_shifts" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "shift_work_centers" ADD CONSTRAINT "fk_shift_work_centers_work_center_id_work_centers" FOREIGN KEY ("work_center_id") REFERENCES "work_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "shift_work_centers" DROP CONSTRAINT "fk_shift_work_centers_work_center_id_work_centers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shift_work_centers" DROP CONSTRAINT "fk_shift_work_centers_shift_id_shifts"`,
    );
    await queryRunner.query(
      `ALTER TABLE "worker_work_centers" DROP CONSTRAINT "fk_worker_work_centers_work_center_id_work_centers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "worker_work_centers" DROP CONSTRAINT "fk_worker_work_centers_worker_id_workers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_dependencies" DROP CONSTRAINT "fk_task_dependencies_depends_on_task_id_tasks"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_dependencies" DROP CONSTRAINT "fk_task_dependencies_task_id_tasks"`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_step_dependencies" DROP CONSTRAINT "fk_production_step_dependencies_depends_on_step_id_production_steps"`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_step_dependencies" DROP CONSTRAINT "fk_production_step_dependencies_step_id_production_steps"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_trails" DROP CONSTRAINT "fk_audit_trails_user_id_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" DROP CONSTRAINT "fk_activity_logs_user_id_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_records" DROP CONSTRAINT "fk_maintenance_records_equipment_id_equipment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "maintenance_schedules" DROP CONSTRAINT "fk_maintenance_schedules_equipment_id_equipment"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" DROP CONSTRAINT "fk_equipment_supplier_id_suppliers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" DROP CONSTRAINT "fk_equipment_department_id_departments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "equipment" DROP CONSTRAINT "fk_equipment_work_center_id_work_centers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shift_exceptions" DROP CONSTRAINT "fk_shift_exceptions_shift_id_shifts"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shift_assignments" DROP CONSTRAINT "fk_shift_assignments_work_center_id_work_centers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shift_assignments" DROP CONSTRAINT "fk_shift_assignments_shift_id_shifts"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shifts" DROP CONSTRAINT "fk_shifts_department_id_departments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quality_control_plans" DROP CONSTRAINT "fk_quality_control_plans_product_id_products"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quality_inspections" DROP CONSTRAINT "fk_quality_inspections_inspector_id_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quality_inspections" DROP CONSTRAINT "fk_quality_inspections_work_center_id_work_centers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quality_inspections" DROP CONSTRAINT "fk_quality_inspections_product_id_products"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quality_inspections" DROP CONSTRAINT "fk_quality_inspections_production_order_id_production_orders"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quality_inspections" DROP CONSTRAINT "fk_quality_inspections_work_order_id_work_orders"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quality_inspections" DROP CONSTRAINT "fk_quality_inspections_metric_id_quality_metrics"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quality_metrics" DROP CONSTRAINT "fk_quality_metrics_product_id_products"`,
    );
    await queryRunner.query(
      `ALTER TABLE "time_clock_entries" DROP CONSTRAINT "fk_time_clock_entries_worker_id_workers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "worker_schedules" DROP CONSTRAINT "fk_worker_schedules_worker_id_workers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workers" DROP CONSTRAINT "fk_workers_supervisor_id_workers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workers" DROP CONSTRAINT "fk_workers_department_id_departments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "workers" DROP CONSTRAINT "fk_workers_user_id_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" DROP CONSTRAINT "fk_work_orders_completed_by_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" DROP CONSTRAINT "fk_work_orders_assigned_to_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" DROP CONSTRAINT "fk_work_orders_product_id_products"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" DROP CONSTRAINT "fk_work_orders_work_center_id_work_centers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_orders" DROP CONSTRAINT "fk_work_orders_production_order_id_production_orders"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_time_logs" DROP CONSTRAINT "fk_task_time_logs_user_id_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_time_logs" DROP CONSTRAINT "fk_task_time_logs_task_id_tasks"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "fk_tasks_product_id_products"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "fk_tasks_work_center_id_work_centers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "fk_tasks_assigned_to_id_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" DROP CONSTRAINT "fk_tasks_work_order_id_work_orders"`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_orders" DROP CONSTRAINT "fk_production_orders_approved_by_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_orders" DROP CONSTRAINT "fk_production_orders_created_by_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_orders" DROP CONSTRAINT "fk_production_orders_customer_order_id_customer_orders"`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_orders" DROP CONSTRAINT "fk_production_orders_unit_of_measure_id_units_of_measure"`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_orders" DROP CONSTRAINT "fk_production_orders_product_id_products"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_order_lines" DROP CONSTRAINT "fk_customer_order_lines_product_id_products"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_order_lines" DROP CONSTRAINT "fk_customer_order_lines_customer_order_id_customer_orders"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_orders" DROP CONSTRAINT "fk_customer_orders_created_by_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_orders" DROP CONSTRAINT "fk_customer_orders_sales_rep_id_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_orders" DROP CONSTRAINT "fk_customer_orders_customer_id_customers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "fk_products_unit_of_measure_id_units_of_measure"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "fk_products_category_id_product_categories"`,
    );
    await queryRunner.query(
      `ALTER TABLE "routings" DROP CONSTRAINT "fk_routings_approved_by_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "routings" DROP CONSTRAINT "fk_routings_created_by_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "routings" DROP CONSTRAINT "fk_routings_product_id_products"`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_steps" DROP CONSTRAINT "fk_production_steps_product_id_products"`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_steps" DROP CONSTRAINT "fk_production_steps_work_center_id_work_centers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "production_steps" DROP CONSTRAINT "fk_production_steps_routing_id_routings"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" DROP CONSTRAINT "fk_inventory_product_id_products"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bom_components" DROP CONSTRAINT "fk_bom_components_unit_of_measure_id_units_of_measure"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bom_components" DROP CONSTRAINT "fk_bom_components_component_id_products"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bom_components" DROP CONSTRAINT "fk_bom_components_bill_of_materials_id_bills_of_materials"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bills_of_materials" DROP CONSTRAINT "fk_bills_of_materials_approved_by_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bills_of_materials" DROP CONSTRAINT "fk_bills_of_materials_created_by_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bills_of_materials" DROP CONSTRAINT "fk_bills_of_materials_product_id_products"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "fk_users_tenant_id_tenants"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "fk_users_department_id_departments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "fk_user_roles_assigned_by_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "fk_user_roles_role_id_roles"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT "fk_user_roles_user_id_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT "fk_departments_manager_id_users"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT "fk_departments_parent_department_id_departments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_centers" DROP CONSTRAINT "fk_work_centers_department_id_departments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" DROP CONSTRAINT "fk_product_categories_parent_category_id_product_categories"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_shift_work_centers_work_center_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_shift_work_centers_shift_id"`,
    );
    await queryRunner.query(`DROP TABLE "shift_work_centers"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_worker_work_centers_work_center_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_worker_work_centers_worker_id"`,
    );
    await queryRunner.query(`DROP TABLE "worker_work_centers"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_task_dependencies_depends_on_task_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_task_dependencies_task_id"`,
    );
    await queryRunner.query(`DROP TABLE "task_dependencies"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_production_step_dependencies_depends_on_step_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_production_step_dependencies_step_id"`,
    );
    await queryRunner.query(`DROP TABLE "production_step_dependencies"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_data_change_logs_tenant_id_entity_name_entity_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_data_change_logs_tenant_id_changed_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_data_change_logs_tenant_id_changed_by"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_data_change_logs_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "data_change_logs"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_audit_trails_tenant_id_table_name_record_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_audit_trails_tenant_id_operation"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_audit_trails_tenant_id_timestamp"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_audit_trails_tenant_id_user_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_audit_trails_tenant_id"`);
    await queryRunner.query(`DROP TABLE "audit_trails"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_activity_logs_tenant_id_timestamp"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_activity_logs_tenant_id_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_activity_logs_tenant_id_entity_type_entity_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_activity_logs_tenant_id_type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_activity_logs_tenant_id_category"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_activity_logs_tenant_id_severity"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_activity_logs_tenant_id_session_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_activity_logs_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "activity_logs"`);
    await queryRunner.query(`DROP TYPE "public"."activity_logs_severity_enum"`);
    await queryRunner.query(`DROP TYPE "public"."activity_logs_category_enum"`);
    await queryRunner.query(`DROP TYPE "public"."activity_logs_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_maintenance_records_tenant_id_equipment_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_maintenance_records_tenant_id_start_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_maintenance_records_tenant_id_type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_maintenance_records_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "maintenance_records"`);
    await queryRunner.query(
      `DROP TYPE "public"."maintenance_records_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_maintenance_schedules_tenant_id_equipment_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_maintenance_schedules_tenant_id_scheduled_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_maintenance_schedules_tenant_id_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_maintenance_schedules_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "maintenance_schedules"`);
    await queryRunner.query(
      `DROP TYPE "public"."maintenance_schedules_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."maintenance_schedules_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_equipment_tenant_id_equipment_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_equipment_tenant_id_work_center_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_equipment_tenant_id_department_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_equipment_tenant_id_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_equipment_tenant_id_type"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_equipment_tenant_id"`);
    await queryRunner.query(`DROP TABLE "equipment"`);
    await queryRunner.query(`DROP TYPE "public"."equipment_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."equipment_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_production_calendar_tenant_id_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_production_calendar_tenant_id_is_working_day"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_production_calendar_tenant_id_is_holiday"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_production_calendar_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "production_calendar"`);
    await queryRunner.query(
      `DROP TYPE "public"."production_calendar_day_of_week_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_shift_exceptions_tenant_id_shift_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_shift_exceptions_tenant_id_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_shift_exceptions_tenant_id_type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_shift_exceptions_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "shift_exceptions"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_shift_assignments_tenant_id_shift_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_shift_assignments_tenant_id_worker_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_shift_assignments_tenant_id_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_shift_assignments_tenant_id_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_shift_assignments_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "shift_assignments"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_shifts_tenant_id_shift_code"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_shifts_tenant_id_type"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_shifts_tenant_id_department_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_shifts_tenant_id_is_active"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_shifts_tenant_id"`);
    await queryRunner.query(`DROP TABLE "shifts"`);
    await queryRunner.query(`DROP TYPE "public"."shifts_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_non_conformance_reports_tenant_id_report_number"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_non_conformance_reports_tenant_id_report_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_non_conformance_reports_tenant_id_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_non_conformance_reports_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "non_conformance_reports"`);
    await queryRunner.query(
      `DROP TYPE "public"."non_conformance_reports_severity_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_quality_control_plans_tenant_id_product_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_quality_control_plans_tenant_id_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_quality_control_plans_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "quality_control_plans"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_quality_inspections_tenant_id_work_order_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_quality_inspections_tenant_id_production_order_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_quality_inspections_tenant_id_inspection_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_quality_inspections_tenant_id_result"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_quality_inspections_tenant_id_type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_quality_inspections_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "quality_inspections"`);
    await queryRunner.query(
      `DROP TYPE "public"."quality_inspections_result_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."quality_inspections_type_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_quality_metrics_tenant_id_metric_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_quality_metrics_tenant_id_product_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_quality_metrics_tenant_id_type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_quality_metrics_tenant_id_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_quality_metrics_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "quality_metrics"`);
    await queryRunner.query(`DROP TYPE "public"."quality_metrics_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_suppliers_tenant_id_supplier_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_suppliers_tenant_id_name"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_suppliers_tenant_id_email"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_suppliers_tenant_id_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_suppliers_tenant_id_type"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_suppliers_tenant_id"`);
    await queryRunner.query(`DROP TABLE "suppliers"`);
    await queryRunner.query(`DROP TYPE "public"."suppliers_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."suppliers_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_time_clock_entries_tenant_id_worker_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_time_clock_entries_tenant_id_clock_in"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_time_clock_entries_tenant_id_clock_out"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_time_clock_entries_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "time_clock_entries"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_worker_schedules_tenant_id_worker_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_worker_schedules_tenant_id_shift_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_worker_schedules_tenant_id_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_worker_schedules_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "worker_schedules"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_workers_tenant_id_employee_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_workers_tenant_id_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_workers_tenant_id_department_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_workers_tenant_id_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_workers_tenant_id_shift_type"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_workers_tenant_id"`);
    await queryRunner.query(`DROP TABLE "workers"`);
    await queryRunner.query(`DROP TYPE "public"."workers_shift_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."workers_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_orders_tenant_id_work_order_number"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_orders_tenant_id_production_order_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_orders_tenant_id_work_center_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_orders_tenant_id_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_orders_tenant_id_scheduled_start_date"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_work_orders_tenant_id"`);
    await queryRunner.query(`DROP TABLE "work_orders"`);
    await queryRunner.query(`DROP TYPE "public"."work_orders_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_task_time_logs_tenant_id_task_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_task_time_logs_tenant_id_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_task_time_logs_tenant_id_start_time"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_task_time_logs_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "task_time_logs"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_tasks_tenant_id_task_number"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_tasks_tenant_id_work_order_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_tasks_tenant_id_assigned_to_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_tasks_tenant_id_work_center_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_tasks_tenant_id_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_tasks_tenant_id_priority"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_tasks_tenant_id_type"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_tasks_tenant_id_scheduled_start_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_tasks_tenant_id_due_date"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_tasks_tenant_id"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_production_orders_tenant_id_order_number"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_production_orders_tenant_id_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_production_orders_tenant_id_planned_start_date_planned_end_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_production_orders_tenant_id_priority"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_production_orders_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "production_orders"`);
    await queryRunner.query(
      `DROP TYPE "public"."production_orders_status_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_customer_order_lines_tenant_id_customer_order_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_customer_order_lines_tenant_id_product_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_customer_order_lines_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "customer_order_lines"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_customer_orders_tenant_id_order_number"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_customer_orders_tenant_id_customer_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_customer_orders_tenant_id_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_customer_orders_tenant_id_order_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_customer_orders_tenant_id_required_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_customer_orders_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "customer_orders"`);
    await queryRunner.query(
      `DROP TYPE "public"."customer_orders_priority_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."customer_orders_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_customers_tenant_id_customer_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_customers_tenant_id_name"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_customers_tenant_id_email"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_customers_tenant_id_status"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_customers_tenant_id"`);
    await queryRunner.query(`DROP TABLE "customers"`);
    await queryRunner.query(`DROP TYPE "public"."customers_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."customers_payment_terms_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_products_tenant_id_sku"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_products_tenant_id_name"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_products_tenant_id_type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_products_tenant_id_is_active"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_products_tenant_id"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TYPE "public"."products_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_routings_tenant_id_product_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_routings_tenant_id_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_routings_tenant_id_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_routings_tenant_id_effective_date"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_routings_tenant_id"`);
    await queryRunner.query(`DROP TABLE "routings"`);
    await queryRunner.query(`DROP TYPE "public"."routings_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_production_steps_tenant_id_step_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_production_steps_tenant_id_routing_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_production_steps_tenant_id_work_center_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_production_steps_tenant_id_sequence_number"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_production_steps_tenant_id_type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_production_steps_tenant_id_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_production_steps_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "production_steps"`);
    await queryRunner.query(
      `DROP TYPE "public"."production_steps_status_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."production_steps_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_tenant_id_product_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_tenant_id_warehouse_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_tenant_id_location_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_tenant_id_lot_number"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_tenant_id_status"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_inventory_tenant_id"`);
    await queryRunner.query(`DROP TABLE "inventory"`);
    await queryRunner.query(`DROP TYPE "public"."inventory_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_bom_components_tenant_id_bill_of_materials_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_bom_components_tenant_id_component_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_bom_components_tenant_id_sequence"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_bom_components_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "bom_components"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_bills_of_materials_tenant_id_product_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_bills_of_materials_tenant_id_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_bills_of_materials_tenant_id_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_bills_of_materials_tenant_id_effective_date"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_bills_of_materials_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "bills_of_materials"`);
    await queryRunner.query(
      `DROP TYPE "public"."bills_of_materials_status_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_users_tenant_id_email"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_users_tenant_id_username"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_users_tenant_id_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_users_tenant_id_department_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_users_tenant_id"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_tenants_slug"`);
    await queryRunner.query(`DROP TABLE "tenants"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_user_roles_tenant_id_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_user_roles_tenant_id_role_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_user_roles_tenant_id"`);
    await queryRunner.query(`DROP TABLE "user_roles"`);
    await queryRunner.query(`DROP INDEX "public"."idx_roles_tenant_id_code"`);
    await queryRunner.query(`DROP INDEX "public"."idx_roles_tenant_id_name"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_roles_tenant_id_is_system"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_roles_tenant_id"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_departments_tenant_id_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_departments_tenant_id_name"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_departments_tenant_id_parent_department_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_departments_tenant_id_is_active"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_departments_tenant_id"`);
    await queryRunner.query(`DROP TABLE "departments"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_centers_tenant_id_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_centers_tenant_id_name"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_centers_tenant_id_department_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_centers_tenant_id_type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_centers_tenant_id_is_active"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_work_centers_tenant_id"`);
    await queryRunner.query(`DROP TABLE "work_centers"`);
    await queryRunner.query(`DROP TYPE "public"."work_centers_type_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_units_of_measure_tenant_id_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_units_of_measure_tenant_id_category"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_units_of_measure_tenant_id_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_units_of_measure_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "units_of_measure"`);
    await queryRunner.query(
      `DROP TYPE "public"."units_of_measure_category_enum"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_categories_tenant_id_code"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_categories_tenant_id_name"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_categories_tenant_id_parent_category_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_categories_tenant_id_is_active"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_categories_tenant_id"`,
    );
    await queryRunner.query(`DROP TABLE "product_categories"`);
  }
}
