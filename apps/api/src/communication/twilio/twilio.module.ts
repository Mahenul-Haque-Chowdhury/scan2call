import { Module } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { TwilioWebhookController } from './twilio-webhook.controller';
import { TwilioVoiceController } from './twilio-voice.controller';

@Module({
  controllers: [TwilioWebhookController, TwilioVoiceController],
  providers: [TwilioService],
  exports: [TwilioService],
})
export class TwilioModule {}
