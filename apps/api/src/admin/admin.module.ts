import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { AdminTagsController } from './admin-tags.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminProductsController } from './admin-products.controller';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAuditLogController } from './admin-audit-log.controller';
import { AdminSystemController } from './admin-system.controller';
import { AdminService } from './admin.service';
import { AdminSystemService } from './admin-system.service';
import { QrCodeModule } from '../qr-code/qr-code.module';

@Module({
  imports: [QrCodeModule],
  controllers: [
    AdminUsersController,
    AdminTagsController,
    AdminOrdersController,
    AdminProductsController,
    AdminAnalyticsController,
    AdminAuditLogController,
    AdminSystemController,
  ],
  providers: [AdminService, AdminSystemService],
  exports: [AdminService],
})
export class AdminModule {}
