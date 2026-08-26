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
 *  - 'upsert' (default): Updates existing endpoints matching path & method, inserts new ones.
 *  - 'merge': Retains existing data within target projectId, inserting all imported collections, APIs, and scenarios as new records.
 *  - 'replace': Deletes existing collections, APIs, and scenarios ONLY within target projectId before inserting imported ones.
 */
export function importProjectOpenApi(
  projectId: string,
  rawSpec: any,
  mode: 'upsert' | 'merge' | 'replace' = 'upsert'
): { success: boolean; importedApiCount: number; importedCollectionCount: number; updatedApiCount?: number } {
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

  let importedApiCount = 0;
  let updatedApiCount = 0;

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

    // Upsert Collections
    const insertCollection = db.prepare(
      'INSERT INTO tblCollection (id, project_id, name, description, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)'
    );
    const updateCollection = db.prepare(
      'UPDATE tblCollection SET description = COALESCE(?, description), status = ?, updated_at = ? WHERE id = ?'
    );

    for (const col of extracted.collections) {
      const existingCol = db.prepare('SELECT id FROM tblCollection WHERE project_id = ? AND LOWER(name) = LOWER(?) AND deleted_at IS NULL').get(projectId, col.name) as { id: string } | undefined;
      if (existingCol) {
        updateCollection.run(col.description ?? null, toDbBoolean(col.status ?? true), now, existingCol.id);
      } else {
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
    }

    if (mode === 'upsert') {
      const existingApis = db
        .prepare('SELECT * FROM tblApi WHERE project_id = ? AND deleted_at IS NULL')
        .all(projectId) as ApiRow[];

      const existingApiMap = new Map<string, ApiRow>();
      for (const apiRow of existingApis) {
        const key = `${apiRow.method_request.toUpperCase()}::${apiRow.path}`;
        existingApiMap.set(key, apiRow);
      }

      const updateApiStmt = db.prepare(
        'UPDATE tblApi SET collection_id = COALESCE(?, collection_id), name = ?, description = ?, status = ?, updated_at = ? WHERE id = ?'
      );
      const insertApiStmt = db.prepare(
        'INSERT INTO tblApi (id, project_id, collection_id, name, description, path, method_request, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)'
      );

      const updateReqStmt = db.prepare(
        'UPDATE tblRequestScenario SET name = ?, description = ?, headers = ?, query_params = ?, path_params = ?, body = ?, body_type = ?, match_type = ?, priority = ?, status = ?, updated_at = ? WHERE id = ?'
      );
      const insertReqStmt = db.prepare(
        'INSERT INTO tblRequestScenario (id, api_id, name, description, headers, query_params, path_params, body, body_type, match_type, priority, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)'
      );

      const updateRespStmt = db.prepare(
        'UPDATE tblResponseScenario SET name = ?, description = ?, status_code = ?, headers = ?, body = ?, response_type = ?, file_path = ?, file_name = ?, delay_ms = ?, weight = ?, priority = ?, status = ?, updated_at = ? WHERE id = ?'
      );
      const insertRespStmt = db.prepare(
        'INSERT INTO tblResponseScenario (id, request_scenario_id, name, description, status_code, headers, body, response_type, file_path, file_name, delay_ms, weight, priority, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)'
      );

      for (const api of extracted.apis) {
        const apiKey = `${api.methodRequest.toUpperCase()}::${api.path}`;
        const existingApiRow = existingApiMap.get(apiKey);

        if (existingApiRow) {
          const targetApiId = existingApiRow.id;
          updateApiStmt.run(
            api.collectionId ?? existingApiRow.collection_id ?? null,
            api.name,
            api.description ?? existingApiRow.description ?? null,
            toDbBoolean(api.status ?? true),
            now,
            targetApiId
          );
          updatedApiCount++;

          const reqScenarios = extracted.requestScenarios.filter((r) => r.apiId === api.id);
          const existingReqRows = db
            .prepare('SELECT * FROM tblRequestScenario WHERE api_id = ? AND deleted_at IS NULL')
            .all(targetApiId) as RequestScenarioRow[];

          for (const req of reqScenarios) {
            const respScenarios = extracted.responseScenarios.filter((resp) => resp.requestScenarioId === req.id);
            const existingReq = existingReqRows.find((r) => r.name === req.name) || existingReqRows[0];

            if (existingReq) {
              updateReqStmt.run(
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
                existingReq.id
              );

              const existingRespRows = db
                .prepare('SELECT * FROM tblResponseScenario WHERE request_scenario_id = ? AND deleted_at IS NULL')
                .all(existingReq.id) as ResponseScenarioRow[];

              for (const resp of respScenarios) {
                const existingResp = existingRespRows.find((r) => r.status_code === resp.statusCode);
                if (existingResp) {
                  updateRespStmt.run(
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
                    existingResp.id
                  );
                } else {
                  insertRespStmt.run(
                    resp.id,
                    existingReq.id,
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
              }
            } else {
              insertReqStmt.run(
                req.id,
                targetApiId,
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
              for (const resp of respScenarios) {
                insertRespStmt.run(
                  resp.id,
                  req.id,
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
            }
          }
        } else {
          const targetApiId = api.id;
          insertApiStmt.run(
            targetApiId,
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
          importedApiCount++;

          const reqScenarios = extracted.requestScenarios.filter((r) => r.apiId === api.id);
          for (const req of reqScenarios) {
            insertReqStmt.run(
              req.id,
              targetApiId,
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

            const respScenarios = extracted.responseScenarios.filter((resp) => resp.requestScenarioId === req.id);
            for (const resp of respScenarios) {
              insertRespStmt.run(
                resp.id,
                req.id,
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
          }
        }
      }
    } else {
      // mode === 'merge' or 'replace'
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
      importedApiCount = extracted.apis.length;

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
    }

    db.exec('COMMIT;');
    return {
      success: true,
      importedApiCount,
      updatedApiCount,
      importedCollectionCount: extracted.collections.length,
    };
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}
