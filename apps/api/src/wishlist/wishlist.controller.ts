import { Controller, Get, Post, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get wishlist' })
  async get(@CurrentUser('sub') userId: string) {
    return { success: true, data: await this.wishlistService.getOrCreate(userId) };
  }

  @Post(':productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add to wishlist' })
  async add(@CurrentUser('sub') userId: string, @Param('productId') productId: string) {
    return { success: true, data: await this.wishlistService.addItem(userId, productId) };
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove from wishlist' })
  async remove(@CurrentUser('sub') userId: string, @Param('productId') productId: string) {
    return { success: true, data: await this.wishlistService.removeItem(userId, productId) };
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear wishlist' })
  async clear(@CurrentUser('sub') userId: string) {
    return { success: true, data: await this.wishlistService.clear(userId) };
  }
}
