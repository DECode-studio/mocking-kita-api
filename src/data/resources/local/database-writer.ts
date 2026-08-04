import { db } from '@/src/core/db/sqlite-client';
import { MockApiDatabase } from '@/src/data/database/mock-api-database';
import { stringifyJson, toDbBoolean } from '@/src/data/models/shared';

export function clearAllTables(): void {
  db.exec(`
    DELETE FROM tblResponseScenario;
    DELETE FROM tblRequestScenario;
    DELETE FROM tblApiEnvironment;
    DELETE FROM tblApi;
    DELETE FROM tblEnvironment;
    DELETE FROM tblProject;
  `);
}

export function seedDatabase(data: MockApiDatabase): void {
  const insertProject = db.prepare(`
    INSERT INTO tblProject (id, name, description, status, created_at, updated_at, deleted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertEnvironment = db.prepare(`
    INSERT INTO tblEnvironment (
      id, project_id, name, environment_type, public_base_url, origin_base_url,
      status, created_at, updated_at, deleted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertApi = db.prepare(`
    INSERT INTO tblApi (
      id, project_id, name, description, path, method_request,
      status, created_at, updated_at, deleted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertApiEnvironment = db.prepare(`
    INSERT INTO tblApiEnvironment (
      id, api_id, environment_id, enabled, path_override, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRequestScenario = db.prepare(`
    INSERT INTO tblRequestScenario (
      id, api_id, name, description, headers, query_params, path_params, body,
      match_type, priority, status, created_at, updated_at, deleted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertResponseScenario = db.prepare(`
    INSERT INTO tblResponseScenario (
      id, request_scenario_id, name, description, status_code, headers, body,
      delay_ms, weight, priority, status, created_at, updated_at, deleted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    db.exec('BEGIN');
    clearAllTables();

    for (const project of data.projects) {
      insertProject.run(
        project.id,
        project.name,
        project.description ?? null,
        toDbBoolean(project.status),
        project.createdAt,
        project.updatedAt,
        project.deletedAt ?? null
      );
    }

    for (const environment of data.environments) {
      insertEnvironment.run(
        environment.id,
        environment.projectId,
        environment.name,
        environment.environmentType,
        environment.publicBaseUrl,
        environment.originBaseUrl ?? null,
        toDbBoolean(environment.status),
        environment.createdAt,
        environment.updatedAt,
        environment.deletedAt ?? null
      );
    }

    for (const api of data.apiCollections) {
      insertApi.run(
        api.id,
        api.projectId,
        api.name,
        api.description ?? null,
        api.path,
        api.methodRequest,
        toDbBoolean(api.status),
        api.createdAt,
        api.updatedAt,
        api.deletedAt ?? null
      );
    }

    for (const apiEnvironment of data.apiEnvironments) {
      insertApiEnvironment.run(
        apiEnvironment.id,
        apiEnvironment.apiId,
        apiEnvironment.environmentId,
        toDbBoolean(apiEnvironment.enabled),
        apiEnvironment.pathOverride ?? null,
        apiEnvironment.createdAt,
        apiEnvironment.updatedAt
      );
    }

    for (const requestScenario of data.requestScenarios) {
      insertRequestScenario.run(
        requestScenario.id,
        requestScenario.apiId,
        requestScenario.name,
        requestScenario.description ?? null,
        stringifyJson(requestScenario.headers),
        stringifyJson(requestScenario.queryParams),
        stringifyJson(requestScenario.pathParams),
        stringifyJson(requestScenario.body),
        requestScenario.matchType,
        requestScenario.priority,
        toDbBoolean(requestScenario.status),
        requestScenario.createdAt,
        requestScenario.updatedAt,
        requestScenario.deletedAt ?? null
      );
    }

    for (const responseScenario of data.responseScenarios) {
      insertResponseScenario.run(
        responseScenario.id,
        responseScenario.requestScenarioId,
        responseScenario.name,
        responseScenario.description ?? null,
        responseScenario.statusCode,
        stringifyJson(responseScenario.headers),
        stringifyJson(responseScenario.body),
        responseScenario.delayMs,
        responseScenario.weight,
        responseScenario.priority,
        toDbBoolean(responseScenario.status),
        responseScenario.createdAt,
        responseScenario.updatedAt,
        responseScenario.deletedAt ?? null
      );
    }

    db.exec('COMMIT');
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch {}
    throw error;
  }
}
