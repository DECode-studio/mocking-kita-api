import { ApiEnvironment } from '@/src/domain/api/entity/api_environment';
import { toBoolean } from '@/src/core/utils/db-converter';

export type ApiEnvironmentRow = {
  id: string;
  api_id: string;
  environment_id: string;
  enabled: number | null;
  path_override: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export function apiEnvironmentFromRow(row: ApiEnvironmentRow): ApiEnvironment {
  return {
    id: row.id,
    apiId: row.api_id,
    environmentId: row.environment_id,
    enabled: toBoolean(row.enabled),
    pathOverride: row.path_override ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}
