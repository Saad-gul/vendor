import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';
import { SearchService } from '../search/search.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { generateSlug } from '@marketverse/shared';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly search: SearchService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(vendorId: string, dto: CreateProductDto) {
    await this.verifyVendor(vendorId);

    const slug = dto.slug || generateSlug(dto.name);
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Product slug already exists');

    const existingSku = await this.prisma.product.findUnique({ where: { sku: dto.sku } });
    if (existingSku) throw new ConflictException('SKU already in use');

    const product = await this.prisma.product.create({
      data: {
        vendorId,
        categoryId: dto.categoryId,
        name: dto.name,
        slug,
        description: dto.description,
        shortDescription: dto.shortDescription,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice,
        sku: dto.sku,
        stock: dto.stock,
        lowStockThreshold: dto.lowStockThreshold ?? 10,
        status: dto.status || ProductStatus.DRAFT,
        images: dto.images || [],
        tags: dto.tags || [],
        attributes: dto.attributes as unknown as Prisma.InputJsonValue,
      },
    });

    await this.search.indexProduct(product);
    await this.redis.invalidateCache('products');

    if (product.stock <= product.lowStockThreshold) {
      await this.notifications.notifyLowStock(vendorId, product.id, product.name, product.stock);
    }

    return product;
  }

  async findAll(query: ProductQueryDto, includeInactive = false) {
    const cacheKey = this.buildCacheKey(query);
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const where: Prisma.ProductWhereInput = {};
    if (!includeInactive) where.status = ProductStatus.ACTIVE;
    if (query.status) where.status = query.status;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search } },
      ];
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) where.price.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput = { [query.sortBy]: query.sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } }, vendor: { select: { id: true, storeName: true, storeSlug: true } } },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    const result = {
      data,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
        hasNextPage: query.page * query.limit < total,
        hasPreviousPage: query.page > 1,
      },
    };

    await this.redis.set(cacheKey, result, 300);
    return result;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        vendor: { select: { id: true, storeName: true, storeSlug: true, isVerified: true } },
        reviews: { include: { user: { select: { id: true, name: true, avatar: true } } }, take: 20, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!product) throw new NotFoundException('Product not found');

    await this.prisma.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } });
    return product;
  }

  async findById(id: string, vendorId?: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (vendorId && product.vendorId !== vendorId) throw new ForbiddenException('You do not own this product');
    return product;
  }

  async update(id: string, vendorId: string, dto: UpdateProductDto) {
    await this.findById(id, vendorId);
    const { attributes, ...rest } = dto;
    const data: Prisma.ProductUpdateInput = { ...rest };
    if (dto.name && !dto.slug) data.slug = generateSlug(dto.name);
    if (attributes) data.attributes = attributes as unknown as Prisma.InputJsonValue;

    const updated = await this.prisma.product.update({ where: { id }, data });
    await this.search.indexProduct(updated);
    await this.redis.invalidateCache('products');

    if (updated.stock <= updated.lowStockThreshold) {
      await this.notifications.notifyLowStock(vendorId, updated.id, updated.name, updated.stock);
    }

    return updated;
  }

  async remove(id: string, vendorId: string) {
    await this.findById(id, vendorId);
    await this.prisma.product.delete({ where: { id } });
    await this.search.removeProduct(id);
    await this.redis.invalidateCache('products');
    return { success: true };
  }

  async updateStock(id: string, vendorId: string, stock: number) {
    await this.findById(id, vendorId);
    const updated = await this.prisma.product.update({ where: { id }, data: { stock } });
    if (updated.stock <= updated.lowStockThreshold) {
      await this.notifications.notifyLowStock(vendorId, updated.id, updated.name, updated.stock);
    }
    return updated;
  }

  private buildCacheKey(query: ProductQueryDto): string {
    return `products:${JSON.stringify(query)}`;
  }

  private async verifyVendor(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new ForbiddenException('You must be a vendor to create products');
    return vendor;
  }
}
