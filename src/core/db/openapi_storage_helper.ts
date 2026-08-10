import { db } from '@/src/core/db/sqlite-client';
import { ProjectRow, projectFromRow } from '@/src/data/project/model/project_model';
import { CollectionRow, collectionFromRow } from '@/src/data/collection/model/collection_model';
import { ApiRow, apiFromRow } from '@/src/data/api/model/api_collection_model';
import { RequestScenarioRow, requestScenarioFromRow } from '@/src/data/request-scenario/model/request_scenario_model';
import { ResponseScenarioRow, responseScenarioFromRow } from '@/src/data/response-scenario/model/response_scenario_model';
import { exportProjectToOpenApiSpec, parseOpenApiSpecToProjectData, OpenApiSpec } from '@/src/core/openapi/openapi_converter';
import { toDbBoolean } from '@/src/core/utils/db-converter';

/**
 * Export all endpoints, collections, and scenarios belonging strictly to a single project into OpenAPI 3.0 spec.
 */
export function exportProjectOpenApi(projectId: string): OpenApiSpec {
  const projectRow = db.prepare('SELECT * FROM tblProject WHERE id = ?').get(projectId) as ProjectRow | undefined;
  if (!projectRow) {
    throw new Error(`Project with ID ${projectId} not found.`);
  }

  const project = projectFromRow(projectRow);

  const collectionRows = db
    .prepare('SELECT * FROM tblCollection WHERE project_id = ? AND deleted_at IS NULL')
    .all(projectId) as CollectionRow[];
  const collections = collectionRows.map(collectionFromRow);

  const apiRows = db
    .prepare('SELECT * FROM tblApi WHERE project_id = ? AND deleted_at IS NULL')
    .all(projectId) as ApiRow[];
  const apis = apiRows.map(apiFromRow);

  const apiIds = apis.map((a) => a.id);
  let requestScenarios: ReturnType<typeof requestScenarioFromRow>[] = [];
  let responseScenarios: ReturnType<typeof responseScenarioFromRow>[] = [];

  if (apiIds.length > 0) {
    const placeholders = apiIds.map(() => '?').join(',');
    const reqRows = db
      .prepare(`SELECT * FROM tblRequestScenario WHERE api_id IN (${placeholders}) AND deleted_at IS NULL`)
      .all(...apiIds) as RequestScenarioRow[];
    requestScenarios = reqRows.map(requestScenarioFromRow);

    const reqIds = requestScenarios.map((r) => r.id);
    if (reqIds.length > 0) {
      const reqPlaceholders = reqIds.map(() => '?').join(',');
      const respRows = db
        .prepare(`SELECT * FROM tblResponseScenario WHERE request_scenario_id IN (${reqPlaceholders}) AND deleted_at IS NULL`)
        .all(...reqIds) as ResponseScenarioRow[];
      responseScenarios = respRows.map(responseScenarioFromRow);
    }
  }

  return exportProjectToOpenApiSpec(project, collections, apis, requestScenarios, responseScenarios);
}

/**
 * Import an OpenAPI JSON document into a target project.
 * Concept: Strictly scoped to the specified projectId so existing projects remain completely unharmed.
 * Mode:
 *  - 'replace': Deletes existing collections, APIs, and scenarios ONLY within target projectId before inserting imported ones.
 *  - 'merge': Retains existing data within target projectId, inserting/updating imported collections, APIs, and scenarios.
 */
