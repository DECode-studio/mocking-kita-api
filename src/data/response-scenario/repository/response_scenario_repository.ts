import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { ResponseScenarioRepository } from '@/src/domain/response-scenario/repository/response_scenario_repository';
import { callDatabase } from '@/src/data/repositories/shared/database-proxy-client';

export class ResponseScenarioRemoteRepository implements ResponseScenarioRepository {
  async getByRequestScenarioId(requestScenarioId: string): Promise<ResponseScenario[]> {
    const database = await callDatabase<{ responseScenarios: ResponseScenario[] }>('getDatabase');
    return database.responseScenarios.filter((responseScenario) => responseScenario.requestScenarioId === requestScenarioId);
  }

  async getById(id: string): Promise<ResponseScenario | null> {
    const database = await callDatabase<{ responseScenarios: ResponseScenario[] }>('getDatabase');
    return database.responseScenarios.find((responseScenario) => responseScenario.id === id) || null;
  }

  async create(input: Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<ResponseScenario> {
    return callDatabase<ResponseScenario>('createRespScenario', input);
  }

  async update(id: string, input: Partial<ResponseScenario>): Promise<ResponseScenario> {
    return callDatabase<ResponseScenario>('updateRespScenario', { id, input });
  }

  async softDelete(id: string): Promise<void> {
    await callDatabase<void>('softDeleteRespScenario', { id });
  }
}
