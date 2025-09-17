import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Product } from '../entities/product.entity';
import { WorkOrder } from '../entities/work-order.entity';
import { Inventory } from '../entities/inventory.entity';
import { ProductionOrder } from '../entities/production-order.entity';
import { QualityMetric } from '../entities/quality-metric.entity';

// Repositories
import { ProductRepository } from './product.repository';
import { WorkOrderRepository } from './work-order.repository';
import { InventoryRepository } from './inventory.repository';
import { ProductionOrderRepository } from './production-order.repository';
import { QualityMetricRepository } from './quality-metric.repository';

const entities = [
  Product,
  WorkOrder,
  Inventory,
  ProductionOrder,
  QualityMetric,
];

const repositories = [
  ProductRepository,
  WorkOrderRepository,
  InventoryRepository,
  ProductionOrderRepository,
  QualityMetricRepository,
];

@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  providers: repositories,
  exports: repositories,
})
export class RepositoriesModule {}
