import { db } from '@/src/core/db/sqlite-client';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { RequestScenarioRow, requestScenarioFromRow } from '@/src/data/request-scenario/model/request_scenario_model';
import { stringifyJson, toDbBoolean } from '@/src/core/utils/db-converter';

export function getRequestScenariosByApiId(apiId: string): RequestScenario[] {
  return (
    db.prepare('SELECT * FROM tblRequestScenario WHERE api_id = ? ORDER BY priority DESC, created_at ASC, id ASC').all(apiId) as RequestScenarioRow[]
  ).map(requestScenarioFromRow);
}

export function getRequestScenarioById(id: string): RequestScenario | null {
  const row = db.prepare('SELECT * FROM tblRequestScenario WHERE id = ? LIMIT 1').get(id) as RequestScenarioRow | undefined;
  return row ? requestScenarioFromRow(row) : null;
}

export function createRequestScenario(
  input: Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
): RequestScenario {
  db.prepare(
    'INSERT INTO tblRequestScenario (id, api_id, name, description, headers, query_params, path_params, body, match_type, priority, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    input.id,
    input.apiId,
    input.name,
    input.description ?? null,
    stringifyJson(input.headers),
    stringifyJson(input.queryParams),
    stringifyJson(input.pathParams),
    stringifyJson(input.body),
    input.matchType,
    input.priority,
    toDbBoolean(input.status),
    input.createdAt,
    input.updatedAt,
    input.deletedAt ?? null
  );
  return input;
}

export function updateRequestScenario(id: string, input: Partial<RequestScenario>): RequestScenario {
  const current = getRequestScenarioById(id);
  if (!current) throw new Error(`Request scenario ${id} not found`);
  const updated: RequestScenario = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };
  db.prepare(
    'UPDATE tblRequestScenario SET api_id = ?, name = ?, description = ?, headers = ?, query_params = ?, path_params = ?, body = ?, match_type = ?, priority = ?, status = ?, created_at = ?, updated_at = ?, deleted_at = ? WHERE id = ?'
  ).run(
    updated.apiId,
    updated.name,
    updated.description ?? null,
    stringifyJson(updated.headers),
    stringifyJson(updated.queryParams),
    stringifyJson(updated.pathParams),
    stringifyJson(updated.body),
    updated.matchType,
    updated.priority,
    toDbBoolean(updated.status),
    updated.createdAt,
    updated.updatedAt,
    updated.deletedAt ?? null,
    id
  );
  return updated;
}

export function softDeleteRequestScenario(id: string): void {
  db.prepare('DELETE FROM tblRequestScenario WHERE id = ?').run(id);
}

export function removeRequestScenariosByApiId(apiId: string): void {
  db.prepare('DELETE FROM tblRequestScenario WHERE api_id = ?').run(apiId);
}
