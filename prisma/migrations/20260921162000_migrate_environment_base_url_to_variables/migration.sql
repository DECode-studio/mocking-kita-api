-- AlterTable: Add variables column with default empty array
ALTER TABLE "tblEnvironment" ADD COLUMN IF NOT EXISTS "variables" JSONB NOT NULL DEFAULT '[]';

-- Data Migration: Migrate existing base_url into variables JSON array with key "baseUrl"
UPDATE "tblEnvironment"
SET "variables" = jsonb_build_array(
    jsonb_build_object(
        'id', gen_random_uuid()::text,
        'key', 'baseUrl',
        'value', "base_url",
        'type', 'plain',
        'enabled', true
    )
)
WHERE "base_url" IS NOT NULL AND TRIM("base_url") != '';

-- DropColumn: Drop old base_url column
ALTER TABLE "tblEnvironment" DROP COLUMN IF EXISTS "base_url";
