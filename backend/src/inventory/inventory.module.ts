import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialConsumptionService } from './services/material-consumption.service';
import { Inventory } from '../entities/inventory.entity';
import { InventoryTransaction } from '../entities/inventory-transaction.entity';
import {
  BillOfMaterials,
  BOMComponent,
} from '../entities/bill-of-materials.entity';
import { Product } from '../entities/product.entity';
import { CustomerOrderLine } from '../entities/customer-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inventory,
      InventoryTransaction,
      BillOfMaterials,
      BOMComponent,
      Product,
      CustomerOrderLine,
    ]),
  ],
  providers: [MaterialConsumptionService],
  exports: [MaterialConsumptionService],
})
export class InventoryModule {}
