import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GiftCodeStatus, SubscriptionSource } from '@prisma/client';

const GIFT_CODE_PREFIX = 'Scan2Call-Gift-';
const GIFT_CODE_LENGTH = 8;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

interface CreateGiftCodeInput {
  durationMonths?: number;
  lifetime?: boolean;
  expiresAt?: Date | null;
  maxRedemptions?: number;
}

interface GiftCodeState {
  id: string;
  status: GiftCodeStatus;
  expiresAt: Date | null;
  redeemedCount: number;
  maxRedemptions: number;
}

@Injectable()
export class GiftService {
  constructor(private readonly prisma: PrismaService) {}

  async createGiftCode(adminId: string, input: CreateGiftCodeInput) {
    const durationMonths = input.durationMonths ?? null;
    const lifetime = input.lifetime ?? false;
    const expiresAt = input.expiresAt ?? null;

    if (!lifetime && !durationMonths) {
      throw new BadRequestException('Duration months is required unless lifetime is set');
    }

    if (durationMonths && durationMonths < 1) {
      throw new BadRequestException('Duration months must be at least 1');
    }

    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Expiry must be in the future');
    }

    const maxRedemptions = Math.max(input.maxRedemptions ?? 1, 1);
    const code = await this.generateUniqueCode();

    const giftCode = await this.prisma.subscriptionGiftCode.create({
      data: {
        code,
        durationMonths,
        lifetime,
        expiresAt,
        maxRedemptions,
        createdById: adminId,
      },
    });

