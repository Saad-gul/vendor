import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { UserRole } from '@marketverse/shared';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(vendorId: string | undefined, userRole: UserRole, dto: CreateCouponDto) {
    const code = dto.code.toUpperCase();
    const existing = await this.prisma.coupon.findUnique({ where: { code } });
    if (existing) throw new BadRequestException('Coupon code already exists');

    if (userRole === UserRole.VENDOR && !vendorId) throw new ForbiddenException('Vendor not found');

    return this.prisma.coupon.create({
      data: {
        code,
        type: dto.type,
        value: dto.value,
        minOrderAmount: dto.minOrderAmount,
        maxUses: dto.maxUses,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        vendorId: userRole === UserRole.VENDOR ? vendorId : undefined,
      },
    });
  }

  async findAll(vendorId?: string, userRole?: UserRole) {
    const where = userRole === UserRole.VENDOR && vendorId ? { vendorId } : {};
    return this.prisma.coupon.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string, vendorId?: string, userRole?: UserRole) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    if (userRole === UserRole.VENDOR && coupon.vendorId && coupon.vendorId !== vendorId) {
      throw new ForbiddenException('You do not own this coupon');
    }
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto, vendorId?: string, userRole?: UserRole) {
    await this.findById(id, vendorId, userRole);
    return this.prisma.coupon.update({
      where: { id },
      data: { ...dto, expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined },
    });
  }

  async remove(id: string, vendorId?: string, userRole?: UserRole) {
    await this.findById(id, vendorId, userRole);
    await this.prisma.coupon.delete({ where: { id } });
    return { success: true };
  }

  async validateCoupon(code: string, subtotal: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) throw new BadRequestException('Invalid coupon');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new BadRequestException('Coupon expired');
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new BadRequestException('Coupon usage limit reached');
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount.toNumber()) throw new BadRequestException('Minimum order amount not met');
    return coupon;
  }

  async applyUsage(couponId: string) {
    return this.prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
  }
}
