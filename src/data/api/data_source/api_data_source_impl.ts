import { db } from '@/src/core/db/sqlite-client';
import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { ApiRow, apiFromRow } from '@/src/data/api/model/api_collection_model';
import { toDbBoolean } from '@/src/core/utils/db-converter';

export function getApisByProjectId(projectId: string): ApiCollection[] {
  return (
    db.prepare('SELECT * FROM tblApi WHERE project_id = ? ORDER BY created_at ASC, id ASC').all(projectId) as ApiRow[]
  ).map(apiFromRow);
}

export function getApiById(id: string): ApiCollection | null {
  const row = db.prepare('SELECT * FROM tblApi WHERE id = ? LIMIT 1').get(id) as ApiRow | undefined;
  return row ? apiFromRow(row) : null;
}

export function createApi(
  input: Omit<ApiCollection, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
): ApiCollection {
  db.prepare(
    'INSERT INTO tblApi (id, project_id, collection_id, name, description, path, method_request, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    input.id,
    input.projectId,
    input.collectionId ?? null,
    input.name,
    input.description ?? null,
    input.path,
    input.methodRequest,
    toDbBoolean(input.status),
    input.createdAt,
    input.updatedAt,
    input.deletedAt ?? null
  );
  return input;
}

export function updateApi(id: string, input: Partial<ApiCollection>): ApiCollection {
  const current = getApiById(id);
  if (!current) throw new Error(`API Collection ${id} not found`);
  const updated: ApiCollection = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };
  db.prepare(
    'UPDATE tblApi SET project_id = ?, collection_id = ?, name = ?, description = ?, path = ?, method_request = ?, status = ?, created_at = ?, updated_at = ?, deleted_at = ? WHERE id = ?'
  ).run(
    updated.projectId,
    updated.collectionId ?? null,
    updated.name,
    updated.description ?? null,
    updated.path,
    updated.methodRequest,
    toDbBoolean(updated.status),
    updated.createdAt,
    updated.updatedAt,
    updated.deletedAt ?? null,
    id
  );
  return updated;
}

export function softDeleteApi(id: string): void {
  const current = getApiById(id);
  if (!current) throw new Error(`API Collection ${id} not found`);
  updateApi(id, { deletedAt: new Date().toISOString(), status: false });
}

export function removeApisByProjectId(projectId: string): void {
  db.prepare('DELETE FROM tblApi WHERE project_id = ?').run(projectId);
}
