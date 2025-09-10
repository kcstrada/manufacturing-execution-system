import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Inventory } from '../../entities/inventory.entity';
import { InventoryTransaction } from '../../entities/inventory-transaction.entity';
import { InventoryRepository } from '../../repositories/inventory.repository';
import { InventoryTransactionRepository } from '../../repositories/inventory-transaction.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inventory,
      InventoryTransaction,
    ]),
  ],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    InventoryRepository,
    InventoryTransactionRepository,
  ],
  exports: [InventoryService],
})
export class InventoryModule {}