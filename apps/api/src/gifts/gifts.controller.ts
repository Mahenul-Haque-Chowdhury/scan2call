import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { GiftsService } from './gifts.service';
import { RedeemGiftDto } from '../subscriptions/dto/redeem-gift.dto';

@ApiTags('gifts')
@ApiBearerAuth()
@Controller('gifts')
export class GiftsController {
  constructor(private readonly giftsService: GiftsService) {}

  @Post('redeem')
  @ApiOperation({ summary: 'Redeem a subscription or tag gift code' })
  async redeemGift(@CurrentUser() user: JwtPayload, @Body() dto: RedeemGiftDto) {
    const result = await this.giftsService.redeem(user.id, dto.code);
    return { data: result };
  }
}
