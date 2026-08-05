import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { parseJson, toBoolean } from '@/src/core/utils/db-converter';

export type ResponseScenarioRow = {
  id: string;
  request_scenario_id: string;
  name: string | null;
  description: string | null;
  status_code: number | null;
  headers: string | null;
  body: string | null;
  delay_ms: number | null;
  weight: number | null;
  priority: number | null;
  status: number | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
};

export function responseScenarioFromRow(row: ResponseScenarioRow): ResponseScenario {
  return {
    id: row.id,
    requestScenarioId: row.request_scenario_id,
    name: row.name ?? '',
    description: row.description ?? undefined,
    statusCode: row.status_code ?? 200,
    headers: parseJson<Record<string, unknown>>(row.headers, {}),
    body: parseJson<unknown>(row.body, {}),
    delayMs: row.delay_ms ?? 0,
    weight: row.weight ?? 100,
    priority: row.priority ?? 0,
    status: toBoolean(row.status),
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
    deletedAt: row.deleted_at ?? null,
  };
}
