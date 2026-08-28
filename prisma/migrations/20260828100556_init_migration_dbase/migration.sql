-- CreateTable
CREATE TABLE "tblProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tblProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tblEnvironment" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "environment_type" TEXT NOT NULL,
    "public_base_url" TEXT,
    "origin_base_url" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tblEnvironment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tblCollection" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tblCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tblApi" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "collection_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "path" TEXT NOT NULL,
    "method_request" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tblApi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tblApiEnvironment" (
    "id" TEXT NOT NULL,
    "api_id" TEXT NOT NULL,
    "environment_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "path_override" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tblApiEnvironment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tblRequestScenario" (
    "id" TEXT NOT NULL,
    "api_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "headers" JSONB,
    "query_params" JSONB,
    "path_params" JSONB,
    "body" JSONB,
    "body_type" TEXT NOT NULL DEFAULT 'JSON',
    "match_type" TEXT NOT NULL DEFAULT 'EXACT',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tblRequestScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tblResponseScenario" (
    "id" TEXT NOT NULL,
    "request_scenario_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status_code" INTEGER,
    "headers" JSONB,
    "body" JSONB,
    "response_type" TEXT NOT NULL DEFAULT 'JSON',
    "file_path" TEXT,
    "file_name" TEXT,
    "delay_ms" INTEGER NOT NULL DEFAULT 0,
    "weight" INTEGER NOT NULL DEFAULT 100,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tblResponseScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tblAccount" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tblAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tblChangeLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "project_id" TEXT,
    "user_id" TEXT,
    "operator" TEXT NOT NULL,
    "description" TEXT,
    "before_state" JSONB,
    "after_state" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tblChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tblApi_project_id_path_method_request_key" ON "tblApi"("project_id", "path", "method_request");

-- CreateIndex
CREATE UNIQUE INDEX "tblApiEnvironment_api_id_environment_id_key" ON "tblApiEnvironment"("api_id", "environment_id");

-- CreateIndex
CREATE UNIQUE INDEX "tblAccount_username_key" ON "tblAccount"("username");

-- CreateIndex
CREATE INDEX "tblChangeLog_project_id_idx" ON "tblChangeLog"("project_id");

-- CreateIndex
CREATE INDEX "tblChangeLog_created_at_idx" ON "tblChangeLog"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "tblEnvironment" ADD CONSTRAINT "tblEnvironment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "tblProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblCollection" ADD CONSTRAINT "tblCollection_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "tblProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblApi" ADD CONSTRAINT "tblApi_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "tblProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblApi" ADD CONSTRAINT "tblApi_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "tblCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblApiEnvironment" ADD CONSTRAINT "tblApiEnvironment_api_id_fkey" FOREIGN KEY ("api_id") REFERENCES "tblApi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblApiEnvironment" ADD CONSTRAINT "tblApiEnvironment_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "tblEnvironment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblRequestScenario" ADD CONSTRAINT "tblRequestScenario_api_id_fkey" FOREIGN KEY ("api_id") REFERENCES "tblApi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblResponseScenario" ADD CONSTRAINT "tblResponseScenario_request_scenario_id_fkey" FOREIGN KEY ("request_scenario_id") REFERENCES "tblRequestScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblChangeLog" ADD CONSTRAINT "tblChangeLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tblAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
