-- Remove QR design templates and add frame styles

DO $$ BEGIN
  CREATE TYPE "QrFrameStyle" AS ENUM ('SCAN2CALL_TOP', 'SCAN2CALL_BOTTOM', 'NONE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "tags" DROP CONSTRAINT IF EXISTS "tags_qrDesignTemplateId_fkey";
ALTER TABLE "tag_batches" DROP CONSTRAINT IF EXISTS "tag_batches_qrDesignTemplateId_fkey";

DROP INDEX IF EXISTS "tags_qrDesignTemplateId_idx";
DROP INDEX IF EXISTS "tag_batches_qrDesignTemplateId_idx";

ALTER TABLE "tags"
  DROP COLUMN IF EXISTS "qrDesignTemplateId",
  DROP COLUMN IF EXISTS "qrDesignOverrides";

ALTER TABLE "tag_batches"
  DROP COLUMN IF EXISTS "qrDesignTemplateId";

ALTER TABLE "tags"
  ADD COLUMN IF NOT EXISTS "qrFrameStyle" "QrFrameStyle" NOT NULL DEFAULT 'SCAN2CALL_TOP';

ALTER TABLE "tag_batches"
  ADD COLUMN IF NOT EXISTS "qrFrameStyle" "QrFrameStyle" NOT NULL DEFAULT 'SCAN2CALL_TOP';

DROP TABLE IF EXISTS "qr_design_templates";

DELETE FROM "system_settings" WHERE "key" = 'defaultQrDesignTemplateId';
