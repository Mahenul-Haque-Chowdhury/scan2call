-- AlterEnum
ALTER TYPE "AdminActionType" ADD VALUE 'TAG_ASSIGNED_TO_USER';

-- AlterTable
ALTER TABLE "tag_batches" ADD COLUMN     "qrDesignTemplateId" TEXT;

-- AlterTable
ALTER TABLE "tags" ADD COLUMN     "qrDesignOverrides" JSONB,
ADD COLUMN     "qrDesignTemplateId" TEXT,
ADD COLUMN     "qrPngUrl" TEXT,
ADD COLUMN     "qrSvgUrl" TEXT;

-- CreateTable
CREATE TABLE "qr_design_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qr_design_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "qr_design_templates_createdBy_idx" ON "qr_design_templates"("createdBy");

-- CreateIndex
CREATE INDEX "qr_design_templates_isActive_idx" ON "qr_design_templates"("isActive");

-- CreateIndex
CREATE INDEX "tag_batches_qrDesignTemplateId_idx" ON "tag_batches"("qrDesignTemplateId");

-- CreateIndex
CREATE INDEX "tags_qrDesignTemplateId_idx" ON "tags"("qrDesignTemplateId");

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_qrDesignTemplateId_fkey" FOREIGN KEY ("qrDesignTemplateId") REFERENCES "qr_design_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_design_templates" ADD CONSTRAINT "qr_design_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_batches" ADD CONSTRAINT "tag_batches_qrDesignTemplateId_fkey" FOREIGN KEY ("qrDesignTemplateId") REFERENCES "qr_design_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
