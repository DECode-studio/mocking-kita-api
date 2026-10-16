import { RequestScenario } from '@/src/client/domain/request-scenario/entity/request_scenario';
import { BodyPathRule, MatchStrategy, MatchType, RequestBodyType } from '@/src/core/utils/types';

export function toRequestScenarioDomain(r: {
  id: string;
  apiId: string;
  name: string;
  description: string | null;
  headers: unknown;
  queryParams: unknown;
  pathParams: unknown;
  body: unknown;
  bodyType: string;
  matchType: string;
  matchStrategy?: string | null;
  bodyRules?: unknown;
  strictBodyStructure?: boolean;
  priority: number;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): RequestScenario {
  return {
    id: r.id,
    apiId: r.apiId,
    name: r.name,
    description: r.description ?? undefined,
    headers: (r.headers as Record<string, unknown>) ?? {},
    queryParams: (r.queryParams as Record<string, unknown>) ?? {},
    pathParams: (r.pathParams as Record<string, unknown>) ?? {},
    body: r.body ?? {},
    bodyType: (r.bodyType as RequestBodyType) || 'JSON',
    matchType: (r.matchType as MatchType) || 'EXACT',
    matchStrategy: (r.matchStrategy as MatchStrategy) || 'ALL',
    bodyRules: (r.bodyRules as BodyPathRule[]) ?? undefined,
    strictBodyStructure: r.strictBodyStructure !== undefined ? r.strictBodyStructure : true,
    priority: r.priority,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
  };
}


