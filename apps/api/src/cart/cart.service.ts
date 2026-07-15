import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';
import { AddToCartDto, ApplyCouponDto } from './dto/cart-item.dto';
import { CouponsService } from '../coupons/coupons.service';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly coupons: CouponsService,
  ) {}

  async getOrCreate(userId: string) {
    const cart = await this.findOrCreateCart(userId);
    return this.enrichCart(cart);
  }

  private async findOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: { include: { vendor: { select: { id: true, storeName: true } } } } } }, coupon: true },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: { include: { vendor: { select: { id: true, storeName: true } } } } } }, coupon: true },
      });
    }
    return cart;
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Product not found');
    if (product.status !== 'ACTIVE') throw new BadRequestException('Product is not available');
    if (product.stock < dto.quantity) throw new BadRequestException('Not enough stock');

    const cart = await this.findOrCreateCart(userId);
    const existing = cart.items.find((item) => item.productId === dto.productId);

    if (existing) {
      const newQuantity = existing.quantity + dto.quantity;
      if (product.stock < newQuantity) throw new BadRequestException('Not enough stock');
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQuantity, priceAtAdd: product.price.toNumber() },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
          priceAtAdd: product.price.toNumber(),
        },
      });
    }

    await this.redis.del(`cart:${userId}`);
    return this.getOrCreate(userId);
  }

  async updateItem(userId: string, productId: string, quantity: number) {
    const cart = await this.findOrCreateCart(userId);
    const item = cart.items.find((i) => i.productId === productId);
    if (!item) throw new NotFoundException('Cart item not found');

    if (quantity === 0) {
      await this.prisma.cartItem.delete({ where: { id: item.id } });
    } else {
      const product = await this.prisma.product.findUnique({ where: { id: productId } });
      if (!product || product.stock < quantity) throw new BadRequestException('Not enough stock');
      await this.prisma.cartItem.update({ where: { id: item.id }, data: { quantity, priceAtAdd: product.price.toNumber() } });
    }

    await this.redis.del(`cart:${userId}`);
    return this.getOrCreate(userId);
  }

  async removeItem(userId: string, productId: string) {
    return this.updateItem(userId, productId, 0);
  }

  async applyCoupon(userId: string, dto: ApplyCouponDto) {
    const cart = await this.getOrCreate(userId);
    const coupon = await this.coupons.validateCoupon(dto.code, cart.subtotal);
    const rawCart = await this.findOrCreateCart(userId);
    await this.prisma.cart.update({ where: { id: rawCart.id }, data: { couponId: coupon.id } });
    await this.redis.del(`cart:${userId}`);
    return this.getOrCreate(userId);
  }

  async removeCoupon(userId: string) {
    const rawCart = await this.findOrCreateCart(userId);
    await this.prisma.cart.update({ where: { id: rawCart.id }, data: { couponId: null } });
    await this.redis.del(`cart:${userId}`);
    return this.getOrCreate(userId);
  }

  async clearCart(userId: string) {
    const rawCart = await this.findOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: rawCart.id } });
    await this.prisma.cart.update({ where: { id: rawCart.id }, data: { couponId: null } });
    await this.redis.del(`cart:${userId}`);
    return this.getOrCreate(userId);
  }

  private enrichCart(cart: Awaited<ReturnType<typeof this.findOrCreateCart>>) {
    let subtotal = 0;
    const items = cart.items.map((item) => {
      const price = (item.product.price as unknown as { toNumber: () => number }).toNumber();
      const total = price * item.quantity;
      subtotal += total;
      return { ...item, unitPrice: price, total };
    });

    const coupon = cart.coupon
      ? { type: cart.coupon.type, value: cart.coupon.value.toNumber(), minOrderAmount: cart.coupon.minOrderAmount?.toNumber() }
      : undefined;
    const discount = this.calculateDiscount(subtotal, coupon);
    const tax = subtotal * 0.0;
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = Math.max(0, subtotal + tax + shipping - discount);

    return {
      ...cart,
      items,
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }

  private calculateDiscount(subtotal: number, coupon: { type: 'PERCENTAGE' | 'FIXED'; value: number; minOrderAmount?: number | null } | null | undefined): number {
    if (!coupon) return 0;
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) return 0;
    if (coupon.type === 'PERCENTAGE') return subtotal * (coupon.value / 100);
    return Math.min(coupon.value, subtotal);
  }
}
