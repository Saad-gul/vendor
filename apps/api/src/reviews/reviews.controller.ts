import { Controller, Get, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { UserRole } from '@marketverse/shared';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review' })
  async create(@CurrentUser('sub') userId: string, @Body() dto: CreateReviewDto) {
    return { success: true, data: await this.reviewsService.create(userId, dto) };
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get product reviews' })
  async findByProduct(@Param('productId') productId: string) {
    return { success: true, data: await this.reviewsService.findByProduct(productId) };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my reviews' })
  async findByUser(@CurrentUser('sub') userId: string) {
    return { success: true, data: await this.reviewsService.findByUser(userId) };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review' })
  async remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return { success: true, data: await this.reviewsService.remove(id, userId) };
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a review (admin)' })
  async approve(@Param('id') id: string) {
    return { success: true, data: await this.reviewsService.approve(id) };
  }
}
