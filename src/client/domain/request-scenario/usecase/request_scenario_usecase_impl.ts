import { RequestScenario } from '../entity/request_scenario';
import { RequestScenarioRepository } from '../repository/request_scenario_repository';
import { RequestScenarioUseCase } from './request_scenario_usecase';

export class RequestScenarioUseCaseImpl implements RequestScenarioUseCase {
  constructor(private repository: RequestScenarioRepository) {}

  async getByApiId(apiId: string): Promise<RequestScenario[]> {
    return this.repository.getByApiId(apiId);
  }

  async getById(id: string): Promise<RequestScenario | null> {
    return this.repository.getById(id);
  }

  async create(input: Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<RequestScenario> {
    return this.repository.create(input);
  }

  async update(id: string, input: Partial<RequestScenario>): Promise<RequestScenario> {
    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }
}
