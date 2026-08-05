import { db } from '@/src/core/db/sqlite-client';
import { Environment } from '@/src/domain/environment/entity/environment';
import { EnvironmentRow, environmentFromRow } from '@/src/data/environment/model/environment_model';
import { toDbBoolean } from '@/src/core/utils/db-converter';

export function getEnvironmentsByProjectId(projectId: string): Environment[] {
  return (
    db.prepare('SELECT * FROM tblEnvironment WHERE project_id = ? ORDER BY created_at ASC, id ASC').all(projectId) as
      EnvironmentRow[]
  ).map(environmentFromRow);
}

export function getEnvironmentById(id: string): Environment | null {
  const row = db.prepare('SELECT * FROM tblEnvironment WHERE id = ? LIMIT 1').get(id) as EnvironmentRow | undefined;
  return row ? environmentFromRow(row) : null;
}

export function createEnvironment(
  input: Omit<Environment, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
): Environment {
  db.prepare(
    'INSERT INTO tblEnvironment (id, project_id, name, environment_type, public_base_url, origin_base_url, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    input.id,
    input.projectId,
    input.name,
    input.environmentType,
    input.publicBaseUrl,
    input.originBaseUrl ?? null,
    toDbBoolean(input.status),
    input.createdAt,
    input.updatedAt,
    input.deletedAt ?? null
  );
  return input;
}

export function updateEnvironment(id: string, input: Partial<Environment>): Environment {
  const current = getEnvironmentById(id);
  if (!current) throw new Error(`Environment ${id} not found`);
  const updated: Environment = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };
  db.prepare(
    'UPDATE tblEnvironment SET project_id = ?, name = ?, environment_type = ?, public_base_url = ?, origin_base_url = ?, status = ?, created_at = ?, updated_at = ?, deleted_at = ? WHERE id = ?'
  ).run(
    updated.projectId,
    updated.name,
    updated.environmentType,
    updated.publicBaseUrl,
    updated.originBaseUrl ?? null,
    toDbBoolean(updated.status),
    updated.createdAt,
    updated.updatedAt,
    updated.deletedAt ?? null,
    id
  );
  return updated;
}

export function softDeleteEnvironment(id: string): void {
  db.prepare('DELETE FROM tblEnvironment WHERE id = ?').run(id);
}

export function removeEnvironmentsByProjectId(projectId: string): void {
  db.prepare('DELETE FROM tblEnvironment WHERE project_id = ?').run(projectId);
}
