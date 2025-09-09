# Manufacturing Execution System - Entity Relationship Diagram

## Overview
This document describes the complete data model for the Manufacturing Execution System (MES), including all entities, relationships, and constraints.

## Core Entity Groups

### 1. Tenant & Organization
Multi-tenant architecture supporting multiple manufacturing companies.

### 2. User & Authentication
User management, roles, and permissions.

### 3. Product Management
Products, components, bills of materials (BOM).

### 4. Production Planning
Production orders, work orders, scheduling.

### 5. Inventory Management
Raw materials, finished goods, warehouses, stock movements.

### 6. Manufacturing Execution
Work centers, machines, operations, routing.

### 7. Quality Control
Quality checks, inspections, non-conformances.

### 8. Maintenance
Preventive and corrective maintenance.

## Entity Definitions

### 1. Tenant Management

#### Tenant
```
tenant
├── id (UUID, PK)
├── name (VARCHAR(255), NOT NULL)
├── code (VARCHAR(50), UNIQUE, NOT NULL)
├── domain (VARCHAR(255), UNIQUE)
├── status (ENUM: active, suspended, inactive)
├── settings (JSONB)
├── subscription_plan (VARCHAR(50))
├── subscription_expires_at (TIMESTAMP)
├── storage_quota (BIGINT)
├── user_quota (INT)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── deleted_at (TIMESTAMP)
```

### 2. User Management

#### User
```
user
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── email (VARCHAR(255), UNIQUE, NOT NULL)
├── username (VARCHAR(100), UNIQUE)
├── first_name (VARCHAR(100))
├── last_name (VARCHAR(100))
├── phone (VARCHAR(20))
├── department (VARCHAR(100))
├── position (VARCHAR(100))
├── employee_id (VARCHAR(50))
├── status (ENUM: active, inactive, suspended)
├── last_login_at (TIMESTAMP)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── deleted_at (TIMESTAMP)
```

