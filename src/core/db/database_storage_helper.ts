import { db } from '@/src/core/db/sqlite-client';
import { MockApiDatabase } from '@/src/domain/database/entity/mock_api_database';
import { ApiRow, apiFromRow } from '@/src/data/api/model/api_collection_model';
import { ApiEnvironmentRow, apiEnvironmentFromRow } from '@/src/data/api/model/api_environment_model';
import { EnvironmentRow, environmentFromRow } from '@/src/data/environment/model/environment_model';
import { ProjectRow, projectFromRow } from '@/src/data/project/model/project_model';
import { CollectionRow, collectionFromRow } from '@/src/data/collection/model/collection_model';
import { RequestScenarioRow, requestScenarioFromRow } from '@/src/data/request-scenario/model/request_scenario_model';
import {
  ResponseScenarioRow,
  responseScenarioFromRow,
} from '@/src/data/response-scenario/model/response_scenario_model';
import { INITIAL_SEED_DATA } from './seed-data';
import { toDbBoolean } from '@/src/core/utils/db-converter';

export function readDatabase(): MockApiDatabase {
  const projects = db.prepare('SELECT * FROM tblProject ORDER BY created_at ASC, id ASC').all() as ProjectRow[];
  const environments = db
    .prepare('SELECT * FROM tblEnvironment ORDER BY created_at ASC, id ASC')
    .all() as EnvironmentRow[];
  const collections = db
    .prepare('SELECT * FROM tblCollection ORDER BY created_at ASC, id ASC')
    .all() as CollectionRow[];
  const apiCollections = db.prepare('SELECT * FROM tblApi ORDER BY created_at ASC, id ASC').all() as ApiRow[];
  const apiEnvironments = db
    .prepare('SELECT * FROM tblApiEnvironment ORDER BY created_at ASC, id ASC')
    .all() as ApiEnvironmentRow[];
  const requestScenarios = db
    .prepare('SELECT * FROM tblRequestScenario ORDER BY priority DESC, created_at ASC, id ASC')
    .all() as RequestScenarioRow[];
  const responseScenarios = db
    .prepare('SELECT * FROM tblResponseScenario ORDER BY priority DESC, created_at ASC, id ASC')
    .all() as ResponseScenarioRow[];

  return {
    version: '1.0.0',
    projects: projects.map(projectFromRow),
    environments: environments.map(environmentFromRow),
    collections: collections.map(collectionFromRow),
    apiCollections: apiCollections.map(apiFromRow),
    apiEnvironments: apiEnvironments.map(apiEnvironmentFromRow),
    requestScenarios: requestScenarios.map(requestScenarioFromRow),
    responseScenarios: responseScenarios.map(responseScenarioFromRow),
  };
}

