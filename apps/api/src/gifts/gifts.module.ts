import { Module } from '@nestjs/common';
import { GiftsController } from './gifts.controller';
import { GiftsService } from './gifts.service';
import { TagGiftService } from './tag-gift.service';

@Module({
  controllers: [GiftsController],
  providers: [GiftsService, TagGiftService],
  exports: [TagGiftService],
})
export class GiftsModule {}
