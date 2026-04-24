import {
  Injectable,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { SUBSCRIPTION_PRICE_AUD_CENTS } from '@scan2call/shared';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionsService {
  private readonly stripe: Stripe | null;
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = key
      ? new Stripe(key, { apiVersion: '2025-02-24.acacia' })
      : null;
  }

  private get stripeClient(): Stripe {
    if (!this.stripe) throw new BadRequestException('Stripe is not configured');
    return this.stripe;
  }

  /**
   * Returns the single plan info (public).
   */
  getPlanInfo() {
    return {
      data: {
        name: 'Scan2Call Subscription',
        priceInCents: SUBSCRIPTION_PRICE_AUD_CENTS,
        currency: 'AUD',
        interval: 'month',
        features: [
          'Unlimited tags',
          'Unlimited scans',
          'WhatsApp relay',
          'Location tracking',
          'Custom lost-mode message',
          'Tag photos',
          'Store purchasing',
        ],
      },
    };
  }

  /**
   * Returns the current user's subscription, or null if none exists.
   */
  async getMySubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    return { data: subscription };
  }

  /**
   * Creates a Stripe Checkout session for the monthly subscription.
   */
  async createCheckoutSession(
    userId: string,
    dto: CreateSubscriptionDto,
  ): Promise<{ sessionUrl: string }> {
    // Prevent duplicate active subscriptions
    const existing = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { status: true },
    });

    if (existing?.status === 'ACTIVE') {
      throw new ConflictException('You already have an active subscription');
    }

    // Fetch user
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true },
    });

    // Ensure Stripe price ID is configured
    const stripePriceId = this.config.getOrThrow<string>('STRIPE_SUBSCRIPTION_PRICE_ID');
    const appUrl = this.config.getOrThrow<string>('APP_URL');

    const session = await this.stripeClient.checkout.sessions.create({
      mode: 'subscription',
      customer: user.stripeCustomerId ?? undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
      },
      success_url: dto.successUrl ?? `${appUrl}/dashboard?subscription=success`,
      cancel_url: dto.cancelUrl ?? `${appUrl}/pricing?subscription=cancelled`,
    });

    this.logger.log(`Subscription checkout session ${session.id} created for user ${userId}`);

    return { sessionUrl: session.url! };
  }

  /**
   * Cancels the subscription at the end of the current billing period.
   */
  async cancelSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || subscription.status !== 'ACTIVE') {
      throw new BadRequestException('No active subscription to cancel');
    }

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('Subscription has no linked Stripe subscription');
    }

    await this.stripeClient.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await this.prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true },
    });

    this.logger.log(`Subscription cancelled at period end for user ${userId}`);

    return { data: { message: 'Subscription will cancel at end of billing period' } };
  }

  /**
   * Resumes a subscription that was set to cancel at period end.
   */
  async resumeSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || subscription.status !== 'ACTIVE' || !subscription.cancelAtPeriodEnd) {
      throw new BadRequestException('No cancelling subscription to resume');
    }

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('Subscription has no linked Stripe subscription');
    }

    await this.stripeClient.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await this.prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: false },
    });

    this.logger.log(`Subscription resumed for user ${userId}`);

    return { data: { message: 'Subscription resumed successfully' } };
  }

  /**
   * Generates a Stripe Billing Portal URL so the user can manage
   * payment methods, view invoices, etc.
   */
  async createBillingPortalSession(userId: string): Promise<{ portalUrl: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer linked to this account');
    }

    const appUrl = this.config.getOrThrow<string>('APP_URL');

    const session = await this.stripeClient.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/dashboard`,
    });

    return { portalUrl: session.url };
  }

  /**
   * Helper: checks whether a given user has an active subscription.
   */
  async isUserSubscribed(userId: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { status: true },
    });

    return subscription?.status === 'ACTIVE';
  }
}
