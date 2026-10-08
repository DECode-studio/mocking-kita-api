import { RequestScenario } from '../entity/request_scenario';

export interface RequestScenarioUseCase {
  getByApiId(apiId: string): Promise<RequestScenario[]>;
  getById(id: string): Promise<RequestScenario | null>;
  create(input: Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<RequestScenario>;
  update(id: string, input: Partial<RequestScenario>): Promise<RequestScenario>;
  delete(id: string): Promise<void>;
}
