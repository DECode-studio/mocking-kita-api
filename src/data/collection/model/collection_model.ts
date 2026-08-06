import { Collection } from '@/src/domain/collection/entity/collection';
import { toBoolean } from '@/src/core/utils/db-converter';

export type CollectionRow = {
  id: string;
  project_id: string;
  name: string | null;
  description: string | null;
  status: number | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

export function collectionFromRow(row: CollectionRow): Collection {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name ?? '',
    description: row.description ?? undefined,
    status: toBoolean(row.status),
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    deletedAt: row.deleted_at ?? null,
  };
}
