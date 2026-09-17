import { Environment } from '@/src/client/domain/environment/entity/environment';
import { toBoolean } from '@/src/core/utils/db-converter';

export type EnvironmentRow = {
  id: string;
  project_id: string;
  name: string | null;
  environment_type: string | null;
  base_url: string | null;
  status: number | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

export function environmentFromRow(row: EnvironmentRow): Environment {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name ?? '',
    environmentType: (row.environment_type as Environment['environmentType']) || 'LOCAL',
    baseUrl: row.base_url ?? '',
    status: toBoolean(row.status),
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    deletedAt: row.deleted_at ?? null,
  };
}
