import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderStateMachineService } from './services/order-state-machine.service';
import { OrderWorkflowListener } from './listeners/order-workflow.listener';
import { CustomerOrder, CustomerOrderLine } from '../../entities/customer-order.entity';
import { OrderStateTransition } from '../../entities/order-state-transition.entity';
import { OrderRepository, OrderLineRepository } from '../../repositories/order.repository';
import { Product } from '../../entities/product.entity';
import { Customer } from '../../entities/customer.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerOrder,
      CustomerOrderLine,
      OrderStateTransition,
      Product,
      Customer,
      User,
    ]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepository,
    OrderLineRepository,
    OrderStateMachineService,
    OrderWorkflowListener,
  ],
  exports: [OrderService, OrderStateMachineService],
})
export class OrderModule {}