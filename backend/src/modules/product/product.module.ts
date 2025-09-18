import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductService } from './services/product.service';
import { ProductCategoryService } from './services/product-category.service';
import { ProductSearchService } from './services/product-search.service';
import { ProductTemplateService } from './services/product-template.service';
import { ProductController } from './controllers/product.controller';
import { ProductCategoryController } from './controllers/product-category.controller';
import { ProductSearchController } from './controllers/product-search.controller';
import { ProductTemplateController } from './controllers/product-template.controller';
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
    ProductTemplateController,
  ],
  providers: [
    ProductService,
    ProductCategoryService,
    ProductSearchService,
    ProductTemplateService,
  ],
  exports: [
    ProductService,
    ProductCategoryService,
    ProductSearchService,
    ProductTemplateService,
  ],
})
export class ProductModule {}