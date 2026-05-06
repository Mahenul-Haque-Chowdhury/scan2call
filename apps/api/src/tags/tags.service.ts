import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MediaService } from '../media/media.service';
import { AppConfigService } from '../config/config.service';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ActivateTagDto } from './dto/activate-tag.dto';
import { ToggleLostModeDto } from './dto/toggle-lost-mode.dto';
import { ReportFoundDto } from './dto/report-found.dto';
import { GenerateReportImageUploadUrlDto } from './dto/generate-report-image-upload-url.dto';
import { TurnstileService } from './turnstile.service';
import type { PublicTagInfo, TagDetail, TagSummary } from '@scan2call/shared';

type TagWithScanCount = Prisma.TagGetPayload<{
  include: { _count: { select: { scans: true } } };
}>;

// base62 alphabet: 0-9 a-z A-Z
const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly mediaService: MediaService,
    private readonly configService: AppConfigService,
    private readonly turnstileService: TurnstileService,
  ) {}

  /**
   * Generate a 12-character base62 token using crypto.randomBytes(9).
   * 9 bytes = 72 bits of entropy, encoded as 12 base62 chars.
   */
  generateToken(): string {
    const bytes = randomBytes(9);
    let token = '';
    for (const byte of bytes) {
      // Map each byte (0-255) into a base62 character
      // Use modulo to ensure uniform-ish distribution
      token += BASE62[byte % 62];
    }
    // Trim or pad to exactly 12 chars (9 bytes -> 12 chars)
    return token.slice(0, 12);
  }

  /**
   * List all tags for the authenticated user.
   */
  async findAllForUser(userId: string): Promise<TagSummary[]> {
    const tags = await this.prisma.tag.findMany({
      where: { ownerId: userId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { scans: true } },
      },
    });

    return tags.map((tag) => this.toTagSummary(tag));
  }

  /**
   * Get a single tag by ID, ensuring it belongs to the user.
   */
  async findOneForUser(userId: string, tagId: string): Promise<TagDetail> {
    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, ownerId: userId, deletedAt: null },
      include: {
        _count: { select: { scans: true } },
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return this.toTagDetail(tag);
  }

  /**
   * Update a tag's metadata.
   */
  async update(userId: string, tagId: string, dto: UpdateTagDto): Promise<TagDetail> {
    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, ownerId: userId, deletedAt: null },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const updated = await this.prisma.tag.update({
      where: { id: tagId },
      data: {
        label: dto.label !== undefined ? dto.label : undefined,
        description: dto.description !== undefined ? dto.description : undefined,
        photoUrl: dto.photoUrl !== undefined ? dto.photoUrl : undefined,
        allowVoiceCall: dto.allowVoiceCall !== undefined ? dto.allowVoiceCall : undefined,
        allowSms: dto.allowSms !== undefined ? dto.allowSms : undefined,
        allowWhatsApp: dto.allowWhatsApp !== undefined ? dto.allowWhatsApp : undefined,
        allowSendLocation: dto.allowSendLocation !== undefined ? dto.allowSendLocation : undefined,
      },
      include: {
        _count: { select: { scans: true } },
      },
    });

    return this.toTagDetail(updated);
  }

  /**
   * Permanently delete a tag and related data.
   */
  async remove(userId: string, tagId: string): Promise<void> {
    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, ownerId: userId, deletedAt: null },
      select: {
        id: true,
        photoUrl: true,
        qrPngUrl: true,
        qrSvgUrl: true,
      },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const assetKeys = [tag.photoUrl, tag.qrPngUrl, tag.qrSvgUrl]
      .map((url) => this.mediaService.extractKeyFromUrl(url ?? ''))
      .filter((key): key is string => !!key);

    await Promise.all(
      assetKeys.map((key) => this.mediaService.deleteObject(key)),
    );

    await this.prisma.$transaction([
      this.prisma.communicationLog.deleteMany({ where: { tagId } }),
      this.prisma.scan.deleteMany({ where: { tagId } }),
      this.prisma.tagGiftRedemption.deleteMany({ where: { tagId } }),
      this.prisma.tag.delete({ where: { id: tagId } }),
    ]);
  }

  /**
   * Activate (claim) an existing INACTIVE tag by its token.
   */
  async activate(userId: string, dto: ActivateTagDto): Promise<TagDetail> {
    const tag = await this.prisma.tag.findUnique({
      where: { token: dto.token },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found. Please check the QR code and try again.');
    }

    if (tag.deletedAt) {
      throw new BadRequestException('This tag has been deactivated.');
    }

    if (tag.status !== 'INACTIVE') {
      throw new ConflictException('This tag has already been activated.');
    }

    if (tag.ownerId && tag.ownerId !== userId) {
      throw new ForbiddenException('This tag belongs to another user.');
    }

    const updated = await this.prisma.tag.update({
      where: { id: tag.id },
      data: {
        ownerId: userId,
        status: 'LOST',
        label: dto.label,
        isLostMode: true,
        lostModeAt: new Date(),
        lostModeMessage: dto.lostModeMessage ?? null,
        activatedAt: new Date(),
      },
      include: {
        _count: { select: { scans: true } },
      },
    });

    return this.toTagDetail(updated);
  }

  /**
   * Toggle lost mode on/off for a tag.
   */
  async toggleLostMode(
    userId: string,
    tagId: string,
    dto: ToggleLostModeDto,
  ): Promise<TagDetail> {
    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, ownerId: userId, deletedAt: null },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    if (tag.status === 'INACTIVE' || tag.status === 'DEACTIVATED') {
      throw new BadRequestException('Cannot toggle lost mode on an inactive or deactivated tag.');
    }

    const updated = await this.prisma.tag.update({
      where: { id: tagId },
      data: {
        isLostMode: dto.isLostMode,
        lostModeAt: dto.isLostMode ? new Date() : null,
        lostModeMessage: dto.isLostMode ? (dto.lostModeMessage ?? tag.lostModeMessage) : null,
        status: dto.isLostMode ? 'LOST' : 'ACTIVE',
      },
      include: {
        _count: { select: { scans: true } },
      },
    });

    return this.toTagDetail(updated);
  }

  /**
   * Public scan: lookup tag by token and return safe public info (NO owner PII).
   */
  async getPublicTagInfo(token: string): Promise<PublicTagInfo> {
    const tag = await this.prisma.tag.findUnique({
      where: { token },
      include: {
        owner: {
          select: { firstName: true, phone: true, phoneVerified: true },
        },
      },
    });

    if (!tag || tag.deletedAt) {
      throw new NotFoundException('Tag not found');
    }

    if (tag.status === 'INACTIVE') {
      throw new BadRequestException(
        'This tag has not been activated yet. Please log in and activate it.',
      );
    }

    if (tag.status === 'DEACTIVATED') {
      throw new BadRequestException('This tag has been deactivated by its owner.');
    }

    // Determine contact options based on tag preferences and owner setup
    const ownerHasPhone = !!tag.owner?.phone && !!tag.owner?.phoneVerified;

    return {
      tagType: tag.type,
      label: tag.label,
      description: tag.description,
      photoUrl: tag.photoUrl,
      ownerFirstName: tag.owner?.firstName ?? 'Owner',
      isLostMode: tag.isLostMode,
      lostModeMessage: tag.isLostMode ? tag.lostModeMessage : null,
      contactOptions: {
        call: tag.allowVoiceCall && ownerHasPhone,
        sms: tag.allowSms && ownerHasPhone,
        whatsapp: tag.allowWhatsApp && ownerHasPhone,
        browserCall: tag.allowVoiceCall, // Browser call only needs owner to exist
        sendLocation: tag.allowSendLocation && ownerHasPhone,
      },
    };
  }

  /**
   * Generate a pre-signed upload URL for finder-provided report image.
   */
  async generateReportImageUploadUrl(
    token: string,
    dto: GenerateReportImageUploadUrlDto,
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    const tag = await this.prisma.tag.findUnique({
      where: { token },
      select: {
        token: true,
        deletedAt: true,
        isLostMode: true,
      },
    });

    if (!tag || tag.deletedAt) {
      throw new NotFoundException('Tag not found');
    }

    if (!tag.isLostMode) {
      throw new BadRequestException('This tag is not currently in lost mode.');
    }

    return this.mediaService.generateUploadUrl({
      fileName: dto.fileName,
      contentType: dto.contentType,
      fileSize: dto.fileSize,
      folder: `finder-reports/${token}`,
    });
  }

  /**
   * Report a tag as found (transition from LOST -> FOUND).
   */
  async reportFound(
    token: string,
    dto: ReportFoundDto,
    ipAddress?: string,
  ): Promise<{ message: string }> {
    await this.turnstileService.verifyToken(dto.captchaToken, ipAddress);

    const trimmedMessage = dto.message?.trim();

    if (dto.finderImageUrl) {
      this.validateFinderImageUrl(token, dto.finderImageUrl);
    }

    const tag = await this.prisma.tag.findUnique({
      where: { token },
      include: {
        owner: {
          select: { email: true, firstName: true },
        },
      },
    });

    if (!tag || tag.deletedAt) {
      throw new NotFoundException('Tag not found');
    }

    if (!tag.isLostMode) {
      return { message: 'This tag is not currently in lost mode.' };
    }

    await this.prisma.tag.update({
      where: { id: tag.id },
      data: {
        status: 'FOUND',
      },
    });

    // Notify the owner
    if (tag.owner) {
      await this.notificationsService.sendItemFoundNotification({
        ownerEmail: tag.owner.email,
        ownerFirstName: tag.owner.firstName,
        tagLabel: tag.label,
        tagToken: tag.token,
        finderMessage: trimmedMessage,
        finderImageUrl: dto.finderImageUrl,
      });
    }

    return { message: 'The owner has been notified that their item was found. Thank you!' };
  }

  /**
   * Get scan history for a specific tag (authenticated, owner only).
   */
  async getTagScans(
    userId: string,
    tagId: string,
    page = 1,
    pageSize = 20,
  ) {
    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, ownerId: userId, deletedAt: null },
    });

    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    const [scans, total] = await Promise.all([
      this.prisma.scan.findMany({
        where: { tagId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          city: true,
          country: true,
          contactInitiated: true,
          createdAt: true,
        },
      }),
      this.prisma.scan.count({ where: { tagId } }),
    ]);

    return {
      data: scans,
      meta: { page, pageSize, total },
    };
  }

  // ────────────────────────────────────────────
  // Mapping helpers
  // ────────────────────────────────────────────

  private toTagSummary(tag: TagWithScanCount): TagSummary {
    return {
      id: tag.id,
      token: tag.token,
      type: tag.type,
      status: tag.status,
      label: tag.label,
      photoUrl: tag.photoUrl,
      isLostMode: tag.isLostMode,
      scanCount: tag._count?.scans ?? 0,
      createdAt: tag.createdAt.toISOString(),
    };
  }

  private validateFinderImageUrl(token: string, imageUrl: string): void {
    let parsedUrl: URL;

    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      throw new BadRequestException('Invalid finder image URL.');
    }

    const requiredPathFragment = `/finder-reports/${token}/`;
    if (!parsedUrl.pathname.includes(requiredPathFragment)) {
      throw new BadRequestException('Invalid finder image URL.');
    }

    const allowedHosts = new Set<string>();

    if (this.configService.cdnUrl) {
      try {
        allowedHosts.add(new URL(this.configService.cdnUrl).host);
      } catch {
        this.logger.warn('CDN_URL is not a valid URL; skipping hostname check for CDN.');
      }
    }

    if (this.configService.s3Endpoint) {
      try {
        allowedHosts.add(new URL(this.configService.s3Endpoint).host);
      } catch {
        this.logger.warn('S3_ENDPOINT is not a valid URL; skipping hostname check for endpoint.');
      }
    }

    if (allowedHosts.size > 0 && !allowedHosts.has(parsedUrl.host)) {
      throw new BadRequestException('Invalid finder image URL.');
    }
  }

  private toTagDetail(tag: TagWithScanCount): TagDetail {
    return {
      ...this.toTagSummary(tag),
      description: tag.description,
      lostModeAt: tag.lostModeAt?.toISOString() ?? null,
      lostModeMessage: tag.lostModeMessage,
      allowVoiceCall: tag.allowVoiceCall,
      allowSms: tag.allowSms,
      allowWhatsApp: tag.allowWhatsApp,
      allowSendLocation: tag.allowSendLocation,
      activatedAt: tag.activatedAt?.toISOString() ?? null,
      updatedAt: tag.updatedAt.toISOString(),
    };
  }
}
