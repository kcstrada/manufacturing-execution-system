import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private dataSource: DataSource) {}

  async seed() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if data already exists
      const existingTenants = await queryRunner.query(
        'SELECT COUNT(*) FROM tenants',
      );
      if (existingTenants[0].count > 0) {
        this.logger.warn('Seed data already exists. Skipping...');
        await queryRunner.commitTransaction();
        return;
      }

      this.logger.log('Creating seed data...');

      // 1. Create Tenants
      const [tenant1] = await queryRunner.query(`
        INSERT INTO tenants (slug, name, description, website, subdomain, settings, billing, is_active)
        VALUES 
        ('acme-manufacturing', 'ACME Manufacturing Co.', 'Leading manufacturer of industrial equipment', 
         'https://acme-mfg.example.com', 'acme', 
         '{"timezone": "America/New_York", "dateFormat": "MM/DD/YYYY", "currency": "USD", "language": "en"}',
         '{"plan": "enterprise", "seats": 100, "billingCycle": "monthly"}', true)
        RETURNING id
      `);

      // 2. Create Departments
      const departments = await queryRunner.query(
        `
        INSERT INTO departments (tenant_id, code, name, description, location, cost_center, version, is_active)
        VALUES 
        ($1, 'PROD', 'Production', 'Main production department', 'Building A', 'CC-1000', 1, true),
        ($1, 'QA', 'Quality Assurance', 'Quality control and testing', 'Building A', 'CC-2000', 1, true),
        ($1, 'MAINT', 'Maintenance', 'Equipment maintenance department', 'Building B', 'CC-3000', 1, true),
        ($1, 'WHSE', 'Warehouse', 'Inventory and logistics', 'Building C', 'CC-4000', 1, true)
        RETURNING id
      `,
        [tenant1.id],
      );

      // 3. Create Roles
      const roles = await queryRunner.query(
        `
        INSERT INTO roles (tenant_id, name, code, description, permissions, is_system, version, is_active)
        VALUES 
        ($1, 'Administrator', 'ADMIN', 'Full system access', '{"all": true}', true, 1, true),
        ($1, 'Production Manager', 'PROD_MGR', 'Manages production operations', 
         '{"production": ["read", "write", "delete"]}', false, 1, true),
        ($1, 'Quality Inspector', 'QA_INSP', 'Performs quality inspections', 
         '{"quality": ["read", "write"]}', false, 1, true),
        ($1, 'Machine Operator', 'OPERATOR', 'Operates production equipment', 
         '{"tasks": ["read", "update"]}', false, 1, true)
        RETURNING id
      `,
        [tenant1.id],
      );

      // 4. Create Users
      const users = await queryRunner.query(
        `
        INSERT INTO users (tenant_id, email, username, first_name, last_name, phone, position, 
                          employee_id, department_id, status, preferences, version, is_active)
        VALUES 
        ($1, 'admin@acme-mfg.com', 'admin', 'System', 'Administrator', '555-0100', 
         'System Administrator', 'EMP001', $2, 'active', 
         '{"theme": "light", "notifications": true}', 1, true),
        ($1, 'john.smith@acme-mfg.com', 'jsmith', 'John', 'Smith', '555-0101', 
         'Production Manager', 'EMP002', $2, 'active', '{}', 1, true),
        ($1, 'jane.doe@acme-mfg.com', 'jdoe', 'Jane', 'Doe', '555-0102', 
         'Quality Inspector', 'EMP003', $3, 'active', '{}', 1, true),
        ($1, 'bob.wilson@acme-mfg.com', 'bwilson', 'Bob', 'Wilson', '555-0103', 
         'Machine Operator', 'EMP004', $2, 'active', '{}', 1, true)
        RETURNING id
      `,
        [tenant1.id, departments[0].id, departments[1].id],
      );

      // 5. Assign Roles to Users
      await queryRunner.query(
        `
        INSERT INTO user_roles (tenant_id, user_id, role_id, assigned_by, version, is_active)
        VALUES 
        ($1, $2, $3, $2, 1, true),
        ($1, $4, $5, $2, 1, true),
        ($1, $6, $7, $2, 1, true),
        ($1, $8, $9, $4, 1, true)
      `,
        [
          tenant1.id,
          users[0].id,
          roles[0].id,
          users[1].id,
          roles[1].id,
          users[2].id,
          roles[2].id,
          users[3].id,
          roles[3].id,
        ],
      );

      // 6. Create Units of Measure
      const uoms = await queryRunner.query(
        `
        INSERT INTO units_of_measure (tenant_id, code, name, description, category, symbol, 
                                      conversion_factor, decimal_places, version, is_active)
        VALUES 
        ($1, 'PCS', 'Pieces', 'Individual pieces', 'quantity', 'pcs', 1, 0, 1, true),
        ($1, 'KG', 'Kilogram', 'Weight in kilograms', 'weight', 'kg', 1, 2, 1, true),
        ($1, 'M', 'Meter', 'Length in meters', 'length', 'm', 1, 2, 1, true),
        ($1, 'L', 'Liter', 'Volume in liters', 'volume', 'L', 1, 2, 1, true),
        ($1, 'HR', 'Hour', 'Time in hours', 'time', 'hr', 1, 2, 1, true)
        RETURNING id
      `,
        [tenant1.id],
      );

      // 7. Create Product Categories
      const categories = await queryRunner.query(
        `
        INSERT INTO product_categories (tenant_id, code, name, description, sort_order, version, is_active)
        VALUES 
        ($1, 'FIN', 'Finished Goods', 'Completed products ready for sale', 1, 1, true),
        ($1, 'SEMI', 'Semi-Finished Goods', 'Partially completed products', 2, 1, true),
        ($1, 'RAW', 'Raw Materials', 'Basic materials for production', 3, 1, true),
        ($1, 'COMP', 'Components', 'Component parts', 4, 1, true)
        RETURNING id
      `,
        [tenant1.id],
      );

      // 8. Create Products
      const products = await queryRunner.query(
        `
        INSERT INTO products (tenant_id, sku, name, description, type, category_id, 
                             unit_of_measure_id, specifications, cost, 
                             price, is_active, version)
        VALUES 
        ($1, 'WIDGET-001', 'Industrial Widget A', 'High-performance industrial widget', 
         'finished_good', $2, $3, 
         '{"weight": "2.5 kg", "dimensions": "10x10x5 cm", "material": "Steel"}',
         150.00, 250.00, true, 1),
        ($1, 'GADGET-001', 'Premium Gadget X', 'Advanced electronic gadget', 
         'finished_good', $2, $3,
         '{"weight": "1.2 kg", "power": "12V DC"}',
         200.00, 350.00, true, 1),
        ($1, 'SUB-ASM-001', 'Sub-Assembly Module A', 'Core sub-assembly module', 
         'component', $4, $3, '{}', 50.00, 0, true, 1),
        ($1, 'STEEL-SHEET-001', 'Steel Sheet 2mm', '2mm thick steel sheet', 
         'raw_material', $5, $6, '{}', 25.00, 0, true, 1),
        ($1, 'PLASTIC-RESIN-001', 'ABS Plastic Resin', 'ABS thermoplastic resin', 
         'raw_material', $5, $6, '{}', 5.00, 0, true, 1),
        ($1, 'SCREW-M6-20', 'M6x20 Hex Screw', 'Metric hex screw M6x20mm', 
         'component', $7, $3, '{}', 0.10, 0, true, 1),
        ($1, 'BEARING-6204', 'Ball Bearing 6204', 'Deep groove ball bearing', 
         'component', $7, $3, '{}', 8.00, 0, true, 1)
        RETURNING id
      `,
        [
          tenant1.id,
          categories[0].id,
          uoms[0].id,
          categories[1].id,
          categories[2].id,
          uoms[1].id,
          categories[3].id,
        ],
      );

      // 9. Create Work Centers
      const workCenters = await queryRunner.query(
        `
        INSERT INTO work_centers (tenant_id, code, name, description, type, department_id,
                                 capacity_per_hour, setup_cost_per_hour, run_cost_per_hour,
                                 number_of_machines, number_of_operators, efficiency, 
                                 utilization, version, is_active)
        VALUES 
        ($1, 'WC-MACH-01', 'CNC Machining Center 1', 'Primary CNC machining station', 
         'production', $2, 10, 75.00, 50.00, 2, 2, 85, 80, 1, true),
        ($1, 'WC-ASM-01', 'Assembly Station 1', 'Manual assembly workstation', 
         'assembly', $2, 20, 30.00, 25.00, 0, 3, 90, 85, 1, true),
        ($1, 'WC-QC-01', 'Quality Control Station', 'Quality inspection station', 
         'quality', $3, 30, 0, 35.00, 0, 2, 100, 60, 1, true)
        RETURNING id
      `,
        [tenant1.id, departments[0].id, departments[1].id],
      );

      // 10. Create Suppliers
      await queryRunner.query(
        `
        INSERT INTO suppliers (tenant_id, code, name, type, contact_name, email, phone,
                              address, city, state, postal_code, country, payment_terms,
                              lead_time_days, minimum_order_value, rating, status, version, is_active)
        VALUES 
        ($1, 'SUP-001', 'Steel Supply Co.', 'material', 'Mike Johnson', 
         'mike@steelsupply.com', '555-1000', '123 Industrial Way', 
         'Pittsburgh', 'PA', '15201', 'USA', 'Net 30', 7, 500, 4.5, 'active', 1, true)
      `,
        [tenant1.id],
      );

      // 11. Create Customers
      await queryRunner.query(
        `
        INSERT INTO customers (tenant_id, code, name, contact_name, email, phone,
                              address, city, state, postal_code, country, credit_limit,
                              payment_terms, tax_id, status, version, is_active)
        VALUES 
        ($1, 'CUST-001', 'TechCorp Industries', 'Alice Brown', 'alice@techcorp.com', 
         '555-3000', '789 Tech Plaza', 'San Francisco', 'CA', '94105', 'USA',
         50000, 'net30', 'TC123456', 'active', 1, true),
        ($1, 'CUST-002', 'Global Manufacturing Ltd.', 'David Chen', 'david@globalmfg.com',
         '555-4000', '321 Factory Road', 'Chicago', 'IL', '60601', 'USA',
         75000, 'net45', 'GM789012', 'active', 1, true)
        RETURNING id
      `,
        [tenant1.id],
      );

      // 12. Create Inventory
      await queryRunner.query(
        `
        INSERT INTO inventory (tenant_id, product_id, warehouse_code, location,
                              quantity_on_hand, quantity_available, quantity_reserved,
                              reorder_point, reorder_quantity, unit_of_measure_id,
                              last_count_date, status, version, is_active)
        VALUES 
        ($1, $2, 'WH-01', 'A-01-01', 50, 45, 5, 20, 100, $3, CURRENT_DATE, 'available', 1, true),
        ($1, $4, 'WH-01', 'B-02-03', 500, 500, 0, 100, 1000, $5, CURRENT_DATE, 'available', 1, true)
      `,
        [tenant1.id, products[0].id, uoms[0].id, products[3].id, uoms[1].id],
      );

      // 13. Create Shifts
      await queryRunner.query(
        `
        INSERT INTO shifts (tenant_id, code, name, type, start_time, end_time,
                           break_minutes, days_of_week, is_active, version)
        VALUES 
        ($1, 'SHIFT-DAY', 'Day Shift', 'day', '06:00', '14:00', 30,
         '["monday", "tuesday", "wednesday", "thursday", "friday"]', true, 1)
      `,
        [tenant1.id],
      );

      // 14. Create Workers
      await queryRunner.query(
        `
        INSERT INTO workers (tenant_id, employee_id, first_name, last_name, email, phone,
                            department_id, position, skills, certifications, hourly_rate,
                            shift_type, status, version, is_active)
        VALUES 
        ($1, 'WRK-001', 'Tom', 'Anderson', 'tom.anderson@acme-mfg.com', '555-5001',
         $2, 'Machine Operator', '["CNC Operation", "Quality Control", "Assembly"]',
         '["CNC Level 2", "Safety Training"]', 25.00, 'day', 'active', 1, true),
        ($1, 'WRK-002', 'Lisa', 'Martinez', 'lisa.martinez@acme-mfg.com', '555-5002',
         $2, 'Assembly Technician', '["Assembly", "Testing", "Packaging"]',
         '["IPC-A-610"]', 22.00, 'day', 'active', 1, true),
        ($1, 'WRK-003', 'James', 'Wilson', 'james.wilson@acme-mfg.com', '555-5003',
         $3, 'Quality Inspector', '["Quality Inspection", "Testing", "Documentation"]',
         '["ISO 9001", "Six Sigma Green Belt"]', 28.00, 'day', 'active', 1, true)
      `,
        [tenant1.id, departments[0].id, departments[1].id],
      );

      // 15. Create Equipment
      await queryRunner.query(
        `
        INSERT INTO equipment (tenant_id, code, name, description, type, manufacturer,
                              model, serial_number, purchase_date, purchase_cost,
                              work_center_id, department_id, status, version, is_active)
        VALUES 
        ($1, 'CNC-001', 'Haas VF-2 CNC Mill', '3-axis CNC milling machine', 'cnc',
         'Haas Automation', 'VF-2', 'VF2-123456', '2020-01-15', 75000,
         $2, $3, 'operational', 1, true)
      `,
        [tenant1.id, workCenters[0].id, departments[0].id],
      );

      // 16. Create Quality Metrics
      await queryRunner.query(
        `
        INSERT INTO quality_metrics (tenant_id, code, name, description, type,
                                     unit_of_measure, target_value, min_value, max_value,
                                     product_id, version, is_active)
        VALUES 
        ($1, 'DIM-TOL', 'Dimensional Tolerance', 'Check dimensional tolerances',
         'dimensional', 'mm', 0, -0.1, 0.1, $2, 1, true)
      `,
        [tenant1.id, products[0].id],
      );

      await queryRunner.commitTransaction();
      this.logger.log('Seed data created successfully');
      this.logger.log('Test credentials:');
      this.logger.log('  Admin: admin@acme-mfg.com');
      this.logger.log('  Manager: john.smith@acme-mfg.com');
      this.logger.log('  Inspector: jane.doe@acme-mfg.com');
      this.logger.log('  Operator: bob.wilson@acme-mfg.com');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to create seed data', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async clearData() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Delete in reverse order of dependencies
      const tables = [
        'activity_logs',
        'quality_metrics',
        'tasks',
        'work_orders',
        'production_orders',
        'customer_order_lines',
        'customer_orders',
        'customers',
        'suppliers',
        'inventory',
        'bom_components',
        'bills_of_materials',
        'routings',
        'production_steps',
        'equipment',
        'workers',
        'shifts',
        'work_centers',
        'products',
        'product_categories',
        'units_of_measure',
        'user_roles',
        'roles',
        'users',
        'departments',
        'tenants',
      ];

      for (const table of tables) {
        await queryRunner.query(`DELETE FROM ${table}`);
      }

      await queryRunner.commitTransaction();
      this.logger.log('Data cleared successfully');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Failed to clear data', error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
