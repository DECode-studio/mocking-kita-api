import { db } from '@/src/core/db/sqlite-client';
import { Collection } from '@/src/domain/collection/entity/collection';
import { CollectionRow, collectionFromRow } from '@/src/data/collection/model/collection_model';
import { toDbBoolean } from '@/src/core/utils/db-converter';

export function getCollectionsByProjectId(projectId: string): Collection[] {
  return (
    db.prepare('SELECT * FROM tblCollection WHERE project_id = ? ORDER BY created_at ASC, id ASC').all(projectId) as CollectionRow[]
  ).map(collectionFromRow);
}

export function getCollectionById(id: string): Collection | null {
  const row = db.prepare('SELECT * FROM tblCollection WHERE id = ? LIMIT 1').get(id) as CollectionRow | undefined;
  return row ? collectionFromRow(row) : null;
}

export function createCollection(
  input: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
): Collection {
  db.prepare(
    'INSERT INTO tblCollection (id, project_id, name, description, status, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    input.id,
    input.projectId,
    input.name,
    input.description ?? null,
    toDbBoolean(input.status),
    input.createdAt,
    input.updatedAt,
    input.deletedAt ?? null
  );
  return input;
}

export function updateCollection(id: string, input: Partial<Collection>): Collection {
  const current = getCollectionById(id);
  if (!current) throw new Error(`Collection ${id} not found`);
  const updated: Collection = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };
  db.prepare(
    'UPDATE tblCollection SET project_id = ?, name = ?, description = ?, status = ?, created_at = ?, updated_at = ?, deleted_at = ? WHERE id = ?'
  ).run(
    updated.projectId,
    updated.name,
    updated.description ?? null,
    toDbBoolean(updated.status),
    updated.createdAt,
    updated.updatedAt,
    updated.deletedAt ?? null,
    id
  );
  return updated;
}

export function softDeleteCollection(id: string): void {
  const current = getCollectionById(id);
  if (!current) throw new Error(`Collection ${id} not found`);
  
  // Clean up collection_id mapping in tblApi by setting to null
  db.prepare('UPDATE tblApi SET collection_id = NULL WHERE collection_id = ?').run(id);

  updateCollection(id, { deletedAt: new Date().toISOString(), status: false });
}

export function removeCollectionsByProjectId(projectId: string): void {
  db.prepare('DELETE FROM tblCollection WHERE project_id = ?').run(projectId);
}
