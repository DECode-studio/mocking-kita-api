import { RequestScenario } from '@/src/client/domain/request-scenario/entity/request_scenario';
import { RequestScenarioRepository } from '@/src/client/domain/request-scenario/repository/request_scenario_repository';
import { RequestScenarioRemoteDataSource } from '../data_source/request_scenario_data_source';
import { RequestScenarioRemoteDataSourceImpl } from '../data_source/request_scenario_data_source_impl';

export class RequestScenarioRepositoryImpl implements RequestScenarioRepository {
  constructor(private dataSource: RequestScenarioRemoteDataSource = new RequestScenarioRemoteDataSourceImpl()) {}

  async getByApiId(apiId: string): Promise<RequestScenario[]> {
    return this.dataSource.getByApiId(apiId);
  }

  async getById(id: string): Promise<RequestScenario | null> {
    return this.dataSource.getById(id);
  }

  async create(input: Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<RequestScenario> {
    return this.dataSource.create(input);
  }

  async update(id: string, input: Partial<RequestScenario>): Promise<RequestScenario> {
    return this.dataSource.update(id, input);
  }

  async softDelete(id: string): Promise<void> {
    return this.dataSource.softDelete(id);
  }
}
