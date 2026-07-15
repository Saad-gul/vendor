import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';
import { Product } from '@prisma/client';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly esEnabled: boolean;

  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService, private readonly redis: RedisService) {
    this.esEnabled = !!this.config.get('ELASTICSEARCH_URL');
  }

  async searchProducts(query: string, filters: Record<string, unknown> = {}) {
    const cacheKey = `search:${query}:${JSON.stringify(filters)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    let data;
    if (this.esEnabled) {
      data = await this.searchElasticsearch(query, filters);
    } else {
      data = await this.searchPrisma(query, filters);
    }

    await this.redis.set(cacheKey, data, 120);
    return data;
  }

  async indexProduct(product: Product) {
    if (!this.esEnabled) return;
    this.logger.debug(`Indexing product ${product.id} to Elasticsearch (stub)`);
    // Implement Elasticsearch index call here when ELASTICSEARCH_URL is configured
  }

  async removeProduct(productId: string) {
    if (!this.esEnabled) return;
    this.logger.debug(`Removing product ${productId} from Elasticsearch (stub)`);
  }

  private async searchPrisma(query: string, filters: Record<string, unknown>) {
    const where: Record<string, unknown> = {
      status: 'ACTIVE',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
      ],
    };

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.vendorId) where.vendorId = filters.vendorId;
    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) (where.price as Record<string, number>).gte = filters.minPrice as number;
      if (filters.maxPrice) (where.price as Record<string, number>).lte = filters.maxPrice as number;
    }

    const limit = (filters.limit as number) || 20;
    const page = (filters.page as number) || 1;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } }, vendor: { select: { id: true, storeName: true, storeSlug: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPreviousPage: page > 1 } };
  }

  private async searchElasticsearch(query: string, filters: Record<string, unknown>) {
    this.logger.warn('Elasticsearch not fully integrated; falling back to Prisma search');
    return this.searchPrisma(query, filters);
  }
}
