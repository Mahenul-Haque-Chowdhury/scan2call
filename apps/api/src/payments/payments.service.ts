import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { PaymentStatus } from '@/generated/prisma/client';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe | null;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = key
      ? new Stripe(key, { apiVersion: '2025-02-24.acacia' })
      : null;
  }

  /**
   * Records a new payment linked to an order or subscription invoice.
   */
  async recordPayment(params: {
    userId: string;
    orderId?: string;
    amountInCents: number;
    currency?: string;
    stripePaymentIntentId?: string;
    stripeInvoiceId?: string;
    stripeChargeId?: string;
    paymentMethod?: string;
    cardLast4?: string;
    cardBrand?: string;
    receiptUrl?: string;
  }) {
    const payment = await this.prisma.payment.create({
      data: {
        userId: params.userId,
        orderId: params.orderId,
        amountInCents: params.amountInCents,
        currency: params.currency ?? 'AUD',
        status: PaymentStatus.SUCCEEDED,
        stripePaymentIntentId: params.stripePaymentIntentId,
        stripeInvoiceId: params.stripeInvoiceId,
        stripeChargeId: params.stripeChargeId,
        paymentMethod: params.paymentMethod,
        cardLast4: params.cardLast4,
        cardBrand: params.cardBrand,
        receiptUrl: params.receiptUrl,
        paidAt: new Date(),
      },
    });

    this.logger.log(`Payment ${payment.id} recorded for user ${params.userId}`);
    return payment;
  }

  /**
   * Updates the status of an existing payment.
   */
  async updatePaymentStatus(
    stripePaymentIntentId: string,
    status: PaymentStatus,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntentId },
    });

    if (!payment) {
      this.logger.warn(
        `Payment not found for PaymentIntent ${stripePaymentIntentId}`,
      );
      return null;
    }

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status,
        ...(status === PaymentStatus.SUCCEEDED ? { paidAt: new Date() } : {}),
      },
    });

    this.logger.log(
      `Payment ${payment.id} status updated to ${status}`,
    );
    return updated;
  }

  /**
   * Processes a refund through Stripe and updates the payment record.
   */
  async handleRefund(stripeChargeId: string, amountInCents: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { stripeChargeId },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for charge ${stripeChargeId}`);
      return null;
    }

    const newRefundedTotal = payment.refundedAmountInCents + amountInCents;
    const isFullRefund = newRefundedTotal >= payment.amountInCents;

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        refundedAmountInCents: newRefundedTotal,
        refundedAt: new Date(),
        status: isFullRefund
          ? PaymentStatus.REFUNDED
          : PaymentStatus.PARTIALLY_REFUNDED,
      },
    });

    // If linked to an order, update order status
    if (payment.orderId && isFullRefund) {
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'REFUNDED' },
      });
    }

    this.logger.log(
      `Refund of ${amountInCents} cents processed for payment ${payment.id}`,
    );
    return updated;
  }
}
