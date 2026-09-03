import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';

export function toResponseScenarioDomain(r: {
  id: string;
  requestScenarioId: string;
  name: string;
  description: string | null;
  statusCode: number | null;
  headers: any;
  body: any;
  responseType: string;
  filePath: string | null;
  fileName: string | null;
  delayMs: number;
  weight: number;
  priority: number;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): ResponseScenario {
  return {
    id: r.id,
    requestScenarioId: r.requestScenarioId,
    name: r.name,
    description: r.description ?? undefined,
    statusCode: r.statusCode ?? 200,
    headers: r.headers ?? {},
    body: r.body ?? {},
    responseType: r.responseType as any,
    filePath: r.filePath ?? undefined,
    fileName: r.fileName ?? undefined,
    delayMs: r.delayMs,
    weight: r.weight,
    priority: r.priority,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
  };
}
