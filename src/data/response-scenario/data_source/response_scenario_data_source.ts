import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';

export interface ResponseScenarioDataSource {
  getResponseScenariosByRequestScenarioId(requestScenarioId: string): ResponseScenario[];
  getResponseScenarioById(id: string): ResponseScenario | null;
  createResponseScenario(
    input: Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
  ): ResponseScenario;
  updateResponseScenario(id: string, input: Partial<ResponseScenario>): ResponseScenario;
  softDeleteResponseScenario(id: string): void;
  removeResponseScenariosByRequestScenarioId(requestScenarioId: string): void;
}
