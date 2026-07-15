import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  async getPlatformAnalytics() {
    const cacheKey = 'analytics:platform';
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const [totalUsers, totalVendors, totalProducts, totalOrders, totalRevenue, pendingVendors] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.vendor.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ _sum: { total: true } }),
      this.prisma.vendor.count({ where: { isVerified: false } }),
    ]);

    const result = {
      totalUsers,
      totalVendors,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.total?.toNumber() || 0,
      pendingVendors,
    };
    await this.redis.set(cacheKey, result, 300);
    return result;
  }

  async getVendorAnalytics(vendorId: string) {
    const cacheKey = `analytics:vendor:${vendorId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new Error('Vendor not found');

    const [orders, revenue, products, lowStock, salesByMonth] = await Promise.all([
      this.prisma.order.count({ where: { vendorId } }),
      this.prisma.order.aggregate({ where: { vendorId, paymentStatus: 'PAID' }, _sum: { total: true } }),
      this.prisma.product.count({ where: { vendorId } }),
      this.prisma.product.count({ where: { vendorId, stock: { lte: 10 } } }),
      this.getMonthlySales(vendorId),
    ]);

    const result = {
      totalOrders: orders,
      totalRevenue: revenue._sum.total?.toNumber() || 0,
      totalProducts: products,
      lowStockProducts: lowStock,
      salesByMonth,
    };
    await this.redis.set(cacheKey, result, 300);
    return result;
  }

  async getMonthlySales(vendorId?: string) {
    const months = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return { start: startOfMonth(date), end: endOfMonth(date), label: format(date, 'yyyy-MM') };
    });

    const data: { month: string; revenue: number; orders: number }[] = [];
    for (const { start, end, label } of months) {
      const where = { createdAt: { gte: start, lte: end }, paymentStatus: 'PAID' as const, ...(vendorId ? { vendorId } : {}) };
      const agg = await this.prisma.order.aggregate({ where, _sum: { total: true }, _count: true });
      data.push({ month: label, revenue: agg._sum.total?.toNumber() || 0, orders: agg._count });
    }
    return data;
  }
}
