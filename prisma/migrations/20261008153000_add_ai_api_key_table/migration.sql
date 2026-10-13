-- CreateTable
CREATE TABLE IF NOT EXISTS "tblAiApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'NVIDIA_NIM',
    "encrypted_key" TEXT NOT NULL,
    "key_hint" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tblAiApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tblAiApiKey_provider_is_active_priority_idx" ON "tblAiApiKey"("provider", "is_active", "priority");
