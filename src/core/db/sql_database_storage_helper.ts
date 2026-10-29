import prisma from '@/src/core/db/prisma-client';

function escapeSqlString(val: string | null | undefined): string {
  if (val === null || val === undefined) return 'NULL';
  return `'${val.replace(/'/g, "''")}'`;
}

function escapeSqlDate(val: Date | string | null | undefined): string {
  if (!val) return 'NULL';
  const iso = val instanceof Date ? val.toISOString() : new Date(val).toISOString();
  return `'${iso}'::timestamptz`;
}

function escapeSqlBoolean(val: boolean | null | undefined): string {
  if (val === null || val === undefined) return 'TRUE';
  return val ? 'TRUE' : 'FALSE';
}

function escapeSqlNumber(val: number | null | undefined, fallback = '0'): string {
  if (val === null || val === undefined || isNaN(val)) return fallback;
  return String(val);
}

function escapeSqlJson(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  try {
    const jsonStr = JSON.stringify(val);
    return `'${jsonStr.replace(/'/g, "''")}'::jsonb`;
  } catch {
    return "'{}'::jsonb";
  }
}

/**
 * Generates a full PostgreSQL SQL dump file content.
 */
export async function generateDatabaseSqlDump(mode: 'upsert' | 'replace' = 'upsert'): Promise<string> {
  const [
    accounts,
    projects,
    environments,
    collections,
    apis,
    projectPics,
    apiPics,
    apiEnvironments,
    requestScenarios,
    responseScenarios,
    dataSheets,
    scenarioFlows,
    scenarioFlowSteps,
    scenarioFlowJobs,
    scenarioFlowExecutions,
    scenarioFlowExecutionSteps,
    aiApiKeys,
    changeLogs,
  ] = await Promise.all([
    prisma.account.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.project.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.environment.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.collection.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.api.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.projectPic.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.apiPic.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.apiEnvironment.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.requestScenario.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.responseScenario.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
    }),
    prisma.dataSheet.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.scenarioFlow.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.scenarioFlowStep.findMany({
      orderBy: [{ flowId: 'asc' }, { stepOrder: 'asc' }, { id: 'asc' }],
    }),
    prisma.scenarioFlowJob.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.scenarioFlowExecution.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.scenarioFlowExecutionStep.findMany({
      orderBy: [{ executionId: 'asc' }, { stepOrder: 'asc' }, { id: 'asc' }],
    }),
    prisma.aiApiKey.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
    prisma.changeLog.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
  ]);

  const nowIso = new Date().toISOString();
  const chunks: string[] = [
    `-- ========================================================`,
    `-- Mock API Studio - PostgreSQL SQL Database Backup`,
    `-- Generated At: ${nowIso}`,
    `-- Total Projects: ${projects.length} | Endpoints: ${apis.length} | Scenarios: ${responseScenarios.length} | Flows: ${scenarioFlows.length} | DataSheets: ${dataSheets.length}`,
    `-- ========================================================`,
    ``,
    `BEGIN;`,
    ``,
  ];

  if (mode === 'replace') {
    chunks.push(
      `-- Clean existing records before restoring (Replace Mode)`,
      `DELETE FROM "tblScenarioFlowExecutionStep";`,
      `DELETE FROM "tblScenarioFlowExecution";`,
      `DELETE FROM "tblScenarioFlowJob";`,
      `DELETE FROM "tblScenarioFlowStep";`,
      `DELETE FROM "tblScenarioFlow";`,
      `DELETE FROM "tblDataSheet";`,
      `DELETE FROM "tblResponseScenario";`,
      `DELETE FROM "tblRequestScenario";`,
      `DELETE FROM "tblApiEnvironment";`,
      `DELETE FROM "tblApiPic";`,
      `DELETE FROM "tblProjectPic";`,
      `DELETE FROM "tblApi";`,
      `DELETE FROM "tblCollection";`,
      `DELETE FROM "tblEnvironment";`,
      `DELETE FROM "tblProject";`,
      `DELETE FROM "tblAiApiKey";`,
      `DELETE FROM "tblChangeLog";`,
      ``
    );
  }

  // 1. tblAccount
  if (accounts.length > 0) {
    chunks.push(`-- 1. Accounts (${accounts.length} rows)`);
    for (const u of accounts) {
      chunks.push(
        `INSERT INTO "tblAccount" ("id", "username", "password", "role", "name", "google_id", "has_custom_password", "created_at", "updated_at") VALUES (${escapeSqlString(
          u.id
        )}, ${escapeSqlString(u.username)}, ${escapeSqlString(u.password)}, ${escapeSqlString(
          u.role
        )}, ${escapeSqlString(u.name)}, ${escapeSqlString(u.googleId)}, ${escapeSqlBoolean(
          u.hasCustomPassword
        )}, ${escapeSqlDate(u.createdAt)}, ${escapeSqlDate(
          u.updatedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "username" = EXCLUDED."username", "password" = EXCLUDED."password", "role" = EXCLUDED."role", "name" = EXCLUDED."name", "google_id" = EXCLUDED."google_id", "has_custom_password" = EXCLUDED."has_custom_password", "updated_at" = EXCLUDED."updated_at";`
      );
    }
    chunks.push(``);
  }

  // 2. tblProject
  if (projects.length > 0) {
    chunks.push(`-- 2. Projects (${projects.length} rows)`);
    for (const p of projects) {
      chunks.push(
        `INSERT INTO "tblProject" ("id", "name", "description", "status", "created_at", "updated_at", "deleted_at") VALUES (${escapeSqlString(
          p.id
        )}, ${escapeSqlString(p.name)}, ${escapeSqlString(p.description)}, ${escapeSqlBoolean(
          p.status
        )}, ${escapeSqlDate(p.createdAt)}, ${escapeSqlDate(p.updatedAt)}, ${escapeSqlDate(
          p.deletedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "status" = EXCLUDED."status", "updated_at" = EXCLUDED."updated_at", "deleted_at" = EXCLUDED."deleted_at";`
      );
    }
    chunks.push(``);
  }

  // 3. tblEnvironment
  if (environments.length > 0) {
    chunks.push(`-- 3. Environments (${environments.length} rows)`);
    for (const e of environments) {
      chunks.push(
        `INSERT INTO "tblEnvironment" ("id", "project_id", "name", "is_base_url", "values", "environment_type", "variables", "status", "created_at", "updated_at", "deleted_at") VALUES (${escapeSqlString(
          e.id
        )}, ${escapeSqlString(e.projectId)}, ${escapeSqlString(e.name)}, ${escapeSqlBoolean(
          e.isBaseUrl !== false
        )}, ${escapeSqlJson(e.values || {})}, ${escapeSqlString(
          e.environmentType
        )}, ${escapeSqlJson(e.variables || [])}, ${escapeSqlBoolean(
          e.status
        )}, ${escapeSqlDate(e.createdAt)}, ${escapeSqlDate(e.updatedAt)}, ${escapeSqlDate(
          e.deletedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "is_base_url" = EXCLUDED."is_base_url", "values" = EXCLUDED."values", "environment_type" = EXCLUDED."environment_type", "variables" = EXCLUDED."variables", "status" = EXCLUDED."status", "updated_at" = EXCLUDED."updated_at", "deleted_at" = EXCLUDED."deleted_at";`
      );
    }
    chunks.push(``);
  }

  // 4. tblCollection
  if (collections.length > 0) {
    chunks.push(`-- 4. Collections (${collections.length} rows)`);
    for (const c of collections) {
      chunks.push(
        `INSERT INTO "tblCollection" ("id", "project_id", "name", "description", "status", "created_at", "updated_at", "deleted_at") VALUES (${escapeSqlString(
          c.id
        )}, ${escapeSqlString(c.projectId)}, ${escapeSqlString(c.name)}, ${escapeSqlString(
          c.description
        )}, ${escapeSqlBoolean(c.status)}, ${escapeSqlDate(c.createdAt)}, ${escapeSqlDate(
          c.updatedAt
        )}, ${escapeSqlDate(
          c.deletedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "status" = EXCLUDED."status", "updated_at" = EXCLUDED."updated_at", "deleted_at" = EXCLUDED."deleted_at";`
      );
    }
    chunks.push(``);
  }

  // 5. tblApi
  if (apis.length > 0) {
    chunks.push(`-- 5. APIs (${apis.length} rows)`);
    for (const a of apis) {
      chunks.push(
        `INSERT INTO "tblApi" ("id", "project_id", "collection_id", "name", "description", "path", "method_request", "status", "created_at", "updated_at", "deleted_at") VALUES (${escapeSqlString(
          a.id
        )}, ${escapeSqlString(a.projectId)}, ${escapeSqlString(a.collectionId)}, ${escapeSqlString(
          a.name
        )}, ${escapeSqlString(a.description)}, ${escapeSqlString(a.path)}, ${escapeSqlString(
          a.methodRequest
        )}, ${escapeSqlBoolean(a.status)}, ${escapeSqlDate(a.createdAt)}, ${escapeSqlDate(
          a.updatedAt
        )}, ${escapeSqlDate(
          a.deletedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "collection_id" = EXCLUDED."collection_id", "description" = EXCLUDED."description", "path" = EXCLUDED."path", "method_request" = EXCLUDED."method_request", "status" = EXCLUDED."status", "updated_at" = EXCLUDED."updated_at", "deleted_at" = EXCLUDED."deleted_at";`
      );
    }
    chunks.push(``);
  }

  // 6. tblProjectPic
  if (projectPics.length > 0) {
    chunks.push(`-- 6. Project PICs (${projectPics.length} rows)`);
    for (const pp of projectPics) {
      chunks.push(
        `INSERT INTO "tblProjectPic" ("id", "project_id", "account_id", "created_at") VALUES (${escapeSqlString(
          pp.id
        )}, ${escapeSqlString(pp.projectId)}, ${escapeSqlString(pp.accountId)}, ${escapeSqlDate(
          pp.createdAt
        )}) ON CONFLICT ("id") DO UPDATE SET "project_id" = EXCLUDED."project_id", "account_id" = EXCLUDED."account_id";`
      );
    }
    chunks.push(``);
  }

  // 7. tblApiPic
  if (apiPics.length > 0) {
    chunks.push(`-- 7. API PICs (${apiPics.length} rows)`);
    for (const ap of apiPics) {
      chunks.push(
        `INSERT INTO "tblApiPic" ("id", "api_id", "account_id", "created_at") VALUES (${escapeSqlString(
          ap.id
        )}, ${escapeSqlString(ap.apiId)}, ${escapeSqlString(ap.accountId)}, ${escapeSqlDate(
          ap.createdAt
        )}) ON CONFLICT ("id") DO UPDATE SET "api_id" = EXCLUDED."api_id", "account_id" = EXCLUDED."account_id";`
      );
    }
    chunks.push(``);
  }

  // 8. tblApiEnvironment
  if (apiEnvironments.length > 0) {
    chunks.push(`-- 8. API Environments (${apiEnvironments.length} rows)`);
    for (const ae of apiEnvironments) {
      chunks.push(
        `INSERT INTO "tblApiEnvironment" ("id", "api_id", "environment_id", "enabled", "path_override", "created_at", "updated_at") VALUES (${escapeSqlString(
          ae.id
        )}, ${escapeSqlString(ae.apiId)}, ${escapeSqlString(ae.environmentId)}, ${escapeSqlBoolean(
          ae.enabled
        )}, ${escapeSqlString(ae.pathOverride)}, ${escapeSqlDate(ae.createdAt)}, ${escapeSqlDate(
          ae.updatedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "enabled" = EXCLUDED."enabled", "path_override" = EXCLUDED."path_override", "updated_at" = EXCLUDED."updated_at";`
      );
    }
    chunks.push(``);
  }

  // 9. tblRequestScenario (including match_strategy, body_rules, strict_body_structure)
  if (requestScenarios.length > 0) {
    chunks.push(`-- 9. Request Scenarios (${requestScenarios.length} rows)`);
    for (const r of requestScenarios) {
      chunks.push(
        `INSERT INTO "tblRequestScenario" ("id", "api_id", "name", "description", "headers", "query_params", "path_params", "body", "body_type", "match_type", "match_strategy", "body_rules", "strict_body_structure", "priority", "status", "created_at", "updated_at", "deleted_at") VALUES (${escapeSqlString(
          r.id
        )}, ${escapeSqlString(r.apiId)}, ${escapeSqlString(r.name)}, ${escapeSqlString(
          r.description
        )}, ${escapeSqlJson(r.headers)}, ${escapeSqlJson(r.queryParams)}, ${escapeSqlJson(
          r.pathParams
        )}, ${escapeSqlJson(r.body)}, ${escapeSqlString(r.bodyType)}, ${escapeSqlString(
          r.matchType
        )}, ${escapeSqlString(r.matchStrategy || 'ALL')}, ${escapeSqlJson(
          r.bodyRules
        )}, ${escapeSqlBoolean(r.strictBodyStructure !== false)}, ${escapeSqlNumber(
          r.priority,
          '0'
        )}, ${escapeSqlBoolean(r.status)}, ${escapeSqlDate(r.createdAt)}, ${escapeSqlDate(
          r.updatedAt
        )}, ${escapeSqlDate(
          r.deletedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "headers" = EXCLUDED."headers", "query_params" = EXCLUDED."query_params", "path_params" = EXCLUDED."path_params", "body" = EXCLUDED."body", "body_type" = EXCLUDED."body_type", "match_type" = EXCLUDED."match_type", "match_strategy" = EXCLUDED."match_strategy", "body_rules" = EXCLUDED."body_rules", "strict_body_structure" = EXCLUDED."strict_body_structure", "priority" = EXCLUDED."priority", "status" = EXCLUDED."status", "updated_at" = EXCLUDED."updated_at", "deleted_at" = EXCLUDED."deleted_at";`
      );
    }
    chunks.push(``);
  }

  // 10. tblResponseScenario
  if (responseScenarios.length > 0) {
    chunks.push(`-- 10. Response Scenarios (${responseScenarios.length} rows)`);
    for (const rs of responseScenarios) {
      chunks.push(
        `INSERT INTO "tblResponseScenario" ("id", "request_scenario_id", "name", "description", "status_code", "headers", "body", "response_type", "file_path", "file_name", "delay_ms", "weight", "priority", "status", "created_at", "updated_at", "deleted_at") VALUES (${escapeSqlString(
          rs.id
        )}, ${escapeSqlString(rs.requestScenarioId)}, ${escapeSqlString(rs.name)}, ${escapeSqlString(
          rs.description
        )}, ${escapeSqlNumber(rs.statusCode, '200')}, ${escapeSqlJson(rs.headers)}, ${escapeSqlJson(
          rs.body
        )}, ${escapeSqlString(rs.responseType)}, ${escapeSqlString(rs.filePath)}, ${escapeSqlString(
          rs.fileName
        )}, ${escapeSqlNumber(rs.delayMs, '0')}, ${escapeSqlNumber(rs.weight, '100')}, ${escapeSqlNumber(
          rs.priority,
          '0'
        )}, ${escapeSqlBoolean(rs.status)}, ${escapeSqlDate(rs.createdAt)}, ${escapeSqlDate(
          rs.updatedAt
        )}, ${escapeSqlDate(
          rs.deletedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "status_code" = EXCLUDED."status_code", "headers" = EXCLUDED."headers", "body" = EXCLUDED."body", "response_type" = EXCLUDED."response_type", "file_path" = EXCLUDED."file_path", "file_name" = EXCLUDED."file_name", "delay_ms" = EXCLUDED."delay_ms", "weight" = EXCLUDED."weight", "priority" = EXCLUDED."priority", "status" = EXCLUDED."status", "updated_at" = EXCLUDED."updated_at", "deleted_at" = EXCLUDED."deleted_at";`
      );
    }
    chunks.push(``);
  }

  // 11. tblDataSheet
  if (dataSheets.length > 0) {
    chunks.push(`-- 11. DataSheets (${dataSheets.length} rows)`);
    for (const ds of dataSheets) {
      chunks.push(
        `INSERT INTO "tblDataSheet" ("id", "project_id", "name", "code", "category", "description", "format", "data", "status", "created_at", "updated_at", "deleted_at") VALUES (${escapeSqlString(
          ds.id
        )}, ${escapeSqlString(ds.projectId)}, ${escapeSqlString(ds.name)}, ${escapeSqlString(
          ds.code
        )}, ${escapeSqlString(ds.category)}, ${escapeSqlString(ds.description)}, ${escapeSqlString(
          ds.format || 'LIST'
        )}, ${escapeSqlJson(ds.data ?? [])}, ${escapeSqlBoolean(ds.status)}, ${escapeSqlDate(
          ds.createdAt
        )}, ${escapeSqlDate(ds.updatedAt)}, ${escapeSqlDate(
          ds.deletedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "project_id" = EXCLUDED."project_id", "name" = EXCLUDED."name", "code" = EXCLUDED."code", "category" = EXCLUDED."category", "description" = EXCLUDED."description", "format" = EXCLUDED."format", "data" = EXCLUDED."data", "status" = EXCLUDED."status", "updated_at" = EXCLUDED."updated_at", "deleted_at" = EXCLUDED."deleted_at";`
      );
    }
    chunks.push(``);
  }

  // 12. tblScenarioFlow
  if (scenarioFlows.length > 0) {
    chunks.push(`-- 12. ScenarioFlows (${scenarioFlows.length} rows)`);
    for (const f of scenarioFlows) {
      chunks.push(
        `INSERT INTO "tblScenarioFlow" ("id", "project_id", "name", "description", "status", "default_environment_id", "stop_on_failure", "variables", "created_at", "updated_at", "deleted_at") VALUES (${escapeSqlString(
          f.id
        )}, ${escapeSqlString(f.projectId)}, ${escapeSqlString(f.name)}, ${escapeSqlString(
          f.description
        )}, ${escapeSqlBoolean(f.status)}, ${escapeSqlString(
          f.defaultEnvironmentId
        )}, ${escapeSqlBoolean(f.stopOnFailure !== false)}, ${escapeSqlJson(
          f.variables
        )}, ${escapeSqlDate(f.createdAt)}, ${escapeSqlDate(f.updatedAt)}, ${escapeSqlDate(
          f.deletedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "project_id" = EXCLUDED."project_id", "name" = EXCLUDED."name", "description" = EXCLUDED."description", "status" = EXCLUDED."status", "default_environment_id" = EXCLUDED."default_environment_id", "stop_on_failure" = EXCLUDED."stop_on_failure", "variables" = EXCLUDED."variables", "updated_at" = EXCLUDED."updated_at", "deleted_at" = EXCLUDED."deleted_at";`
      );
    }
    chunks.push(``);
  }

  // 13. tblScenarioFlowStep
  if (scenarioFlowSteps.length > 0) {
    chunks.push(`-- 13. ScenarioFlowSteps (${scenarioFlowSteps.length} rows)`);
    for (const s of scenarioFlowSteps) {
      chunks.push(
        `INSERT INTO "tblScenarioFlowStep" ("id", "flow_id", "api_id", "request_scenario_id", "step_order", "name", "description", "enabled", "delay_ms", "continue_on_error", "method_override", "path_override", "headers_override", "query_params_override", "path_params_override", "body_override", "body_type", "extractors", "assertions", "target_environment_type", "target_environment", "created_at", "updated_at") VALUES (${escapeSqlString(
          s.id
        )}, ${escapeSqlString(s.flowId)}, ${escapeSqlString(s.apiId)}, ${escapeSqlString(
          s.requestScenarioId
        )}, ${escapeSqlNumber(s.stepOrder, '0')}, ${escapeSqlString(s.name)}, ${escapeSqlString(
          s.description
        )}, ${escapeSqlBoolean(s.enabled)}, ${escapeSqlNumber(s.delayMs, '0')}, ${escapeSqlBoolean(
          s.continueOnError
        )}, ${escapeSqlString(s.methodOverride)}, ${escapeSqlString(s.pathOverride)}, ${escapeSqlJson(
          s.headersOverride
        )}, ${escapeSqlJson(s.queryParamsOverride)}, ${escapeSqlJson(
          s.pathParamsOverride
        )}, ${escapeSqlJson(s.bodyOverride)}, ${escapeSqlString(s.bodyType || 'JSON')}, ${escapeSqlJson(
          s.extractors
        )}, ${escapeSqlJson(s.assertions)}, ${escapeSqlString(
          s.targetEnvironmentType || 'DEFAULT'
        )}, ${escapeSqlString(s.targetEnvironment)}, ${escapeSqlDate(s.createdAt)}, ${escapeSqlDate(
          s.updatedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "flow_id" = EXCLUDED."flow_id", "api_id" = EXCLUDED."api_id", "request_scenario_id" = EXCLUDED."request_scenario_id", "step_order" = EXCLUDED."step_order", "name" = EXCLUDED."name", "description" = EXCLUDED."description", "enabled" = EXCLUDED."enabled", "delay_ms" = EXCLUDED."delay_ms", "continue_on_error" = EXCLUDED."continue_on_error", "method_override" = EXCLUDED."method_override", "path_override" = EXCLUDED."path_override", "headers_override" = EXCLUDED."headers_override", "query_params_override" = EXCLUDED."query_params_override", "path_params_override" = EXCLUDED."path_params_override", "body_override" = EXCLUDED."body_override", "body_type" = EXCLUDED."body_type", "extractors" = EXCLUDED."extractors", "assertions" = EXCLUDED."assertions", "target_environment_type" = EXCLUDED."target_environment_type", "target_environment" = EXCLUDED."target_environment", "updated_at" = EXCLUDED."updated_at";`
      );
    }
    chunks.push(``);
  }

  // 14. tblScenarioFlowJob
  if (scenarioFlowJobs.length > 0) {
    chunks.push(`-- 14. ScenarioFlowJobs (${scenarioFlowJobs.length} rows)`);
    for (const j of scenarioFlowJobs) {
      chunks.push(
        `INSERT INTO "tblScenarioFlowJob" ("id", "project_id", "flow_id", "environment_id", "name", "description", "status", "schedule_type", "cron_expression", "interval_seconds", "scheduled_at", "target_mode", "stop_condition", "max_iterations", "current_iteration", "end_at", "data_source_type", "data_sheet_id", "data_iteration_mode", "data_sheet_current_index", "custom_variables", "last_run_at", "next_run_at", "last_status", "last_error", "total_runs", "success_runs", "failed_runs", "created_at", "updated_at", "deleted_at") VALUES (${escapeSqlString(
          j.id
        )}, ${escapeSqlString(j.projectId)}, ${escapeSqlString(j.flowId)}, ${escapeSqlString(
          j.environmentId
        )}, ${escapeSqlString(j.name)}, ${escapeSqlString(j.description)}, ${escapeSqlString(
          j.status || 'ACTIVE'
        )}, ${escapeSqlString(j.scheduleType || 'CRON')}, ${escapeSqlString(
          j.cronExpression
        )}, ${escapeSqlNumber(j.intervalSeconds, 'NULL')}, ${escapeSqlDate(
          j.scheduledAt
        )}, ${escapeSqlString(j.targetMode || 'LIVE')}, ${escapeSqlString(
          j.stopCondition || 'FOREVER'
        )}, ${escapeSqlNumber(j.maxIterations, 'NULL')}, ${escapeSqlNumber(
          j.currentIteration,
          '0'
        )}, ${escapeSqlDate(j.endAt)}, ${escapeSqlString(
          j.dataSourceType || 'NONE'
        )}, ${escapeSqlString(j.dataSheetId)}, ${escapeSqlString(
          j.dataIterationMode || 'PER_TICK'
        )}, ${escapeSqlNumber(j.dataSheetCurrentIndex, '0')}, ${escapeSqlJson(
          j.customVariables
        )}, ${escapeSqlDate(j.lastRunAt)}, ${escapeSqlDate(j.nextRunAt)}, ${escapeSqlString(
          j.lastStatus
        )}, ${escapeSqlString(j.lastError)}, ${escapeSqlNumber(
          j.totalRuns,
          '0'
        )}, ${escapeSqlNumber(j.successRuns, '0')}, ${escapeSqlNumber(
          j.failedRuns,
          '0'
        )}, ${escapeSqlDate(j.createdAt)}, ${escapeSqlDate(j.updatedAt)}, ${escapeSqlDate(
          j.deletedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "project_id" = EXCLUDED."project_id", "flow_id" = EXCLUDED."flow_id", "environment_id" = EXCLUDED."environment_id", "name" = EXCLUDED."name", "description" = EXCLUDED."description", "status" = EXCLUDED."status", "schedule_type" = EXCLUDED."schedule_type", "cron_expression" = EXCLUDED."cron_expression", "interval_seconds" = EXCLUDED."interval_seconds", "scheduled_at" = EXCLUDED."scheduled_at", "target_mode" = EXCLUDED."target_mode", "stop_condition" = EXCLUDED."stop_condition", "max_iterations" = EXCLUDED."max_iterations", "current_iteration" = EXCLUDED."current_iteration", "end_at" = EXCLUDED."end_at", "data_source_type" = EXCLUDED."data_source_type", "data_sheet_id" = EXCLUDED."data_sheet_id", "data_iteration_mode" = EXCLUDED."data_iteration_mode", "data_sheet_current_index" = EXCLUDED."data_sheet_current_index", "custom_variables" = EXCLUDED."custom_variables", "last_run_at" = EXCLUDED."last_run_at", "next_run_at" = EXCLUDED."next_run_at", "last_status" = EXCLUDED."last_status", "last_error" = EXCLUDED."last_error", "total_runs" = EXCLUDED."total_runs", "success_runs" = EXCLUDED."success_runs", "failed_runs" = EXCLUDED."failed_runs", "updated_at" = EXCLUDED."updated_at", "deleted_at" = EXCLUDED."deleted_at";`
      );
    }
    chunks.push(``);
  }

  // 15. tblScenarioFlowExecution
  if (scenarioFlowExecutions.length > 0) {
    chunks.push(`-- 15. ScenarioFlowExecutions (${scenarioFlowExecutions.length} rows)`);
    for (const ex of scenarioFlowExecutions) {
      chunks.push(
        `INSERT INTO "tblScenarioFlowExecution" ("id", "flow_id", "environment_id", "job_id", "status", "trigger_source", "target_mode", "total_steps", "passed_steps", "failed_steps", "duration_ms", "initial_variables", "final_variables", "executed_by", "error_summary", "created_at") VALUES (${escapeSqlString(
          ex.id
        )}, ${escapeSqlString(ex.flowId)}, ${escapeSqlString(ex.environmentId)}, ${escapeSqlString(
          ex.jobId
        )}, ${escapeSqlString(ex.status || 'RUNNING')}, ${escapeSqlString(
          ex.triggerSource || 'MANUAL'
        )}, ${escapeSqlString(ex.targetMode || 'LIVE')}, ${escapeSqlNumber(
          ex.totalSteps,
          '0'
        )}, ${escapeSqlNumber(ex.passedSteps, '0')}, ${escapeSqlNumber(
          ex.failedSteps,
          '0'
        )}, ${escapeSqlNumber(ex.durationMs, '0')}, ${escapeSqlJson(
          ex.initialVariables
        )}, ${escapeSqlJson(ex.finalVariables)}, ${escapeSqlString(
          ex.executedBy
        )}, ${escapeSqlString(ex.errorSummary)}, ${escapeSqlDate(
          ex.createdAt
        )}) ON CONFLICT ("id") DO UPDATE SET "status" = EXCLUDED."status", "total_steps" = EXCLUDED."total_steps", "passed_steps" = EXCLUDED."passed_steps", "failed_steps" = EXCLUDED."failed_steps", "duration_ms" = EXCLUDED."duration_ms", "initial_variables" = EXCLUDED."initial_variables", "final_variables" = EXCLUDED."final_variables", "executed_by" = EXCLUDED."executed_by", "error_summary" = EXCLUDED."error_summary";`
      );
    }
    chunks.push(``);
  }

  // 16. tblScenarioFlowExecutionStep
  if (scenarioFlowExecutionSteps.length > 0) {
    chunks.push(`-- 16. ScenarioFlowExecutionSteps (${scenarioFlowExecutionSteps.length} rows)`);
    for (const es of scenarioFlowExecutionSteps) {
      chunks.push(
        `INSERT INTO "tblScenarioFlowExecutionStep" ("id", "execution_id", "flow_step_id", "step_order", "step_name", "method", "url", "status", "http_status_code", "duration_ms", "request_snapshot", "response_snapshot", "extracted_variables", "assertion_results", "error_message", "created_at") VALUES (${escapeSqlString(
          es.id
        )}, ${escapeSqlString(es.executionId)}, ${escapeSqlString(es.flowStepId)}, ${escapeSqlNumber(
          es.stepOrder,
          '0'
        )}, ${escapeSqlString(es.stepName)}, ${escapeSqlString(es.method)}, ${escapeSqlString(
          es.url
        )}, ${escapeSqlString(es.status)}, ${escapeSqlNumber(
          es.httpStatusCode,
          'NULL'
        )}, ${escapeSqlNumber(es.durationMs, '0')}, ${escapeSqlJson(
          es.requestSnapshot
        )}, ${escapeSqlJson(es.responseSnapshot)}, ${escapeSqlJson(
          es.extractedVariables
        )}, ${escapeSqlJson(es.assertionResults)}, ${escapeSqlString(
          es.errorMessage
        )}, ${escapeSqlDate(es.createdAt)}) ON CONFLICT ("id") DO UPDATE SET "status" = EXCLUDED."status", "http_status_code" = EXCLUDED."http_status_code", "duration_ms" = EXCLUDED."duration_ms", "request_snapshot" = EXCLUDED."request_snapshot", "response_snapshot" = EXCLUDED."response_snapshot", "extracted_variables" = EXCLUDED."extracted_variables", "assertion_results" = EXCLUDED."assertion_results", "error_message" = EXCLUDED."error_message";`
      );
    }
    chunks.push(``);
  }

  // 17. tblAiApiKey
  if (aiApiKeys.length > 0) {
    chunks.push(`-- 17. AI API Keys (${aiApiKeys.length} rows)`);
    for (const k of aiApiKeys) {
      chunks.push(
        `INSERT INTO "tblAiApiKey" ("id", "name", "provider", "encrypted_key", "key_hint", "priority", "is_active", "last_used_at", "failure_count", "last_error", "created_at", "updated_at") VALUES (${escapeSqlString(
          k.id
        )}, ${escapeSqlString(k.name)}, ${escapeSqlString(k.provider)}, ${escapeSqlString(
          k.encryptedKey
        )}, ${escapeSqlString(k.keyHint)}, ${escapeSqlNumber(k.priority, '1')}, ${escapeSqlBoolean(
          k.isActive
        )}, ${escapeSqlDate(k.lastUsedAt)}, ${escapeSqlNumber(
          k.failureCount,
          '0'
        )}, ${escapeSqlString(k.lastError)}, ${escapeSqlDate(k.createdAt)}, ${escapeSqlDate(
          k.updatedAt
        )}) ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "provider" = EXCLUDED."provider", "encrypted_key" = EXCLUDED."encrypted_key", "key_hint" = EXCLUDED."key_hint", "priority" = EXCLUDED."priority", "is_active" = EXCLUDED."is_active", "last_used_at" = EXCLUDED."last_used_at", "failure_count" = EXCLUDED."failure_count", "last_error" = EXCLUDED."last_error", "updated_at" = EXCLUDED."updated_at";`
      );
    }
    chunks.push(``);
  }

  // 18. tblChangeLog
  if (changeLogs.length > 0) {
    chunks.push(`-- 18. ChangeLogs (${changeLogs.length} rows)`);
    for (const cl of changeLogs) {
      chunks.push(
        `INSERT INTO "tblChangeLog" ("id", "action", "entity_type", "entity_id", "project_id", "user_id", "operator", "description", "before_state", "after_state", "metadata", "created_at") VALUES (${escapeSqlString(
          cl.id
        )}, ${escapeSqlString(cl.action)}, ${escapeSqlString(cl.entityType)}, ${escapeSqlString(
          cl.entityId
        )}, ${escapeSqlString(cl.projectId)}, ${escapeSqlString(cl.userId)}, ${escapeSqlString(
          cl.operator
        )}, ${escapeSqlString(cl.description)}, ${escapeSqlJson(cl.beforeState)}, ${escapeSqlJson(
          cl.afterState
        )}, ${escapeSqlJson(cl.metadata)}, ${escapeSqlDate(
          cl.createdAt
        )}) ON CONFLICT ("id") DO NOTHING;`
      );
    }
    chunks.push(``);
  }

  chunks.push(`COMMIT;`, ``);
  return chunks.join('\n');
}

