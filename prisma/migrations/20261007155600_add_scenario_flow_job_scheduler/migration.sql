-- CreateTable
CREATE TABLE "tblScenarioFlowJob" (
    "id" TEXT NOT NULL,
    "project_id" TEXT,
    "flow_id" TEXT NOT NULL,
    "environment_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "scheduleType" TEXT NOT NULL DEFAULT 'CRON',
    "cron_expression" TEXT,
    "interval_seconds" INTEGER,
    "scheduled_at" TIMESTAMP(3),
    "target_mode" TEXT NOT NULL DEFAULT 'LIVE',
    "stop_condition" TEXT NOT NULL DEFAULT 'FOREVER',
    "max_iterations" INTEGER,
    "current_iteration" INTEGER NOT NULL DEFAULT 0,
    "end_at" TIMESTAMP(3),
    "data_source_type" TEXT NOT NULL DEFAULT 'NONE',
    "data_sheet_id" TEXT,
    "data_iteration_mode" TEXT NOT NULL DEFAULT 'PER_TICK',
    "data_sheet_current_index" INTEGER NOT NULL DEFAULT 0,
    "custom_variables" JSONB,
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "last_status" TEXT,
    "last_error" TEXT,
    "total_runs" INTEGER NOT NULL DEFAULT 0,
    "success_runs" INTEGER NOT NULL DEFAULT 0,
    "failed_runs" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tblScenarioFlowJob_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "tblScenarioFlowExecution" ADD COLUMN "job_id" TEXT;

-- CreateIndex
CREATE INDEX "tblScenarioFlowJob_flow_id_idx" ON "tblScenarioFlowJob"("flow_id");

-- CreateIndex
CREATE INDEX "tblScenarioFlowJob_project_id_idx" ON "tblScenarioFlowJob"("project_id");

-- CreateIndex
CREATE INDEX "tblScenarioFlowJob_status_idx" ON "tblScenarioFlowJob"("status");

-- CreateIndex
CREATE INDEX "tblScenarioFlowExecution_job_id_idx" ON "tblScenarioFlowExecution"("job_id");

-- AddForeignKey
ALTER TABLE "tblScenarioFlowJob" ADD CONSTRAINT "tblScenarioFlowJob_flow_id_fkey" FOREIGN KEY ("flow_id") REFERENCES "tblScenarioFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblScenarioFlowJob" ADD CONSTRAINT "tblScenarioFlowJob_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "tblProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblScenarioFlowJob" ADD CONSTRAINT "tblScenarioFlowJob_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "tblEnvironment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblScenarioFlowJob" ADD CONSTRAINT "tblScenarioFlowJob_data_sheet_id_fkey" FOREIGN KEY ("data_sheet_id") REFERENCES "tblDataSheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblScenarioFlowExecution" ADD CONSTRAINT "tblScenarioFlowExecution_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "tblScenarioFlowJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
