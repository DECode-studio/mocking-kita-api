-- AlterTable
ALTER TABLE "tblRequestScenario" ADD COLUMN IF NOT EXISTS "strict_body_structure" BOOLEAN NOT NULL DEFAULT true;
