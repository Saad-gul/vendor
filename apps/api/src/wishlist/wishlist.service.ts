import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate(userId: string) {
    let wishlist = await this.prisma.wishlist.findUnique({
      where: { userId },
      include: { items: { include: { product: { include: { vendor: { select: { id: true, storeName: true } } } } } } },
    });
    if (!wishlist) {
      wishlist = await this.prisma.wishlist.create({
        data: { userId },
        include: { items: { include: { product: { include: { vendor: { select: { id: true, storeName: true } } } } } } },
      });
    }
    return wishlist;
  }

  async addItem(userId: string, productId: string) {
    const wishlist = await this.getOrCreate(userId);
    const exists = wishlist.items.some((i) => i.productId === productId);
    if (!exists) {
      await this.prisma.wishlistItem.create({ data: { wishlistId: wishlist.id, productId } });
    }
    return this.getOrCreate(userId);
  }

  async removeItem(userId: string, productId: string) {
    const wishlist = await this.getOrCreate(userId);
    await this.prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, productId } });
    return this.getOrCreate(userId);
  }

  async clear(userId: string) {
    const wishlist = await this.getOrCreate(userId);
    await this.prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id } });
    return this.getOrCreate(userId);
  }
}
