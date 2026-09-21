-- CreateTable
CREATE TABLE "tblDataSheet" (
    "id" TEXT NOT NULL,
    "project_id" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "format" TEXT NOT NULL DEFAULT 'LIST',
    "data" JSONB NOT NULL DEFAULT '[]',
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tblDataSheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tblDataSheet_project_id_idx" ON "tblDataSheet"("project_id");

-- CreateIndex
CREATE INDEX "tblDataSheet_code_idx" ON "tblDataSheet"("code");

-- AddForeignKey
ALTER TABLE "tblDataSheet" ADD CONSTRAINT "tblDataSheet_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "tblProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
