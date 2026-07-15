import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  async create(userId: string, title: string, message: string, orderId?: string) {
    const notification = await this.prisma.notification.create({
      data: { userId, title, message, orderId },
    });
    await this.redis.del(`notifications:${userId}`);
    return notification;
  }

  async findByUser(userId: string) {
    const cacheKey = `notifications:${userId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    await this.redis.set(cacheKey, notifications, 60);
    return notifications;
  }

  async markAsRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
    await this.redis.del(`notifications:${userId}`);
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    await this.redis.del(`notifications:${userId}`);
    return { success: true };
  }

  async notifyOrderStatus(userId: string, orderId: string, status: string) {
    return this.create(userId, 'Order Update', `Your order status has been updated to ${status}.`, orderId);
  }

  async notifyLowStock(vendorId: string, productId: string, productName: string, stock: number) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId }, select: { userId: true } });
    if (!vendor) return null;
    return this.create(vendor.userId, 'Low Stock Alert', `Product ${productName} is low on stock (${stock} remaining).`);
  }

  async notifyNewOrder(vendorUserId: string, orderId: string, total: number) {
    return this.create(vendorUserId, 'New Order', `You received a new order ${orderId} for $${total.toFixed(2)}.`, orderId);
  }
}
