import { Module, forwardRef } from '@nestjs/common';
import { TagsController } from './tags.controller';
import { TagsPublicController } from './tags-public.controller';
import { TagsService } from './tags.service';
import { ScansModule } from '../scans/scans.module';
import { MediaModule } from '../media/media.module';
import { TurnstileService } from './turnstile.service';

@Module({
  imports: [forwardRef(() => ScansModule), MediaModule],
  controllers: [TagsController, TagsPublicController],
  providers: [TagsService, TurnstileService],
  exports: [TagsService],
})
export class TagsModule {}
