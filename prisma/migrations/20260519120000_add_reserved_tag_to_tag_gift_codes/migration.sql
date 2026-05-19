ALTER TABLE "tag_gift_codes"
ADD COLUMN "reservedTagId" TEXT;

CREATE UNIQUE INDEX "tag_gift_codes_reservedTagId_key"
ON "tag_gift_codes"("reservedTagId");

ALTER TABLE "tag_gift_codes"
ADD CONSTRAINT "tag_gift_codes_reservedTagId_fkey"
FOREIGN KEY ("reservedTagId") REFERENCES "tags"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
