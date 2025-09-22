import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillOfMaterials, BOMComponent } from '../../entities/bill-of-materials.entity';
import { Product } from '../../entities/product.entity';
import { UnitOfMeasure } from '../../entities/unit-of-measure.entity';
import { BOMController } from './controllers/bom.controller';
import { BOMService } from './services/bom.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BillOfMaterials,
      BOMComponent,
      Product,
      UnitOfMeasure,
    ]),
  ],
  controllers: [BOMController],
  providers: [BOMService],
  exports: [BOMService],
})
export class BOMModule {}