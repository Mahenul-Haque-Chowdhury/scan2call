-- Remove the subscription system, introduce tag expiry / per-year pricing / auto-renewal.

-- DropForeignKey
ALTER TABLE "subscription_gift_redemptions" DROP CONSTRAINT IF EXISTS "subscription_gift_redemptions_giftCodeId_fkey";
ALTER TABLE "subscription_gift_redemptions" DROP CONSTRAINT IF EXISTS "subscription_gift_redemptions_userId_fkey";
ALTER TABLE "subscription_gift_codes" DROP CONSTRAINT IF EXISTS "subscription_gift_codes_createdById_fkey";
ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "subscription_gift_redemptions";
DROP TABLE IF EXISTS "subscription_gift_codes";
DROP TABLE IF EXISTS "subscriptions";

-- DropEnum
DROP TYPE IF EXISTS "SubscriptionStatus";
DROP TYPE IF EXISTS "SubscriptionSource";

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PURCHASE', 'RENEWAL');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "stripeDefaultPaymentMethodId" TEXT;

-- AlterTable
ALTER TABLE "tags"
ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "autoRenew" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "renewalPriceInCents" INTEGER,
ADD COLUMN "renewalReminderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tag_batches" ADD COLUMN "bundledDurationYears" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "products"
ADD COLUMN "devicePriceInCents" INTEGER,
ADD COLUMN "hasFindMy" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "order_items"
ADD COLUMN "durationYears" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "autoRenew" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "renewalPriceInCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "payments"
ADD COLUMN "tagId" TEXT,
ADD COLUMN "type" "PaymentType" NOT NULL DEFAULT 'PURCHASE';

-- CreateIndex
CREATE INDEX "tags_expiresAt_idx" ON "tags"("expiresAt");

-- CreateIndex
CREATE INDEX "payments_tagId_idx" ON "payments"("tagId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;
