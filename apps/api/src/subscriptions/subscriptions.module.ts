import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { GiftService } from './gift.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, GiftService],
  exports: [SubscriptionsService, GiftService],
})
export class SubscriptionsModule {}
