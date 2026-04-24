import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { TwilioService } from './twilio/twilio.service';
import { InitiateCallDto } from './dto/initiate-call.dto';
import { SendSmsDto } from './dto/send-sms.dto';
import { SendLocationDto } from './dto/send-location.dto';

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,
  ) {}

  /**
   * Initiate an anonymous voice call from the finder's browser to the tag owner.
   * Returns a Twilio Client token for WebRTC calling.
   */
  async initiateCall(dto: InitiateCallDto) {
    return this.generateBrowserCallToken(dto.token);
  }

  /**
   * Send an anonymous SMS to the tag owner with the finder's message.
   * One-way direct SMS, no proxy needed, no finder phone required.
   */
  async initiateSms(dto: SendSmsDto) {
    const tag = await this.findActiveTagWithOwner(dto.token);

    if (!tag.allowSms) {
      throw new BadRequestException('SMS is not enabled for this tag.');
    }

    if (!tag.owner.phone || !tag.owner.phoneVerified) {
      throw new BadRequestException('Tag owner has not set up a verified phone number.');
    }

    const messageBody = dto.message
      ? `Scan2Call: Someone found your item "${tag.label || 'Tag'}". They said: "${dto.message}"`
      : `Scan2Call: Someone found your item "${tag.label || 'Tag'}" and wants to contact you.`;

    const messageSid = await this.twilioService.sendSms(tag.owner.phone, messageBody);

    const log = await this.prisma.communicationLog.create({
      data: {
        tagId: tag.id,
        ownerId: tag.owner.id,
        type: 'SMS',
        status: 'COMPLETED',
        twilioMessageSid: messageSid,
      },
    });

    await this.markRecentScanContacted(tag.id);

    this.logger.log(`Anonymous SMS sent to owner: ${log.id}`);

    return {
      communicationId: log.id,
      message: 'Your message has been sent to the owner anonymously.',
    };
  }

  /**
   * Send an anonymous WhatsApp message to the tag owner.
   * One-way direct message, no finder phone required.
   */
  async initiateWhatsApp(dto: SendSmsDto) {
    const tag = await this.findActiveTagWithOwner(dto.token);

    if (!tag.allowWhatsApp) {
      throw new BadRequestException('WhatsApp is not enabled for this tag.');
    }

    if (!tag.owner.phone || !tag.owner.phoneVerified) {
      throw new BadRequestException('Tag owner has not set up a verified phone number.');
    }

    // Compose a privacy-safe message - never reveal finder's real number
    const messageBody = dto.message
      ? `Scan2Call: Someone found your item "${tag.label || 'Tag'}". They said: "${dto.message}". Reply to this message to respond anonymously.`
      : `Scan2Call: Someone found your item "${tag.label || 'Tag'}" and wants to contact you. Reply to this message to respond.`;

    const messageSid = await this.twilioService.sendWhatsAppMessage(
      tag.owner.phone,
      messageBody,
    );

    const log = await this.prisma.communicationLog.create({
      data: {
        tagId: tag.id,
        ownerId: tag.owner.id,
        type: 'WHATSAPP',
        status: 'INITIATED',
        twilioMessageSid: messageSid,
      },
    });

    await this.markRecentScanContacted(tag.id);

    this.logger.log(`WhatsApp message sent: ${log.id}, messageSid: ${messageSid}`);

    return {
      communicationId: log.id,
      message: 'WhatsApp message sent to the tag owner. They will be notified.',
    };
  }

  /**
   * Generate a Twilio Client token for browser-based calling.
   * The finder gets a short-lived token to make a call from their browser.
   */
  async generateBrowserCallToken(token: string) {
    const tag = await this.findActiveTagWithOwner(token);

    if (!tag.allowVoiceCall) {
      throw new BadRequestException('Voice calls are not enabled for this tag.');
    }

    // Use tag token as the identity (anonymous - no PII)
    const identity = `finder-${token}-${Date.now()}`;
    const clientToken = this.twilioService.generateClientToken(identity);

    // Log the communication attempt
    const log = await this.prisma.communicationLog.create({
      data: {
        tagId: tag.id,
        ownerId: tag.owner.id,
        type: 'VOICE_CALL',
        status: 'INITIATED',
      },
    });

    await this.markRecentScanContacted(tag.id);

    this.logger.log(`Browser call token generated for tag: ${token}`);

    return {
      communicationId: log.id,
      token: clientToken,
      identity,
    };
  }

  /**
   * Send the finder's location to the tag owner via SMS.
   * No proxy needed - this is a one-way notification.
   */
  async sendLocation(dto: SendLocationDto) {
    const tag = await this.findActiveTagWithOwner(dto.token);

    if (!tag.allowSendLocation) {
      throw new BadRequestException('Location sharing is not enabled for this tag.');
    }

    if (!tag.owner.phone || !tag.owner.phoneVerified) {
      throw new BadRequestException('Tag owner has not set up a verified phone number.');
    }

    // Build Google Maps link
    const mapsLink = `https://www.google.com/maps?q=${dto.latitude},${dto.longitude}`;

    // Compose message
    let messageBody = `Scan2Call: Someone found your item "${tag.label || 'Tag'}" and shared their location: ${mapsLink}`;
    if (dto.message) {
      messageBody += ` They said: "${dto.message}"`;
    }

    // Send SMS directly to owner (not proxy - no 2-way needed for location)
    const messageSid = await this.twilioService.sendSms(tag.owner.phone, messageBody);

    // Log the communication
    const log = await this.prisma.communicationLog.create({
      data: {
        tagId: tag.id,
        ownerId: tag.owner.id,
        type: 'LOCATION_SHARE',
        status: 'COMPLETED',
        twilioMessageSid: messageSid,
      },
    });

    await this.markRecentScanContacted(tag.id);

    this.logger.log(`Location shared for tag ${tag.id}: ${log.id}`);

    return {
      communicationId: log.id,
      message: 'Your location has been sent to the owner. Thank you!',
    };
  }

  /**
   * Get communication history for the authenticated user (tag owner).
   */
  async getHistory(
    userId: string,
    page = 1,
    pageSize = 20,
  ) {
    const [logs, total] = await Promise.all([
      this.prisma.communicationLog.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          type: true,
          status: true,
          durationSeconds: true,
          messageCount: true,
          initiatedAt: true,
          connectedAt: true,
          endedAt: true,
          createdAt: true,
          tag: {
            select: {
              id: true,
              token: true,
              label: true,
              type: true,
            },
          },
        },
      }),
      this.prisma.communicationLog.count({ where: { ownerId: userId } }),
    ]);

    return {
      data: logs,
      meta: { page, pageSize, total },
    };
  }

  /**
   * Get a single communication log entry by ID (authenticated, owner only).
   */
  async getOne(userId: string, communicationId: string) {
    const log = await this.prisma.communicationLog.findFirst({
      where: { id: communicationId, ownerId: userId },
      select: {
        id: true,
        type: true,
        status: true,
        proxyNumber: true,
        durationSeconds: true,
        messageCount: true,
        initiatedAt: true,
        connectedAt: true,
        endedAt: true,
        createdAt: true,
        tag: {
          select: {
            id: true,
            token: true,
            label: true,
            type: true,
          },
        },
      },
    });

    if (!log) {
      throw new NotFoundException('Communication log not found');
    }

    return log;
  }

  // ────────────────────────────────────────────
  // Private helpers
  // ────────────────────────────────────────────

  /**
   * Find an active tag by token, including the owner's contact info.
   * Throws if the tag doesn't exist, is not active, or has no owner.
   */
  private async findActiveTagWithOwner(token: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { token },
      include: {
        owner: {
          select: {
            id: true,
            phone: true,
            phoneVerified: true,
            firstName: true,
          },
        },
      },
    });

    if (!tag || tag.deletedAt) {
      throw new NotFoundException('Tag not found');
    }

    if (tag.status === 'INACTIVE') {
      throw new BadRequestException('This tag has not been activated yet.');
    }

    if (tag.status === 'DEACTIVATED') {
      throw new BadRequestException('This tag has been deactivated.');
    }

    if (!tag.owner) {
      throw new BadRequestException('This tag has no owner assigned.');
    }

    return { ...tag, owner: tag.owner };
  }

  /**
   * Mark the most recent scan for this tag as having initiated contact.
   */
  private async markRecentScanContacted(tagId: string): Promise<void> {
    const recentScan = await this.prisma.scan.findFirst({
      where: { tagId, contactInitiated: false },
      orderBy: { createdAt: 'desc' },
    });

    if (recentScan) {
      await this.prisma.scan.update({
        where: { id: recentScan.id },
        data: { contactInitiated: true },
      });
    }
  }
}
