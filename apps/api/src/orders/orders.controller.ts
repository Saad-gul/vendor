import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { OrderStatus } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UserRole } from '@marketverse/shared';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create orders from cart' })
  async create(@CurrentUser('sub') userId: string, @Body() dto: CreateOrderDto) {
    return { success: true, data: await this.ordersService.createFromCart(userId, dto) };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my orders' })
  async findAll(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('vendorId') vendorId: string | undefined,
    @Query() pagination: PaginationDto,
    @Query('status') status?: OrderStatus,
  ) {
    return { success: true, data: await this.ordersService.findAll(userId, role, vendorId, { ...pagination, status }) };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order details' })
  async findById(@Param('id') id: string, @CurrentUser('sub') userId: string, @CurrentUser('role') role: UserRole, @CurrentUser('vendorId') vendorId: string | undefined) {
    return { success: true, data: await this.ordersService.findById(id, userId, role, vendorId) };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: UserRole,
    @CurrentUser('vendorId') vendorId: string | undefined,
  ) {
    return { success: true, data: await this.ordersService.updateStatus(id, dto, userId, role, vendorId) };
  }
}
