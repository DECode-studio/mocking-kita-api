import { RequestScenario } from '@/src/client/domain/request-scenario/entity/request_scenario';

export interface RequestScenarioRemoteDataSource {
  getByApiId(apiId: string): Promise<RequestScenario[]>;
  getById(id: string): Promise<RequestScenario | null>;
  create(input: Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<RequestScenario>;
  update(id: string, input: Partial<RequestScenario>): Promise<RequestScenario>;
  softDelete(id: string): Promise<void>;
}
