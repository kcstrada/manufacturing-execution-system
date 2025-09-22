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
import { BOMService } from '../services/bom.service';
import { BillOfMaterials } from '../../../entities/bill-of-materials.entity';
import { CreateBOMDto } from '../dto/create-bom.dto';
import { UpdateBOMDto } from '../dto/update-bom.dto';
import { BOMQueryDto } from '../dto/bom-query.dto';
import { BOMResponseDto, BOMExplosionDto } from '../dto/bom-response.dto';

@ApiTags('bom')
@Controller('api/v1/bom')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class BOMController {
  private readonly logger = new Logger(BOMController.name);

  constructor(
    private readonly bomService: BOMService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new BOM' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'BOM created successfully',
    type: BillOfMaterials,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or circular dependency detected',
  })
  async create(
    @Body() createBOMDto: CreateBOMDto,
    @CurrentUser() user: User,
  ): Promise<BillOfMaterials> {
    this.logger.log(`Creating BOM for product: ${createBOMDto.productId}`);
    return this.bomService.create(createBOMDto, user.tenantId, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all BOMs with filtering' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of BOMs retrieved successfully',
  })
  async findAll(
    @Query() queryDto: BOMQueryDto,
    @CurrentUser() user: User,
  ): Promise<{
    items: BillOfMaterials[];
    total: number;
  }> {
    return this.bomService.findAll(queryDto, user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get BOM by ID' })
  @ApiParam({ name: 'id', type: String, description: 'BOM ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'BOM retrieved successfully',
    type: BillOfMaterials,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'BOM not found',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<BillOfMaterials> {
    return this.bomService.findOne(id, user.tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update BOM' })
  @ApiParam({ name: 'id', type: String, description: 'BOM ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'BOM updated successfully',
    type: BillOfMaterials,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'BOM not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot modify active BOM components',
  })
  async update(
    @Param('id') id: string,
    @Body() updateBOMDto: UpdateBOMDto,
    @CurrentUser() user: User,
  ): Promise<BillOfMaterials> {
    return this.bomService.update(id, updateBOMDto, user.tenantId, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete BOM (soft delete)' })
  @ApiParam({ name: 'id', type: String, description: 'BOM ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'BOM deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete default or active BOM',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.bomService.remove(id, user.tenantId);
  }

  @Get(':id/explode')
  @ApiOperation({ summary: 'Explode BOM to show multi-level structure' })
  @ApiParam({ name: 'id', type: String, description: 'BOM ID' })
  @ApiQuery({ name: 'quantity', required: false, type: Number, description: 'Quantity to explode' })
  @ApiQuery({ name: 'maxLevel', required: false, type: Number, description: 'Maximum explosion level' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'BOM explosion retrieved successfully',
    type: BOMExplosionDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Circular reference detected or max level exceeded',
  })
  async explodeBOM(
    @Param('id') id: string,
    @Query('quantity') quantity = 1,
    @Query('maxLevel') maxLevel = 10,
    @CurrentUser() user: User,
  ): Promise<BOMExplosionDto> {
    this.logger.log(`Exploding BOM ${id} with quantity ${quantity}`);
    return this.bomService.explodeBOM(id, user.tenantId, quantity, maxLevel);
  }

  @Post(':id/copy')
  @ApiOperation({ summary: 'Copy BOM to create new version' })
  @ApiParam({ name: 'id', type: String, description: 'BOM ID to copy' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'BOM copied successfully',
    type: BillOfMaterials,
  })
  async copyBOM(
    @Param('id') id: string,
    @Body('productId') productId: string,
    @CurrentUser() user: User,
  ): Promise<BillOfMaterials> {
    this.logger.log(`Copying BOM ${id} to product ${productId}`);
    return this.bomService.copyBOM(id, productId, user.tenantId, user.id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate BOM' })
  @ApiParam({ name: 'id', type: String, description: 'BOM ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'BOM activated successfully',
    type: BillOfMaterials,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'BOM already active or has no components',
  })
  async activateBOM(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<BillOfMaterials> {
    this.logger.log(`Activating BOM ${id}`);
    return this.bomService.activateBOM(id, user.tenantId, user.id);
  }

  @Get(':id1/compare/:id2')
  @ApiOperation({ summary: 'Compare two BOMs' })
  @ApiParam({ name: 'id1', type: String, description: 'First BOM ID' })
  @ApiParam({ name: 'id2', type: String, description: 'Second BOM ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'BOM comparison retrieved successfully',
  })
  async compareBOMs(
    @Param('id1') id1: string,
    @Param('id2') id2: string,
    @CurrentUser() user: User,
  ): Promise<any> {
    this.logger.log(`Comparing BOMs ${id1} and ${id2}`);
    return this.bomService.compareBOMs(id1, id2, user.tenantId);
  }

  @Get('component/:componentId/where-used')
  @ApiOperation({ summary: 'Get where-used list for a component' })
  @ApiParam({ name: 'componentId', type: String, description: 'Component product ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Where-used list retrieved successfully',
    type: [BillOfMaterials],
  })
  async getWhereUsed(
    @Param('componentId') componentId: string,
    @CurrentUser() user: User,
  ): Promise<BillOfMaterials[]> {
    this.logger.log(`Getting where-used for component ${componentId}`);
    return this.bomService.getWhereUsed(componentId, user.tenantId);
  }
}