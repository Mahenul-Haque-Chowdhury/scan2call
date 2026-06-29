import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  calculateTagUnitPriceInCents,
  calculateShippingInCents,
  SHIPPING_AUSTRALIA_IN_CENTS,
} from '@scan2call/shared';
import { PrismaService } from '../database/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrderStatus } from '@/generated/prisma/client';
import Stripe from 'stripe';
import { randomBytes } from 'crypto';

@Injectable()
export class OrdersService {
  private readonly stripe: Stripe | null;
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = key ? new Stripe(key) : null;
  }

  private get stripeClient(): Stripe {
    if (!this.stripe) throw new BadRequestException('Stripe is not configured');
    return this.stripe;
  }

  /**
   * Creates a Stripe Checkout session for a product order.
   * Open to any authenticated user; the QR is the product and is priced per year
   * for the duration the buyer selects (1-5 years).
   */
  async createCheckoutSession(userId: string, dto: CreateOrderDto): Promise<{ sessionUrl: string }> {
    // Fetch user for Stripe customer ID
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, stripeCustomerId: true, email: true },
    });

    // Validate and fetch all products
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
        deletedAt: null,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products are unavailable');
    }

    // Check stock availability
    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of dto.items) {
      const product = productMap.get(item.productId)!;
      if (!product.isInStock || product.stockQuantity < item.quantity) {
        throw new BadRequestException(`Insufficient stock for "${product.name}"`);
      }
    }

    // Price each line by the chosen duration (per-year pricing + Find My device formula)
    const priced = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const years = item.durationYears;
      const unitPriceInCents = calculateTagUnitPriceInCents({
        priceInCents: product.priceInCents,
        hasFindMy: product.hasFindMy,
        devicePriceInCents: product.devicePriceInCents,
        years,
      });
      return { item, product, years, unitPriceInCents };
    });

    const anyAutoRenew = dto.items.some((item) => item.autoRenew);

    // Generate order number: SC-YYYYMMDD-XXXX
    const orderNumber = await this.generateOrderNumber();

    let subtotalInCents = 0;
    const orderItems = priced.map(({ item, product, years, unitPriceInCents }) => {
      const totalPrice = unitPriceInCents * item.quantity;
      subtotalInCents += totalPrice;
      return {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        unitPriceInCents,
        totalPriceInCents: totalPrice,
        durationYears: years,
        autoRenew: item.autoRenew ?? false,
        // Snapshot the per-year price so future renewals are unaffected by price changes.
        renewalPriceInCents: product.priceInCents,
        tagLabel: item.tagLabel || null,
        tagDescription: item.tagDescription || null,
      };
    });

    // Flat shipping fee based on destination ($5 AU / $5 worldwide).
    const shippingInCents = calculateShippingInCents(dto.shippingCountry);
    const totalInCents = subtotalInCents + shippingInCents;

    // Create order in PENDING status
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: OrderStatus.PENDING,
        subtotalInCents,
        shippingInCents,
        totalInCents,
        shippingFirstName: dto.shippingFirstName,
        shippingLastName: dto.shippingLastName,
        shippingAddress1: dto.shippingAddress1,
        shippingAddress2: dto.shippingAddress2,
        shippingCity: dto.shippingCity,
        // State and postcode are optional (some countries have neither); store '' so
        // the non-null columns are satisfied without a migration.
        shippingState: dto.shippingState ?? '',
        shippingPostcode: dto.shippingPostcode ?? '',
        shippingCountry: dto.shippingCountry ?? 'AU',
        customerNotes: dto.customerNotes,
        items: {
          create: orderItems,
        },
      },
    });

    // Ensure a persistent Stripe customer when we need to save a card for auto-renewal.
    let stripeCustomerId = user.stripeCustomerId ?? undefined;
    if (anyAutoRenew && !stripeCustomerId) {
      const customer = await this.stripeClient.customers.create({ email: user.email });
      stripeCustomerId = customer.id;
      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      });
    }

    // Build Stripe Checkout line items. Price varies by duration, so we always send
    // computed price_data (a static product.stripePriceId cannot represent it).
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priced.map(
      ({ item, product, years, unitPriceInCents }) => ({
        price_data: {
          currency: 'aud',
          product_data: {
            name: `${product.name} (${years} year${years > 1 ? 's' : ''})`,
            ...(product.shortDescription
              ? { description: product.shortDescription }
              : {}),
          },
          unit_amount: unitPriceInCents,
        },
        quantity: item.quantity,
      }),
    );

    // Add shipping as its own line so it shows up in the Stripe total and amount_total.
    if (shippingInCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name:
              shippingInCents === SHIPPING_AUSTRALIA_IN_CENTS
                ? 'Shipping (Australia)'
                : 'Shipping (Worldwide)',
          },
          unit_amount: shippingInCents,
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout session
    let session: Stripe.Checkout.Session;
    try {
      session = await this.stripeClient.checkout.sessions.create({
        mode: 'payment',
        customer: stripeCustomerId,
        customer_email: stripeCustomerId ? undefined : user.email,
        line_items: lineItems,
        // Save the card off-session so the renewal cron can charge it later.
        ...(anyAutoRenew
          ? { payment_intent_data: { setup_future_usage: 'off_session' } }
          : {}),
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId,
        },
        success_url: `${this.config.getOrThrow<string>('APP_URL')}/checkout/success?orderId=${order.id}`,
        cancel_url: `${this.config.getOrThrow<string>('APP_URL')}/store?status=cancelled`,
      });
    } catch (err) {
      const stripeErr = err as Stripe.errors.StripeError;
      // Surface the real Stripe reason instead of a generic 500 so it is visible
      // in the logs and to the user (e.g. tax not active, no such customer).
      this.logger.error(
        `Stripe checkout session failed for order ${orderNumber}: ` +
          `type=${stripeErr.type} code=${stripeErr.code} param=${stripeErr.param} message=${stripeErr.message}`,
      );
      throw new BadRequestException(
        stripeErr.message || 'Failed to create checkout session',
      );
    }

    this.logger.log(`Checkout session ${session.id} created for order ${orderNumber}`);

    return { sessionUrl: session.url! };
  }

  async findAllForUser(userId: string, query: OrderQueryDto) {
    const { page = 1, pageSize = 10, status } = query;
    const skip = (page - 1) * pageSize;

    const where = {
      userId,
      ...(status ? { status: status as OrderStatus } : {}),
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  slug: true,
                  images: { take: 1, orderBy: { sortOrder: 'asc' as const } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: { page, pageSize, total },
    };
  }

  async findOneForUser(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                slug: true,
                images: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return { data: order };
  }

  /**
   * Generates a unique order number in format SC-YYYYMMDD-XXXXXXXX.
   * Randomized suffix avoids count-based collisions under concurrent checkout.
   */
  private async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `SC-${dateStr}-`;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const suffix = randomBytes(4).toString('hex').toUpperCase();
      const orderNumber = `${prefix}${suffix}`;
      const existing = await this.prisma.order.findUnique({
        where: { orderNumber },
        select: { id: true },
      });

      if (!existing) {
        return orderNumber;
      }
    }

    throw new BadRequestException('Unable to generate a unique order number');
  }
}
