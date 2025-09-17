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

      this.logger.log('Creating minimal seed data...');

      // 1. Create a basic tenant
      const [tenant1] = await queryRunner.query(`
        INSERT INTO tenants (slug, name, is_active)
        VALUES ('demo', 'Demo Company', true)
        RETURNING id
      `);

      // 2. Create basic departments
      await queryRunner.query(
        `
        INSERT INTO departments (tenant_id, code, name, is_active, version)
        VALUES 
        ($1, 'PROD', 'Production', true, 1),
        ($1, 'QA', 'Quality', true, 1),
        ($1, 'WHSE', 'Warehouse', true, 1)
      `,
        [tenant1.id],
      );

      // 3. Create basic roles
      await queryRunner.query(
        `
        INSERT INTO roles (tenant_id, name, code, description, permissions, is_active, version)
        VALUES 
        ($1, 'Administrator', 'ADMIN', 'Full access', '{"all": true}', true, 1),
        ($1, 'Operator', 'OPERATOR', 'Basic access', '{"read": true}', true, 1)
      `,
        [tenant1.id],
      );

      // 4. Create basic units of measure
      await queryRunner.query(
        `
        INSERT INTO units_of_measure (tenant_id, name, code, symbol, category, is_active, version)
        VALUES 
        ($1, 'Pieces', 'PCS', 'pcs', 'quantity', true, 1),
        ($1, 'Kilogram', 'KG', 'kg', 'weight', true, 1)
      `,
        [tenant1.id],
      );

      // 5. Create basic product categories
      await queryRunner.query(
        `
        INSERT INTO product_categories (tenant_id, name, code, is_active, version)
        VALUES 
        ($1, 'Finished Goods', 'FIN', true, 1),
        ($1, 'Raw Materials', 'RAW', true, 1)
      `,
        [tenant1.id],
      );

      await queryRunner.commitTransaction();
      this.logger.log('Basic seed data created successfully');
      this.logger.log('Test tenant: slug=demo');
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
