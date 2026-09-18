-- CreateTable
CREATE TABLE "tblScenarioFlow" (
    "id" TEXT NOT NULL,
    "project_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "default_environment_id" TEXT,
    "stop_on_failure" BOOLEAN NOT NULL DEFAULT true,
    "variables" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tblScenarioFlow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tblScenarioFlowStep" (
    "id" TEXT NOT NULL,
    "flow_id" TEXT NOT NULL,
    "api_id" TEXT,
    "request_scenario_id" TEXT,
    "step_order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "delay_ms" INTEGER NOT NULL DEFAULT 0,
    "continue_on_error" BOOLEAN NOT NULL DEFAULT false,
    "method_override" TEXT,
    "path_override" TEXT,
    "headers_override" JSONB,
    "query_params_override" JSONB,
    "path_params_override" JSONB,
    "body_override" JSONB,
    "extractors" JSONB,
    "assertions" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tblScenarioFlowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tblScenarioFlowExecution" (
    "id" TEXT NOT NULL,
    "flow_id" TEXT NOT NULL,
    "environment_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "trigger_source" TEXT NOT NULL DEFAULT 'MANUAL',
    "target_mode" TEXT NOT NULL DEFAULT 'LIVE',
    "total_steps" INTEGER NOT NULL DEFAULT 0,
    "passed_steps" INTEGER NOT NULL DEFAULT 0,
    "failed_steps" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,
    "initial_variables" JSONB,
    "final_variables" JSONB,
    "executed_by" TEXT,
    "error_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tblScenarioFlowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tblScenarioFlowExecutionStep" (
    "id" TEXT NOT NULL,
    "execution_id" TEXT NOT NULL,
    "flow_step_id" TEXT,
    "step_order" INTEGER NOT NULL,
    "step_name" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "http_status_code" INTEGER,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,
    "request_snapshot" JSONB,
    "response_snapshot" JSONB,
    "extracted_variables" JSONB,
    "assertion_results" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tblScenarioFlowExecutionStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tblScenarioFlow_project_id_idx" ON "tblScenarioFlow"("project_id");

-- CreateIndex
CREATE INDEX "tblScenarioFlowStep_flow_id_step_order_idx" ON "tblScenarioFlowStep"("flow_id", "step_order");

-- CreateIndex
CREATE INDEX "tblScenarioFlowExecution_flow_id_idx" ON "tblScenarioFlowExecution"("flow_id");

-- CreateIndex
CREATE INDEX "tblScenarioFlowExecution_created_at_idx" ON "tblScenarioFlowExecution"("created_at" DESC);

-- CreateIndex
CREATE INDEX "tblScenarioFlowExecutionStep_execution_id_idx" ON "tblScenarioFlowExecutionStep"("execution_id");

-- AddForeignKey
ALTER TABLE "tblScenarioFlow" ADD CONSTRAINT "tblScenarioFlow_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "tblProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblScenarioFlow" ADD CONSTRAINT "tblScenarioFlow_default_environment_id_fkey" FOREIGN KEY ("default_environment_id") REFERENCES "tblEnvironment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblScenarioFlowStep" ADD CONSTRAINT "tblScenarioFlowStep_flow_id_fkey" FOREIGN KEY ("flow_id") REFERENCES "tblScenarioFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblScenarioFlowStep" ADD CONSTRAINT "tblScenarioFlowStep_api_id_fkey" FOREIGN KEY ("api_id") REFERENCES "tblApi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblScenarioFlowStep" ADD CONSTRAINT "tblScenarioFlowStep_request_scenario_id_fkey" FOREIGN KEY ("request_scenario_id") REFERENCES "tblRequestScenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblScenarioFlowExecution" ADD CONSTRAINT "tblScenarioFlowExecution_flow_id_fkey" FOREIGN KEY ("flow_id") REFERENCES "tblScenarioFlow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblScenarioFlowExecution" ADD CONSTRAINT "tblScenarioFlowExecution_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "tblEnvironment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblScenarioFlowExecutionStep" ADD CONSTRAINT "tblScenarioFlowExecutionStep_execution_id_fkey" FOREIGN KEY ("execution_id") REFERENCES "tblScenarioFlowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tblScenarioFlowExecutionStep" ADD CONSTRAINT "tblScenarioFlowExecutionStep_flow_step_id_fkey" FOREIGN KEY ("flow_step_id") REFERENCES "tblScenarioFlowStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
