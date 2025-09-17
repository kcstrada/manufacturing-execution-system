import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  HttpStatus,
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
import { ProductSearchService } from '../services/product-search.service';
import { ProductSearchDto } from '../dto/product-search.dto';
import { SearchResultDto } from '../dto/search-result.dto';
import { Product } from '../../../entities/product.entity';

@ApiTags('product-search')
@Controller('api/v1/products/search')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class ProductSearchController {
  private readonly logger = new Logger(ProductSearchController.name);

  constructor(
    private readonly searchService: ProductSearchService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Search products with advanced filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully',
    type: SearchResultDto,
  })
  async search(
    @Query() searchDto: ProductSearchDto,
    @CurrentUser() user: User,
  ): Promise<SearchResultDto> {
    this.logger.log(`Searching products with query: ${searchDto.query || 'all'}`);
    return this.searchService.searchProducts(searchDto, user.tenantId);
  }

  @Get('autocomplete')
  @ApiOperation({ summary: 'Autocomplete product search' })
  @ApiQuery({
    name: 'query',
    type: String,
    description: 'Search query (minimum 2 characters)',
    required: true,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    description: 'Maximum number of results',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Autocomplete results retrieved successfully',
    type: [Product],
  })
  async autocomplete(
    @Query('query') query: string,
    @Query('limit') limit = 10,
    @CurrentUser() user: User,
  ): Promise<Product[]> {
    return this.searchService.autocomplete(query, user.tenantId, limit);
  }

  @Get('similar/:id')
  @ApiOperation({ summary: 'Find similar products' })
  @ApiParam({ name: 'id', type: String, description: 'Product ID' })
  @ApiQuery({
    name: 'limit',
    type: Number,
    description: 'Maximum number of results',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Similar products retrieved successfully',
    type: [Product],
  })
  async findSimilar(
    @Param('id') id: string,
    @Query('limit') limit = 10,
    @CurrentUser() user: User,
  ): Promise<Product[]> {
    return this.searchService.findSimilarProducts(id, user.tenantId, limit);
  }
}