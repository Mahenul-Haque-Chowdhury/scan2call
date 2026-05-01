import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { GiftCodeStatus, TagType } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../database/prisma.service';

const GIFT_CODE_PREFIX = 'Scan2Call-Gift-';
const GIFT_CODE_LENGTH = 8;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TAG_TOKEN_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

interface CreateTagGiftCodeInput {
  tagType?: TagType;
  expiresAt?: Date | null;
  maxRedemptions?: number;
}

@Injectable()
export class TagGiftService {
  constructor(private readonly prisma: PrismaService) {}

  async createTagGiftCode(adminId: string, input: CreateTagGiftCodeInput) {
    const maxRedemptions = Math.max(input.maxRedemptions ?? 1, 1);
    const code = await this.generateUniqueCode();

    const giftCode = await this.prisma.tagGiftCode.create({
      data: {
        code,
        tagType: input.tagType ?? 'GENERIC',
        expiresAt: input.expiresAt ?? null,
        maxRedemptions,
        createdById: adminId,
      },
    });

    return { data: giftCode };
  }

  async listTagGiftCodes(params: { page?: number; pageSize?: number; status?: GiftCodeStatus; search?: string }) {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [{ code: { contains: params.search, mode: 'insensitive' } }];
    }

    const [codes, total] = await Promise.all([
      this.prisma.tagGiftCode.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.tagGiftCode.count({ where }),
    ]);

    return { data: codes, meta: { page, pageSize, total } };
  }

  async assignTagGiftCode(adminId: string, codeId: string, userId: string, note?: string) {
    const giftCode = await this.prisma.tagGiftCode.findUnique({ where: { id: codeId } });
    if (!giftCode) throw new NotFoundException('Gift code not found');

    return this.redeemTagGiftCode(userId, giftCode.code, adminId, note);
  }

  async redeemTagGiftCode(userId: string, rawCode: string, adminId?: string, note?: string) {
    const code = rawCode.trim();
    if (!code) throw new BadRequestException('Redeem code is required');

    const giftCode = await this.prisma.tagGiftCode.findUnique({ where: { code } });
    if (!giftCode) throw new NotFoundException('Gift code not found');

    this.ensureGiftCodeIsRedeemable(giftCode);

    const alreadyRedeemed = await this.prisma.tagGiftRedemption.findUnique({
      where: { giftCodeId_userId: { giftCodeId: giftCode.id, userId } },
    });

    if (alreadyRedeemed) {
      throw new ConflictException('You have already redeemed this gift code');
    }

    const token = await this.generateUniqueTagToken();

    const result = await this.prisma.$transaction(async (tx) => {
      const tag = await tx.tag.create({
        data: {
          token,
          type: giftCode.tagType,
          status: 'INACTIVE',
          ownerId: userId,
        },
      });

      await tx.tagGiftRedemption.create({
        data: {
          giftCodeId: giftCode.id,
          userId,
          tagId: tag.id,
          note: note?.trim() || undefined,
        },
      });

      const redeemedCount = giftCode.redeemedCount + 1;
      const nextStatus = redeemedCount >= giftCode.maxRedemptions ? 'REDEEMED' : giftCode.status;

      await tx.tagGiftCode.update({
        where: { id: giftCode.id },
        data: {
          redeemedCount,
          status: nextStatus,
        },
      });

      if (adminId) {
        await tx.adminAuditLog.create({
          data: {
            adminId,
            action: 'MODERATION_ACTION',
            targetType: 'TagGift',
            targetId: giftCode.id,
            metadata: { userId, code: giftCode.code, note: note ?? null, tagId: tag.id },
          },
        });
      }

      return tag;
    });

    return {
      data: {
        code: giftCode.code,
        tagId: result.id,
        token: result.token,
        tagType: result.type,
        status: result.status,
      },
    };
  }

  private ensureGiftCodeIsRedeemable(giftCode: { status: GiftCodeStatus; expiresAt: Date | null; redeemedCount: number; maxRedemptions: number }) {
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

  private async generateUniqueCode(): Promise<string> {
    for (let i = 0; i < 6; i += 1) {
      const code = `${GIFT_CODE_PREFIX}${this.randomToken(GIFT_CODE_LENGTH)}`;
      const existingSubscription = await this.prisma.subscriptionGiftCode.findUnique({ where: { code } });
      if (existingSubscription) continue;
      const existingTag = await this.prisma.tagGiftCode.findUnique({ where: { code } });
      if (!existingTag) return code;
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

  private async generateUniqueTagToken(): Promise<string> {
    for (let i = 0; i < 6; i += 1) {
      const token = this.randomTagToken(12);
      const existing = await this.prisma.tag.findUnique({ where: { token } });
      if (!existing) return token;
    }
    throw new ConflictException('Unable to generate a unique tag token');
  }

  private randomTagToken(length: number): string {
    const bytes = randomBytes(9);
    let token = '';
    for (const byte of bytes) {
      token += TAG_TOKEN_ALPHABET[byte % TAG_TOKEN_ALPHABET.length];
    }
    return token.slice(0, length);
  }
}
