import { ResponseScenario } from '@/src/client/domain/response-scenario/entity/response_scenario';
import { ResponseScenarioRepository } from '@/src/client/domain/response-scenario/repository/response_scenario_repository';
import { ResponseScenarioRemoteDataSource } from '../data_source/response_scenario_data_source';
import { ResponseScenarioRemoteDataSourceImpl } from '../data_source/response_scenario_data_source_impl';

export class ResponseScenarioRepositoryImpl implements ResponseScenarioRepository {
  constructor(private dataSource: ResponseScenarioRemoteDataSource = new ResponseScenarioRemoteDataSourceImpl()) {}

  async getByRequestScenarioId(requestScenarioId: string): Promise<ResponseScenario[]> {
    return this.dataSource.getByRequestScenarioId(requestScenarioId);
  }

  async getById(id: string): Promise<ResponseScenario | null> {
    return this.dataSource.getById(id);
  }

  async create(input: Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<ResponseScenario> {
    return this.dataSource.create(input);
  }

  async update(id: string, input: Partial<ResponseScenario>): Promise<ResponseScenario> {
    return this.dataSource.update(id, input);
  }

  async softDelete(id: string): Promise<void> {
    return this.dataSource.softDelete(id);
  }

  async uploadFile(file: File): Promise<{ filePath: string; fileName: string }> {
    return this.dataSource.uploadFile(file);
  }
}
