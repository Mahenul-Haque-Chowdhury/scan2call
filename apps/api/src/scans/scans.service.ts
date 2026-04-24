import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

interface ScanContext {
  ip?: string;
  userAgent?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  country?: string;
}

@Injectable()
export class ScansService {
  private readonly logger = new Logger(ScansService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create a scan record when a tag is scanned publicly.
   * IP address is SHA-256 hashed for privacy - never stored raw.
   */
  async createScan(token: string, context: ScanContext): Promise<string> {
    const tag = await this.prisma.tag.findUnique({
      where: { token },
      include: {
        owner: {
          select: {
            email: true,
            phone: true,
            firstName: true,
            notifyOnScan: true,
            notifyViaSms: true,
            notifyViaEmail: true,
          },
        },
      },
    });

    if (!tag || tag.deletedAt) {
      throw new NotFoundException('Tag not found');
    }

    // Hash the IP address for privacy (Australian Privacy Act compliance)
    const hashedIp = context.ip
      ? createHash('sha256').update(context.ip).digest('hex')
      : null;

    const scan = await this.prisma.scan.create({
      data: {
        tagId: tag.id,
        ownerId: tag.ownerId,
        ipAddress: hashedIp,
        userAgent: context.userAgent ?? null,
        latitude: context.latitude ?? null,
        longitude: context.longitude ?? null,
        city: context.city ?? null,
        country: context.country ?? null,
      },
    });

    this.logger.log(`Scan recorded: ${scan.id} for tag ${tag.id}`);

    // Trigger notification to owner if they have notifications enabled
    if (tag.owner?.notifyOnScan) {
      this.notificationsService.sendScanNotification({
        ownerEmail: tag.owner.email,
        ownerPhone: tag.owner.notifyViaSms ? (tag.owner.phone ?? undefined) : undefined,
        ownerFirstName: tag.owner.firstName,
        tagLabel: tag.label,
        tagToken: token,
        scanCity: context.city,
        scanCountry: context.country,
        scannedAt: scan.createdAt,
      }).catch((err) => {
        this.logger.error(`Failed to send scan notification: ${err.message}`);
      });
    }

    return scan.id;
  }

  /**
   * Get paginated scan history for the authenticated user (across all their tags).
   */
  async findScansForUser(
    userId: string,
    page = 1,
    pageSize = 20,
  ) {
    const [scans, total] = await Promise.all([
      this.prisma.scan.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          tagId: true,
          city: true,
          country: true,
          contactInitiated: true,
          createdAt: true,
          tag: {
            select: {
              token: true,
              label: true,
              type: true,
            },
          },
        },
      }),
      this.prisma.scan.count({ where: { ownerId: userId } }),
    ]);

    return {
      data: scans,
      meta: { page, pageSize, total },
    };
  }
}
