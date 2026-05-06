import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { Prisma } from '@/generated/prisma/client';
import { AppConfigService } from '../config/config.service';
import { Role, TagType, TagStatus, OrderStatus, ContactMessageStatus } from '@/generated/prisma/client';
import { BatchGenerateTagsDto } from './dto/batch-generate-tags.dto';
import { AssignTagDto } from './dto/assign-tag.dto';
import { AnalyticsQueryDto, AnalyticsGranularity } from './dto/analytics-query.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { MediaService } from '../media/media.service';
import { QrCodeService, QrRenderOptions } from '../qr-code/qr-code.service';
import * as crypto from 'crypto';
import Stripe from 'stripe';

/** Base62 alphabet for tag token generation */
const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const DEFAULT_QR_DESIGN_SETTING_KEY = 'defaultQrDesignTemplateId';

type QrTemplateConfig = {
  size?: number;
  margin?: number;
  foregroundColor?: string;
  backgroundColor?: string;
};

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: AppConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly mediaService: MediaService,
    private readonly qrCodeService: QrCodeService,
  ) {
    const key = this.configService.stripeSecretKey;
    this.stripe = key
      ? new Stripe(key, { apiVersion: '2025-02-24.acacia' })
      : null;
  }

  private get stripeClient(): Stripe {
    if (!this.stripe) throw new BadRequestException('Stripe is not configured');
    return this.stripe;
  }

  // ──────────────────────────────────────────────
  // USER MANAGEMENT
  // ──────────────────────────────────────────────

  /**
   * List users with pagination and search.
   */
  async listUsers(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: Role;
  }) {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { deletedAt: null };

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.role) {
      where.role = params.role;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isSuspended: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { tags: true, orders: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { page, pageSize, total },
    };
  }

  /**
   * Get a single user's detailed profile by ID.
   */
  async getUserById(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        subscription: true,
        _count: { select: { tags: true, scans: true, orders: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Strip sensitive fields
    const { passwordHash, ...safeUser } = user;
    void passwordHash;
    return safeUser;
  }

  /**
   * Admin manually verifies a user's email and/or phone.
   */
  async verifyUser(
    adminId: string,
    userId: string,
    data: { emailVerified?: boolean; phoneVerified?: boolean },
  ) {
    await this.ensureUserExists(userId);

    const updateData: Record<string, unknown> = {};

    if (data.emailVerified !== undefined) {
      updateData.emailVerified = data.emailVerified;
      updateData.emailVerifiedAt = data.emailVerified ? new Date() : null;
    }
    if (data.phoneVerified !== undefined) {
      updateData.phoneVerified = data.phoneVerified;
      updateData.phoneVerifiedAt = data.phoneVerified ? new Date() : null;
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        phoneVerified: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Admin ${adminId} manually verified user ${userId}: ${JSON.stringify(data)}`);
    return user;
  }

  /**
   * Admin update of a user: change role, suspend/unsuspend.
   */
  async updateUser(
    adminId: string,
    userId: string,
    data: { role?: Role; isSuspended?: boolean; suspendedReason?: string },
  ) {
    await this.ensureUserExists(userId);

    const updateData: Record<string, unknown> = {};

    if (data.role !== undefined) {
      updateData.role = data.role;
    }

    if (data.isSuspended !== undefined) {
      updateData.isSuspended = data.isSuspended;
      updateData.suspendedAt = data.isSuspended ? new Date() : null;
      updateData.suspendedReason = data.isSuspended ? (data.suspendedReason || null) : null;

      // Audit log
      await this.prisma.adminAuditLog.create({
        data: {
          adminId,
          action: data.isSuspended ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
          targetType: 'User',
          targetId: userId,
          metadata: { reason: data.suspendedReason },
        },
      });
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isSuspended: true,
        suspendedAt: true,
        suspendedReason: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Admin ${adminId} updated user ${userId}`);
    return user;
  }

  /**
   * Admin hard delete (or soft delete) a user.
   */
  async deleteUser(adminId: string, userId: string) {
    await this.ensureUserExists(userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Admin ${adminId} deleted user ${userId}`);
    return { deleted: true };
  }

  // ──────────────────────────────────────────────
  // CONTACT MESSAGES
  // ──────────────────────────────────────────────

  async listContactMessages(params: {
    page?: number;
    pageSize?: number;
    status?: ContactMessageStatus;
    search?: string;
  }) {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { message: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [messages, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          message: true,
          status: true,
          createdAt: true,
          repliedAt: true,
          _count: { select: { replies: true } },
        },
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    return {
      data: messages,
      meta: { page, pageSize, total },
    };
  }

  async getContactMessageById(messageId: string) {
    const message = await this.prisma.contactMessage.findUnique({
      where: { id: messageId },
      include: {
        replies: {
          orderBy: { sentAt: 'desc' },
          include: {
            sentBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Contact message not found');
    }

    return { data: message };
  }

  async replyContactMessage(
    adminId: string,
    messageId: string,
    data: { subject?: string; body: string },
  ) {
    const message = await this.prisma.contactMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Contact message not found');
    }

    const subject = (data.subject || '').trim() || 'Scan2Call Support';
    const body = data.body.trim();

    await this.notificationsService.sendContactReply({
      name: message.name,
      email: message.email,
      subject,
      body,
    });

    const updated = await this.prisma.contactMessage.update({
      where: { id: messageId },
      data: {
        status: 'REPLIED',
        repliedAt: new Date(),
        repliedById: adminId,
        replies: {
          create: {
            subject,
            body,
            sentById: adminId,
          },
        },
      },
      include: {
        replies: {
          orderBy: { sentAt: 'desc' },
          include: {
            sentBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    this.logger.log(`Admin ${adminId} replied to contact message ${messageId}`);
    return { data: updated };
  }

  // ──────────────────────────────────────────────
  // TAG MANAGEMENT
  // ──────────────────────────────────────────────

  /**
   * List tags with pagination and filtering.
   */
  async listTags(params: {
    page?: number;
    pageSize?: number;
    status?: TagStatus;
    type?: TagType;
    search?: string;
  }) {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (params.status) {
      where.status = params.status;
    } else {
      // By default, don't filter out soft-deleted tags — admins should see everything
    }
    if (params.type) {
      where.type = params.type;
    }
    if (params.search) {
      where.OR = [
        { token: { contains: params.search } },
        { label: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [tags, total] = await Promise.all([
      this.prisma.tag.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          token: true,
          type: true,
          status: true,
          label: true,
          ownerId: true,
          isLostMode: true,
          batchId: true,
          createdAt: true,
          owner: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          _count: { select: { scans: true } },
        },
      }),
      this.prisma.tag.count({ where }),
    ]);

    return {
      data: tags,
      meta: { page, pageSize, total },
    };
  }

  /**
   * Update a single tag (admin).
   */
  async updateTag(
    adminId: string,
    tagId: string,
    data: {
      status?: TagStatus;
      label?: string;
      qrDesignTemplateId?: string | null;
      qrDesignOverrides?: Record<string, unknown>;
    },
  ) {
    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const statusData: Record<string, unknown> = {};
    if (data.status !== undefined) {
      statusData.status = data.status;
      if (data.status === 'DEACTIVATED') {
        statusData.deactivatedAt = new Date();
      } else if (data.status === 'ACTIVE') {
        // Clear soft-delete timestamps so the tag is visible to the user again
        statusData.deletedAt = null;
        statusData.deactivatedAt = null;
      }
    }

    const updateData: Prisma.TagUpdateInput = {
      ...(statusData as Prisma.TagUpdateInput),
      ...(data.label !== undefined ? { label: data.label } : {}),
      ...(data.qrDesignOverrides !== undefined
        ? { qrDesignOverrides: data.qrDesignOverrides as Prisma.InputJsonValue }
        : {}),
      ...(data.qrDesignTemplateId !== undefined
        ? data.qrDesignTemplateId
          ? { qrDesignTemplate: { connect: { id: data.qrDesignTemplateId } } }
          : { qrDesignTemplate: { disconnect: true } }
        : {}),
    };

    const updated = await this.prisma.tag.update({
      where: { id: tagId },
      data: updateData,
    });

    const auditAction = data.status === 'DEACTIVATED' ? 'TAG_DEACTIVATED'
      : data.status === 'ACTIVE' && tag.deletedAt ? 'TAG_REACTIVATED'
      : null;

    if (auditAction) {
      await this.prisma.adminAuditLog.create({
        data: {
          adminId,
          action: auditAction,
          targetType: 'Tag',
          targetId: tagId,
        },
      });
    }

    this.logger.log(`Admin ${adminId} updated tag ${tagId}`);
    return updated;
  }

  async deleteTag(adminId: string, tagId: string) {
    const tag = await this.prisma.tag.findFirst({ where: { id: tagId } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const updated = await this.prisma.tag.update({
      where: { id: tagId },
      data: {
        status: 'DEACTIVATED',
        deletedAt: new Date(),
        deactivatedAt: new Date(),
      },
    });

    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'TAG_DEACTIVATED',
        targetType: 'Tag',
        targetId: tagId,
        metadata: { reason: 'Admin delete' },
      },
    });

    this.logger.log(`Admin ${adminId} deleted tag ${tagId}`);
    return updated;
  }

  /**
   * Assign a pre-generated tag to a user and activate it immediately.
   */
  async assignTagToUser(adminId: string, dto: AssignTagDto) {
    if (!dto.tagId && !dto.token) {
      throw new BadRequestException('Provide either tagId or token to assign a tag');
    }

    await this.ensureUserExists(dto.userId);

    const tag = await this.prisma.tag.findFirst({
      where: dto.tagId ? { id: dto.tagId } : { token: dto.token },
    });

    if (!tag || tag.deletedAt) {
      throw new NotFoundException('Tag not found');
    }

    if (tag.status === 'DEACTIVATED') {
      throw new BadRequestException('This tag has been deactivated');
    }

    if (tag.ownerId && tag.ownerId !== dto.userId) {
      throw new BadRequestException('This tag is already assigned to another user');
    }

    const updated = await this.prisma.tag.update({
      where: { id: tag.id },
      data: {
        ownerId: dto.userId,
        status: 'ACTIVE',
        isLostMode: false,
        lostModeAt: null,
        lostModeMessage: null,
        activatedAt: tag.activatedAt ?? new Date(),
        deletedAt: null,
        deactivatedAt: null,
      },
    });

    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'TAG_ASSIGNED_TO_USER',
        targetType: 'Tag',
        targetId: tag.id,
        metadata: {
          userId: dto.userId,
          token: tag.token,
        },
      },
    });

    this.logger.log(`Admin ${adminId} assigned tag ${tag.id} to user ${dto.userId}`);
    return updated;
  }

  /**
   * Batch generate tags with unique 12-char base62 tokens.
   */
  async batchGenerateTags(adminId: string, dto: BatchGenerateTagsDto) {
    const tokens = this.generateUniqueTokens(dto.quantity);
    const batchName = dto.batchName?.trim() || `Batch ${new Date().toISOString()}`;

    if (dto.storeQrAssets && dto.quantity > 1000) {
      throw new BadRequestException(
        'QR asset generation is limited to 1000 tags per request. Reduce quantity or run multiple batches.',
      );
    }

    const resolvedTemplateId = dto.qrDesignTemplateId
      ?? await this.getDefaultQrDesignTemplateId();
    const resolvedTemplate = resolvedTemplateId
      ? await this.prisma.qrDesignTemplate.findFirst({
          where: { id: resolvedTemplateId, isActive: true },
        })
      : null;

    // Create the batch record
    const batch = await this.prisma.tagBatch.create({
      data: {
        name: batchName,
        quantity: dto.quantity,
        tagType: dto.tagType,
        generatedBy: adminId,
        notes: dto.notes,
        qrDesignTemplateId: resolvedTemplate?.id ?? null,
      },
    });

    // Bulk create tags
    await this.prisma.tag.createMany({
      data: tokens.map((token) => ({
        token,
        type: dto.tagType,
        status: 'INACTIVE' as const,
        batchId: batch.id,
        qrDesignTemplateId: resolvedTemplate?.id ?? null,
      })),
    });

    if (dto.storeQrAssets) {
      const tags = await this.prisma.tag.findMany({
        where: { batchId: batch.id },
        select: { id: true, token: true, qrDesignTemplateId: true, qrDesignOverrides: true },
      });

      await this.generateAndStoreQrAssets(batch.id, tags, resolvedTemplate?.config ?? null);
    }

    // Audit log
    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'TAG_BATCH_GENERATED',
        targetType: 'TagBatch',
        targetId: batch.id,
        metadata: {
          quantity: dto.quantity,
          tagType: dto.tagType,
          batchName: dto.batchName,
        },
      },
    });

    this.logger.log(
      `Admin ${adminId} generated batch "${dto.batchName}" with ${dto.quantity} tags`,
    );

    return {
      batchId: batch.id,
      batchName: batch.name,
      quantity: dto.quantity,
      tagType: dto.tagType,
      tokens,
    };
  }

  private resolveQrOptions(
    baseConfig: unknown,
    overrides: unknown,
  ): QrRenderOptions {
    const base = (baseConfig && typeof baseConfig === 'object') ? (baseConfig as QrTemplateConfig) : {};
    const override = (overrides && typeof overrides === 'object') ? (overrides as QrTemplateConfig) : {};
    return {
      size: override.size ?? base.size,
      margin: override.margin ?? base.margin,
      foregroundColor: override.foregroundColor ?? base.foregroundColor,
      backgroundColor: override.backgroundColor ?? base.backgroundColor,
    };
  }

  private async buildQrAssetsForTags(
    tags: Array<{ token: string; qrDesignTemplateId: string | null; qrDesignOverrides: unknown }>,
    batchTemplateId?: string | null,
  ): Promise<Array<{ token: string; renderOptions: QrRenderOptions }>> {
    const templateCache = new Map<string, unknown>();
    const defaultTemplateId = await this.getDefaultQrDesignTemplateId();

    const resolveTemplateConfig = async (templateId: string | null) => {
      if (!templateId) return null;
      if (!templateCache.has(templateId)) {
        const template = await this.prisma.qrDesignTemplate.findFirst({
          where: { id: templateId, isActive: true },
          select: { config: true },
        });
        templateCache.set(templateId, template?.config ?? null);
      }
      return templateCache.get(templateId) ?? null;
    };

    const resolvedBatchTemplateId = batchTemplateId ?? null;

    const results: Array<{ token: string; renderOptions: QrRenderOptions }> = [];
    for (const tag of tags) {
      const templateId = tag.qrDesignTemplateId ?? resolvedBatchTemplateId ?? defaultTemplateId;
      const templateConfig = await resolveTemplateConfig(templateId);
      results.push({
        token: tag.token,
        renderOptions: this.resolveQrOptions(templateConfig, tag.qrDesignOverrides),
      });
    }

    return results;
  }

  private async generateAndStoreQrAssets(
    batchId: string,
    tags: Array<{ id: string; token: string; qrDesignTemplateId: string | null; qrDesignOverrides: unknown }>,
    defaultTemplateConfig: unknown,
  ): Promise<void> {
    const concurrency = 6;
    const templateCache = new Map<string, unknown>();

    await this.mapWithConcurrency(tags, concurrency, async (tag) => {
      let templateConfig: unknown = defaultTemplateConfig;
      if (tag.qrDesignTemplateId) {
        if (!templateCache.has(tag.qrDesignTemplateId)) {
          const template = await this.prisma.qrDesignTemplate.findFirst({
            where: { id: tag.qrDesignTemplateId, isActive: true },
          });
          templateCache.set(tag.qrDesignTemplateId, template?.config ?? null);
        }
        templateConfig = templateCache.get(tag.qrDesignTemplateId) ?? null;
      }

      const renderOptions = this.resolveQrOptions(templateConfig, tag.qrDesignOverrides);

      const scanUrl = this.qrCodeService.buildScanUrl(tag.token);
      const [png, svg] = await Promise.all([
        this.qrCodeService.generatePngWithOptions(scanUrl, renderOptions),
        this.qrCodeService.generateSvgWithOptions(scanUrl, renderOptions),
      ]);

      const pngKey = `qr-codes/${batchId}/${tag.token}.png`;
      const svgKey = `qr-codes/${batchId}/${tag.token}.svg`;

      const [pngUpload, svgUpload] = await Promise.all([
        this.mediaService.uploadBuffer({
          key: pngKey,
          body: png,
          contentType: 'image/png',
          cacheControl: 'public, max-age=31536000, immutable',
        }),
        this.mediaService.uploadBuffer({
          key: svgKey,
          body: Buffer.from(svg, 'utf-8'),
          contentType: 'image/svg+xml',
          cacheControl: 'public, max-age=31536000, immutable',
        }),
      ]);

      await this.prisma.tag.update({
        where: { id: tag.id },
        data: {
          qrPngUrl: pngUpload.publicUrl,
          qrSvgUrl: svgUpload.publicUrl,
        },
      });
    });
  }

  private async mapWithConcurrency<T>(
    items: T[],
    limit: number,
    handler: (item: T) => Promise<void>,
  ): Promise<void> {
    if (items.length === 0) return;

    const queue = [...items];
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) break;
        await handler(item);
      }
    });

    await Promise.all(workers);
  }

  async listQrTemplates() {
    const [templates, defaultTemplateId] = await Promise.all([
      this.prisma.qrDesignTemplate.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      this.getDefaultQrDesignTemplateId(),
    ]);

    return {
      data: templates.map((template) => ({
        ...template,
        isDefault: template.id === defaultTemplateId,
      })),
    };
  }

  async getDefaultQrDesignTemplate() {
    const templateId = await this.getDefaultQrDesignTemplateId();
    return { data: { templateId } };
  }

  async setDefaultQrDesignTemplate(adminId: string, templateId?: string | null) {
    const trimmedId = templateId?.trim();
    let resolvedId: string | null = trimmedId && trimmedId.length > 0 ? trimmedId : null;

    if (resolvedId) {
      const template = await this.prisma.qrDesignTemplate.findFirst({
        where: { id: resolvedId, isActive: true },
        select: { id: true },
      });
      if (!template) {
        throw new NotFoundException('QR template not found');
      }
      resolvedId = template.id;
    }

    await this.prisma.systemSetting.upsert({
      where: { key: DEFAULT_QR_DESIGN_SETTING_KEY },
      update: { value: { templateId: resolvedId } },
      create: {
        key: DEFAULT_QR_DESIGN_SETTING_KEY,
        value: { templateId: resolvedId },
        description: 'Default QR design template for new tag batches.',
      },
    });

    this.logger.log(`Admin ${adminId} set default QR design template to ${resolvedId ?? 'none'}`);

    return { data: { templateId: resolvedId } };
  }

  private async getDefaultQrDesignTemplateId(): Promise<string | null> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: DEFAULT_QR_DESIGN_SETTING_KEY },
    });
    const value = setting?.value as { templateId?: string | null } | null;
    return value?.templateId ?? null;
  }

  async createQrTemplate(
    adminId: string,
    data: { name: string; description?: string | null; config: Prisma.InputJsonValue; isActive?: boolean },
  ) {
    const template = await this.prisma.qrDesignTemplate.create({
      data: {
        name: data.name.trim(),
        description: data.description ?? null,
        config: data.config,
        isActive: data.isActive ?? true,
        createdBy: adminId,
      },
    });

    return { data: template };
  }

  async updateQrTemplate(
    templateId: string,
    data: { name?: string; description?: string | null; config?: Prisma.InputJsonValue; isActive?: boolean },
  ) {
    const template = await this.prisma.qrDesignTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      throw new NotFoundException('QR template not found');
    }

    const updated = await this.prisma.qrDesignTemplate.update({
      where: { id: templateId },
      data: {
        name: data.name?.trim() ?? undefined,
        description: data.description !== undefined ? data.description : undefined,
        config: data.config !== undefined ? data.config : undefined,
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
    });

    return { data: updated };
  }

  async getQrTemplateById(templateId: string) {
    const template = await this.prisma.qrDesignTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      throw new NotFoundException('QR template not found');
    }
    return template;
  }

  async regenerateTagQrAssets(adminId: string, tagId: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id: tagId },
      select: { id: true, token: true, batchId: true, qrDesignTemplateId: true, qrDesignOverrides: true },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    if (!tag.batchId) {
      throw new BadRequestException('Tag does not belong to a batch');
    }

    const batch = await this.prisma.tagBatch.findUnique({
      where: { id: tag.batchId },
      select: { qrDesignTemplateId: true },
    });

    const template = tag.qrDesignTemplateId
      ? await this.prisma.qrDesignTemplate.findFirst({ where: { id: tag.qrDesignTemplateId, isActive: true } })
      : batch?.qrDesignTemplateId
        ? await this.prisma.qrDesignTemplate.findFirst({ where: { id: batch.qrDesignTemplateId, isActive: true } })
        : null;

    await this.generateAndStoreQrAssets(tag.batchId, [tag], template?.config ?? null);

    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'QR_GENERATED',
        targetType: 'Tag',
        targetId: tag.id,
      },
    });

    return { regenerated: true };
  }

  async regenerateBatchQrAssets(adminId: string, batchId: string) {
    const batch = await this.prisma.tagBatch.findUnique({
      where: { id: batchId },
      select: { id: true, qrDesignTemplateId: true },
    });

    if (!batch) {
      throw new NotFoundException('Tag batch not found');
    }

    const tags = await this.prisma.tag.findMany({
      where: { batchId: batch.id },
      select: { id: true, token: true, qrDesignTemplateId: true, qrDesignOverrides: true },
    });

    const template = batch.qrDesignTemplateId
      ? await this.prisma.qrDesignTemplate.findFirst({ where: { id: batch.qrDesignTemplateId, isActive: true } })
      : null;

    await this.generateAndStoreQrAssets(batch.id, tags, template?.config ?? null);

    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'QR_GENERATED',
        targetType: 'TagBatch',
        targetId: batch.id,
      },
    });

    return { regenerated: true };
  }

  async getQrAssetsForTagIds(tagIds: string[]) {
    const tags = await this.prisma.tag.findMany({
      where: { id: { in: tagIds } },
      select: { id: true, token: true, batchId: true, qrDesignTemplateId: true, qrDesignOverrides: true },
    });

    if (tags.length === 0) {
      return { data: [] };
    }

    const batchIds = Array.from(new Set(tags.map((tag) => tag.batchId).filter(Boolean))) as string[];
    const batches = batchIds.length > 0
      ? await this.prisma.tagBatch.findMany({
          where: { id: { in: batchIds } },
          select: { id: true, qrDesignTemplateId: true },
        })
      : [];
    const batchTemplateMap = new Map(batches.map((batch) => [batch.id, batch.qrDesignTemplateId ?? null]));

    const defaultTemplateId = await this.getDefaultQrDesignTemplateId();
    const templateCache = new Map<string, unknown>();

    const resolveTemplateConfig = async (templateId: string | null) => {
      if (!templateId) return null;
      if (!templateCache.has(templateId)) {
        const template = await this.prisma.qrDesignTemplate.findFirst({
          where: { id: templateId, isActive: true },
          select: { config: true },
        });
        templateCache.set(templateId, template?.config ?? null);
      }
      return templateCache.get(templateId) ?? null;
    };

    const items: Array<{ token: string; renderOptions: QrRenderOptions }> = [];
    for (const tag of tags) {
      const batchTemplateId = tag.batchId ? batchTemplateMap.get(tag.batchId) ?? null : null;
      const templateId = tag.qrDesignTemplateId ?? batchTemplateId ?? defaultTemplateId;
      const templateConfig = await resolveTemplateConfig(templateId);
      items.push({
        token: tag.token,
        renderOptions: this.resolveQrOptions(templateConfig, tag.qrDesignOverrides),
      });
    }

    return { data: items };
  }

  async getQrAssetsForBatch(batchId: string) {
    const batch = await this.prisma.tagBatch.findUnique({
      where: { id: batchId },
      select: { id: true, name: true, qrDesignTemplateId: true },
    });

    if (!batch) {
      throw new NotFoundException('Tag batch not found');
    }

    const tags = await this.prisma.tag.findMany({
      where: { batchId: batch.id },
      select: { token: true, qrDesignTemplateId: true, qrDesignOverrides: true },
      orderBy: { createdAt: 'asc' },
    });

    const assets = await this.buildQrAssetsForTags(tags, batch.qrDesignTemplateId ?? null);
    return { data: assets, batchName: batch.name };
  }

  /**
   * Import tags from CSV content. Expects rows with: token, tagType (optional).
   * Validates uniqueness and creates tags in a batch.
   */
  async importTagsCsv(adminId: string, csvContent: string, batchName?: string, tagType?: TagType) {
    const lines = csvContent
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Skip header row if present
    const hasHeader = lines[0]?.toLowerCase().includes('token');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    if (dataLines.length === 0) {
      throw new BadRequestException('CSV file contains no data rows');
    }

    if (dataLines.length > 10000) {
      throw new BadRequestException('CSV import limited to 10,000 rows per import');
    }

    const tokens: string[] = [];
    const tokenRegex = /^[a-zA-Z0-9]{12}$/;

    for (const line of dataLines) {
      const columns = line.split(',').map((col) => col.trim());
      const token = columns[0];

      if (!token || !tokenRegex.test(token)) {
        throw new BadRequestException(`Invalid token format: "${token}". Must be 12-char base62.`);
      }

      tokens.push(token);
    }

    // Check for duplicates within the import
    const uniqueTokens = new Set(tokens);
    if (uniqueTokens.size !== tokens.length) {
      throw new BadRequestException('CSV contains duplicate tokens');
    }

    // Check for existing tokens in the database
    const existing = await this.prisma.tag.findMany({
      where: { token: { in: tokens } },
      select: { token: true },
    });

    if (existing.length > 0) {
      throw new BadRequestException(
        `${existing.length} token(s) already exist in database: ${existing.slice(0, 5).map((t) => t.token).join(', ')}...`,
      );
    }

    // Create batch
    const resolvedType = tagType || 'GENERIC';
    const batch = await this.prisma.tagBatch.create({
      data: {
        name: batchName || `CSV Import ${new Date().toISOString().split('T')[0]}`,
        quantity: tokens.length,
        tagType: resolvedType,
        generatedBy: adminId,
        notes: `Imported from CSV with ${tokens.length} tags`,
      },
    });

    // Bulk create
    await this.prisma.tag.createMany({
      data: tokens.map((token) => ({
        token,
        type: resolvedType,
        status: 'INACTIVE' as const,
        batchId: batch.id,
      })),
    });

    // Audit log
    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'TAG_CSV_IMPORTED',
        targetType: 'TagBatch',
        targetId: batch.id,
        metadata: { count: tokens.length, batchName: batch.name },
      },
    });

    this.logger.log(`Admin ${adminId} imported ${tokens.length} tags via CSV`);

    return {
      batchId: batch.id,
      imported: tokens.length,
      tagType: resolvedType,
    };
  }

  /**
   * List all tag batches.
   */
  async listBatches(params: { page?: number; pageSize?: number }) {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;

    const [batches, total] = await Promise.all([
      this.prisma.tagBatch.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { tags: true } },
        },
      }),
      this.prisma.tagBatch.count(),
    ]);

    return {
      data: batches,
      meta: { page, pageSize, total },
    };
  }

  /**
   * Get a single batch and its tags.
   */
  async getBatchById(batchId: string) {
    const batch = await this.prisma.tagBatch.findUnique({
      where: { id: batchId },
      include: {
        tags: {
          select: {
            id: true,
            token: true,
            status: true,
            ownerId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Tag batch not found');
    }

    return batch;
  }

  // ──────────────────────────────────────────────
  // ORDER MANAGEMENT
  // ──────────────────────────────────────────────

  /**
   * List orders with pagination and filtering.
   */
  async listOrders(params: {
    page?: number;
    pageSize?: number;
    status?: OrderStatus;
    search?: string;
  }) {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (params.status) {
      where.status = params.status;
    }
    if (params.search) {
      where.OR = [
        { orderNumber: { contains: params.search, mode: 'insensitive' } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          items: {
            select: { productName: true, quantity: true, totalPriceInCents: true },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: { page, pageSize, total },
    };
  }

  /**
   * Get order detail by ID.
   */
  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, tagType: true, includesTagCount: true } },
            tags: { select: { id: true, token: true, status: true, label: true } },
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
   * Update order (status, tracking, internal notes).
   */
  async updateOrder(
    adminId: string,
    orderId: string,
    data: {
      status?: OrderStatus;
      trackingNumber?: string;
      trackingCarrier?: string;
      internalNotes?: string;
    },
  ) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updateData: Record<string, unknown> = {};

    if (data.status) {
      updateData.status = data.status;
      if (data.status === 'SHIPPED') {
        updateData.shippedAt = new Date();
      }
      if (data.status === 'DELIVERED') {
        updateData.deliveredAt = new Date();

        // Auto-activate all tags linked to this order's items
        const orderItems = await this.prisma.orderItem.findMany({
          where: { orderId },
          select: { id: true },
        });
        const itemIds = orderItems.map(i => i.id);

        if (itemIds.length > 0) {
          const activatedCount = await this.prisma.tag.updateMany({
            where: {
              orderItemId: { in: itemIds },
              status: 'INACTIVE',
            },
            data: {
              status: 'ACTIVE',
              activatedAt: new Date(),
            },
          });

          if (activatedCount.count > 0) {
            await this.prisma.adminAuditLog.create({
              data: {
                adminId,
                action: 'ORDER_TAGS_ACTIVATED',
                targetType: 'Order',
                targetId: orderId,
                metadata: { activatedCount: activatedCount.count },
              },
            });
            this.logger.log(`Auto-activated ${activatedCount.count} tags for delivered order ${orderId}`);
          }
        }
      }
    }
    if (data.trackingNumber !== undefined) {
      updateData.trackingNumber = data.trackingNumber;
    }
    if (data.trackingCarrier !== undefined) {
      updateData.trackingCarrier = data.trackingCarrier;
    }
    if (data.internalNotes !== undefined) {
      updateData.internalNotes = data.internalNotes;
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: { select: { id: true, email: true } },
        items: true,
      },
    });

    // Audit log
    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'ORDER_UPDATED',
        targetType: 'Order',
        targetId: orderId,
        metadata: { changes: data },
      },
    });

    this.logger.log(`Admin ${adminId} updated order ${orderId}`);
    return { data: updated };
  }

  /**
   * Issue a full refund for an order via Stripe.
   */
  async refundOrder(adminId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === 'REFUNDED') {
      throw new BadRequestException('Order is already refunded');
    }

    if (!order.payment?.stripePaymentIntentId) {
      throw new BadRequestException('No Stripe payment found for this order');
    }

    // Issue Stripe refund
    const refund = await this.stripeClient.refunds.create({
      payment_intent: order.payment.stripePaymentIntentId,
      reason: 'requested_by_customer',
    });

    // Update payment record
    await this.prisma.payment.update({
      where: { id: order.payment.id },
      data: {
        status: 'REFUNDED',
        refundedAmountInCents: order.totalInCents,
        refundedAt: new Date(),
      },
    });

    // Update order status
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'REFUNDED' },
    });

    // Audit log
    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'REFUND_ISSUED',
        targetType: 'Order',
        targetId: orderId,
        metadata: {
          refundId: refund.id,
          amountInCents: order.totalInCents,
          stripePaymentIntentId: order.payment.stripePaymentIntentId,
        },
      },
    });

    this.logger.log(`Admin ${adminId} refunded order ${orderId} (${refund.id})`);

    return {
      orderId: updatedOrder.id,
      refundId: refund.id,
      amountRefundedInCents: order.totalInCents,
      status: 'REFUNDED',
    };
  }

  // ──────────────────────────────────────────────
  // ANALYTICS
  // ──────────────────────────────────────────────

  /**
   * Overview: counts of users, tags, scans, orders, revenue.
   */
  async getAnalyticsOverview() {
    const [totalUsers, totalTags, totalScans, totalOrders, revenueResult] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.tag.count({ where: { deletedAt: null } }),
      this.prisma.scan.count(),
      this.prisma.order.count(),
      this.prisma.payment.aggregate({
        where: { status: 'SUCCEEDED' },
        _sum: { amountInCents: true },
      }),
    ]);

    const activeSubscriptions = await this.prisma.subscription.count({
      where: { status: 'ACTIVE' },
    });

    return {
      totalUsers,
      totalTags,
      totalScans,
      totalOrders,
      activeSubscriptions,
      totalRevenueInCents: revenueResult._sum.amountInCents || 0,
    };
  }

  /**
   * Scan analytics over a date range.
   */
  async getScansAnalytics(query: AnalyticsQueryDto) {
    const { startDate, endDate } = this.resolveDateRange(query);

    const scans = await this.prisma.scan.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
    });

    const buckets = this.bucketByGranularity(
      scans.map((s) => ({ date: s.createdAt, count: s._count.id })),
      query.granularity || AnalyticsGranularity.DAY,
    );

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      granularity: query.granularity || AnalyticsGranularity.DAY,
      data: buckets,
    };
  }

  /**
   * Revenue analytics over a date range.
   */
  async getRevenueAnalytics(query: AnalyticsQueryDto) {
    const { startDate, endDate } = this.resolveDateRange(query);

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'SUCCEEDED',
        paidAt: { gte: startDate, lte: endDate },
      },
      select: { amountInCents: true, paidAt: true },
      orderBy: { paidAt: 'asc' },
    });

    const granularity = query.granularity || AnalyticsGranularity.DAY;
    const buckets = this.bucketByGranularity(
      payments.map((p) => ({ date: p.paidAt!, count: p.amountInCents })),
      granularity,
    );

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      granularity,
      data: buckets,
    };
  }

  /**
   * Tag analytics: breakdown by status and type.
   */
  async getTagsAnalytics() {
    const [byStatus, byType] = await Promise.all([
      this.prisma.tag.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
      this.prisma.tag.groupBy({
        by: ['type'],
        where: { deletedAt: null },
        _count: { id: true },
      }),
    ]);

    return {
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
      byType: byType.map((t) => ({ type: t.type, count: t._count.id })),
    };
  }

  // ──────────────────────────────────────────────
  // PRODUCT MANAGEMENT
  // ──────────────────────────────────────────────

  async listProducts(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    tagType?: TagType;
    includeDeleted?: boolean;
  }) {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (!params.includeDeleted) {
      where.deletedAt = null;
    }
    if (params.tagType) {
      where.tagType = params.tagType;
    }
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { orderItems: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: { page, pageSize, total },
    };
  }

  async getProductById(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { orderItems: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async createProduct(adminId: string, dto: CreateProductDto) {
    // Check unique constraints
    const existing = await this.prisma.product.findFirst({
      where: { OR: [{ slug: dto.slug }, { sku: dto.sku }] },
      select: { slug: true, sku: true },
    });

    if (existing) {
      if (existing.slug === dto.slug) {
        throw new BadRequestException('A product with this slug already exists');
      }
      throw new BadRequestException('A product with this SKU already exists');
    }

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        shortDescription: dto.shortDescription,
        priceInCents: dto.priceInCents,
        compareAtPrice: dto.compareAtPrice,
        sku: dto.sku,
        stockQuantity: dto.stockQuantity ?? 0,
        tagType: dto.tagType,
        includesTagCount: dto.includesTagCount ?? 1,
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        sortOrder: dto.sortOrder ?? 0,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
      },
      include: { images: true },
    });

    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'PRODUCT_UPDATED',
        targetType: 'Product',
        targetId: product.id,
        metadata: { action: 'created', name: dto.name, sku: dto.sku },
      },
    });

    this.logger.log(`Admin ${adminId} created product "${dto.name}" (${product.id})`);
    return product;
  }

  async updateProduct(adminId: string, productId: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check slug/sku uniqueness if being changed
    if (dto.slug && dto.slug !== product.slug) {
      const slugTaken = await this.prisma.product.findFirst({
        where: { slug: dto.slug, id: { not: productId } },
      });
      if (slugTaken) throw new BadRequestException('A product with this slug already exists');
    }
    if (dto.sku && dto.sku !== product.sku) {
      const skuTaken = await this.prisma.product.findFirst({
        where: { sku: dto.sku, id: { not: productId } },
      });
      if (skuTaken) throw new BadRequestException('A product with this SKU already exists');
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: dto,
      include: { images: true },
    });

    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'PRODUCT_UPDATED',
        targetType: 'Product',
        targetId: productId,
        metadata: { changes: Object.keys(dto) },
      },
    });

    this.logger.log(`Admin ${adminId} updated product ${productId}`);
    return updated;
  }

  async deleteProduct(adminId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.update({
      where: { id: productId },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'PRODUCT_UPDATED',
        targetType: 'Product',
        targetId: productId,
        metadata: { action: 'deleted', name: product.name },
      },
    });

    this.logger.log(`Admin ${adminId} soft-deleted product ${productId}`);
    return { deleted: true };
  }

  // ──────────────────────────────────────────────
  // PRODUCT IMAGES
  // ──────────────────────────────────────────────

  async addProductImage(
    productId: string,
    dto: { url: string; altText?: string; sortOrder?: number },
  ) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.productImage.create({
      data: {
        productId,
        url: dto.url,
        altText: dto.altText || null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async removeProductImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) {
      throw new NotFoundException('Image not found');
    }

    await this.prisma.productImage.delete({ where: { id: imageId } });
    return { deleted: true };
  }

  // ──────────────────────────────────────────────
  // AUDIT LOG
  // ──────────────────────────────────────────────

  async listAuditLogs(params: {
    page?: number;
    pageSize?: number;
    action?: string;
    adminId?: string;
    targetType?: string;
  }) {
    const page = params.page || 1;
    const pageSize = Math.min(params.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (params.action) {
      where.action = params.action;
    }
    if (params.adminId) {
      where.adminId = params.adminId;
    }
    if (params.targetType) {
      where.targetType = params.targetType;
    }

    const [logs, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          admin: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: { page, pageSize, total },
    };
  }

  // ──────────────────────────────────────────────
  // ORDER-TAG GENERATION
  // ──────────────────────────────────────────────

  /**
   * Generate tags for a specific order item.
   */
  async generateTagsForOrderItem(adminId: string, orderId: string, itemId: string) {
    // 1. Fetch order with items and product info
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { id: itemId },
          include: {
            product: { select: { id: true, tagType: true, includesTagCount: true } },
            tags: { select: { id: true } },
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (!order.items[0]) throw new NotFoundException('Order item not found');

    const item = order.items[0];

    // Check order status is PAID or PROCESSING
    if (order.status !== 'PAID' && order.status !== 'PROCESSING') {
      throw new BadRequestException('Tags can only be generated for paid or processing orders');
    }

    // Check tags haven't already been generated
    if (item.tags.length > 0) {
      throw new BadRequestException('Tags have already been generated for this order item');
    }

    // Determine how many tags to create
    const tagCount = Math.max(item.quantity * (item.product.includesTagCount || 1), item.quantity);
    const tagType = item.product.tagType || 'GENERIC';

    // Generate unique tokens
    const tokens = this.generateUniqueTokens(tagCount);

    // Create tags
    const createdTags = [];
    for (const token of tokens) {
      const tag = await this.prisma.tag.create({
        data: {
          token,
          type: tagType,
          status: 'INACTIVE',
          ownerId: order.userId,
          orderItemId: item.id,
          label: item.tagLabel || null,
          description: item.tagDescription || null,
        },
      });
      createdTags.push(tag);
    }

    // Auto-update order status to PROCESSING if it was PAID
    if (order.status === 'PAID') {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PROCESSING' },
      });
    }

    // Audit log
    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'QR_GENERATED',
        targetType: 'Order',
        targetId: orderId,
        metadata: { orderItemId: item.id, tagCount, tokens },
      },
    });

    this.logger.log(`Admin ${adminId} generated ${tagCount} tags for order ${orderId}, item ${itemId}`);

    return {
      orderItemId: item.id,
      tagsGenerated: tagCount,
      tags: createdTags.map(t => ({ id: t.id, token: t.token, status: t.status })),
    };
  }

  /**
   * Look up a tag by ID for QR code generation.
   */
  async getTagForQr(tagId: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id: tagId },
      select: { id: true, token: true },
    });
    if (!tag) throw new NotFoundException('Tag not found');
    return tag;
  }

  // ──────────────────────────────────────────────
  // PRIVATE HELPERS
  // ──────────────────────────────────────────────

  /**
   * Generate unique 12-char base62 tokens via crypto.randomBytes(9).
   */
  private generateUniqueTokens(count: number): string[] {
    const tokens = new Set<string>();

    while (tokens.size < count) {
      const bytes = crypto.randomBytes(9);
      let token = '';
      for (let i = 0; i < 9; i++) {
        // Map each byte to a base62 character
        // bytes are 0-255, base62 has 62 chars
        // Use two bytes to generate ~1.5 chars each for better distribution
        token += BASE62[bytes[i]! % 62];
      }
      // We need 12 chars total, generate 3 more from additional random bytes
      const extra = crypto.randomBytes(3);
      for (let i = 0; i < 3; i++) {
        token += BASE62[extra[i]! % 62];
      }
      tokens.add(token);
    }

    return Array.from(tokens);
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private resolveDateRange(query: AnalyticsQueryDto): { startDate: Date; endDate: Date } {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate
      ? new Date(query.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30 days back

    return { startDate, endDate };
  }

  private bucketByGranularity(
    items: { date: Date; count: number }[],
    granularity: AnalyticsGranularity,
  ): { period: string; value: number }[] {
    const bucketMap = new Map<string, number>();

    for (const item of items) {
      const key = this.dateToKey(item.date, granularity);
      bucketMap.set(key, (bucketMap.get(key) || 0) + item.count);
    }

    return Array.from(bucketMap.entries())
      .map(([period, value]) => ({ period, value }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  private dateToKey(date: Date, granularity: AnalyticsGranularity): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    switch (granularity) {
      case AnalyticsGranularity.DAY:
        return `${year}-${month}-${day}`;
      case AnalyticsGranularity.WEEK: {
        // ISO week start (Monday)
        const dayOfWeek = d.getDay() || 7;
        d.setDate(d.getDate() - dayOfWeek + 1);
        const wy = d.getFullYear();
        const wm = String(d.getMonth() + 1).padStart(2, '0');
        const wd = String(d.getDate()).padStart(2, '0');
        return `${wy}-W${wm}-${wd}`;
      }
      case AnalyticsGranularity.MONTH:
        return `${year}-${month}`;
    }
  }
}
