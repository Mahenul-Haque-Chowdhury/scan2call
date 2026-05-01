import { Injectable, NotFoundException } from '@nestjs/common';
import { GiftService } from '../subscriptions/gift.service';
import { TagGiftService } from './tag-gift.service';

@Injectable()
export class GiftsService {
  constructor(
    private readonly giftService: GiftService,
    private readonly tagGiftService: TagGiftService,
  ) {}

  async redeem(userId: string, code: string) {
    try {
      const subscriptionResult = await this.giftService.redeemGiftCode(userId, code);
      return { type: 'SUBSCRIPTION', ...subscriptionResult.data } as const;
    } catch (err) {
      if (!(err instanceof NotFoundException)) throw err;
    }

    const tagResult = await this.tagGiftService.redeemTagGiftCode(userId, code);
    return { type: 'TAG', ...tagResult.data } as const;
  }
}
