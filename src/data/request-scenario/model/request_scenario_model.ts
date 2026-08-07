import { MatchType, RequestBodyType } from '@/src/core/utils/types';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { parseJson, toBoolean } from '@/src/core/utils/db-converter';

export type RequestScenarioRow = {
  id: string;
  api_id: string;
  name: string | null;
  description: string | null;
  headers: string | null;
  query_params: string | null;
  path_params: string | null;
  body: string | null;
  body_type: string | null;
  match_type: string | null;
  priority: number | null;
  status: number | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

export function requestScenarioFromRow(row: RequestScenarioRow): RequestScenario {
  return {
    id: row.id,
    apiId: row.api_id,
    name: row.name ?? '',
    description: row.description ?? undefined,
    headers: parseJson<Record<string, unknown>>(row.headers, {}),
    queryParams: parseJson<Record<string, unknown>>(row.query_params, {}),
    pathParams: parseJson<Record<string, unknown>>(row.path_params, {}),
    body: parseJson<unknown>(row.body, {}),
    bodyType: (row.body_type as RequestBodyType) || 'JSON',
    matchType: (row.match_type as MatchType) || 'EXACT',
    priority: row.priority ?? 0,
    status: toBoolean(row.status),
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    deletedAt: row.deleted_at ?? null,
  };
}
