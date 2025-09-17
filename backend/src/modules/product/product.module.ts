import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from './services/product.service';
import { ProductCategoryService } from './services/product-category.service';
import { ProductSearchService } from './services/product-search.service';
import { ProductController } from './controllers/product.controller';
import { ProductCategoryController } from './controllers/product-category.controller';
import { ProductSearchController } from './controllers/product-search.controller';
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
  controllers: [
    ProductController,
    ProductCategoryController,
    ProductSearchController,
  ],
  providers: [
    ProductService,
    ProductCategoryService,
    ProductSearchService,
  ],
  exports: [
    ProductService,
    ProductCategoryService,
    ProductSearchService,
  ],
})
export class ProductModule {}