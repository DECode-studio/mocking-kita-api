export interface ResponseScenario {
  id: string;
  requestScenarioId: string;
  name: string;
  description?: string;
  statusCode: number;
  headers: Record<string, unknown>;
  body: unknown;
  responseType: 'JSON' | 'FILE';
  filePath?: string | null;
  fileName?: string | null;
  delayMs: number;
  weight: number;
  priority: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
