import { ApiCollection } from '@/src/domain/api/entity/api_collection';
import { toBoolean } from '@/src/core/utils/db-converter';

export type ApiRow = {
  id: string;
  project_id: string;
  collection_id: string | null;
  name: string | null;
  description: string | null;
  path: string | null;
  method_request: string | null;
  status: number | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

export function apiFromRow(row: ApiRow): ApiCollection {
  return {
    id: row.id,
    projectId: row.project_id,
    collectionId: row.collection_id ?? null,
    name: row.name ?? '',
    description: row.description ?? undefined,
    path: row.path ?? '',
    methodRequest: (row.method_request as ApiCollection['methodRequest']) || 'GET',
    status: toBoolean(row.status),
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    deletedAt: row.deleted_at ?? null,
  };
}
