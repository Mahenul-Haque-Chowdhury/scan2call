/*
  Warnings:

  - You are about to drop the column `tagId` on the `order_items` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminActionType" ADD VALUE 'QR_GENERATED';
ALTER TYPE "AdminActionType" ADD VALUE 'ORDER_TAGS_ACTIVATED';

-- AlterEnum
ALTER TYPE "CommunicationType" ADD VALUE 'LOCATION_SHARE';

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_tagId_fkey";

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "tagId",
ADD COLUMN     "tagDescription" TEXT,
ADD COLUMN     "tagLabel" TEXT;

-- AlterTable
ALTER TABLE "tags" ADD COLUMN     "allowSendLocation" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "orderItemId" TEXT;

-- CreateIndex
CREATE INDEX "tags_orderItemId_idx" ON "tags"("orderItemId");

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
