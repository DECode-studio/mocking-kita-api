export interface ResponseScenario {
  id: string;
  requestScenarioId: string;
  name: string;
  description?: string;
  statusCode: number;
  headers: Record<string, unknown>;
  body: unknown;
  delayMs: number;
  weight: number;
  priority: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
