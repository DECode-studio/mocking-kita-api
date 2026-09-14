import { ResponseScenario } from '@/src/client/domain/response-scenario/entity/response_scenario';

export interface ResponseScenarioRemoteDataSource {
  getByRequestScenarioId(requestScenarioId: string): Promise<ResponseScenario[]>;
  getById(id: string): Promise<ResponseScenario | null>;
  create(input: Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<ResponseScenario>;
  update(id: string, input: Partial<ResponseScenario>): Promise<ResponseScenario>;
  softDelete(id: string): Promise<void>;
  uploadFile(file: File): Promise<{ filePath: string; fileName: string }>;
}
