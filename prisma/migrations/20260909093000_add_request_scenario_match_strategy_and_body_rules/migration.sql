-- AlterTable
ALTER TABLE "tblRequestScenario" ADD COLUMN IF NOT EXISTS "match_strategy" TEXT NOT NULL DEFAULT 'ALL';
ALTER TABLE "tblRequestScenario" ADD COLUMN IF NOT EXISTS "body_rules" JSONB;

