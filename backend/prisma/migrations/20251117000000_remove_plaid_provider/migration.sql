-- AlterEnum: Remove 'plaid' from Provider enum
-- First, ensure no existing data uses 'plaid' (or update any rows that do)
-- Update any institutions using 'plaid' to use 'flinks' instead
UPDATE "Institution" SET provider = 'flinks' WHERE provider = 'plaid';

-- Now remove 'plaid' from the enum by recreating it
-- Step 1: Create new enum without 'plaid'
CREATE TYPE "Provider_new" AS ENUM ('flinks', 'manual');

-- Step 2: Update columns to use the new enum
ALTER TABLE "Institution" ALTER COLUMN "provider" TYPE "Provider_new" USING ("provider"::text::"Provider_new");

-- Step 3: Drop old enum and rename new one
DROP TYPE "Provider";
ALTER TYPE "Provider_new" RENAME TO "Provider";
