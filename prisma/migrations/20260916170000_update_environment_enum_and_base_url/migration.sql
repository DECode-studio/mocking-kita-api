-- CreateEnum
CREATE TYPE "EnvironmentType" AS ENUM ('LOCAL', 'DEVELOPMENT', 'TESTING', 'STAGING', 'PRODUCTION');

-- AlterTable
ALTER TABLE "tblEnvironment" DROP COLUMN IF EXISTS "public_base_url",
DROP COLUMN IF EXISTS "origin_base_url",
ADD COLUMN IF NOT EXISTS "base_url" TEXT,
DROP COLUMN IF EXISTS "environment_type",
ADD COLUMN "environment_type" "EnvironmentType" NOT NULL DEFAULT 'LOCAL';
