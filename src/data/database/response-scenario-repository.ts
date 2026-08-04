import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';

export interface ResponseScenarioDatabaseRepository {
  createRespScenario(input: Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<ResponseScenario>;
  updateRespScenario(id: string, input: Partial<ResponseScenario>): Promise<ResponseScenario>;
  softDeleteRespScenario(id: string): Promise<void>;
  getByReqScenarioIdRespScenario(requestScenarioId: string): Promise<ResponseScenario[]>;
  getRespScenarioById(id: string): Promise<ResponseScenario | null>;
}
