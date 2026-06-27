import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import Stripe from 'stripe';
import { PaymentType } from '@/generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AppConfigService } from '../config/config.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PaymentsService } from '../payments/payments.service';
import { addDays, addYears } from '../common/utils/date.util';

const REMINDER_WINDOW_DAYS = 30;

@Injectable()
export class RenewalsService {
  private readonly logger = new Logger(RenewalsService.name);
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly notifications: NotificationsService,
    private readonly payments: PaymentsService,
  ) {
    const key = this.config.stripeSecretKey;
    this.stripe = key ? new Stripe(key) : null;
  }

  /** Runs daily: send expiry reminders, then process auto-renewals. */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runDaily(): Promise<void> {
    this.logger.log('Running daily tag renewal job');
    await this.sendExpiryReminders();
    await this.processAutoRenewals();
  }

  /**
   * Email owners whose tags expire within the reminder window and have not yet
   * been reminded for the current period.
   */
  async sendExpiryReminders(): Promise<number> {
    const now = new Date();
    const windowEnd = addDays(now, REMINDER_WINDOW_DAYS);

    const tags = await this.prisma.tag.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ['INACTIVE', 'DEACTIVATED'] },
        renewalReminderSentAt: null,
        expiresAt: { gt: now, lte: windowEnd },
        owner: { isNot: null },
      },
      include: {
        owner: { select: { email: true, firstName: true } },
      },
    });

    let sent = 0;
    for (const tag of tags) {
      if (!tag.owner || !tag.expiresAt) continue;
      try {
        await this.notifications.sendTagExpiryReminder({
          email: tag.owner.email,
          firstName: tag.owner.firstName,
          tagLabel: tag.label,
          tagToken: tag.token,
          expiresAt: tag.expiresAt,
          autoRenew: tag.autoRenew,
          renewalPriceInCents: tag.renewalPriceInCents,
        });
        await this.prisma.tag.update({
          where: { id: tag.id },
          data: { renewalReminderSentAt: now },
        });
        sent += 1;
      } catch (err) {
        this.logger.error(`Failed to send expiry reminder for tag ${tag.id}: ${(err as Error).message}`);
      }
    }

    if (sent > 0) this.logger.log(`Sent ${sent} tag expiry reminder(s)`);
    return sent;
  }

  /**
   * Charge the saved card for expired auto-renew tags and extend their expiry by
   * 1 year. On failure, disable auto-renewal and notify the owner.
   */
  async processAutoRenewals(): Promise<number> {
    const now = new Date();

    const tags = await this.prisma.tag.findMany({
      where: {
        deletedAt: null,
        autoRenew: true,
        status: { not: 'DEACTIVATED' },
        expiresAt: { lte: now },
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            stripeCustomerId: true,
            stripeDefaultPaymentMethodId: true,
          },
        },
      },
    });

    let renewed = 0;
    for (const tag of tags) {
      if (!tag.owner || !tag.expiresAt) continue;

      const amount = tag.renewalPriceInCents;
      const { stripeCustomerId, stripeDefaultPaymentMethodId } = tag.owner;

      // Cannot charge without a price or a saved payment method: fail gracefully.
      if (!amount || !stripeCustomerId || !stripeDefaultPaymentMethodId || !this.stripe) {
        await this.failRenewal(tag.id, {
          email: tag.owner.email,
          firstName: tag.owner.firstName,
          tagLabel: tag.label,
          tagToken: tag.token,
          expiresAt: tag.expiresAt,
        });
        continue;
      }

      try {
        const pi = await this.stripe.paymentIntents.create({
          amount,
          currency: 'aud',
          customer: stripeCustomerId,
          payment_method: stripeDefaultPaymentMethodId,
          off_session: true,
          confirm: true,
          metadata: { tagId: tag.id, userId: tag.owner.id, type: 'RENEWAL' },
        });

        if (pi.status !== 'succeeded') {
          throw new Error(`PaymentIntent status ${pi.status}`);
        }

        // Extend from the later of now / current expiry so we never lose paid time.
        const base = tag.expiresAt > now ? tag.expiresAt : now;
        const newExpiry = addYears(base, 1);

        await this.prisma.tag.update({
          where: { id: tag.id },
          data: { expiresAt: newExpiry, renewalReminderSentAt: null },
        });

        await this.payments.recordPayment({
          userId: tag.owner.id,
          tagId: tag.id,
          type: PaymentType.RENEWAL,
          amountInCents: amount,
          stripePaymentIntentId: pi.id,
        });

        await this.notifications.sendRenewalSuccess({
          email: tag.owner.email,
          firstName: tag.owner.firstName,
          tagLabel: tag.label,
          tagToken: tag.token,
          expiresAt: newExpiry,
          amountInCents: amount,
        });

        renewed += 1;
      } catch (err) {
        this.logger.error(`Auto-renewal failed for tag ${tag.id}: ${(err as Error).message}`);
        await this.failRenewal(tag.id, {
          email: tag.owner.email,
          firstName: tag.owner.firstName,
          tagLabel: tag.label,
          tagToken: tag.token,
          expiresAt: tag.expiresAt,
        });
      }
    }

    if (renewed > 0) this.logger.log(`Auto-renewed ${renewed} tag(s)`);
    return renewed;
  }

  /**
   * Disable auto-renewal after a failed attempt (avoids daily retries) and notify
   * the owner. The tag stays expired and the relay gate keeps it blocked.
   */
  private async failRenewal(
    tagId: string,
    payload: {
      email: string;
      firstName: string;
      tagLabel: string | null;
      tagToken: string;
      expiresAt: Date;
    },
  ): Promise<void> {
    await this.prisma.tag.update({
      where: { id: tagId },
      data: { autoRenew: false },
    });
    await this.notifications.sendRenewalFailed(payload);
  }
}
