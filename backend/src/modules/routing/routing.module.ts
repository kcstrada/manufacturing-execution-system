import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Routing } from '../../entities/routing.entity';
import { ProductionStep } from '../../entities/production-step.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Routing, ProductionStep])],
  controllers: [],
  providers: [],
  exports: [],
})
export class RoutingModule {}