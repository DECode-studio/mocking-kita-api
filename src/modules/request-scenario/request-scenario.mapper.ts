import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';

export function toRequestScenarioDomain(r: {
  id: string;
  apiId: string;
  name: string;
  description: string | null;
  headers: any;
  queryParams: any;
  pathParams: any;
  body: any;
  bodyType: string;
  matchType: string;
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
    headers: r.headers ?? {},
    queryParams: r.queryParams ?? {},
    pathParams: r.pathParams ?? {},
    body: r.body ?? {},
    bodyType: r.bodyType as any,
    matchType: r.matchType as any,
    priority: r.priority,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
  };
}
