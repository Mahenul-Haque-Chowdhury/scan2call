CREATE TABLE IF NOT EXISTS "saved_addresses" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "address1" TEXT NOT NULL,
  "address2" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "postcode" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'AU',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "saved_addresses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "saved_addresses_userId_idx" ON "saved_addresses"("userId");
CREATE INDEX IF NOT EXISTS "saved_addresses_userId_isDefault_idx" ON "saved_addresses"("userId", "isDefault");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'saved_addresses_userId_fkey'
      AND table_name = 'saved_addresses'
  ) THEN
    ALTER TABLE "saved_addresses"
      ADD CONSTRAINT "saved_addresses_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
