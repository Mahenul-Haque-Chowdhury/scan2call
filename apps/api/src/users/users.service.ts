import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateNotificationPrefsDto } from './dto/update-notification-prefs.dto';
import { SavedAddressDto, UpdateSavedAddressDto } from './dto/saved-address.dto';

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
        whatsappPhone: true,
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
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Subscriptions were removed; the store is open to everyone. These flags are
    // retained (always true) for backward compatibility with the current frontend
    // until the subscription UI is removed in a later round. @deprecated
    return {
      ...user,
      isSubscribed: true,
      hasActiveSubscription: true,
    };
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
    const nextWhatsappPhone = dto.whatsappPhone === undefined ? undefined : dto.whatsappPhone?.trim() || null;

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
        ...(nextWhatsappPhone !== undefined && { whatsappPhone: nextWhatsappPhone }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        phoneVerified: true,
        whatsappPhone: true,
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

  async listSavedAddresses(userId: string) {
    await this.ensureUserExists(userId);

    const addresses = await this.prisma.savedAddress.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { updatedAt: 'desc' },
      ],
    });

    return { data: addresses };
  }

  async createSavedAddress(userId: string, dto: SavedAddressDto) {
    await this.ensureUserExists(userId);

    const hasAddress = await this.prisma.savedAddress.findFirst({
      where: { userId },
      select: { id: true },
    });
    const shouldBeDefault = dto.isDefault ?? !hasAddress;
    const data = this.cleanCreateSavedAddressData(dto);

    const address = await this.prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.savedAddress.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }

      return tx.savedAddress.create({
        data: {
          ...data,
          userId,
          isDefault: shouldBeDefault,
        },
      });
    });

    this.logger.log(`Saved address created for user ${userId}`);
    return { data: address };
  }

  async updateSavedAddress(userId: string, addressId: string, dto: UpdateSavedAddressDto) {
    await this.ensureSavedAddressOwner(userId, addressId);

    const shouldBeDefault = dto.isDefault === true;
    const data = this.cleanSavedAddressData(dto);

    const address = await this.prisma.$transaction(async (tx) => {
      if (shouldBeDefault) {
        await tx.savedAddress.updateMany({
          where: { userId, id: { not: addressId } },
          data: { isDefault: false },
        });
      }

      return tx.savedAddress.update({
        where: { id: addressId },
        data: {
          ...data,
          ...(shouldBeDefault && { isDefault: true }),
        },
      });
    });

    this.logger.log(`Saved address ${addressId} updated for user ${userId}`);
    return { data: address };
  }

  async setDefaultSavedAddress(userId: string, addressId: string) {
    await this.ensureSavedAddressOwner(userId, addressId);

    const address = await this.prisma.$transaction(async (tx) => {
      await tx.savedAddress.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      return tx.savedAddress.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });

    return { data: address };
  }

  async deleteSavedAddress(userId: string, addressId: string) {
    const address = await this.ensureSavedAddressOwner(userId, addressId);

    await this.prisma.$transaction(async (tx) => {
      await tx.savedAddress.delete({ where: { id: addressId } });

      if (address.isDefault) {
        const nextDefault = await tx.savedAddress.findFirst({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
          select: { id: true },
        });

        if (nextDefault) {
          await tx.savedAddress.update({
            where: { id: nextDefault.id },
            data: { isDefault: true },
          });
        }
      }
    });

    this.logger.log(`Saved address ${addressId} deleted for user ${userId}`);
    return { deleted: true };
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

  private async ensureSavedAddressOwner(userId: string, addressId: string) {
    await this.ensureUserExists(userId);

    const address = await this.prisma.savedAddress.findFirst({
      where: { id: addressId, userId },
    });

    if (!address) {
      throw new NotFoundException('Saved address not found');
    }

    return address;
  }

  private cleanSavedAddressData(dto: SavedAddressDto | UpdateSavedAddressDto) {
    return {
      ...(dto.firstName !== undefined && { firstName: dto.firstName.trim() }),
      ...(dto.lastName !== undefined && { lastName: dto.lastName.trim() }),
      ...(dto.address1 !== undefined && { address1: dto.address1.trim() }),
      ...(dto.address2 !== undefined && { address2: dto.address2.trim() || null }),
      ...(dto.city !== undefined && { city: dto.city.trim() }),
      ...(dto.state !== undefined && { state: dto.state.trim() }),
      ...(dto.postcode !== undefined && { postcode: dto.postcode.trim() }),
      ...(dto.country !== undefined && { country: dto.country.trim() || 'AU' }),
    };
  }

  private cleanCreateSavedAddressData(dto: SavedAddressDto) {
    return {
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      address1: dto.address1.trim(),
      address2: dto.address2?.trim() || null,
      city: dto.city.trim(),
      state: dto.state.trim(),
      postcode: dto.postcode.trim(),
      country: dto.country?.trim() || 'AU',
    };
  }
}
