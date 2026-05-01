-- CreateTable
CREATE TABLE "tag_gift_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "GiftCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "tagType" "TagType" NOT NULL DEFAULT 'GENERIC',
    "expiresAt" TIMESTAMP(3),
    "maxRedemptions" INTEGER NOT NULL DEFAULT 1,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tag_gift_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_gift_redemptions" (
    "id" TEXT NOT NULL,
    "giftCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "tag_gift_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tag_gift_codes_code_key" ON "tag_gift_codes"("code");

-- CreateIndex
CREATE INDEX "tag_gift_codes_status_idx" ON "tag_gift_codes"("status");

-- CreateIndex
CREATE INDEX "tag_gift_codes_expiresAt_idx" ON "tag_gift_codes"("expiresAt");

-- CreateIndex
CREATE INDEX "tag_gift_redemptions_giftCodeId_idx" ON "tag_gift_redemptions"("giftCodeId");

-- CreateIndex
CREATE INDEX "tag_gift_redemptions_userId_idx" ON "tag_gift_redemptions"("userId");

-- CreateIndex
CREATE INDEX "tag_gift_redemptions_tagId_idx" ON "tag_gift_redemptions"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "tag_gift_redemptions_giftCodeId_userId_key" ON "tag_gift_redemptions"("giftCodeId", "userId");

-- AddForeignKey
ALTER TABLE "tag_gift_codes" ADD CONSTRAINT "tag_gift_codes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_gift_redemptions" ADD CONSTRAINT "tag_gift_redemptions_giftCodeId_fkey" FOREIGN KEY ("giftCodeId") REFERENCES "tag_gift_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_gift_redemptions" ADD CONSTRAINT "tag_gift_redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_gift_redemptions" ADD CONSTRAINT "tag_gift_redemptions_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
