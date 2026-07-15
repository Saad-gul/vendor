import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService) {
    this.apiKey = this.config.get('OPENAI_API_KEY');
  }

  async generateProductDescription(input: { name: string; category?: string; keywords?: string[] }) {
    if (!this.apiKey) {
      return {
        description: `Elevate your lifestyle with ${input.name}. Crafted with premium materials and designed for modern use, this ${input.category || 'product'} offers exceptional quality and style. ${(input.keywords || []).join(', ')}.`,
        shortDescription: `Premium ${input.category || 'product'}: ${input.name}.`,
      };
    }

    // In production, call OpenAI API
    this.logger.log('OpenAI product description generation not wired; returning fallback');
    return {
      description: `AI-generated description for ${input.name}.`,
      shortDescription: `AI summary for ${input.name}.`,
    };
  }

  async generateSalesInsights(vendorId: string) {
    const [orders, revenue, topProducts] = await Promise.all([
      this.prisma.order.count({ where: { vendorId } }),
      this.prisma.order.aggregate({ where: { vendorId, paymentStatus: 'PAID' }, _sum: { total: true } }),
      this.prisma.product.findMany({ where: { vendorId }, orderBy: { salesCount: 'desc' }, take: 5 }),
    ]);

    const totalRevenue = revenue._sum.total?.toNumber() || 0;
    return {
      summary: `You have ${orders} orders generating $${totalRevenue.toFixed(2)} in revenue.`,
      topProducts: topProducts.map((p) => p.name),
      suggestion: orders === 0
        ? 'Consider running promotions to drive initial sales.'
        : 'Your top products are performing well; consider bundling them with complementary items.',
    };
  }

  async getRecommendations(userId?: string) {
    const recentOrders = userId
      ? await this.prisma.order.findMany({ where: { userId }, include: { items: { select: { productId: true } } }, take: 5 })
      : [];

    const purchasedIds = new Set(recentOrders.flatMap((o) => o.items.map((i) => i.productId)));
    const products = await this.prisma.product.findMany({
      where: { status: 'ACTIVE', id: { notIn: Array.from(purchasedIds) } },
      orderBy: { salesCount: 'desc' },
      take: 10,
      include: { vendor: { select: { storeName: true, storeSlug: true } } },
    });

    return products;
  }
}
