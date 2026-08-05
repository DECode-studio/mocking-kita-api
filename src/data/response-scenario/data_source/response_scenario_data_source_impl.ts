import { db } from '@/src/core/db/sqlite-client';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { ResponseScenarioRow, responseScenarioFromRow } from '@/src/data/response-scenario/model/response_scenario_model';
import { stringifyJson, toDbBoolean } from '@/src/core/utils/db-converter';

export function getResponseScenariosByRequestScenarioId(requestScenarioId: string): ResponseScenario[] {
  return (
    db.prepare('SELECT * FROM tblResponseScenario WHERE request_scenario_id = ? ORDER BY priority DESC, created_at ASC, id ASC').all(requestScenarioId) as ResponseScenarioRow[]
  ).map(responseScenarioFromRow);
}

export function getResponseScenarioById(id: string): ResponseScenario | null {
  const row = db
    .prepare('SELECT * FROM tblResponseScenario WHERE id = ? LIMIT 1')
    .get(id) as ResponseScenarioRow | undefined;
  return row ? responseScenarioFromRow(row) : null;
}

export function createResponseScenario(
  input: Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
): ResponseScenario {
  db.prepare(
    'INSERT INTO tblResponseScenario (id, request_scenario_id, name, description, status_code, headers, body, delay_ms, weight, priority, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    input.id,
    input.requestScenarioId,
    input.name,
    input.description ?? null,
    input.statusCode,
    stringifyJson(input.headers),
    stringifyJson(input.body),
    input.delayMs,
    input.weight,
    input.priority,
    toDbBoolean(input.status),
    input.createdAt,
    input.updatedAt,
    input.deletedAt ?? null
  );
  return input;
}

export function updateResponseScenario(id: string, input: Partial<ResponseScenario>): ResponseScenario {
  const current = getResponseScenarioById(id);
  if (!current) throw new Error(`Response scenario ${id} not found`);
  const updated: ResponseScenario = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };
  db.prepare(
    'UPDATE tblResponseScenario SET request_scenario_id = ?, name = ?, description = ?, status_code = ?, headers = ?, body = ?, delay_ms = ?, weight = ?, priority = ?, status = ?, created_at = ?, updated_at = ?, deleted_at = ? WHERE id = ?'
  ).run(
    updated.requestScenarioId,
    updated.name,
    updated.description ?? null,
    updated.statusCode,
    stringifyJson(updated.headers),
    stringifyJson(updated.body),
    updated.delayMs,
    updated.weight,
    updated.priority,
    toDbBoolean(updated.status),
    updated.createdAt,
    updated.updatedAt,
    updated.deletedAt ?? null,
    id
  );
  return updated;
}

export function softDeleteResponseScenario(id: string): void {
  const current = getResponseScenarioById(id);
  if (!current) throw new Error(`Response scenario ${id} not found`);
  updateResponseScenario(id, { deletedAt: new Date().toISOString(), status: false });
}

export function removeResponseScenariosByRequestScenarioId(requestScenarioId: string): void {
  db.prepare('DELETE FROM tblResponseScenario WHERE request_scenario_id = ?').run(requestScenarioId);
}
