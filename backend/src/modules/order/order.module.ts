import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { CustomerOrder, CustomerOrderLine } from '../../entities/customer-order.entity';
import { OrderRepository, OrderLineRepository } from '../../repositories/order.repository';
import { Product } from '../../entities/product.entity';
import { Customer } from '../../entities/customer.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerOrder,
      CustomerOrderLine,
      Product,
      Customer,
      User,
    ]),
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepository,
    OrderLineRepository,
  ],
  exports: [OrderService],
})
export class OrderModule {}