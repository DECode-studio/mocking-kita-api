import { db } from '@/src/core/db/sqlite-client';
import { ApiEnvironment } from '@/src/domain/api/entity/api_environment';
import { ApiEnvironmentRow, apiEnvironmentFromRow } from '@/src/data/api/model/api_environment_model';
import { toDbBoolean } from '@/src/core/utils/db-converter';

export function getApiEnvironmentsByApiId(apiId: string): ApiEnvironment[] {
  return (
    db.prepare('SELECT * FROM tblApiEnvironment WHERE api_id = ? ORDER BY created_at ASC, id ASC').all(apiId) as
      ApiEnvironmentRow[]
  ).map(apiEnvironmentFromRow);
}

export function getApiEnvironment(apiId: string, environmentId: string): ApiEnvironment | null {
  const row = db
    .prepare('SELECT * FROM tblApiEnvironment WHERE api_id = ? AND environment_id = ? LIMIT 1')
    .get(apiId, environmentId) as ApiEnvironmentRow | undefined;
  return row ? apiEnvironmentFromRow(row) : null;
}

export function upsertApiEnvironment(
  input: Omit<ApiEnvironment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): ApiEnvironment {
  const now = new Date().toISOString();
  const existing = getApiEnvironment(input.apiId, input.environmentId);

  if (existing) {
    const updated: ApiEnvironment = {
      ...existing,
      ...input,
      updatedAt: now,
    };
    db.prepare(
      'UPDATE tblApiEnvironment SET enabled = ?, path_override = ?, updated_at = ? WHERE api_id = ? AND environment_id = ?'
    ).run(toDbBoolean(updated.enabled), updated.pathOverride ?? null, updated.updatedAt, updated.apiId, updated.environmentId);
    return updated;
  }

  const created: ApiEnvironment = {
    id: input.id || `apienv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    apiId: input.apiId,
    environmentId: input.environmentId,
    enabled: input.enabled,
    pathOverride: input.pathOverride,
    createdAt: now,
    updatedAt: now,
  };

  db.prepare(
    'INSERT INTO tblApiEnvironment (id, api_id, environment_id, enabled, path_override, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    created.id,
    created.apiId,
    created.environmentId,
    toDbBoolean(created.enabled),
    created.pathOverride ?? null,
    created.createdAt,
    created.updatedAt
  );
  return created;
}

export function removeApiEnvironmentsByApiId(apiId: string): void {
  db.prepare('DELETE FROM tblApiEnvironment WHERE api_id = ?').run(apiId);
}

export function removeApiEnvironmentsByEnvironmentId(environmentId: string): void {
  db.prepare('DELETE FROM tblApiEnvironment WHERE environment_id = ?').run(environmentId);
}
