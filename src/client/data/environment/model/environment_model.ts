import {
  Environment,
  EnvironmentVariable,
  normalizeEnvironmentValues,
  getEnvironmentBaseUrl,
} from '@/src/client/domain/environment/entity/environment';
import { toBoolean } from '@/src/core/utils/db-converter';
import { generateId } from '@/src/core/utils/uuid';

export type EnvironmentRow = {
  id: string;
  project_id: string;
  name: string | null;
  is_base_url?: boolean | null;
  values?: any;
  environment_type?: string | null;
  base_url?: string | null;
  variables?: any;
  status: number | boolean | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

export function environmentFromRow(row: EnvironmentRow): Environment {
  const isBaseUrl = row.is_base_url !== false;
  const values = normalizeEnvironmentValues(row.values, isBaseUrl);

  let parsedVariables: EnvironmentVariable[] = [];

  if (Array.isArray(row.variables)) {
    parsedVariables = row.variables;
  } else if (typeof row.variables === 'string') {
    try {
      const parsed = JSON.parse(row.variables);
      if (Array.isArray(parsed)) {
        parsedVariables = parsed;
      }
    } catch {
      parsedVariables = [];
    }
  }

  if (parsedVariables.length === 0 && row.base_url) {
    parsedVariables = [
      { id: generateId(), key: 'baseUrl', value: row.base_url, type: 'plain', enabled: true },
    ];
  }

  const baseUrl = getEnvironmentBaseUrl({
    values,
    isBaseUrl,
    environmentType: row.environment_type,
    variables: parsedVariables,
    baseUrl: row.base_url,
  });

  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name ?? '',
    isBaseUrl,
    values,
    environmentType: (row.environment_type as Environment['environmentType']) || null,
    variables: parsedVariables,
    baseUrl,
    status: toBoolean(row.status),
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    deletedAt: row.deleted_at ?? null,
  };
}
