import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateNotificationPrefsDto } from './dto/update-notification-prefs.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get user profile by ID. Excludes soft-deleted users.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        phone: true,
        phoneVerified: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        timezone: true,
        notifyOnScan: true,
        notifyViaSms: true,
        notifyViaEmail: true,
        notifyViaPush: true,
        stripeCustomerId: true,
        createdAt: true,
        subscription: {
          select: {
            id: true,
            status: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            giftExpiresAt: true,
            isLifetime: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isGiftActive = user.subscription
      ? this.isGiftActive(user.subscription.giftExpiresAt, user.subscription.isLifetime)
      : false;

    return {
      ...user,
      isSubscribed: (user.subscription?.status === 'ACTIVE') || isGiftActive,
      hasActiveSubscription: (user.subscription?.status === 'ACTIVE') || isGiftActive,
    };
  }

  private isGiftActive(giftExpiresAt: Date | null, isLifetime: boolean) {
    if (isLifetime) return true;
    if (!giftExpiresAt) return false;
    return giftExpiresAt.getTime() > Date.now();
  }

  /**
   * Update user profile fields (firstName, lastName, timezone, avatarUrl).
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, phone: true },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const nextPhone = dto.phone === undefined ? undefined : dto.phone?.trim() || null;

    if (nextPhone && nextPhone !== existingUser.phone) {
      const phoneOwner = await this.prisma.user.findFirst({
        where: {
          phone: nextPhone,
          deletedAt: null,
          id: { not: userId },
        },
        select: { id: true },
      });

      if (phoneOwner) {
        throw new ConflictException('An account with this phone number already exists');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.timezone !== undefined && { timezone: dto.timezone }),
        ...(nextPhone !== undefined && {
          phone: nextPhone,
          ...(nextPhone !== existingUser.phone && {
            phoneVerified: false,
            phoneVerifiedAt: null,
          }),
        }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        phoneVerified: true,
        timezone: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Profile updated for user ${userId}`);
    return user;
  }

  /**
   * Update notification preference flags.
   */
  async updateNotificationPrefs(userId: string, dto: UpdateNotificationPrefsDto) {
    await this.ensureUserExists(userId);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.notifyOnScan !== undefined && { notifyOnScan: dto.notifyOnScan }),
        ...(dto.notifyViaSms !== undefined && { notifyViaSms: dto.notifyViaSms }),
        ...(dto.notifyViaEmail !== undefined && { notifyViaEmail: dto.notifyViaEmail }),
        ...(dto.notifyViaPush !== undefined && { notifyViaPush: dto.notifyViaPush }),
      },
      select: {
        id: true,
        notifyOnScan: true,
        notifyViaSms: true,
        notifyViaEmail: true,
        notifyViaPush: true,
      },
    });

    this.logger.log(`Notification preferences updated for user ${userId}`);
    return user;
  }

  /**
   * Get dashboard statistics: total tags, total scans, active lost tags.
   */
  async getDashboardStats(userId: string) {
    await this.ensureUserExists(userId);

    const [totalTags, activeTags, lostTags, totalScans] = await Promise.all([
      this.prisma.tag.count({
        where: { ownerId: userId, deletedAt: null },
      }),
      this.prisma.tag.count({
        where: { ownerId: userId, status: 'ACTIVE', deletedAt: null },
      }),
      this.prisma.tag.count({
        where: { ownerId: userId, isLostMode: true, deletedAt: null },
      }),
      this.prisma.scan.count({
        where: { tag: { ownerId: userId } },
      }),
    ]);

    return {
      totalTags,
      activeTags,
      lostTags,
      totalScans,
    };
  }

  /**
   * Soft delete a user account. Sets deletedAt timestamp.
   * Revokes all refresh tokens and deactivates owned tags.
   */
  async softDelete(userId: string) {
    await this.ensureUserExists(userId);

    await this.prisma.$transaction(async (tx) => {
      // Soft delete the user
      await tx.user.update({
        where: { id: userId },
        data: { deletedAt: new Date() },
      });

      // Revoke all refresh tokens
      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      // Deactivate all owned tags
      await tx.tag.updateMany({
        where: { ownerId: userId, deletedAt: null },
        data: {
          status: 'DEACTIVATED',
          deactivatedAt: new Date(),
        },
      });
    });

    this.logger.log(`User ${userId} soft-deleted`);
    return { deleted: true };
  }

  /**
   * Ensure user exists and is not soft-deleted.
   */
  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }
}
