import { Controller, Post, Get, Param, Headers, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

interface RawRequest extends Request {
  rawBody?: Buffer;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intent/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe payment intent' })
  async createIntent(@Param('orderId') orderId: string) {
    return { success: true, data: await this.paymentsService.createPaymentIntent(orderId) };
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook' })
  async webhook(@Headers('stripe-signature') signature: string, @Req() req: RawRequest) {
    return { success: true, data: await this.paymentsService.handleWebhook(signature, req.rawBody as Buffer) };
  }

  @Get('config')
  @ApiOperation({ summary: 'Get Stripe publishable key' })
  getConfig() {
    return { success: true, data: { publishableKey: process.env.STRIPE_PUBLISHABLE_KEY } };
  }
}