#### Role
```
role
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── name (VARCHAR(100), NOT NULL)
├── code (VARCHAR(50), UNIQUE)
├── description (TEXT)
├── permissions (JSONB)
├── is_system (BOOLEAN, DEFAULT false)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### UserRole
```
user_role
├── id (UUID, PK)
├── user_id (UUID, FK -> user.id)
├── role_id (UUID, FK -> role.id)
├── assigned_at (TIMESTAMP)
└── assigned_by (UUID, FK -> user.id)
```

### 3. Product Management

#### Product
```
product
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── sku (VARCHAR(100), UNIQUE, NOT NULL)
├── name (VARCHAR(255), NOT NULL)
├── description (TEXT)
├── category_id (UUID, FK -> product_category.id)
├── type (ENUM: raw_material, component, finished_good, consumable)
├── unit_of_measure_id (UUID, FK -> unit_of_measure.id)
├── weight (DECIMAL(10,3))
├── dimensions (JSONB) // {length, width, height}
├── specifications (JSONB)
├── cost (DECIMAL(15,2))
├── price (DECIMAL(15,2))
├── lead_time_days (INT)
├── min_stock_level (DECIMAL(15,3))
├── max_stock_level (DECIMAL(15,3))
├── reorder_point (DECIMAL(15,3))
├── reorder_quantity (DECIMAL(15,3))
├── is_active (BOOLEAN, DEFAULT true)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── deleted_at (TIMESTAMP)
```

#### BillOfMaterials (BOM)
```
bill_of_materials
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── product_id (UUID, FK -> product.id)
├── version (INT, NOT NULL)
├── is_active (BOOLEAN, DEFAULT true)
├── effective_date (DATE)
├── expiry_date (DATE)
├── notes (TEXT)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── created_by (UUID, FK -> user.id)
```

#### BOMComponent
```
bom_component
├── id (UUID, PK)
├── bom_id (UUID, FK -> bill_of_materials.id)
├── component_id (UUID, FK -> product.id)
├── quantity (DECIMAL(15,3), NOT NULL)
├── unit_of_measure_id (UUID, FK -> unit_of_measure.id)
├── scrap_percentage (DECIMAL(5,2), DEFAULT 0)
├── notes (TEXT)
└── sequence (INT)
```

### 4. Production Planning

#### ProductionOrder
```
production_order
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── order_number (VARCHAR(50), UNIQUE, NOT NULL)
├── product_id (UUID, FK -> product.id)
├── quantity_ordered (DECIMAL(15,3), NOT NULL)
├── quantity_produced (DECIMAL(15,3), DEFAULT 0)
├── quantity_scrapped (DECIMAL(15,3), DEFAULT 0)
├── unit_of_measure_id (UUID, FK -> unit_of_measure.id)
├── planned_start_date (TIMESTAMP)
├── planned_end_date (TIMESTAMP)
├── actual_start_date (TIMESTAMP)
├── actual_end_date (TIMESTAMP)
├── status (ENUM: draft, planned, released, in_progress, completed, cancelled)
├── priority (INT, DEFAULT 0)
├── customer_order_id (UUID, FK -> customer_order.id)
├── notes (TEXT)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
├── created_by (UUID, FK -> user.id)
└── approved_by (UUID, FK -> user.id)
```

#### WorkOrder
```
work_order
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── work_order_number (VARCHAR(50), UNIQUE, NOT NULL)
├── production_order_id (UUID, FK -> production_order.id)
├── work_center_id (UUID, FK -> work_center.id)
├── operation_id (UUID, FK -> operation.id)
├── sequence (INT, NOT NULL)
├── quantity_ordered (DECIMAL(15,3), NOT NULL)
├── quantity_completed (DECIMAL(15,3), DEFAULT 0)
├── quantity_scrapped (DECIMAL(15,3), DEFAULT 0)
├── planned_start_time (TIMESTAMP)
├── planned_end_time (TIMESTAMP)
├── actual_start_time (TIMESTAMP)
├── actual_end_time (TIMESTAMP)
├── setup_time_minutes (INT)
├── run_time_minutes (INT)
├── status (ENUM: pending, ready, in_progress, completed, on_hold, cancelled)
├── assigned_to (UUID, FK -> user.id)
├── notes (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### 5. Manufacturing Execution

#### WorkCenter
```
work_center
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── code (VARCHAR(50), UNIQUE, NOT NULL)
├── name (VARCHAR(255), NOT NULL)
├── description (TEXT)
├── department_id (UUID, FK -> department.id)
├── type (ENUM: machine, manual, assembly, quality_control)
├── capacity_per_hour (DECIMAL(10,2))
├── efficiency_percentage (DECIMAL(5,2), DEFAULT 100)
├── cost_per_hour (DECIMAL(10,2))
├── setup_cost (DECIMAL(10,2))
├── location (VARCHAR(255))
├── is_active (BOOLEAN, DEFAULT true)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### Machine
```
machine
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── work_center_id (UUID, FK -> work_center.id)
├── machine_code (VARCHAR(50), UNIQUE, NOT NULL)
├── name (VARCHAR(255), NOT NULL)
├── manufacturer (VARCHAR(255))
├── model (VARCHAR(255))
├── serial_number (VARCHAR(100))
├── purchase_date (DATE)
├── installation_date (DATE)
├── warranty_expiry_date (DATE)
├── specifications (JSONB)
├── capacity (DECIMAL(10,2))
├── status (ENUM: operational, maintenance, breakdown, idle)
├── last_maintenance_date (DATE)
├── next_maintenance_date (DATE)
├── total_operating_hours (DECIMAL(10,2))
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### Operation
```
operation
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── code (VARCHAR(50), UNIQUE, NOT NULL)
├── name (VARCHAR(255), NOT NULL)
├── description (TEXT)
├── work_center_id (UUID, FK -> work_center.id)
├── setup_time_minutes (INT)
├── run_time_per_unit_minutes (DECIMAL(10,2))
├── instructions (TEXT)
├── tools_required (JSONB)
├── skills_required (JSONB)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### Routing
```
routing
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── product_id (UUID, FK -> product.id)
├── version (INT, NOT NULL)
├── is_active (BOOLEAN, DEFAULT true)
├── effective_date (DATE)
├── expiry_date (DATE)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### RoutingStep
```
routing_step
├── id (UUID, PK)
├── routing_id (UUID, FK -> routing.id)
├── operation_id (UUID, FK -> operation.id)
├── work_center_id (UUID, FK -> work_center.id)
├── sequence (INT, NOT NULL)
├── setup_time_minutes (INT)
├── run_time_per_unit_minutes (DECIMAL(10,2))
├── move_time_minutes (INT)
├── queue_time_minutes (INT)
├── notes (TEXT)
└── created_at (TIMESTAMP)
```

### 6. Inventory Management

#### Warehouse
```
warehouse
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── code (VARCHAR(50), UNIQUE, NOT NULL)
├── name (VARCHAR(255), NOT NULL)
├── type (ENUM: raw_material, finished_goods, mixed)
├── address (TEXT)
├── manager_id (UUID, FK -> user.id)
├── capacity (DECIMAL(15,2))
├── is_active (BOOLEAN, DEFAULT true)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### Location
```
location
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── warehouse_id (UUID, FK -> warehouse.id)
├── code (VARCHAR(50), UNIQUE, NOT NULL)
├── name (VARCHAR(255))
├── aisle (VARCHAR(10))
├── rack (VARCHAR(10))
├── shelf (VARCHAR(10))
├── bin (VARCHAR(10))
├── type (ENUM: storage, staging, quarantine, shipping, receiving)
├── capacity (DECIMAL(10,2))
├── is_active (BOOLEAN, DEFAULT true)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### Inventory
```
inventory
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── product_id (UUID, FK -> product.id)
├── warehouse_id (UUID, FK -> warehouse.id)
├── location_id (UUID, FK -> location.id)
├── lot_number (VARCHAR(100))
├── serial_number (VARCHAR(100))
├── quantity_on_hand (DECIMAL(15,3), NOT NULL)
├── quantity_available (DECIMAL(15,3), NOT NULL)
├── quantity_reserved (DECIMAL(15,3), DEFAULT 0)
├── unit_of_measure_id (UUID, FK -> unit_of_measure.id)
├── expiry_date (DATE)
├── last_counted_date (DATE)
├── last_counted_quantity (DECIMAL(15,3))
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### StockMovement
```
stock_movement
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── movement_number (VARCHAR(50), UNIQUE, NOT NULL)
├── type (ENUM: receipt, issue, transfer, adjustment, return)
├── product_id (UUID, FK -> product.id)
├── quantity (DECIMAL(15,3), NOT NULL)
├── unit_of_measure_id (UUID, FK -> unit_of_measure.id)
├── from_warehouse_id (UUID, FK -> warehouse.id)
├── from_location_id (UUID, FK -> location.id)
├── to_warehouse_id (UUID, FK -> warehouse.id)
├── to_location_id (UUID, FK -> location.id)
├── reference_type (VARCHAR(50)) // production_order, purchase_order, etc.
├── reference_id (UUID)
├── lot_number (VARCHAR(100))
├── serial_number (VARCHAR(100))
├── reason (TEXT)
├── performed_by (UUID, FK -> user.id)
├── performed_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### 7. Quality Control

#### QualityCheck
```
quality_check
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── check_number (VARCHAR(50), UNIQUE, NOT NULL)
├── type (ENUM: incoming, in_process, final, random)
├── work_order_id (UUID, FK -> work_order.id)
├── product_id (UUID, FK -> product.id)
├── lot_number (VARCHAR(100))
├── sample_size (INT)
├── total_quantity (DECIMAL(15,3))
├── passed_quantity (DECIMAL(15,3))
├── failed_quantity (DECIMAL(15,3))
├── status (ENUM: pending, in_progress, passed, failed, conditional)
├── checked_by (UUID, FK -> user.id)
├── checked_at (TIMESTAMP)
├── notes (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### QualityCheckItem
```
quality_check_item
├── id (UUID, PK)
├── quality_check_id (UUID, FK -> quality_check.id)
├── parameter (VARCHAR(255), NOT NULL)
├── specification (VARCHAR(255))
├── min_value (DECIMAL(15,3))
├── max_value (DECIMAL(15,3))
├── actual_value (DECIMAL(15,3))
├── unit_of_measure (VARCHAR(50))
├── result (ENUM: pass, fail, na)
├── notes (TEXT)
└── created_at (TIMESTAMP)
```

#### NonConformance
```
non_conformance
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── ncr_number (VARCHAR(50), UNIQUE, NOT NULL)
├── quality_check_id (UUID, FK -> quality_check.id)
├── product_id (UUID, FK -> product.id)
├── work_order_id (UUID, FK -> work_order.id)
├── quantity (DECIMAL(15,3))
├── defect_type (VARCHAR(100))
├── severity (ENUM: critical, major, minor)
├── description (TEXT)
├── root_cause (TEXT)
├── corrective_action (TEXT)
├── preventive_action (TEXT)
├── status (ENUM: open, investigating, resolved, closed)
├── reported_by (UUID, FK -> user.id)
├── reported_at (TIMESTAMP)
├── resolved_by (UUID, FK -> user.id)
├── resolved_at (TIMESTAMP)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### 8. Maintenance

#### MaintenanceSchedule
```
maintenance_schedule
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── machine_id (UUID, FK -> machine.id)
├── schedule_number (VARCHAR(50), UNIQUE, NOT NULL)
├── type (ENUM: preventive, calibration, inspection)
├── frequency (ENUM: daily, weekly, monthly, quarterly, yearly, hours_based)
├── frequency_value (INT) // For hours_based
├── last_performed_date (DATE)
├── next_due_date (DATE)
├── instructions (TEXT)
├── estimated_duration_hours (DECIMAL(5,2))
├── is_active (BOOLEAN, DEFAULT true)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### MaintenanceOrder
```
maintenance_order
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── order_number (VARCHAR(50), UNIQUE, NOT NULL)
├── machine_id (UUID, FK -> machine.id)
├── schedule_id (UUID, FK -> maintenance_schedule.id)
├── type (ENUM: preventive, corrective, emergency)
├── priority (ENUM: low, medium, high, critical)
├── description (TEXT)
├── planned_start_date (TIMESTAMP)
├── planned_end_date (TIMESTAMP)
├── actual_start_date (TIMESTAMP)
├── actual_end_date (TIMESTAMP)
├── status (ENUM: scheduled, in_progress, completed, cancelled)
├── assigned_to (UUID, FK -> user.id)
├── work_performed (TEXT)
├── parts_used (JSONB)
├── cost (DECIMAL(10,2))
├── downtime_hours (DECIMAL(5,2))
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── created_by (UUID, FK -> user.id)
```

### 9. Supporting Entities

#### UnitOfMeasure
```
unit_of_measure
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── code (VARCHAR(20), UNIQUE, NOT NULL)
├── name (VARCHAR(100), NOT NULL)
├── category (ENUM: weight, length, volume, quantity, time)
├── base_unit (BOOLEAN, DEFAULT false)
├── conversion_factor (DECIMAL(15,6))
├── base_unit_id (UUID, FK -> unit_of_measure.id)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### Department
```
department
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── code (VARCHAR(50), UNIQUE, NOT NULL)
├── name (VARCHAR(255), NOT NULL)
├── manager_id (UUID, FK -> user.id)
├── parent_department_id (UUID, FK -> department.id)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### ProductCategory
```
product_category
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── code (VARCHAR(50), UNIQUE, NOT NULL)
├── name (VARCHAR(255), NOT NULL)
├── parent_category_id (UUID, FK -> product_category.id)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### Shift
```
shift
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── name (VARCHAR(100), NOT NULL)
├── start_time (TIME, NOT NULL)
├── end_time (TIME, NOT NULL)
├── break_minutes (INT, DEFAULT 0)
├── days_of_week (JSONB) // [1,2,3,4,5] for Mon-Fri
├── is_active (BOOLEAN, DEFAULT true)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### Customer
```
customer
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── customer_code (VARCHAR(50), UNIQUE, NOT NULL)
├── name (VARCHAR(255), NOT NULL)
├── type (ENUM: company, individual)
├── email (VARCHAR(255))
├── phone (VARCHAR(20))
├── address (TEXT)
├── city (VARCHAR(100))
├── state (VARCHAR(100))
├── country (VARCHAR(100))
├── postal_code (VARCHAR(20))
├── tax_id (VARCHAR(50))
├── payment_terms (VARCHAR(100))
├── credit_limit (DECIMAL(15,2))
├── is_active (BOOLEAN, DEFAULT true)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### Supplier
```
supplier
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── supplier_code (VARCHAR(50), UNIQUE, NOT NULL)
├── name (VARCHAR(255), NOT NULL)
├── type (ENUM: manufacturer, distributor, service)
├── email (VARCHAR(255))
├── phone (VARCHAR(20))
├── address (TEXT)
├── city (VARCHAR(100))
├── state (VARCHAR(100))
├── country (VARCHAR(100))
├── postal_code (VARCHAR(20))
├── tax_id (VARCHAR(50))
├── payment_terms (VARCHAR(100))
├── lead_time_days (INT)
├── minimum_order_value (DECIMAL(15,2))
├── is_active (BOOLEAN, DEFAULT true)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

#### CustomerOrder
```
customer_order
├── id (UUID, PK)
├── tenant_id (UUID, FK -> tenant.id)
├── order_number (VARCHAR(50), UNIQUE, NOT NULL)
├── customer_id (UUID, FK -> customer.id)
├── order_date (DATE, NOT NULL)
├── required_date (DATE)
├── promised_date (DATE)
├── status (ENUM: draft, confirmed, in_production, shipped, delivered, cancelled)
├── total_amount (DECIMAL(15,2))
├── notes (TEXT)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
└── created_by (UUID, FK -> user.id)
```

#### CustomerOrderLine
```
customer_order_line
├── id (UUID, PK)
├── customer_order_id (UUID, FK -> customer_order.id)
├── line_number (INT, NOT NULL)
├── product_id (UUID, FK -> product.id)
├── quantity (DECIMAL(15,3), NOT NULL)
├── unit_price (DECIMAL(15,2), NOT NULL)
├── discount_percentage (DECIMAL(5,2), DEFAULT 0)
├── tax_percentage (DECIMAL(5,2), DEFAULT 0)
├── total_amount (DECIMAL(15,2), NOT NULL)
├── promised_date (DATE)
├── notes (TEXT)
└── created_at (TIMESTAMP)
```

## Relationships

### One-to-Many Relationships
- tenant → users
- tenant → products
- tenant → production_orders
- tenant → warehouses
- product → bom_components (as component)
- product → inventory
- production_order → work_orders
- work_center → machines
- work_center → operations
- warehouse → locations
- warehouse → inventory
- quality_check → quality_check_items
- machine → maintenance_schedules
- machine → maintenance_orders
- customer → customer_orders
- customer_order → customer_order_lines
- department → work_centers
- routing → routing_steps

### Many-to-Many Relationships
- user ↔ role (through user_role)
- product ↔ supplier (through product_supplier)
- work_order ↔ user (assignments)

### Self-Referential Relationships
- department → parent_department
- product_category → parent_category
- unit_of_measure → base_unit

## Indexes

### Performance Indexes
```sql
-- Tenant isolation
CREATE INDEX idx_tenant_id ON all_tables (tenant_id);

-- Lookup indexes
CREATE INDEX idx_product_sku ON product (tenant_id, sku);
CREATE INDEX idx_production_order_number ON production_order (tenant_id, order_number);
CREATE INDEX idx_work_order_number ON work_order (tenant_id, work_order_number);
CREATE INDEX idx_inventory_product ON inventory (tenant_id, product_id, warehouse_id);
CREATE INDEX idx_stock_movement_product ON stock_movement (tenant_id, product_id);

-- Date range queries
CREATE INDEX idx_production_order_dates ON production_order (tenant_id, planned_start_date, planned_end_date);
CREATE INDEX idx_work_order_dates ON work_order (tenant_id, planned_start_time, planned_end_time);

-- Status filtering
CREATE INDEX idx_production_order_status ON production_order (tenant_id, status);
CREATE INDEX idx_work_order_status ON work_order (tenant_id, status);
CREATE INDEX idx_quality_check_status ON quality_check (tenant_id, status);
```

## Constraints

### Business Rules
1. **Multi-tenancy**: Every table includes tenant_id for data isolation
2. **Soft Deletes**: Critical entities use deleted_at for soft deletion
3. **Audit Trail**: All entities track created_at and updated_at
4. **Status Workflow**: Status transitions follow defined state machines
5. **Inventory Validation**: quantity_available = quantity_on_hand - quantity_reserved
6. **BOM Validation**: Active BOMs cannot overlap date ranges
7. **Routing Validation**: Active routings cannot overlap date ranges
8. **Work Order Sequencing**: Work orders must follow routing sequence

### Data Integrity
```sql
-- Ensure positive quantities
ALTER TABLE inventory ADD CONSTRAINT chk_positive_quantity 
  CHECK (quantity_on_hand >= 0 AND quantity_available >= 0);

-- Ensure valid date ranges
ALTER TABLE bill_of_materials ADD CONSTRAINT chk_bom_dates 
  CHECK (effective_date < expiry_date OR expiry_date IS NULL);

-- Ensure valid percentages
ALTER TABLE bom_component ADD CONSTRAINT chk_scrap_percentage 
  CHECK (scrap_percentage >= 0 AND scrap_percentage <= 100);

-- Ensure work order quantities
ALTER TABLE work_order ADD CONSTRAINT chk_work_order_quantities 
  CHECK (quantity_completed <= quantity_ordered);
```

## Migration Strategy

### Phase 1: Core Entities
1. Tenant and User management
2. Product and BOM
3. Basic inventory

### Phase 2: Production
1. Production orders
2. Work orders
3. Work centers and operations

### Phase 3: Quality & Maintenance
1. Quality checks
2. Non-conformances
3. Maintenance management

### Phase 4: Advanced Features
1. Customer orders
2. Supplier management
3. Advanced reporting

## Performance Considerations

1. **Partitioning**: Consider partitioning large tables by tenant_id
2. **Archiving**: Implement data archiving for historical records
3. **Read Replicas**: Use read replicas for reporting queries
4. **Caching**: Cache frequently accessed reference data
5. **Batch Processing**: Process large operations in batches
6. **Async Processing**: Use queues for long-running operations