export function importProjectOpenApi(
  projectId: string,
  rawSpec: any,
  mode: 'replace' | 'merge' = 'merge'
): { success: boolean; importedApiCount: number; importedCollectionCount: number } {
  const projectRow = db.prepare('SELECT * FROM tblProject WHERE id = ?').get(projectId) as ProjectRow | undefined;
  if (!projectRow) {
    throw new Error(`Project with ID ${projectId} not found.`);
  }

  const existingCollectionRows = db
    .prepare('SELECT * FROM tblCollection WHERE project_id = ? AND deleted_at IS NULL')
    .all(projectId) as CollectionRow[];
  const existingCollections = existingCollectionRows.map(collectionFromRow);

  const extracted = parseOpenApiSpecToProjectData(projectId, rawSpec, existingCollections);
  const now = new Date().toISOString();

  db.exec('BEGIN TRANSACTION;');
  try {
    if (mode === 'replace') {
      // Find all APIs in this project
      const projectApiRows = db.prepare('SELECT id FROM tblApi WHERE project_id = ?').all(projectId) as { id: string }[];
      const projectApiIds = projectApiRows.map((a) => a.id);

      if (projectApiIds.length > 0) {
        const apiPlaceholders = projectApiIds.map(() => '?').join(',');
        const projectReqRows = db
          .prepare(`SELECT id FROM tblRequestScenario WHERE api_id IN (${apiPlaceholders})`)
          .all(...projectApiIds) as { id: string }[];
        const projectReqIds = projectReqRows.map((r) => r.id);

        if (projectReqIds.length > 0) {
          const reqPlaceholders = projectReqIds.map(() => '?').join(',');
          db.prepare(`DELETE FROM tblResponseScenario WHERE request_scenario_id IN (${reqPlaceholders})`).run(...projectReqIds);
        }

        db.prepare(`DELETE FROM tblRequestScenario WHERE api_id IN (${apiPlaceholders})`).run(...projectApiIds);
        db.prepare('DELETE FROM tblApiEnvironment WHERE api_id IN (' + apiPlaceholders + ')').run(...projectApiIds);
        db.prepare('DELETE FROM tblApi WHERE project_id = ?').run(projectId);
      }

      db.prepare('DELETE FROM tblCollection WHERE project_id = ?').run(projectId);
    }

    // Insert Collections
    const insertCollection = db.prepare(
      'INSERT INTO tblCollection (id, project_id, name, description, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)'
    );
    for (const col of extracted.collections) {
      insertCollection.run(
        col.id,
        projectId,
        col.name,
        col.description ?? null,
        toDbBoolean(col.status ?? true),
        now,
        now
      );
    }

    // Insert APIs
    const insertApi = db.prepare(
      'INSERT OR REPLACE INTO tblApi (id, project_id, collection_id, name, description, path, method_request, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)'
    );
    for (const api of extracted.apis) {
      insertApi.run(
        api.id,
        projectId,
        api.collectionId ?? null,
        api.name,
        api.description ?? null,
        api.path,
        api.methodRequest,
        toDbBoolean(api.status ?? true),
        now,
        now
      );
    }

    // Insert Request Scenarios
    const insertReq = db.prepare(
      'INSERT INTO tblRequestScenario (id, api_id, name, description, headers, query_params, path_params, body, body_type, match_type, priority, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)'
    );
    for (const req of extracted.requestScenarios) {
      insertReq.run(
        req.id,
        req.apiId,
        req.name,
        req.description ?? null,
        JSON.stringify(req.headers ?? {}),
        JSON.stringify(req.queryParams ?? {}),
        JSON.stringify(req.pathParams ?? {}),
        JSON.stringify(req.body ?? {}),
        req.bodyType ?? 'JSON',
        req.matchType ?? 'EXACT',
        req.priority ?? 0,
        toDbBoolean(req.status ?? true),
        now,
        now
      );
    }

    // Insert Response Scenarios
    const insertResp = db.prepare(
      'INSERT INTO tblResponseScenario (id, request_scenario_id, name, description, status_code, headers, body, response_type, file_path, file_name, delay_ms, weight, priority, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)'
    );
    for (const resp of extracted.responseScenarios) {
      insertResp.run(
        resp.id,
        resp.requestScenarioId,
        resp.name,
        resp.description ?? null,
        resp.statusCode,
        JSON.stringify(resp.headers ?? {}),
        JSON.stringify(resp.body ?? {}),
        resp.responseType ?? 'JSON',
        resp.filePath ?? null,
        resp.fileName ?? null,
        resp.delayMs ?? 0,
        resp.weight ?? 100,
        resp.priority ?? 0,
        toDbBoolean(resp.status ?? true),
        now,
        now
      );
    }

    db.exec('COMMIT;');
    return {
      success: true,
      importedApiCount: extracted.apis.length,
      importedCollectionCount: extracted.collections.length,
    };
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}
