import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from './services/product.service';
import { ProductController } from './controllers/product.controller';
import { Product } from '../../entities/product.entity';
import { ProductCategory } from '../../entities/product-category.entity';
import { UnitOfMeasure } from '../../entities/unit-of-measure.entity';
import { BillOfMaterials } from '../../entities/bill-of-materials.entity';
import { Routing } from '../../entities/routing.entity';
import { ProductRevision } from '../../entities/product-revision.entity';
import { ProductTemplate } from '../../entities/product-template.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductCategory,
      UnitOfMeasure,
      BillOfMaterials,
      Routing,
      ProductRevision,
      ProductTemplate,
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}