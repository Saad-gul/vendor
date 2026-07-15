import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UserRole } from '@marketverse/shared';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create product (vendor/admin)' })
  async create(@CurrentUser('vendorId') vendorId: string | undefined, @Body() dto: CreateProductDto) {
    if (!vendorId) throw new Error('Vendor not found');
    return { success: true, data: await this.productsService.create(vendorId, dto) };
  }

  @Get()
  @ApiOperation({ summary: 'List and filter products' })
  async findAll(@Query() query: ProductQueryDto) {
    return { success: true, data: await this.productsService.findAll(query) };
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my products (vendor/admin)' })
  async findMyProducts(@CurrentUser('vendorId') vendorId: string | undefined) {
    if (!vendorId) throw new Error('Vendor not found');
    return { success: true, data: await this.productsService.findAll({ vendorId } as ProductQueryDto, true) };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get product by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return { success: true, data: await this.productsService.findBySlug(slug) };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product (vendor/admin)' })
  async update(@CurrentUser('vendorId') vendorId: string | undefined, @Param('id') id: string, @Body() dto: UpdateProductDto) {
    if (!vendorId) throw new Error('Vendor not found');
    return { success: true, data: await this.productsService.update(id, vendorId, dto) };
  }

  @Patch(':id/stock')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product stock' })
  async updateStock(@CurrentUser('vendorId') vendorId: string | undefined, @Param('id') id: string, @Body('stock') stock: number) {
    if (!vendorId) throw new Error('Vendor not found');
    return { success: true, data: await this.productsService.updateStock(id, vendorId, stock) };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product' })
  async remove(@CurrentUser('vendorId') vendorId: string | undefined, @Param('id') id: string) {
    if (!vendorId) throw new Error('Vendor not found');
    await this.productsService.remove(id, vendorId);
    return { success: true };
  }
}
