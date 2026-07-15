import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../database/redis.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService, private readonly redis: RedisService) {
    const key = this.config.get('STRIPE_SECRET_KEY');
    if (key) this.stripe = new Stripe(key, { apiVersion: '2024-04-10' });
  }

  async createPaymentIntent(orderId: string) {
    if (!this.stripe) throw new BadRequestException('Payment provider not configured');

    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentStatus === PaymentStatus.PAID) throw new BadRequestException('Order already paid');

    const amount = Math.round(order.total.toNumber() * 100);
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: order.id },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { paymentIntentId: paymentIntent.id },
    });

    return { clientSecret: paymentIntent.client_secret };
  }

  async confirmPayment(orderId: string, paymentIntentId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: PaymentStatus.PAID, status: OrderStatus.CONFIRMED },
      }),
      this.prisma.payment.create({
        data: {
          orderId,
          amount: order.total,
          status: PaymentStatus.PAID,
          provider: 'stripe',
          providerTxId: paymentIntentId,
        },
      }),
    ]);

    await this.updateVendorAnalytics(order.vendorId, order.total.toNumber());
    await this.redis.invalidateCache('orders');
    return updated[0];
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    if (!this.stripe) throw new BadRequestException('Stripe not configured');
    const secret = this.config.get('STRIPE_WEBHOOK_SECRET');
    if (!secret) throw new BadRequestException('Webhook secret not configured');

    const event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;
      if (orderId) await this.confirmPayment(orderId, paymentIntent.id);
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;
      if (orderId) {
        await this.prisma.order.update({ where: { id: orderId }, data: { paymentStatus: PaymentStatus.FAILED } });
      }
    }

    return { received: true };
  }

  private async updateVendorAnalytics(vendorId: string, total: number) {
    await this.prisma.vendor.update({
      where: { id: vendorId },
      data: { totalSales: { increment: total }, totalOrders: { increment: 1 } },
    });
  }
}
