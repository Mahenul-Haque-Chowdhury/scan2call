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
import { OrderStatus, SubscriptionStatus } from '@/generated/prisma/client';
import { Prisma } from '@/generated/prisma/client';
import Stripe from 'stripe';

type SubscriptionPlanId = 'monthly' | 'yearly' | 'three_year';

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

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
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
   * Handles both one-time payment checkouts (orders) and subscription checkouts.
   */
  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;

    if (
      session.mode === 'payment' &&
      session.metadata?.checkoutType === 'subscription_prepaid'
    ) {
      await this.handlePrepaidSubscriptionCheckout(session);
    } else if (session.mode === 'payment') {
      // One-time product order
      const orderId = session.metadata?.orderId;
      if (!orderId) {
        this.logger.warn('checkout.session.completed (payment) missing orderId in metadata');
        return;
      }

      const stripeCustomerId =
        typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id;

      if (userId && stripeCustomerId) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId },
        });
      }

      const stripePaymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id;

      const order = await this.prisma.$transaction(async (tx) => {
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

        return updatedOrder;
      });

      if (!order) return;

      // Record the payment
      if (userId) {
        await this.paymentsService.recordPayment({
          userId,
          orderId,
          amountInCents: session.amount_total ?? 0,
          currency: session.currency?.toUpperCase() ?? 'AUD',
          stripePaymentIntentId:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id,
        });
      }

      this.logger.log(`Order ${orderId} marked as PAID`);
    } else if (session.mode === 'subscription') {
      // Subscription checkout
      if (!userId) {
        this.logger.warn('checkout.session.completed (subscription) missing userId in metadata');
        return;
      }

      const stripeSubscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id;

      if (!stripeSubscriptionId) {
        this.logger.warn('checkout.session.completed missing subscription ID');
        return;
      }

      // Fetch the subscription from Stripe for period info
      const stripeSub = await this.stripeClient.subscriptions.retrieve(stripeSubscriptionId);
      const stripePriceId = stripeSub.items.data[0]?.price.id;
      const planId =
        this.getPlanIdForPriceId(stripePriceId) ??
        this.getValidPlanId(session.metadata?.planId) ??
        'monthly';

      // Ensure Stripe customer ID is saved on user
      const stripeCustomerId =
        typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id;

      if (stripeCustomerId) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId },
        });
      }

      // Upsert subscription record
      await this.prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          status: SubscriptionStatus.ACTIVE,
          source: 'STRIPE',
          plan: planId,
          stripeSubscriptionId,
          stripePriceId,
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          cancelAtPeriodEnd: false,
        },
        update: {
          status: SubscriptionStatus.ACTIVE,
          source: 'STRIPE',
          plan: planId,
          stripeSubscriptionId,
          stripePriceId,
          currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          cancelAtPeriodEnd: false,
        },
      });

      this.logger.log(`Subscription activated for user ${userId}`);
    }
  }

  private async handlePrepaidSubscriptionCheckout(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const planId = this.getValidPlanId(session.metadata?.planId);

    if (!userId || planId !== 'three_year') {
      this.logger.warn('prepaid subscription checkout missing valid userId or planId');
      return;
    }

    const stripeCustomerId =
      typeof session.customer === 'string'
        ? session.customer
        : session.customer?.id;

    if (stripeCustomerId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date(currentPeriodStart);
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 3);

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        status: SubscriptionStatus.ACTIVE,
        source: 'STRIPE',
        plan: 'three_year',
        stripeSubscriptionId: null,
        stripePriceId: this.config.get<string>('STRIPE_SUBSCRIPTION_THREE_YEAR_PRICE_ID'),
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
      },
      update: {
        status: SubscriptionStatus.ACTIVE,
        source: 'STRIPE',
        plan: 'three_year',
        stripeSubscriptionId: null,
        stripePriceId: this.config.get<string>('STRIPE_SUBSCRIPTION_THREE_YEAR_PRICE_ID'),
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
      },
    });

    await this.paymentsService.recordPayment({
      userId,
      amountInCents: session.amount_total ?? 0,
      currency: session.currency?.toUpperCase() ?? 'AUD',
      stripePaymentIntentId:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id,
    });

    this.logger.log(`Three-year prepaid subscription activated for user ${userId}`);
  }

  /**
   * Handles successful invoice payments (recurring subscription renewals).
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const stripeSubscriptionId =
      typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id;

    if (!stripeSubscriptionId) return;

    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });

    if (!subscription) {
      this.logger.warn(
        `invoice.paid: No subscription found for ${stripeSubscriptionId}`,
      );
      return;
    }

    // Fetch fresh period data from Stripe
    const stripeSub = await this.stripeClient.subscriptions.retrieve(stripeSubscriptionId);

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      },
    });

    // Record the payment
    await this.paymentsService.recordPayment({
      userId: subscription.userId,
      amountInCents: invoice.amount_paid ?? 0,
      currency: invoice.currency?.toUpperCase() ?? 'AUD',
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId:
        typeof invoice.payment_intent === 'string'
          ? invoice.payment_intent
          : invoice.payment_intent?.id ?? undefined,
    });

    this.logger.log(
      `Invoice paid for subscription ${stripeSubscriptionId}`,
    );
  }

  /**
   * Handles failed invoice payments (subscription renewal failures).
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const stripeSubscriptionId =
      typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id;

    if (!stripeSubscriptionId) return;

    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });

    if (!subscription) return;

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.PAST_DUE },
    });

    this.logger.warn(
      `Invoice payment failed for subscription ${stripeSubscriptionId}, status set to PAST_DUE`,
    );
  }

  /**
   * Handles subscription updates from Stripe (e.g. plan changes, period updates).
   */
  private async handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSub.id },
    });

    if (!subscription) {
      this.logger.warn(
        `customer.subscription.updated: No local subscription found for ${stripeSub.id}`,
      );
      return;
    }

    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      past_due: SubscriptionStatus.PAST_DUE,
      canceled: SubscriptionStatus.CANCELLED,
      unpaid: SubscriptionStatus.UNPAID,
      incomplete: SubscriptionStatus.INCOMPLETE,
    };

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: statusMap[stripeSub.status] ?? SubscriptionStatus.ACTIVE,
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        stripePriceId: stripeSub.items.data[0]?.price.id,
        ...(this.getPlanIdForPriceId(stripeSub.items.data[0]?.price.id)
          ? { plan: this.getPlanIdForPriceId(stripeSub.items.data[0]?.price.id)! }
          : {}),
      },
    });

    this.logger.log(
      `Subscription ${stripeSub.id} updated: status=${stripeSub.status}, cancel_at_period_end=${stripeSub.cancel_at_period_end}`,
    );
  }

  /**
   * Handles subscription deletion (final cancellation).
   */
  private async handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSub.id },
    });

    if (!subscription) {
      this.logger.warn(
        `customer.subscription.deleted: No local subscription found for ${stripeSub.id}`,
      );
      return;
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.CANCELLED },
    });

    this.logger.log(
      `Subscription ${stripeSub.id} deleted / cancelled for user ${subscription.userId}`,
    );
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

  private getValidPlanId(planId: string | undefined): SubscriptionPlanId | null {
    if (planId === 'monthly' || planId === 'yearly' || planId === 'three_year') {
      return planId;
    }
    return null;
  }

  private getPlanIdForPriceId(priceId: string | undefined): SubscriptionPlanId | null {
    if (!priceId) return null;

    const planEntries: Array<[string | undefined, SubscriptionPlanId]> = [
      [this.config.get<string>('STRIPE_SUBSCRIPTION_MONTHLY_PRICE_ID'), 'monthly'],
      [this.config.get<string>('STRIPE_SUBSCRIPTION_YEARLY_PRICE_ID'), 'yearly'],
      [this.config.get<string>('STRIPE_SUBSCRIPTION_THREE_YEAR_PRICE_ID'), 'three_year'],
    ];

    return planEntries.find(([configuredPriceId]) => configuredPriceId === priceId)?.[1] ?? null;
  }
}
