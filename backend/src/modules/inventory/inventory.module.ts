import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { AuthModule } from '../../auth/auth.module';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryForecastingService } from './services/inventory-forecasting.service';
import { Inventory } from '../../entities/inventory.entity';
import { InventoryTransaction } from '../../entities/inventory-transaction.entity';
import { CustomerOrder } from '../../entities/customer-order.entity';
import { Product } from '../../entities/product.entity';
import { InventoryRepository } from '../../repositories/inventory.repository';
import { InventoryTransactionRepository } from '../../repositories/inventory-transaction.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inventory,
      InventoryTransaction,
      CustomerOrder,
      Product,
    ]),
    ClsModule,
    AuthModule,
  ],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    InventoryForecastingService,
    InventoryRepository,
    InventoryTransactionRepository,
  ],
  exports: [InventoryService, InventoryForecastingService],
})
export class InventoryModule {}