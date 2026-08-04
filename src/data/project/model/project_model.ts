import { Project } from '@/src/domain/project/entity/project';
import { toBoolean } from '@/src/data/models/shared';

export type ProjectRow = {
  id: string;
  name: string | null;
  description: string | null;
  status: number | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

export function projectFromRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name ?? '',
    description: row.description ?? undefined,
    status: toBoolean(row.status),
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    deletedAt: row.deleted_at ?? null,
  };
}