/**
 * Splits SQL script into executable statements while ignoring comments and keeping string literals intact.
 */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    if (inLineComment) {
      if (char === '\n') inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (char === '*' && nextChar === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote) {
      if (char === '-' && nextChar === '-') {
        inLineComment = true;
        i++;
        continue;
      }
      if (char === '/' && nextChar === '*') {
        inBlockComment = true;
        i++;
        continue;
      }
    }

    if (char === "'" && !inDoubleQuote) {
      // Check escaped single quote ''
      if (inSingleQuote && nextChar === "'") {
        current += "''";
        i++;
        continue;
      }
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    }

    if (char === ';' && !inSingleQuote && !inDoubleQuote) {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        statements.push(trimmed);
      }
      current = '';
    } else {
      current += char;
    }
  }

  const trailing = current.trim();
  if (trailing.length > 0) {
    statements.push(trailing);
  }

  return statements;
}

const SQL_IMPORT_MAX_STATEMENTS_PER_CHUNK = 25;
const SQL_IMPORT_MAX_CHUNK_LENGTH = 750_000;

function escapeJsonControlCharacters(jsonText: string): string {
  let result = '';
  let inJsonString = false;
  let escaped = false;

  for (const char of jsonText) {
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (inJsonString && char === '\\') {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      inJsonString = !inJsonString;
      result += char;
      continue;
    }

    if (inJsonString) {
      if (char === '\n') {
        result += '\\n';
        continue;
      }
      if (char === '\r') {
        result += '\\r';
        continue;
      }
      if (char === '\t') {
        result += '\\t';
        continue;
      }
      if (char < ' ') {
        result += `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`;
        continue;
      }
    }

    result += char;
  }

  return result;
}

