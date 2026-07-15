import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AddToCartDto, UpdateCartItemDto, ApplyCouponDto } from './dto/cart-item.dto';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current cart' })
  async getCart(@CurrentUser('sub') userId: string) {
    return { success: true, data: await this.cartService.getOrCreate(userId) };
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add item to cart' })
  async addItem(@CurrentUser('sub') userId: string, @Body() dto: AddToCartDto) {
    return { success: true, data: await this.cartService.addItem(userId, dto) };
  }

  @Patch('items/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update cart item quantity' })
  async updateItem(@CurrentUser('sub') userId: string, @Param('productId') productId: string, @Body() dto: UpdateCartItemDto) {
    return { success: true, data: await this.cartService.updateItem(userId, productId, dto.quantity) };
  }

  @Delete('items/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeItem(@CurrentUser('sub') userId: string, @Param('productId') productId: string) {
    return { success: true, data: await this.cartService.removeItem(userId, productId) };
  }

  @Post('coupon')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply coupon' })
  async applyCoupon(@CurrentUser('sub') userId: string, @Body() dto: ApplyCouponDto) {
    return { success: true, data: await this.cartService.applyCoupon(userId, dto) };
  }

  @Delete('coupon')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove coupon' })
  async removeCoupon(@CurrentUser('sub') userId: string) {
    return { success: true, data: await this.cartService.removeCoupon(userId) };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear cart' })
  async clear(@CurrentUser('sub') userId: string) {
    return { success: true, data: await this.cartService.clearCart(userId) };
  }
}
