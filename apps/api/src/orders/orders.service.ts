import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UserRole } from '@marketverse/shared';

type OrderWithItems = Prisma.OrderGetPayload<{
  include: { items: true; vendor: { include: { user: { select: { id: true } } } } };
}>;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly payments: PaymentsService,
    private readonly notifications: NotificationsService,
  ) {}

  async createFromCart(userId: string, dto: CreateOrderDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } }, coupon: true },
    });
    if (!cart || cart.items.length === 0) throw new BadRequestException('Cart is empty');

    const groupedByVendor = new Map<string, typeof cart.items>();
    for (const item of cart.items) {
      const list = groupedByVendor.get(item.product.vendorId) || [];
      list.push(item);
      groupedByVendor.set(item.product.vendorId, list);
    }

    const orders: OrderWithItems[] = [];
    for (const [vendorId, items] of groupedByVendor.entries()) {
      const subtotal = items.reduce((sum, item) => sum + (item.product.price.toNumber() * item.quantity), 0);
      let discount = 0;
      if (cart.coupon && (!cart.coupon.vendorId || cart.coupon.vendorId === vendorId)) {
        if (cart.coupon.type === 'PERCENTAGE') discount = subtotal * (cart.coupon.value.toNumber() / 100);
        else discount = Math.min(cart.coupon.value.toNumber(), subtotal);
      }

      const shipping = subtotal > 50 ? 0 : 5.99;
      const tax = subtotal * 0.0;
      const total = Math.max(0, subtotal + tax + shipping - discount);

      const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
      const commission = total * (vendor?.commissionRate.toNumber() || 10) / 100;

      const order = await this.prisma.order.create({
        data: {
          userId,
          vendorId,
          subtotal,
          tax,
          shipping,
          discount,
          commission,
          total,
          couponCode: cart.coupon?.code,
          shippingAddress: dto.shippingAddress as unknown as Prisma.InputJsonValue,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          items: {
            create: items.map((item) => ({
              productId: item.product.id,
              productName: item.product.name,
              productImage: item.product.images[0],
              quantity: item.quantity,
              unitPrice: item.product.price.toNumber(),
              totalPrice: item.product.price.toNumber() * item.quantity,
            })),
          },
        },
        include: { items: true, vendor: { include: { user: { select: { id: true } } } } },
      });

      // decrement stock
      for (const item of items) {
        await this.prisma.product.update({
          where: { id: item.product.id },
          data: { stock: { decrement: item.quantity }, salesCount: { increment: item.quantity } },
        });
      }

      await this.notifications.notifyNewOrder(order.vendor.user.id, order.id, total);
      orders.push(order);
    }

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await this.prisma.cart.update({ where: { id: cart.id }, data: { couponId: null } });
    await this.redis.del(`cart:${userId}`);

    return orders;
  }

  async findAll(userId: string, role: UserRole, vendorId?: string, query?: { page: number; limit: number; status?: OrderStatus }) {
    const where: Prisma.OrderWhereInput = {};
    if (role === UserRole.CUSTOMER) where.userId = userId;
    if (role === UserRole.VENDOR && vendorId) where.vendorId = vendorId;
    if (query?.status) where.status = query.status;

    const page = query?.page || 1;
    const limit = query?.limit || 20;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true, vendor: { select: { storeName: true, storeSlug: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPreviousPage: page > 1 } };
  }

  async findById(id: string, userId: string, role: UserRole, vendorId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        vendor: { include: { user: { select: { id: true } } } },
        user: { select: { id: true, email: true, name: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (role === UserRole.CUSTOMER && order.userId !== userId) throw new ForbiddenException();
    if (role === UserRole.VENDOR && order.vendorId !== vendorId) throw new ForbiddenException();

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, userId: string, role: UserRole, vendorId?: string) {
    const order = await this.findById(id, userId, role, vendorId);
    const updated = await this.prisma.order.update({ where: { id }, data: { status: dto.status, trackingNumber: dto.trackingNumber } });
    await this.notifications.notifyOrderStatus(order.user.id, order.id, dto.status);
    return updated;
  }

  async getVendorOrders(vendorId: string, query: { page: number; limit: number; status?: OrderStatus }) {
    return this.findAll(vendorId, UserRole.VENDOR, vendorId, query);
  }
}
