import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { AdminTagsController } from './admin-tags.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminProductsController } from './admin-products.controller';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAuditLogController } from './admin-audit-log.controller';
import { AdminSystemController } from './admin-system.controller';
import { AdminContactMessagesController } from './admin-contact-messages.controller';
import { AdminGiftCodesController } from './admin-gift-codes.controller';
import { AdminTagGiftCodesController } from './admin-tag-gift-codes.controller';
import { AdminService } from './admin.service';
import { AdminSystemService } from './admin-system.service';
import { QrCodeModule } from '../qr-code/qr-code.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { GiftsModule } from '../gifts/gifts.module';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [QrCodeModule, SubscriptionsModule, GiftsModule, MediaModule],
  controllers: [
    AdminUsersController,
    AdminTagsController,
    AdminOrdersController,
    AdminProductsController,
    AdminAnalyticsController,
    AdminAuditLogController,
    AdminSystemController,
    AdminContactMessagesController,
    AdminGiftCodesController,
    AdminTagGiftCodesController,
  ],
  providers: [AdminService, AdminSystemService],
  exports: [AdminService],
})
export class AdminModule {}