function repairUnclosedTrailingJsonString(jsonText: string): string {
  let inJsonString = false;
  let escaped = false;

  for (const char of jsonText) {
    if (escaped) {
      escaped = false;
      continue;
    }

    if (inJsonString && char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inJsonString = !inJsonString;
    }
  }

  if (!inJsonString) return jsonText;

  const trailingClosersMatch = jsonText.match(/[\s}\]]*$/);
  const trailingStart = trailingClosersMatch ? jsonText.length - trailingClosersMatch[0].length : jsonText.length;
  return `${jsonText.slice(0, trailingStart)}"${jsonText.slice(trailingStart)}`;
}

function normalizeJsonbText(jsonText: string): string {
  const escapedJsonText = escapeJsonControlCharacters(jsonText);
  try {
    JSON.parse(escapedJsonText);
    return escapedJsonText;
  } catch {}

  const repairedJsonText = repairUnclosedTrailingJsonString(escapedJsonText);
  try {
    JSON.parse(repairedJsonText);
    return repairedJsonText;
  } catch {}

  return JSON.stringify(jsonText);
}

function sanitizeJsonbLiterals(statement: string): string {
  let result = '';

  for (let i = 0; i < statement.length; i++) {
    const char = statement[i];
    if (char !== "'") {
      result += char;
      continue;
    }

    let sqlLiteral = '';
    let j = i + 1;
    for (; j < statement.length; j++) {
      const current = statement[j];
      const next = statement[j + 1];

      if (current === "'" && next === "'") {
        sqlLiteral += "''";
        j++;
        continue;
      }

      if (current === "'") {
        break;
      }

      sqlLiteral += current;
    }

    if (j >= statement.length) {
      result += char + sqlLiteral;
      break;
    }

    const suffix = statement.slice(j + 1);
    const isJsonbLiteral = /^\s*::\s*jsonb\b/i.test(suffix);

    if (!isJsonbLiteral) {
      result += `'${sqlLiteral}'`;
      i = j;
      continue;
    }

    const jsonText = sqlLiteral.replace(/''/g, "'");
    const sanitizedJsonText = normalizeJsonbText(jsonText);
    result += `'${sanitizedJsonText.replace(/'/g, "''")}'`;
    i = j;
  }

  return result;
}

