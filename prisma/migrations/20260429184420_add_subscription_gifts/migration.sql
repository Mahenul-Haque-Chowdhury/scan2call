-- CreateEnum
CREATE TYPE "SubscriptionSource" AS ENUM ('STRIPE', 'GIFT');

-- CreateEnum
CREATE TYPE "GiftCodeStatus" AS ENUM ('ACTIVE', 'REDEEMED', 'EXPIRED', 'REVOKED');

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "giftExpiresAt" TIMESTAMP(3),
ADD COLUMN     "isLifetime" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" "SubscriptionSource" NOT NULL DEFAULT 'STRIPE';

-- CreateTable
CREATE TABLE "subscription_gift_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "GiftCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "durationMonths" INTEGER,
    "lifetime" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "maxRedemptions" INTEGER NOT NULL DEFAULT 1,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_gift_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_gift_redemptions" (
    "id" TEXT NOT NULL,
    "giftCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "subscription_gift_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_gift_codes_code_key" ON "subscription_gift_codes"("code");

-- CreateIndex
CREATE INDEX "subscription_gift_codes_status_idx" ON "subscription_gift_codes"("status");

-- CreateIndex
CREATE INDEX "subscription_gift_codes_expiresAt_idx" ON "subscription_gift_codes"("expiresAt");

-- CreateIndex
CREATE INDEX "subscription_gift_redemptions_giftCodeId_idx" ON "subscription_gift_redemptions"("giftCodeId");

-- CreateIndex
CREATE INDEX "subscription_gift_redemptions_userId_idx" ON "subscription_gift_redemptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_gift_redemptions_giftCodeId_userId_key" ON "subscription_gift_redemptions"("giftCodeId", "userId");

-- AddForeignKey
ALTER TABLE "subscription_gift_codes" ADD CONSTRAINT "subscription_gift_codes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_gift_redemptions" ADD CONSTRAINT "subscription_gift_redemptions_giftCodeId_fkey" FOREIGN KEY ("giftCodeId") REFERENCES "subscription_gift_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_gift_redemptions" ADD CONSTRAINT "subscription_gift_redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
