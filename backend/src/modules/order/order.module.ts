import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderStateMachineService } from './services/order-state-machine.service';
import { OrderToTaskConverterService } from './services/order-to-task-converter.service';
import { OrderWorkflowListener } from './listeners/order-workflow.listener';
import { CustomerOrder, CustomerOrderLine } from '../../entities/customer-order.entity';
import { OrderStateTransition } from '../../entities/order-state-transition.entity';
import { OrderRepository, OrderLineRepository } from '../../repositories/order.repository';
import { Product } from '../../entities/product.entity';
import { Customer } from '../../entities/customer.entity';
import { User } from '../../entities/user.entity';
import { ProductionOrder } from '../../entities/production-order.entity';
import { WorkOrder } from '../../entities/work-order.entity';
import { Task } from '../../entities/task.entity';
import { Routing } from '../../entities/routing.entity';
import { ProductionStep } from '../../entities/production-step.entity';
import { BillOfMaterials } from '../../entities/bill-of-materials.entity';
import { WorkCenter } from '../../entities/work-center.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerOrder,
      CustomerOrderLine,
      OrderStateTransition,
      Product,
      Customer,
      User,
      ProductionOrder,
      WorkOrder,
      Task,
      Routing,
      ProductionStep,
      BillOfMaterials,
      WorkCenter,
    ]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepository,
    OrderLineRepository,
    OrderStateMachineService,
    OrderToTaskConverterService,
    OrderWorkflowListener,
  ],
  exports: [OrderService, OrderStateMachineService, OrderToTaskConverterService],
})
export class OrderModule {}