    return { data: giftCode };
  }

  async listGiftCodes(params: { page?: number; pageSize?: number; status?: GiftCodeStatus; search?: string }) {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;

    await this.expireStaleGiftCodes();

    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [codes, total] = await Promise.all([
      this.prisma.subscriptionGiftCode.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.subscriptionGiftCode.count({ where }),
    ]);

    return { data: codes, meta: { page, pageSize, total } };
  }

  async assignGiftCode(adminId: string, codeId: string, userId: string, note?: string) {
    const giftCode = await this.prisma.subscriptionGiftCode.findUnique({ where: { id: codeId } });
    if (!giftCode) throw new NotFoundException('Gift code not found');

    await this.syncGiftCodeStatus(giftCode);

    return this.redeemGiftCode(userId, giftCode.code, adminId, note);
  }

  async redeemGiftCode(userId: string, rawCode: string, adminId?: string, note?: string) {
    const code = rawCode.trim();
    if (!code) throw new BadRequestException('Redeem code is required');

    let giftCode = await this.prisma.subscriptionGiftCode.findUnique({ where: { code } });
    if (!giftCode) throw new NotFoundException('Gift code not found');

    giftCode = await this.syncGiftCodeStatus(giftCode);

    this.ensureGiftCodeIsRedeemable(giftCode);

    const alreadyRedeemed = await this.prisma.subscriptionGiftRedemption.findUnique({
      where: { giftCodeId_userId: { giftCodeId: giftCode.id, userId } },
    });

    if (alreadyRedeemed) {
      throw new ConflictException('You have already redeemed this gift code');
    }

    const now = new Date();
    const subscription = await this.prisma.subscription.findUnique({ where: { userId } });
    const baseDate = this.resolveGiftBaseDate(now, subscription);

    const giftExpiresAt = giftCode.lifetime
      ? null
      : this.addMonths(baseDate, giftCode.durationMonths || 0);

    const nextSource = subscription?.stripeSubscriptionId ? SubscriptionSource.STRIPE : SubscriptionSource.GIFT;

    await this.prisma.$transaction(async (tx) => {
      await tx.subscriptionGiftRedemption.create({
        data: {
          giftCodeId: giftCode.id,
          userId,
          note: note?.trim() || undefined,
        },
      });

      const redeemedCount = giftCode.redeemedCount + 1;
      const nextStatus = redeemedCount >= giftCode.maxRedemptions ? 'REDEEMED' : giftCode.status;

      await tx.subscriptionGiftCode.update({
        where: { id: giftCode.id },
        data: {
          redeemedCount,
          status: nextStatus,
        },
      });

      if (!subscription) {
        await tx.subscription.create({
          data: {
            userId,
            status: 'ACTIVE',
            source: nextSource,
            currentPeriodStart: now,
            currentPeriodEnd: giftExpiresAt ?? null,
            cancelAtPeriodEnd: false,
            giftExpiresAt,
            isLifetime: giftCode.lifetime,
          },
        });
      } else {
        await tx.subscription.update({
          where: { userId },
          data: {
            status: 'ACTIVE',
            source: nextSource,
            currentPeriodStart: subscription.currentPeriodStart ?? now,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
            giftExpiresAt,
            isLifetime: giftCode.lifetime || subscription.isLifetime,
          },
        });
      }

      if (adminId) {
        await tx.adminAuditLog.create({
          data: {
            adminId,
            action: 'MODERATION_ACTION',
            targetType: 'SubscriptionGift',
            targetId: giftCode.id,
            metadata: { userId, code: giftCode.code, note: note ?? null },
          },
        });
      }
    });

    return { data: { code: giftCode.code, giftExpiresAt, isLifetime: giftCode.lifetime } };
  }

  private resolveGiftBaseDate(now: Date, subscription: { currentPeriodEnd: Date | null; giftExpiresAt: Date | null; status: string } | null) {
    if (!subscription) return now;
    const candidates = [now];
    if (subscription.status === 'ACTIVE' && subscription.currentPeriodEnd) {
      candidates.push(subscription.currentPeriodEnd);
    }
    if (subscription.giftExpiresAt) {
      candidates.push(subscription.giftExpiresAt);
    }
    return new Date(Math.max(...candidates.map((d) => d.getTime())));
  }

  private ensureGiftCodeIsRedeemable(giftCode: GiftCodeState) {
    if (giftCode.status === 'REVOKED' || giftCode.status === 'EXPIRED') {
      throw new BadRequestException('This gift code is no longer active');
    }
    if (giftCode.expiresAt && giftCode.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('This gift code has expired');
    }
    if (giftCode.redeemedCount >= giftCode.maxRedemptions) {
      throw new BadRequestException('This gift code has already been redeemed');
    }
  }

  private async expireStaleGiftCodes() {
    await this.prisma.subscriptionGiftCode.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });
  }

  private async syncGiftCodeStatus<T extends GiftCodeState>(giftCode: T): Promise<T> {
    if (giftCode.status === 'ACTIVE' && giftCode.expiresAt && giftCode.expiresAt.getTime() < Date.now()) {
      await this.prisma.subscriptionGiftCode.update({
        where: { id: giftCode.id },
        data: { status: 'EXPIRED' },
      });

      return { ...giftCode, status: 'EXPIRED' };
    }

    return giftCode;
  }

  private async generateUniqueCode(): Promise<string> {
    for (let i = 0; i < 6; i += 1) {
      const code = `${GIFT_CODE_PREFIX}${this.randomToken(GIFT_CODE_LENGTH)}`;
      const existing = await this.prisma.subscriptionGiftCode.findUnique({ where: { code } });
      if (!existing) return code;
    }
    throw new ConflictException('Unable to generate a unique gift code');
  }

  private randomToken(length: number): string {
    let output = '';
    for (let i = 0; i < length; i += 1) {
      const idx = Math.floor(Math.random() * CODE_ALPHABET.length);
      output += CODE_ALPHABET[idx];
    }
    return output;
  }

  private addMonths(base: Date, months: number): Date {
    const result = new Date(base.getTime());
    const day = result.getDate();
    result.setMonth(result.getMonth() + months);
    if (result.getDate() < day) {
      result.setDate(0);
    }
    return result;
  }
}
