import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequireRoles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { InventoryService } from './inventory.service';
import { Inventory } from '../../entities/inventory.entity';
import { InventoryTransaction } from '../../entities/inventory-transaction.entity';
import {
  CreateInventoryDto,
  CreateInventoryTransactionDto,
  AdjustInventoryDto,
  TransferInventoryDto,
} from './dto/create-inventory.dto';
import {
  UpdateInventoryDto,
  UpdateInventoryQuantitiesDto,
  UpdateInventoryStatusDto,
  ReserveInventoryDto,
  ReleaseInventoryDto,
} from './dto/update-inventory.dto';
import {
  InventoryQueryDto,
  InventoryTransactionQueryDto,
  InventoryValuationQueryDto,
} from './dto/inventory-query.dto';
import {
  ForecastDto,
  ForecastResultDto,
  DemandAnalysisDto,
  ReorderPointDto,
  StockoutPredictionDto,
  CalculateReorderPointsDto,
  PredictStockoutsDto,
} from './dto/forecast.dto';
import { InventoryForecastingService } from './services/inventory-forecasting.service';
import { StockAlertService } from './services/stock-alert.service';
import { StockAlert } from '../../entities/stock-alert.entity';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly forecastingService: InventoryForecastingService,
    private readonly stockAlertService: StockAlertService,
  ) {}

  // CRUD Operations
  @Post()
  @RequireRoles('Admin', 'Manager', 'InventoryClerk')
  @ApiOperation({ summary: 'Create new inventory item' })
  @ApiResponse({
    status: 201,
    description: 'Inventory created successfully',
    type: Inventory,
  })
  async create(
    @Body() createInventoryDto: CreateInventoryDto,
  ): Promise<Inventory> {
    return this.inventoryService.create(createInventoryDto);
  }

  @Get()
  @RequireRoles('Admin', 'Manager', 'InventoryClerk', 'Viewer')
  @ApiOperation({ summary: 'Get all inventory items' })
  @ApiResponse({ status: 200, description: 'List of inventory items' })
  async findAll(
    @Query() query: InventoryQueryDto,
  ): Promise<{ data: Inventory[]; total: number }> {
    return this.inventoryService.findAll(query);
  }

  @Get(':id')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk', 'Viewer')
  @ApiOperation({ summary: 'Get inventory item by ID' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory item found',
    type: Inventory,
  })
  async findOne(@Param('id') id: string): Promise<Inventory> {
    return this.inventoryService.findOne(id);
  }

  @Patch(':id')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk')
  @ApiOperation({ summary: 'Update inventory item' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory updated successfully',
    type: Inventory,
  })
  async update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ): Promise<Inventory> {
    return this.inventoryService.update(id, updateInventoryDto);
  }

  @Delete(':id')
  @RequireRoles('Admin')
  @ApiOperation({ summary: 'Delete inventory item' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiResponse({ status: 204, description: 'Inventory deleted successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.inventoryService.remove(id);
  }

  // Stock Tracking Methods
  @Get('product/:productId')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk', 'Viewer')
  @ApiOperation({ summary: 'Get inventory by product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Inventory items for product' })
  async findByProduct(
    @Param('productId') productId: string,
  ): Promise<Inventory[]> {
    return this.inventoryService.findByProduct(productId);
  }

  @Get('warehouse/:warehouseCode')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk', 'Viewer')
  @ApiOperation({ summary: 'Get inventory by warehouse' })
  @ApiParam({ name: 'warehouseCode', description: 'Warehouse code' })
  @ApiResponse({ status: 200, description: 'Inventory items for warehouse' })
  async findByWarehouse(
    @Param('warehouseCode') warehouseCode: string,
  ): Promise<Inventory[]> {
    return this.inventoryService.findByWarehouse(warehouseCode);
  }

  @Get('warehouse/:warehouseCode/location/:locationCode')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk', 'Viewer')
  @ApiOperation({ summary: 'Get inventory by location' })
  @ApiParam({ name: 'warehouseCode', description: 'Warehouse code' })
  @ApiParam({ name: 'locationCode', description: 'Location code' })
  @ApiResponse({ status: 200, description: 'Inventory items for location' })
  async findByLocation(
    @Param('warehouseCode') warehouseCode: string,
    @Param('locationCode') locationCode: string,
  ): Promise<Inventory[]> {
    return this.inventoryService.findByLocation(warehouseCode, locationCode);
  }

  // Quantity Management
  @Get('product/:productId/available')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk', 'Viewer')
  @ApiOperation({ summary: 'Get available quantity for product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({
    name: 'warehouseCode',
    required: false,
    description: 'Warehouse code',
  })
  @ApiResponse({ status: 200, description: 'Available quantity' })
  async getAvailableQuantity(
    @Param('productId') productId: string,
    @Query('warehouseCode') warehouseCode?: string,
  ): Promise<{ quantity: number }> {
    const quantity = await this.inventoryService.getAvailableQuantity(
      productId,
      warehouseCode,
    );
    return { quantity };
  }

  @Get('product/:productId/total')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk', 'Viewer')
  @ApiOperation({ summary: 'Get total quantity for product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({
    name: 'warehouseCode',
    required: false,
    description: 'Warehouse code',
  })
  @ApiResponse({ status: 200, description: 'Total quantity' })
  async getTotalQuantity(
    @Param('productId') productId: string,
    @Query('warehouseCode') warehouseCode?: string,
  ): Promise<{ quantity: number }> {
    const quantity = await this.inventoryService.getTotalQuantity(
      productId,
      warehouseCode,
    );
    return { quantity };
  }

  @Patch(':id/quantities')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk')
  @ApiOperation({ summary: 'Update inventory quantities' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiResponse({
    status: 200,
    description: 'Quantities updated successfully',
    type: Inventory,
  })
  async updateQuantities(
    @Param('id') id: string,
    @Body() quantities: UpdateInventoryQuantitiesDto,
  ): Promise<Inventory> {
    return this.inventoryService.updateQuantities(id, quantities);
  }

  // Reservation Management
  @Post('reserve')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk')
  @ApiOperation({ summary: 'Reserve inventory' })
  @ApiResponse({
    status: 200,
    description: 'Inventory reserved successfully',
    type: Inventory,
  })
  async reserveInventory(
    @Body()
    body: {
      productId: string;
      warehouseCode: string;
      locationCode: string;
      reserveDto: ReserveInventoryDto;
    },
  ): Promise<Inventory> {
    const { productId, warehouseCode, locationCode, reserveDto } = body;
    return this.inventoryService.reserveInventory(
      productId,
      warehouseCode,
      locationCode,
      reserveDto,
    );
  }

  @Post('release')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk')
  @ApiOperation({ summary: 'Release reserved inventory' })
  @ApiResponse({
    status: 200,
    description: 'Inventory released successfully',
    type: Inventory,
  })
  async releaseInventory(
    @Body()
    body: {
      productId: string;
      warehouseCode: string;
      locationCode: string;
      releaseDto: ReleaseInventoryDto;
    },
  ): Promise<Inventory> {
    const { productId, warehouseCode, locationCode, releaseDto } = body;
    return this.inventoryService.releaseInventory(
      productId,
      warehouseCode,
      locationCode,
      releaseDto,
    );
  }

  // Stock Adjustments
  @Post('adjust')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk')
  @ApiOperation({ summary: 'Adjust inventory' })
  @ApiResponse({
    status: 200,
    description: 'Inventory adjusted successfully',
    type: InventoryTransaction,
  })
  async adjustInventory(
    @Body()
    body: {
      productId: string;
      warehouseCode: string;
      locationCode: string;
      adjustDto: AdjustInventoryDto;
    },
  ): Promise<InventoryTransaction> {
    const { productId, warehouseCode, locationCode, adjustDto } = body;
    return this.inventoryService.adjustInventory(
      productId,
      warehouseCode,
      locationCode,
      adjustDto,
    );
  }

  // Stock Transfers
  @Post('transfer')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk')
  @ApiOperation({ summary: 'Transfer inventory between locations' })
  @ApiResponse({
    status: 200,
    description: 'Inventory transferred successfully',
  })
  async transferInventory(@Body() transferDto: TransferInventoryDto): Promise<{
    sourceTransaction: InventoryTransaction;
    destinationTransaction: InventoryTransaction;
  }> {
    return this.inventoryService.transferInventory(transferDto);
  }

  // Status Management
  @Patch(':id/status')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk')
  @ApiOperation({ summary: 'Update inventory status' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
    type: Inventory,
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateInventoryStatusDto,
  ): Promise<Inventory> {
    return this.inventoryService.updateStatus(id, statusDto);
  }

  // Expiration Management
  @Get('expired/items')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk', 'Viewer')
  @ApiOperation({ summary: 'Get expired inventory items' })
  @ApiResponse({ status: 200, description: 'List of expired items' })
  async findExpiredItems(): Promise<Inventory[]> {
    return this.inventoryService.findExpiredItems();
  }

  @Get('expiring/items')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk', 'Viewer')
  @ApiOperation({ summary: 'Get expiring inventory items' })
  @ApiQuery({
    name: 'daysAhead',
    required: true,
    description: 'Days ahead to check',
  })
  @ApiResponse({ status: 200, description: 'List of expiring items' })
  async findExpiringItems(
    @Query('daysAhead') daysAhead: number,
  ): Promise<Inventory[]> {
    return this.inventoryService.findExpiringItems(daysAhead);
  }

  // Stock Analysis
  @Get('analysis/low-stock')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk', 'Viewer')
  @ApiOperation({ summary: 'Get low stock items' })
  @ApiQuery({
    name: 'threshold',
    required: true,
    description: 'Stock threshold',
  })
  @ApiResponse({ status: 200, description: 'List of low stock items' })
  async findLowStockItems(
    @Query('threshold') threshold: number,
  ): Promise<Inventory[]> {
    return this.inventoryService.findLowStockItems(threshold);
  }

  @Get('analysis/valuation')
  @RequireRoles('Admin', 'Manager', 'Viewer')
  @ApiOperation({ summary: 'Get inventory valuation' })
  @ApiResponse({ status: 200, description: 'Inventory valuation' })
  async getInventoryValuation(
    @Query() query: InventoryValuationQueryDto,
  ): Promise<
    {
      productId?: string;
      warehouseCode?: string;
      locationCode?: string;
      totalValue: number;
      totalQuantity: number;
    }[]
  > {
    return this.inventoryService.getInventoryValuation(query);
  }

  // Transaction Management
  @Post('transactions')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk')
  @ApiOperation({ summary: 'Create inventory transaction' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
    type: InventoryTransaction,
  })
  async createTransaction(
    @Body() transactionDto: CreateInventoryTransactionDto,
  ): Promise<InventoryTransaction> {
    return this.inventoryService.createTransaction(transactionDto);
  }

  @Get('transactions')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk', 'Viewer')
  @ApiOperation({ summary: 'Get inventory transactions' })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  async findTransactions(
    @Query() query: InventoryTransactionQueryDto,
  ): Promise<{
    data: InventoryTransaction[];
    total: number;
  }> {
    return this.inventoryService.findTransactions(query);
  }

  @Get('transactions/history/:productId')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk', 'Viewer')
  @ApiOperation({ summary: 'Get transaction history for product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({
    name: 'warehouseCode',
    required: false,
    description: 'Warehouse code',
  })
  @ApiQuery({ name: 'days', required: false, description: 'Number of days' })
  @ApiResponse({ status: 200, description: 'Transaction history' })
  async getTransactionHistory(
    @Param('productId') productId: string,
    @Query('warehouseCode') warehouseCode?: string,
    @Query('days') days?: number,
  ): Promise<InventoryTransaction[]> {
    return this.inventoryService.getTransactionHistory(
      productId,
      warehouseCode,
      days,
    );
  }

  // Cycle Counting
  @Post('cycle-count')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk')
  @ApiOperation({ summary: 'Perform cycle count' })
  @ApiResponse({ status: 200, description: 'Cycle count completed' })
  async performCycleCount(
    @Body()
    body: {
      productId: string;
      warehouseCode: string;
      locationCode: string;
      actualQuantity: number;
      notes?: string;
    },
  ): Promise<{
    inventory: Inventory;
    transaction: InventoryTransaction;
  }> {
    const { productId, warehouseCode, locationCode, actualQuantity, notes } =
      body;
    return this.inventoryService.performCycleCount(
      productId,
      warehouseCode,
      locationCode,
      actualQuantity,
      notes,
    );
  }

  // Stock Receipt
  @Post('receive')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk')
  @ApiOperation({ summary: 'Receive stock' })
  @ApiResponse({ status: 200, description: 'Stock received successfully' })
  async receiveStock(
    @Body()
    body: {
      productId: string;
      warehouseCode: string;
      locationCode: string;
      quantity: number;
      referenceType?: string;
      referenceId?: string;
      lotNumber?: string;
      unitCost?: number;
    },
  ): Promise<{
    inventory: Inventory;
    transaction: InventoryTransaction;
  }> {
    const {
      productId,
      warehouseCode,
      locationCode,
      quantity,
      referenceType,
      referenceId,
      lotNumber,
      unitCost,
    } = body;
    return this.inventoryService.receiveStock(
      productId,
      warehouseCode,
      locationCode,
      quantity,
      referenceType,
      referenceId,
      lotNumber,
      unitCost,
    );
  }

  // Stock Issue
  @Post('issue')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk')
  @ApiOperation({ summary: 'Issue stock' })
  @ApiResponse({ status: 200, description: 'Stock issued successfully' })
  async issueStock(
    @Body()
    body: {
      productId: string;
      warehouseCode: string;
      locationCode: string;
      quantity: number;
      referenceType?: string;
      referenceId?: string;
    },
  ): Promise<{
    inventory: Inventory;
    transaction: InventoryTransaction;
  }> {
    const {
      productId,
      warehouseCode,
      locationCode,
      quantity,
      referenceType,
      referenceId,
    } = body;
    return this.inventoryService.issueStock(
      productId,
      warehouseCode,
      locationCode,
      quantity,
      referenceType,
      referenceId,
    );
  }

  // Stock Availability Check
  @Post('check-availability')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk', 'Viewer')
  @ApiOperation({ summary: 'Check stock availability' })
  @ApiResponse({ status: 200, description: 'Stock availability' })
  async checkStockAvailability(
    @Body()
    body: {
      items: Array<{ productId: string; quantity: number }>;
      warehouseCode?: string;
    },
  ): Promise<{
    available: boolean;
    shortages: Array<{
      productId: string;
      required: number;
      available: number;
      shortage: number;
    }>;
  }> {
    return this.inventoryService.checkStockAvailability(
      body.items,
      body.warehouseCode,
    );
  }

  // Bulk Operations
  @Put('bulk/status')
  @RequireRoles('Admin', 'Manager')
  @ApiOperation({ summary: 'Bulk update inventory status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async bulkUpdateStatus(
    @Body()
    body: {
      inventoryIds: string[];
      statusDto: UpdateInventoryStatusDto;
    },
  ): Promise<Inventory[]> {
    return this.inventoryService.bulkUpdateStatus(
      body.inventoryIds,
      body.statusDto,
    );
  }

  @Post('bulk/adjust')
  @RequireRoles('Admin', 'Manager')
  @ApiOperation({ summary: 'Bulk adjust inventory' })
  @ApiResponse({ status: 200, description: 'Inventory adjusted successfully' })
  async bulkAdjust(
    @Body()
    adjustments: Array<{
      productId: string;
      warehouseCode: string;
      locationCode: string;
      adjustment: AdjustInventoryDto;
    }>,
  ): Promise<InventoryTransaction[]> {
    return this.inventoryService.bulkAdjust(adjustments);
  }

  // Forecasting Endpoints
  @Post('forecast/generate')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk', 'Viewer')
  @ApiOperation({ summary: 'Generate inventory forecast based on orders' })
  @ApiResponse({
    status: 200,
    description: 'Forecast generated successfully',
    type: ForecastResultDto,
  })
  async generateForecast(
    @Body() forecastDto: ForecastDto,
  ): Promise<ForecastResultDto> {
    return this.forecastingService.generateForecast(forecastDto);
  }

  @Get('forecast/demand-analysis/:productId')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk', 'Viewer')
  @ApiOperation({ summary: 'Analyze demand patterns for a product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to analyze',
    default: 90,
  })
  @ApiResponse({
    status: 200,
    description: 'Demand analysis completed',
    type: DemandAnalysisDto,
  })
  async analyzeDemandPatterns(
    @Param('productId') productId: string,
    @Query('days') days?: number,
  ): Promise<DemandAnalysisDto> {
    return this.forecastingService.analyzeDemandPatterns(productId, days || 90);
  }

  @Post('forecast/reorder-points')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk')
  @ApiOperation({ summary: 'Calculate optimal reorder points for products' })
  @ApiResponse({
    status: 200,
    description: 'Reorder points calculated',
    type: [ReorderPointDto],
  })
  async calculateReorderPoints(
    @Body() dto: CalculateReorderPointsDto,
  ): Promise<ReorderPointDto[]> {
    return this.forecastingService.calculateOptimalReorderPoints(
      dto.productIds,
      dto.leadTimeDays,
      dto.serviceLevel,
    );
  }

  @Post('forecast/stockout-predictions')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk', 'Viewer')
  @ApiOperation({ summary: 'Predict potential stockouts' })
  @ApiResponse({
    status: 200,
    description: 'Stockout predictions generated',
    type: [StockoutPredictionDto],
  })
  async predictStockouts(
    @Body() dto: PredictStockoutsDto,
  ): Promise<StockoutPredictionDto[]> {
    return this.forecastingService.predictStockouts(
      dto.warehouseCode,
      dto.daysAhead,
    );
  }

  @Get('forecast/stockouts')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk', 'Viewer')
  @ApiOperation({ summary: 'Get current stockout predictions' })
  @ApiQuery({
    name: 'warehouseCode',
    required: false,
    description: 'Warehouse code',
  })
  @ApiQuery({
    name: 'daysAhead',
    required: false,
    description: 'Days ahead to predict',
    default: 14,
  })
  @ApiResponse({
    status: 200,
    description: 'Stockout predictions',
    type: [StockoutPredictionDto],
  })
  async getStockoutPredictions(
    @Query('warehouseCode') warehouseCode?: string,
    @Query('daysAhead') daysAhead?: number,
  ): Promise<StockoutPredictionDto[]> {
    return this.forecastingService.predictStockouts(
      warehouseCode,
      daysAhead || 14,
    );
  }

  // Stock Alert Endpoints
  @Get('alerts')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk', 'Viewer')
  @ApiOperation({ summary: 'Get active stock alerts' })
  @ApiQuery({
    name: 'warehouseCode',
    required: false,
    description: 'Filter by warehouse code',
  })
  @ApiResponse({
    status: 200,
    description: 'Active stock alerts',
    type: [StockAlert],
  })
  async getActiveAlerts(
    @Query('warehouseCode') warehouseCode?: string,
  ): Promise<StockAlert[]> {
    return this.stockAlertService.getActiveAlerts(warehouseCode);
  }

  @Post('alerts/check')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk')
  @ApiOperation({ summary: 'Manually check stock levels and generate alerts' })
  @ApiQuery({
    name: 'warehouseCode',
    required: false,
    description: 'Warehouse code to check',
  })
  @ApiResponse({ status: 200, description: 'Stock check completed' })
  async manualStockCheck(
    @Query('warehouseCode') warehouseCode?: string,
  ): Promise<{ message: string; alertsGenerated: number }> {
    const alerts =
      await this.stockAlertService.performStockCheck(warehouseCode);
    return {
      message: 'Stock check completed',
      alertsGenerated: alerts.length,
    };
  }

  @Post('alerts/check/:productId')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk')
  @ApiOperation({ summary: 'Check stock level for specific product' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiQuery({
    name: 'warehouseCode',
    required: false,
    description: 'Warehouse code',
  })
  @ApiResponse({ status: 200, description: 'Product stock check result' })
  async checkProductStock(
    @Param('productId') productId: string,
    @Query('warehouseCode') warehouseCode?: string,
  ): Promise<{ alert: any | null; message: string }> {
    const alert = await this.stockAlertService.checkProductStock(
      productId,
      warehouseCode,
    );
    return {
      alert,
      message: alert ? 'Stock alert generated' : 'Stock level is acceptable',
    };
  }

  @Patch('alerts/:id/acknowledge')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk')
  @ApiOperation({ summary: 'Acknowledge a stock alert' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({
    status: 200,
    description: 'Alert acknowledged',
    type: StockAlert,
  })
  async acknowledgeAlert(
    @Param('id') alertId: string,
    @Body() body: { acknowledgedBy: string; notes?: string },
  ): Promise<StockAlert> {
    return this.stockAlertService.acknowledgeAlert(
      alertId,
      body.acknowledgedBy,
      body.notes,
    );
  }

  @Patch('alerts/:id/resolve')
  @RequireRoles('Admin', 'Manager', 'InventoryClerk')
  @ApiOperation({ summary: 'Resolve a stock alert' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, description: 'Alert resolved', type: StockAlert })
  async resolveAlert(
    @Param('id') alertId: string,
    @Body() body: { resolvedBy: string; resolution: string },
  ): Promise<StockAlert> {
    return this.stockAlertService.resolveAlert(
      alertId,
      body.resolvedBy,
      body.resolution,
    );
  }

  @Get('alerts/statistics')
  @RequireRoles('Admin', 'Manager', 'Viewer')
  @ApiOperation({ summary: 'Get stock alert statistics' })
  @ApiResponse({ status: 200, description: 'Alert statistics' })
  async getAlertStatistics(): Promise<{
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    bySeverity: Record<string, number>;
  }> {
    return this.stockAlertService.getAlertStatistics();
  }
}
