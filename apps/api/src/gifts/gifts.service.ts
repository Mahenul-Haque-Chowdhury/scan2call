import { Injectable } from '@nestjs/common';
import { TagGiftService } from './tag-gift.service';

@Injectable()
export class GiftsService {
  constructor(private readonly tagGiftService: TagGiftService) {}

  async redeem(userId: string, code: string) {
    const tagResult = await this.tagGiftService.redeemTagGiftCode(userId, code);
    return { type: 'TAG', ...tagResult.data } as const;
  }
}
