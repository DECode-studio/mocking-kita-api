import { Project } from '@/src/domain/project/entity/project';
import { toBoolean } from '@/src/core/utils/db-converter';

export type ProjectRow = {
  id: string;
  name: string | null;
  description: string | null;
  pic_ids?: string[];
  pic_id?: string | null;
  pics?: any[];
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
    picIds: row.pic_ids || (row.pic_id ? [row.pic_id] : []),
    pics: row.pics || [],
    status: toBoolean(row.status),
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    deletedAt: row.deleted_at ?? null,
  };
}
