import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { RequestScenarioRepository } from '@/src/domain/request-scenario/repository/request_scenario_repository';
import { callDatabase } from '@/src/core/http-client/database-proxy-client';

export class RequestScenarioRemoteRepository implements RequestScenarioRepository {
  async getByApiId(apiId: string): Promise<RequestScenario[]> {
    const database = await callDatabase<{ requestScenarios: RequestScenario[] }>('getDatabase');
    return database.requestScenarios.filter((requestScenario) => requestScenario.apiId === apiId);
  }

  async getById(id: string): Promise<RequestScenario | null> {
    const database = await callDatabase<{ requestScenarios: RequestScenario[] }>('getDatabase');
    return database.requestScenarios.find((requestScenario) => requestScenario.id === id) || null;
  }

  async create(input: Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<RequestScenario> {
    return callDatabase<RequestScenario>('createReqScenario', input);
  }

  async update(id: string, input: Partial<RequestScenario>): Promise<RequestScenario> {
    return callDatabase<RequestScenario>('updateReqScenario', { id, input });
  }

  async softDelete(id: string): Promise<void> {
    await callDatabase<void>('softDeleteReqScenario', { id });
  }
}
