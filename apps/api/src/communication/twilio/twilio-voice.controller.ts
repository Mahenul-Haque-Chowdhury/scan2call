import { Body, Controller, HttpCode, HttpStatus, Logger, Post, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import Twilio from 'twilio';
import { PrismaService } from '../../database/prisma.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiExcludeController()
@Controller('twilio/voice')
export class TwilioVoiceController {
  private readonly logger = new Logger(TwilioVoiceController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post('twiml')
  @Public()
  @HttpCode(HttpStatus.OK)
  async getVoiceTwiml(
    @Body() body: Record<string, string>,
    @Res() res: Response,
  ) {
    const to = body.To ?? '';

    // We encode the tag token in the client identity: finder-{token}-{timestamp}
    const match = to.match(/^finder-(.+)-(\d{10,})$/);
    const twiml = new Twilio.twiml.VoiceResponse();

    if (!match) {
      this.logger.warn(`Invalid Twilio client identity: ${to}`);
      twiml.say('We could not connect your call right now.');
      twiml.hangup();
      res.type('text/xml').send(twiml.toString());
      return;
    }

    const tagToken = match[1];

    const tag = await this.prisma.tag.findUnique({
      where: { token: tagToken },
      include: {
        owner: {
          select: {
            phone: true,
            phoneVerified: true,
          },
        },
      },
    });

    if (!tag || tag.deletedAt || tag.status !== 'ACTIVE' || !tag.allowVoiceCall) {
      this.logger.warn(`Voice call rejected for tag token ${tagToken}`);
      twiml.say('Voice calls are not available for this tag.');
      twiml.hangup();
      res.type('text/xml').send(twiml.toString());
      return;
    }

    if (!tag.owner?.phone || !tag.owner.phoneVerified) {
      this.logger.warn(`Voice call rejected: owner phone missing or unverified for ${tagToken}`);
      twiml.say('The owner is not available for voice calls right now.');
      twiml.hangup();
      res.type('text/xml').send(twiml.toString());
      return;
    }

    const callerId = process.env.TWILIO_PHONE_NUMBER;
    const dial = twiml.dial(
      callerId ? { callerId, answerOnBridge: true } : { answerOnBridge: true },
    );

    dial.number(tag.owner.phone);
    res.type('text/xml').send(twiml.toString());
  }
}
