import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../tenants/tenant.guard';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { User } from '../../../entities/user.entity';
import { ProductCategoryService } from '../services/product-category.service';
import { ProductCategory } from '../../../entities/product-category.entity';
import { Product } from '../../../entities/product.entity';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryQueryDto } from '../dto/category-query.dto';

@ApiTags('product-categories')
@Controller('api/v1/product-categories')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class ProductCategoryController {
  private readonly logger = new Logger(ProductCategoryController.name);

  constructor(
    private readonly categoryService: ProductCategoryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product category' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Category created successfully',
    type: ProductCategory,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Category with this code already exists',
  })
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @CurrentUser() user: User,
  ): Promise<ProductCategory> {
    this.logger.log(`Creating category: ${createCategoryDto.code}`);
    return this.categoryService.create(createCategoryDto, user.tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product categories with optional filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of categories retrieved successfully',
  })
  async findAll(
    @Query() queryDto: CategoryQueryDto,
    @CurrentUser() user: User,
  ): Promise<{
    items: ProductCategory[];
    total: number;
    tree?: ProductCategory[];
  }> {
    return this.categoryService.findAll(queryDto, user.tenantId);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get category tree structure' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive categories',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category tree retrieved successfully',
    type: [ProductCategory],
  })
  async getCategoryTree(
    @Query('includeInactive') includeInactive?: boolean,
    @CurrentUser() user?: User,
  ): Promise<ProductCategory[]> {
    return this.categoryService.getCategoryTree(
      user!.tenantId,
      includeInactive,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product category by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category retrieved successfully',
    type: ProductCategory,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<ProductCategory> {
    return this.categoryService.findOne(id, user.tenantId);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get product category by code' })
  @ApiParam({ name: 'code', type: String, description: 'Category code' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category retrieved successfully',
    type: ProductCategory,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  async findByCode(
    @Param('code') code: string,
    @CurrentUser() user: User,
  ): Promise<ProductCategory> {
    return this.categoryService.findByCode(code, user.tenantId);
  }

  @Get(':id/path')
  @ApiOperation({ summary: 'Get category path (breadcrumb)' })
  @ApiParam({ name: 'id', type: String, description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category path retrieved successfully',
    type: [ProductCategory],
  })
  async getCategoryPath(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<ProductCategory[]> {
    return this.categoryService.getCategoryPath(id, user.tenantId);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Get products in category' })
  @ApiParam({ name: 'id', type: String, description: 'Category ID' })
  @ApiQuery({
    name: 'includeSubcategories',
    required: false,
    type: Boolean,
    description: 'Include products from subcategories',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Products retrieved successfully',
    type: [Product],
  })
  async getProductsByCategory(
    @Param('id') id: string,
    @Query('includeSubcategories') includeSubcategories = true,
    @CurrentUser() user: User,
  ): Promise<Product[]> {
    return this.categoryService.getProductsByCategory(
      id,
      user.tenantId,
      includeSubcategories,
    );
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get category statistics' })
  @ApiParam({ name: 'id', type: String, description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  async getCategoryStatistics(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<{
    totalProducts: number;
    activeProducts: number;
    subcategoriesCount: number;
    totalValue: number;
  }> {
    return this.categoryService.getCategoryStatistics(id, user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product category' })
  @ApiParam({ name: 'id', type: String, description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category updated successfully',
    type: ProductCategory,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @CurrentUser() user: User,
  ): Promise<ProductCategory> {
    return this.categoryService.update(id, updateCategoryDto, user.tenantId);
  }

  @Put(':id/move')
  @ApiOperation({ summary: 'Move category to new parent' })
  @ApiParam({ name: 'id', type: String, description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category moved successfully',
    type: ProductCategory,
  })
  async moveCategory(
    @Param('id') id: string,
    @Body('parentCategoryId') parentCategoryId: string | null,
    @CurrentUser() user: User,
  ): Promise<ProductCategory> {
    return this.categoryService.moveCategory(id, parentCategoryId, user.tenantId);
  }

  @Put('reorder')
  @ApiOperation({ summary: 'Reorder categories within same parent' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories reordered successfully',
  })
  async reorderCategories(
    @Body() categoryOrders: { id: string; sortOrder: number }[],
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.categoryService.reorderCategories(categoryOrders, user.tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product category (soft delete)' })
  @ApiParam({ name: 'id', type: String, description: 'Category ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete category with subcategories or products',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.categoryService.remove(id, user.tenantId);
  }
}