export function seedDatabase(data: MockApiDatabase): void {
  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare('DELETE FROM tblResponseScenario').run();
    db.prepare('DELETE FROM tblRequestScenario').run();
    db.prepare('DELETE FROM tblApiEnvironment').run();
    db.prepare('DELETE FROM tblApi').run();
    db.prepare('DELETE FROM tblCollection').run();
    db.prepare('DELETE FROM tblEnvironment').run();
    db.prepare('DELETE FROM tblProject').run();

    const insertProject = db.prepare(
      'INSERT INTO tblProject (id, name, description, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const item of data.projects) {
      insertProject.run(
        item.id,
        item.name,
        item.description ?? null,
        toDbBoolean(item.status),
        item.createdAt,
        item.updatedAt,
        item.deletedAt ?? null
      );
    }

    const insertEnv = db.prepare(
      'INSERT INTO tblEnvironment (id, project_id, name, environment_type, public_base_url, origin_base_url, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const item of data.environments) {
      insertEnv.run(
        item.id,
        item.projectId,
        item.name,
        item.environmentType,
        item.publicBaseUrl ?? null,
        item.originBaseUrl ?? null,
        toDbBoolean(item.status),
        item.createdAt,
        item.updatedAt,
        item.deletedAt ?? null
      );
    }

    const insertCollection = db.prepare(
      'INSERT INTO tblCollection (id, project_id, name, description, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const item of data.collections || []) {
      insertCollection.run(
        item.id,
        item.projectId,
        item.name,
        item.description ?? null,
        toDbBoolean(item.status),
        item.createdAt,
        item.updatedAt,
        item.deletedAt ?? null
      );
    }

    const insertApi = db.prepare(
      'INSERT INTO tblApi (id, project_id, collection_id, name, description, path, method_request, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const item of data.apiCollections) {
      insertApi.run(
        item.id,
        item.projectId,
        item.collectionId ?? null,
        item.name,
        item.description ?? null,
        item.path,
        item.methodRequest,
        toDbBoolean(item.status),
        item.createdAt,
        item.updatedAt,
        item.deletedAt ?? null
      );
    }

    const insertApiEnv = db.prepare(
      'INSERT INTO tblApiEnvironment (id, api_id, environment_id, enabled, path_override, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    for (const item of data.apiEnvironments) {
      insertApiEnv.run(
        item.id,
        item.apiId,
        item.environmentId,
        toDbBoolean(item.enabled),
        item.pathOverride ?? null,
        item.createdAt,
        item.updatedAt
      );
    }

    const insertReq = db.prepare(
      'INSERT INTO tblRequestScenario (id, api_id, name, description, headers, query_params, path_params, body, body_type, match_type, priority, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const item of data.requestScenarios) {
      insertReq.run(
        item.id,
        item.apiId,
        item.name,
        item.description ?? null,
        JSON.stringify(item.headers ?? {}),
        JSON.stringify(item.queryParams ?? {}),
        JSON.stringify(item.pathParams ?? {}),
        JSON.stringify(item.body ?? {}),
        item.bodyType ?? 'JSON',
        item.matchType ?? 'EXACT',
        item.priority ?? 0,
        toDbBoolean(item.status),
        item.createdAt,
        item.updatedAt,
        item.deletedAt ?? null
      );
    }

    const insertResp = db.prepare(
      'INSERT INTO tblResponseScenario (id, request_scenario_id, name, description, status_code, headers, body, response_type, file_path, file_name, delay_ms, weight, priority, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const item of data.responseScenarios) {
      insertResp.run(
        item.id,
        item.requestScenarioId,
        item.name,
        item.description ?? null,
        item.statusCode,
        JSON.stringify(item.headers ?? {}),
        JSON.stringify(item.body ?? {}),
        item.responseType ?? 'JSON',
        item.filePath ?? null,
        item.fileName ?? null,
        item.delayMs ?? 0,
        item.weight ?? 100,
        item.priority ?? 0,
        toDbBoolean(item.status),
        item.createdAt,
        item.updatedAt,
        item.deletedAt ?? null
      );
    }

    db.exec('COMMIT;');
  } catch (error) {
    db.exec('ROLLBACK;');
    throw error;
  }
}

export function resetDatabaseToSeed(): MockApiDatabase {
  seedDatabase(INITIAL_SEED_DATA);
  return readDatabase();
}

export function importDatabaseData(importedData: MockApiDatabase, mode: 'replace' | 'merge'): MockApiDatabase {
  if (mode === 'replace') {
    seedDatabase(importedData);
    return readDatabase();
  }

  const current = readDatabase();

  const mergeByMap = <T extends { id: string }>(source: T[], incoming: T[] = []) => {
    const map = new Map<string, T>();
    source.forEach((item) => map.set(item.id, item));
    incoming.forEach((item) => map.set(item.id, item));
    return Array.from(map.values());
  };

  const mergedDatabase: MockApiDatabase = {
    version: importedData.version || current.version,
    projects: mergeByMap(current.projects, importedData.projects),
    environments: mergeByMap(current.environments, importedData.environments),
    collections: mergeByMap(current.collections, importedData.collections),
    apiCollections: mergeByMap(current.apiCollections, importedData.apiCollections),
    apiEnvironments: mergeByMap(current.apiEnvironments, importedData.apiEnvironments),
    requestScenarios: mergeByMap(current.requestScenarios, importedData.requestScenarios),
    responseScenarios: mergeByMap(current.responseScenarios, importedData.responseScenarios),
  };

  seedDatabase(mergedDatabase);
  return readDatabase();
}
