import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { RenewalsService } from './renewals.service';

@Module({
  imports: [PaymentsModule],
  providers: [RenewalsService],
  exports: [RenewalsService],
})
export class RenewalsModule {}
