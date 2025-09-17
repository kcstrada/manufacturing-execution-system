import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { AuthModule } from '../../auth/auth.module';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryForecastingService } from './services/inventory-forecasting.service';
import { StockAlertService } from './services/stock-alert.service';
import { StockAlertListener } from './listeners/stock-alert.listener';
import { Inventory } from '../../entities/inventory.entity';
import { InventoryTransaction } from '../../entities/inventory-transaction.entity';
import { CustomerOrder } from '../../entities/customer-order.entity';
import { Product } from '../../entities/product.entity';
import { StockAlert } from '../../entities/stock-alert.entity';
import { InventoryRepository } from '../../repositories/inventory.repository';
import { InventoryTransactionRepository } from '../../repositories/inventory-transaction.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inventory,
      InventoryTransaction,
      CustomerOrder,
      Product,
      StockAlert,
    ]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    BullModule.registerQueue({ name: 'notifications' }, { name: 'email' }),
    ClsModule,
    AuthModule,
  ],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    InventoryForecastingService,
    StockAlertService,
    StockAlertListener,
    InventoryRepository,
    InventoryTransactionRepository,
  ],
  exports: [InventoryService, InventoryForecastingService, StockAlertService],
})
export class InventoryModule {}