function chunkSqlStatements(statements: string[]): string[][] {
  const chunks: string[][] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const statement of statements) {
    const statementLength = statement.length + 2;
    const chunkIsFull =
      currentChunk.length >= SQL_IMPORT_MAX_STATEMENTS_PER_CHUNK ||
      (currentChunk.length > 0 && currentLength + statementLength > SQL_IMPORT_MAX_CHUNK_LENGTH);

    if (chunkIsFull) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentLength = 0;
    }

    currentChunk.push(statement);
    currentLength += statementLength;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Imports and executes SQL database script into PostgreSQL using chunked batch execution.
 */
export async function importDatabaseSql(
  sqlContent: string,
  mode: 'replace' | 'merge' = 'merge'
): Promise<{ statementsExecuted: number; chunksExecuted: number }> {
  const rawStatements = splitSqlStatements(sqlContent);
  const statements = rawStatements.filter((stmt) => {
    const upper = stmt.toUpperCase().trim();
    // Ignore transaction wrappers from exported dumps; imports are chunked intentionally.
    return upper !== 'BEGIN' && upper !== 'COMMIT' && upper !== 'BEGIN;' && upper !== 'COMMIT;';
  });

  if (statements.length === 0) {
    throw new Error('No valid SQL statements found in file.');
  }

  if (mode === 'replace') {
    await prisma.$transaction([
      prisma.scenarioFlowExecutionStep.deleteMany({}),
      prisma.scenarioFlowExecution.deleteMany({}),
      prisma.scenarioFlowJob.deleteMany({}),
      prisma.scenarioFlowStep.deleteMany({}),
      prisma.scenarioFlow.deleteMany({}),
      prisma.dataSheet.deleteMany({}),
      prisma.responseScenario.deleteMany({}),
      prisma.requestScenario.deleteMany({}),
      prisma.apiEnvironment.deleteMany({}),
      prisma.apiPic.deleteMany({}),
      prisma.projectPic.deleteMany({}),
      prisma.api.deleteMany({}),
      prisma.collection.deleteMany({}),
      prisma.environment.deleteMany({}),
      prisma.project.deleteMany({}),
      prisma.aiApiKey.deleteMany({}),
      prisma.changeLog.deleteMany({}),
    ]);
  }

  const chunks = chunkSqlStatements(statements);
  for (const chunk of chunks) {
    for (const statement of chunk) {
      await prisma.$executeRawUnsafe(sanitizeJsonbLiterals(statement));
    }
  }

  return { statementsExecuted: statements.length, chunksExecuted: chunks.length };
}
