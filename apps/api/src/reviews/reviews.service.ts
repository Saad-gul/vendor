import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const order = await this.prisma.order.findFirst({
      where: { userId, items: { some: { productId: dto.productId } }, status: { in: ['DELIVERED'] } },
    });
    if (!order) throw new BadRequestException('You can only review products from delivered orders');

    const existing = await this.prisma.review.findUnique({
      where: { userId_productId: { userId, productId: dto.productId } },
    });
    if (existing) throw new BadRequestException('You have already reviewed this product');

    const review = await this.prisma.review.create({
      data: { userId, productId: dto.productId, rating: dto.rating, comment: dto.comment },
    });

    await this.updateProductRating(dto.productId);
    await this.redis.invalidateCache('products');
    return review;
  }

  async findByProduct(productId: string) {
    return this.prisma.review.findMany({
      where: { productId, isApproved: true },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.review.findMany({
      where: { userId },
      include: { product: { select: { id: true, name: true, slug: true, images: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string) {
    const review = await this.prisma.review.update({ where: { id }, data: { isApproved: true } });
    await this.updateProductRating(review.productId);
    return review;
  }

  async remove(id: string, userId: string, isAdmin = false) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    if (!isAdmin && review.userId !== userId) throw new ForbiddenException('Not authorized');
    await this.prisma.review.delete({ where: { id } });
    await this.updateProductRating(review.productId);
    return { success: true };
  }

  private async updateProductRating(productId: string) {
    const reviews = await this.prisma.review.findMany({ where: { productId, isApproved: true } });
    const avg = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    await this.prisma.product.update({
      where: { id: productId },
      data: { rating: avg, reviewCount: reviews.length },
    });
  }
}
