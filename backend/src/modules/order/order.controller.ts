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
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto, UpdateOrderStatusDto } from './dto/update-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { GenerateTasksDto, TaskGenerationResultDto } from './dto/generate-tasks.dto';
import { CustomerOrder } from '../../entities/customer-order.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { RequireRoles } from '../../auth/decorators/roles.decorator';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @RequireRoles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Order has been successfully created.',
    type: CustomerOrder,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Order number already exists.',
  })
  async create(@Body() createOrderDto: CreateOrderDto): Promise<CustomerOrder> {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  @RequireRoles('admin', 'manager', 'sales', 'operator')
  @ApiOperation({ summary: 'Get all orders with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all orders.',
  })
  async findAll(@Query() query: OrderQueryDto) {
    return this.orderService.findAll(query);
  }

  @Get('stats')
  @RequireRoles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return order statistics.',
  })
  async getStats(@Query('customerId') customerId?: string) {
    return this.orderService.getOrderStats(customerId);
  }

  @Get('attention-required')
  @RequireRoles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Get orders requiring attention' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return orders requiring attention.',
    type: [CustomerOrder],
  })
  async getOrdersRequiringAttention(): Promise<CustomerOrder[]> {
    return this.orderService.getOrdersRequiringAttention();
  }

  @Get('export')
  @RequireRoles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Export orders to CSV' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return CSV file.',
  })
  async exportToCSV(@Query() query: OrderQueryDto, @Res() res: Response) {
    const csv = await this.orderService.exportToCSV(query);
    
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="orders-${Date.now()}.csv"`,
    });
    
    res.send(csv);
  }

  @Get(':id')
  @RequireRoles('admin', 'manager', 'sales', 'operator')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the order.',
    type: CustomerOrder,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found.',
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CustomerOrder> {
    return this.orderService.findOne(id);
  }

  @Get('by-number/:orderNumber')
  @RequireRoles('admin', 'manager', 'sales', 'operator')
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiParam({ name: 'orderNumber', type: 'string' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the order.',
    type: CustomerOrder,
  })
  async findByOrderNumber(@Param('orderNumber') orderNumber: string): Promise<CustomerOrder | null> {
    return this.orderService.findByOrderNumber(orderNumber);
  }

  @Get('customer/:customerId')
  @RequireRoles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Get orders by customer' })
  @ApiParam({ name: 'customerId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return customer orders.',
    type: [CustomerOrder],
  })
  async findByCustomer(
    @Param('customerId', ParseUUIDPipe) customerId: string
  ): Promise<CustomerOrder[]> {
    return this.orderService.findByCustomer(customerId);
  }

  @Patch(':id')
  @RequireRoles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Update an order' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order has been successfully updated.',
    type: CustomerOrder,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot update shipped or delivered orders.',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderDto: UpdateOrderDto
  ): Promise<CustomerOrder> {
    return this.orderService.update(id, updateOrderDto);
  }

  @Patch(':id/status')
  @RequireRoles('admin', 'manager', 'sales')
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order status has been successfully updated.',
    type: CustomerOrder,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition.',
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() statusDto: UpdateOrderStatusDto
  ): Promise<CustomerOrder> {
    return this.orderService.updateStatus(id, statusDto);
  }

  @Post(':id/confirm')
  @RequireRoles('admin', 'manager', 'sales')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm an order' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order has been confirmed.',
    type: CustomerOrder,
  })
  async confirm(@Param('id', ParseUUIDPipe) id: string): Promise<CustomerOrder> {
    return this.orderService.confirm(id);
  }

  @Post(':id/cancel')
  @RequireRoles('admin', 'manager', 'sales')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order has been cancelled.',
    type: CustomerOrder,
  })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string
  ): Promise<CustomerOrder> {
    return this.orderService.cancel(id, reason);
  }

  @Post(':id/ship')
  @RequireRoles('admin', 'manager', 'warehouse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark order as shipped' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order has been marked as shipped.',
    type: CustomerOrder,
  })
  async ship(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('shippedDate') shippedDate?: Date
  ): Promise<CustomerOrder> {
    return this.orderService.ship(id, shippedDate);
  }

  @Post(':id/deliver')
  @RequireRoles('admin', 'manager', 'warehouse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark order as delivered' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order has been marked as delivered.',
    type: CustomerOrder,
  })
  async deliver(@Param('id', ParseUUIDPipe) id: string): Promise<CustomerOrder> {
    return this.orderService.deliver(id);
  }

  @Post(':id/duplicate')
  @RequireRoles('admin', 'manager', 'sales')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Duplicate an order' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Order has been duplicated.',
    type: CustomerOrder,
  })
  async duplicate(@Param('id', ParseUUIDPipe) id: string): Promise<CustomerOrder> {
    return this.orderService.duplicate(id);
  }

  @Get(':id/availability')
  @RequireRoles('admin', 'manager', 'sales', 'warehouse')
  @ApiOperation({ summary: 'Check product availability for order' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return product availability status.',
  })
  async checkAvailability(@Param('id', ParseUUIDPipe) id: string) {
    return this.orderService.checkProductAvailability(id);
  }

  @Post(':id/generate-production-orders')
  @RequireRoles('admin', 'manager', 'production')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate production orders from customer order' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Production orders have been generated.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Can only generate production orders for confirmed orders.',
  })
  async generateProductionOrders(@Param('id', ParseUUIDPipe) id: string): Promise<CustomerOrder> {
    return this.orderService.generateProductionOrders(id);
  }

  @Post(':id/generate-tasks')
  @RequireRoles('admin', 'manager', 'operator')
  @ApiOperation({ summary: 'Generate tasks from customer order with options' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tasks have been generated successfully.',
    type: TaskGenerationResultDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Can only generate tasks for confirmed orders.',
  })
  async generateTasks(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() generateTasksDto: GenerateTasksDto,
  ): Promise<TaskGenerationResultDto> {
    return this.orderService.generateTasks(id, generateTasksDto);
  }

  @Delete(':id')
  @RequireRoles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an order' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Order has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Can only delete draft or cancelled orders.',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.orderService.remove(id);
  }
}