-- AlterTable: Add has_custom_password column to tblAccount to track user-set passwords
ALTER TABLE "tblAccount" ADD COLUMN IF NOT EXISTS "has_custom_password" BOOLEAN NOT NULL DEFAULT false;
