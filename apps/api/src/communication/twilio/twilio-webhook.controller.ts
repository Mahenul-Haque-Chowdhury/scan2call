import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request } from 'express';
import { CommunicationStatus } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { TwilioService } from './twilio.service';
import { PrismaService } from '../../database/prisma.service';

@ApiExcludeController()
@Controller('webhooks/twilio')
export class TwilioWebhookController {
  private readonly logger = new Logger(TwilioWebhookController.name);

  constructor(
    private readonly twilioService: TwilioService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Twilio Voice status callback.
   * Called when a proxy voice call changes status.
   */
  @Post('voice')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleVoiceWebhook(
    @Headers('x-twilio-signature') signature: string,
    @Req() req: Request,
    @Body() body: Record<string, string>,
  ) {
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    if (!this.twilioService.validateWebhook(signature || '', url, body)) {
      this.logger.warn('Invalid Twilio voice webhook signature');
      throw new UnauthorizedException('Invalid Twilio signature');
    }

    const callSid = body.CallSid;
    const callStatus = body.CallStatus ?? '';
    const callDuration = body.CallDuration;

    this.logger.log(`Voice webhook: CallSid=${callSid}, Status=${callStatus}`);

    // Map Twilio call status to our CommunicationStatus
    const statusMap: Record<string, CommunicationStatus> = {
      queued: 'INITIATED',
      ringing: 'RINGING',
      'in-progress': 'IN_PROGRESS',
      completed: 'COMPLETED',
      failed: 'FAILED',
      busy: 'BUSY',
      'no-answer': 'NO_ANSWER',
      canceled: 'FAILED',
    };

    const mappedStatus = statusMap[callStatus] ?? 'INITIATED';

    // Update the communication log if we have a matching record
    if (callSid) {
      try {
        await this.prisma.communicationLog.updateMany({
          where: { twilioCallSid: callSid },
          data: {
            status: mappedStatus,
            durationSeconds: callDuration ? parseInt(callDuration, 10) : undefined,
            connectedAt: callStatus === 'in-progress' ? new Date() : undefined,
            endedAt: ['completed', 'failed', 'busy', 'no-answer', 'canceled'].includes(callStatus)
              ? new Date()
              : undefined,
          },
        });
      } catch (error) {
        this.logger.error(`Failed to update communication log for call ${callSid}`, error);
      }
    }

    // Return empty TwiML response
    return '<Response></Response>';
  }

  /**
   * Twilio SMS status callback.
   * Called when a proxy SMS changes status.
   */
  @Post('sms')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleSmsWebhook(
    @Headers('x-twilio-signature') signature: string,
    @Req() req: Request,
    @Body() body: Record<string, string>,
  ) {
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    if (!this.twilioService.validateWebhook(signature || '', url, body)) {
      this.logger.warn('Invalid Twilio SMS webhook signature');
      throw new UnauthorizedException('Invalid Twilio signature');
    }

    const messageSid = body.MessageSid;
    const messageStatus = body.MessageStatus || body.SmsStatus || '';

    this.logger.log(`SMS webhook: MessageSid=${messageSid}, Status=${messageStatus}`);

    // Update communication log with latest status
    const isCompleted = ['delivered', 'sent'].includes(messageStatus);
    const isFailed = ['failed', 'undelivered'].includes(messageStatus);

    if (messageSid) {
      try {
        await this.prisma.communicationLog.updateMany({
          where: { twilioMessageSid: messageSid },
          data: {
            status: isFailed ? 'FAILED' : isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
            endedAt: isCompleted || isFailed ? new Date() : undefined,
          },
        });
      } catch (error) {
        this.logger.error(`Failed to update communication log for message ${messageSid}`, error);
      }
    }

    return '<Response></Response>';
  }

  /**
   * Twilio WhatsApp status callback.
   * Called when a WhatsApp message changes status.
   */
  @Post('whatsapp')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWhatsAppWebhook(
    @Headers('x-twilio-signature') signature: string,
    @Req() req: Request,
    @Body() body: Record<string, string>,
  ) {
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    if (!this.twilioService.validateWebhook(signature || '', url, body)) {
      this.logger.warn('Invalid Twilio WhatsApp webhook signature');
      throw new UnauthorizedException('Invalid Twilio signature');
    }

    const messageSid = body.MessageSid;
    const messageStatus = body.MessageStatus ?? '';

    this.logger.log(`WhatsApp webhook: MessageSid=${messageSid}, Status=${messageStatus}`);

    const isCompleted = ['delivered', 'read', 'sent'].includes(messageStatus);
    const isFailed = ['failed', 'undelivered'].includes(messageStatus);

    if (messageSid) {
      try {
        await this.prisma.communicationLog.updateMany({
          where: { twilioMessageSid: messageSid },
          data: {
            status: isFailed ? 'FAILED' : isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
            endedAt: isCompleted || isFailed ? new Date() : undefined,
          },
        });
      } catch (error) {
        this.logger.error(`Failed to update communication log for WhatsApp ${messageSid}`, error);
      }
    }

    return '<Response></Response>';
  }
}
