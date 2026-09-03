import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { RequestScenarioRepository } from '@/src/domain/request-scenario/repository/request_scenario_repository';
import { createRequestScenarioRemote, getRequestScenario, listRequestScenariosByApi, softDeleteRequestScenarioRemote, updateRequestScenarioRemote } from '../api/request_scenario_api_client';

export class RequestScenarioRemoteRepository implements RequestScenarioRepository {
  async getByApiId(apiId: string): Promise<RequestScenario[]> {
    return listRequestScenariosByApi(apiId);
  }

  async getById(id: string): Promise<RequestScenario | null> {
    return getRequestScenario(id);
  }

  async create(input: Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<RequestScenario> {
    return createRequestScenarioRemote(input);
  }

  async update(id: string, input: Partial<RequestScenario>): Promise<RequestScenario> {
    return updateRequestScenarioRemote(id, input);
  }

  async softDelete(id: string): Promise<void> {
    await softDeleteRequestScenarioRemote(id);
  }
}
