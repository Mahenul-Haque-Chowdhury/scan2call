import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    this.stripe = key
      ? new Stripe(key, { apiVersion: '2025-02-24.acacia' })
      : null;
  }

  private get stripeClient(): Stripe {
    if (!this.stripe) throw new BadRequestException('Stripe is not configured');
    return this.stripe;
  }

  /**
   * Creates a Stripe Checkout session for a product order.
   * Only active subscribers may create orders.
   */
  async createCheckoutSession(userId: string, dto: CreateOrderDto): Promise<{ sessionUrl: string }> {
    // Verify user is an active subscriber
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: { status: true },
    });

    if (subscription?.status !== 'ACTIVE') {
      throw new ForbiddenException('An active subscription is required to place orders');
    }

    // Fetch user for Stripe customer ID
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { stripeCustomerId: true, email: true },
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

    // Generate order number: SC-YYYYMMDD-XXXX
    const orderNumber = await this.generateOrderNumber();

    // Calculate totals
    let subtotalInCents = 0;
    const orderItems = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const totalPrice = product.priceInCents * item.quantity;
      subtotalInCents += totalPrice;
      return {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        unitPriceInCents: product.priceInCents,
        totalPriceInCents: totalPrice,
        tagLabel: item.tagLabel || null,
        tagDescription: item.tagDescription || null,
      };
    });

    const totalInCents = subtotalInCents; // Shipping/tax can be added later

    // Create order in PENDING status
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: OrderStatus.PENDING,
        subtotalInCents,
        totalInCents,
        shippingFirstName: dto.shippingFirstName,
        shippingLastName: dto.shippingLastName,
        shippingAddress1: dto.shippingAddress1,
        shippingAddress2: dto.shippingAddress2,
        shippingCity: dto.shippingCity,
        shippingState: dto.shippingState,
        shippingPostcode: dto.shippingPostcode,
        shippingCountry: dto.shippingCountry ?? 'AU',
        customerNotes: dto.customerNotes,
        items: {
          create: orderItems,
        },
      },
    });

    // Build Stripe Checkout line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = dto.items.map(
      (item) => {
        const product = productMap.get(item.productId)!;
        return {
          price_data: {
            currency: 'aud',
            product_data: {
              name: product.name,
              ...(product.shortDescription
                ? { description: product.shortDescription }
                : {}),
            },
            unit_amount: product.priceInCents,
          },
          quantity: item.quantity,
        };
      },
    );

    // Create Stripe Checkout session
    const session = await this.stripeClient.checkout.sessions.create({
      mode: 'payment',
      customer: user.stripeCustomerId ?? undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email,
      line_items: lineItems,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId,
      },
      success_url: `${this.config.getOrThrow<string>('APP_URL')}/orders/${order.id}?status=success`,
      cancel_url: `${this.config.getOrThrow<string>('APP_URL')}/store?status=cancelled`,
    });

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
