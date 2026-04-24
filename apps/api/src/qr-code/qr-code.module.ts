import { Module } from '@nestjs/common';
import { QrCodeService } from './qr-code.service';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [AppConfigModule],
  providers: [QrCodeService],
  exports: [QrCodeService],
})
export class QrCodeModule {}
