import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';

export interface RequestScenarioDataSource {
  getRequestScenariosByApiId(apiId: string): RequestScenario[];
  getRequestScenarioById(id: string): RequestScenario | null;
  createRequestScenario(
    input: Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string }
  ): RequestScenario;
  updateRequestScenario(id: string, input: Partial<RequestScenario>): RequestScenario;
  softDeleteRequestScenario(id: string): void;
  removeRequestScenariosByApiId(apiId: string): void;
}
