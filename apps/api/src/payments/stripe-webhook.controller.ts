import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
  Logger,
  RawBodyRequest,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../database/prisma.service';
import { PaymentsService } from './payments.service';
import { OrderStatus } from '@/generated/prisma/client';
import { Prisma } from '@/generated/prisma/client';
import Stripe from 'stripe';

@ApiTags('webhooks')
@Controller('webhooks')
export class StripeWebhookController {
  private readonly stripe: Stripe | null;
  private readonly logger = new Logger(StripeWebhookController.name);
  private readonly webhookSecret: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = key ? new Stripe(key) : null;
    this.webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET', '');
  }

  private get stripeClient(): Stripe {
    if (!this.stripe) throw new BadRequestException('Stripe is not configured');
    return this.stripe;
  }

  @Public()
  @Post('stripe')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event: Stripe.Event;

    try {
      event = this.stripeClient.webhooks.constructEvent(
        req.rawBody!,
        signature,
        this.webhookSecret,
      );
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Received Stripe event: ${event.type} (${event.id})`);

    const isFirstDelivery = await this.markEventForProcessing(event);
    if (!isFirstDelivery) {
      this.logger.log(`Skipping already processed Stripe event: ${event.id}`);
      return { received: true, duplicate: true };
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  // ─── Event Handlers ───────────────────────────────────────────────

  private async markEventForProcessing(event: Stripe.Event): Promise<boolean> {
    try {
      await this.prisma.processedWebhookEvent.create({
        data: {
          id: event.id,
          provider: 'stripe',
          eventType: event.type,
        },
      });
      return true;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return false;
      }
      throw err;
    }
  }

  /**
   * Handles one-time product order checkouts. Marks the order PAID, decrements
   * stock, records the payment, and saves the card for auto-renewal when the
   * order opted in.
   */
  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const orderId = session.metadata?.orderId;

    if (session.mode !== 'payment' || !orderId) {
      this.logger.warn('checkout.session.completed missing orderId or not a payment session');
      return;
    }

    const stripeCustomerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

    const stripePaymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;

    const result = await this.prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!existingOrder) {
        this.logger.warn(`checkout.session.completed: order ${orderId} not found`);
        return null;
      }

      const wasAlreadyPaid = existingOrder.status === OrderStatus.PAID;

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          stripePaymentIntentId,
        },
      });

      if (!wasAlreadyPaid) {
        for (const item of existingOrder.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { decrement: item.quantity },
            },
          });
        }
      }

      const hasAutoRenew = existingOrder.items.some((item) => item.autoRenew);
      return { updatedOrder, hasAutoRenew };
    });

    if (!result) return;

    // Persist the Stripe customer and (when auto-renew was requested) the saved
    // off-session payment method so the renewal cron can charge it later.
    if (userId) {
      let stripeDefaultPaymentMethodId: string | undefined;
      if (result.hasAutoRenew && stripePaymentIntentId) {
        try {
          const pi = await this.stripeClient.paymentIntents.retrieve(stripePaymentIntentId);
          stripeDefaultPaymentMethodId =
            typeof pi.payment_method === 'string'
              ? pi.payment_method
              : pi.payment_method?.id;
        } catch (err) {
          this.logger.warn(
            `Could not retrieve payment method for ${stripePaymentIntentId}: ${(err as Error).message}`,
          );
        }
      }

      if (stripeCustomerId || stripeDefaultPaymentMethodId) {
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            ...(stripeCustomerId ? { stripeCustomerId } : {}),
            ...(stripeDefaultPaymentMethodId ? { stripeDefaultPaymentMethodId } : {}),
          },
        });
      }

      await this.paymentsService.recordPayment({
        userId,
        orderId,
        amountInCents: session.amount_total ?? 0,
        currency: session.currency?.toUpperCase() ?? 'AUD',
        stripePaymentIntentId,
      });
    }

    this.logger.log(`Order ${orderId} marked as PAID`);
  }

  /**
   * Handles charge refund events.
   */
  private async handleChargeRefunded(charge: Stripe.Charge) {
    const refundedAmount = charge.amount_refunded;

    await this.paymentsService.handleRefund(charge.id, refundedAmount);

    this.logger.log(
      `Charge ${charge.id} refunded: ${refundedAmount} cents`,
    );
  }
}
