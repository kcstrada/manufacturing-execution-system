import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillOfMaterials } from '../../entities/bill-of-materials.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BillOfMaterials])],
  controllers: [],
  providers: [],
  exports: [],
})
export class BOMModule {}