import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';

export interface RequestScenarioDatabaseRepository {
  createReqScenario(input: Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<RequestScenario>;
  updateReqScenario(id: string, input: Partial<RequestScenario>): Promise<RequestScenario>;
  softDeleteReqScenario(id: string): Promise<void>;
  getByApiIdReqScenario(apiId: string): Promise<RequestScenario[]>;
  getReqScenarioById(id: string): Promise<RequestScenario | null>;
}
