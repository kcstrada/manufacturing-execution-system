import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { Product } from '../../../entities/product.entity';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully.' })
  @ApiResponse({ status: 409, description: 'Product with this SKU already exists.' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @Request() req: any,
  ): Promise<Product> {
    // TODO: Get tenantId and userId from request after auth is configured
    const tenantId = req.tenantId || 'default-tenant';
    const userId = req.userId || 'system';
    return this.productService.create(createProductDto, tenantId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with filtering' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully.' })
  async findAll(
    @Query() queryDto: ProductQueryDto,
    @Request() req: any,
  ) {
    const tenantId = req.tenantId || 'default-tenant';
    return this.productService.findAll(queryDto, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product found.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<Product> {
    const tenantId = req.tenantId || 'default-tenant';
    return this.productService.findOne(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: any,
  ): Promise<Product> {
    const tenantId = req.tenantId || 'default-tenant';
    const userId = req.userId || 'system';
    return this.productService.update(id, updateProductDto, tenantId, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product (soft delete)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 204, description: 'Product deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 400, description: 'Cannot delete product due to dependencies.' })
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    const tenantId = req.tenantId || 'default-tenant';
    const userId = req.userId || 'system';
    return this.productService.remove(id, tenantId, userId);
  }

  @Post(':id/default-bom/:bomId')
  @ApiOperation({ summary: 'Set default BOM for a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiParam({ name: 'bomId', description: 'BOM ID' })
  @ApiResponse({ status: 200, description: 'Default BOM set successfully.' })
  @ApiResponse({ status: 404, description: 'Product or BOM not found.' })
  async setDefaultBom(
    @Param('id') id: string,
    @Param('bomId') bomId: string,
    @Request() req: any,
  ): Promise<Product> {
    const tenantId = req.tenantId || 'default-tenant';
    const userId = req.userId || 'system';
    return this.productService.setDefaultBom(id, bomId, tenantId, userId);
  }

  @Post(':id/default-routing/:routingId')
  @ApiOperation({ summary: 'Set default routing for a product' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiParam({ name: 'routingId', description: 'Routing ID' })
  @ApiResponse({ status: 200, description: 'Default routing set successfully.' })
  @ApiResponse({ status: 404, description: 'Product or Routing not found.' })
  async setDefaultRouting(
    @Param('id') id: string,
    @Param('routingId') routingId: string,
    @Request() req: any,
  ): Promise<Product> {
    const tenantId = req.tenantId || 'default-tenant';
    const userId = req.userId || 'system';
    return this.productService.setDefaultRouting(id, routingId, tenantId, userId);
  }
}