-- Add optional Google Workspace identifier for SSO-linked accounts.
ALTER TABLE "tblAccount" ADD COLUMN IF NOT EXISTS "google_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "tblAccount_google_id_key" ON "tblAccount"("google_id");
