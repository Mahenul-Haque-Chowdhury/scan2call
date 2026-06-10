import { Module } from '@nestjs/common';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { TwilioModule } from './twilio/twilio.module';
import { TurnstileService } from '../tags/turnstile.service';

@Module({
  imports: [TwilioModule],
  controllers: [CommunicationController],
  providers: [CommunicationService, TurnstileService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
