import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(query: { page: number; limit: number; role?: UserRole; search?: string }) {
    const where: Record<string, unknown> = {};
    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: { id: true, email: true, name: true, role: true, emailVerified: true, createdAt: true, updatedAt: true, vendor: { select: { id: true, storeName: true, isVerified: true } } },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) } };
  }

  async updateUserRole(id: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({ where: { id }, data: { role } });
  }

  async verifyVendor(vendorId: string) {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return this.prisma.vendor.update({ where: { id: vendorId }, data: { isVerified: true } });
  }

  async listPendingVendors() {
    return this.prisma.vendor.findMany({
      where: { isVerified: false },
      include: { user: { select: { id: true, email: true, name: true, createdAt: true } } },
    });
  }

  async listProducts(query: { page: number; limit: number; status?: string }) {
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { vendor: { select: { storeName: true } }, category: { select: { name: true } } },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { data, meta: { total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) } };
  }

  async suspendProduct(id: string) {
    return this.prisma.product.update({ where: { id }, data: { status: 'SUSPENDED' } });
  }

  async updateCommission(vendorId: string, commissionRate: number) {
    return this.prisma.vendor.update({ where: { id: vendorId }, data: { commissionRate } });
  }
}
