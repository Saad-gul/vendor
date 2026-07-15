import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { UserRole } from '@prisma/client';
import { DEFAULT_VENDOR_COMMISSION } from '@marketverse/shared';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateVendorDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRole.CUSTOMER) throw new BadRequestException('User is already a vendor or admin');

    const existing = await this.prisma.vendor.findUnique({ where: { storeSlug: dto.storeSlug } });
    if (existing) throw new ConflictException('Store slug already in use');

    const [updatedUser, vendor] = await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { role: UserRole.VENDOR } }),
      this.prisma.vendor.create({
        data: {
          userId,
          storeName: dto.storeName,
          storeSlug: dto.storeSlug,
          description: dto.description,
          logo: dto.logo,
          banner: dto.banner,
          commissionRate: dto.commissionRate ?? DEFAULT_VENDOR_COMMISSION,
        },
      }),
    ]);

    return { ...vendor, user: this.sanitizeUser(updatedUser) };
  }

  async findAll(query: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = query;
    const where = search
      ? { OR: [{ storeName: { contains: search, mode: 'insensitive' as const } }, { storeSlug: { contains: search, mode: 'insensitive' as const } }] }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        include: { user: { select: { id: true, email: true, name: true, avatar: true, createdAt: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPreviousPage: page > 1 } };
  }

  async findBySlug(slug: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { storeSlug: slug },
      include: { user: { select: { id: true, email: true, name: true, avatar: true } } },
    });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async findByUserId(userId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId }, include: { user: true } });
    if (!vendor) throw new NotFoundException('Vendor profile not found');
    return vendor;
  }

  async update(userId: string, dto: UpdateVendorDto) {
    const vendor = await this.prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) throw new NotFoundException('Vendor not found');

    if (dto.storeSlug && dto.storeSlug !== vendor.storeSlug) {
      const existing = await this.prisma.vendor.findUnique({ where: { storeSlug: dto.storeSlug } });
      if (existing) throw new ConflictException('Store slug already in use');
    }

    return this.prisma.vendor.update({
      where: { userId },
      data: { ...dto, updatedAt: new Date() },
    });
  }

  async updateCommission(vendorId: string, commissionRate: number) {
    return this.prisma.vendor.update({
      where: { id: vendorId },
      data: { commissionRate },
    });
  }

  async verifyVendor(vendorId: string) {
    return this.prisma.vendor.update({ where: { id: vendorId }, data: { isVerified: true } });
  }

  async remove(userId: string) {
    return this.prisma.$transaction([
      this.prisma.vendor.delete({ where: { userId } }),
      this.prisma.user.update({ where: { id: userId }, data: { role: UserRole.CUSTOMER } }),
    ]);
  }

  private sanitizeUser(user: { password?: string | null; refreshTokens?: string[]; oauthId?: string | null; [key: string]: unknown }) {
    const { password, refreshTokens, oauthId, ...rest } = user;
    return rest;
  }
}
