-- Add PIC assignment join tables used by Project.pics and Api.pics relations.
CREATE TABLE IF NOT EXISTS "tblProjectPic" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tblProjectPic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tblApiPic" (
    "id" TEXT NOT NULL,
    "api_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tblApiPic_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tblProjectPic_project_id_account_id_key"
ON "tblProjectPic"("project_id", "account_id");

CREATE UNIQUE INDEX IF NOT EXISTS "tblApiPic_api_id_account_id_key"
ON "tblApiPic"("api_id", "account_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tblProjectPic_project_id_fkey'
    ) THEN
        ALTER TABLE "tblProjectPic"
        ADD CONSTRAINT "tblProjectPic_project_id_fkey"
        FOREIGN KEY ("project_id") REFERENCES "tblProject"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tblProjectPic_account_id_fkey'
    ) THEN
        ALTER TABLE "tblProjectPic"
        ADD CONSTRAINT "tblProjectPic_account_id_fkey"
        FOREIGN KEY ("account_id") REFERENCES "tblAccount"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tblApiPic_api_id_fkey'
    ) THEN
        ALTER TABLE "tblApiPic"
        ADD CONSTRAINT "tblApiPic_api_id_fkey"
        FOREIGN KEY ("api_id") REFERENCES "tblApi"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tblApiPic_account_id_fkey'
    ) THEN
        ALTER TABLE "tblApiPic"
        ADD CONSTRAINT "tblApiPic_account_id_fkey"
        FOREIGN KEY ("account_id") REFERENCES "tblAccount"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
