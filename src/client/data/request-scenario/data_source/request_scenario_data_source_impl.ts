import { apiRequest } from '@/src/core/http-client/api-client';
import { RequestScenario } from '@/src/client/domain/request-scenario/entity/request_scenario';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/client/data/common/remote-response';
import { RequestScenarioRemoteDataSource } from './request_scenario_data_source';

export class RequestScenarioRemoteDataSourceImpl implements RequestScenarioRemoteDataSource {
  async getByApiId(apiId: string): Promise<RequestScenario[]> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<RequestScenario[]>>(`/api/apis/${encodeURIComponent(apiId)}/request-scenarios`));
  }

  async getById(id: string): Promise<RequestScenario | null> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<RequestScenario | null>>(`/api/request-scenarios/${encodeURIComponent(id)}`));
  }

  async create(input: Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<RequestScenario> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<RequestScenario>>('/api/request-scenarios', { method: 'POST', body: input }));
  }

  async update(id: string, input: Partial<RequestScenario>): Promise<RequestScenario> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<RequestScenario>>(`/api/request-scenarios/${encodeURIComponent(id)}`, { method: 'PUT', body: input }));
  }

  async softDelete(id: string): Promise<void> {
    unwrapRemoteData(await apiRequest<RemoteEnvelope<void>>(`/api/request-scenarios/${encodeURIComponent(id)}`, { method: 'DELETE' }));
  }
}

// Standalone functions for backward compatibility / tests if needed
export const listRequestScenariosByApi = (apiId: string) => new RequestScenarioRemoteDataSourceImpl().getByApiId(apiId);
export const getRequestScenario = (id: string) => new RequestScenarioRemoteDataSourceImpl().getById(id);
export const createRequestScenarioRemote = (input: Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'>) => new RequestScenarioRemoteDataSourceImpl().create(input);
export const updateRequestScenarioRemote = (id: string, input: Partial<RequestScenario>) => new RequestScenarioRemoteDataSourceImpl().update(id, input);
export const softDeleteRequestScenarioRemote = (id: string) => new RequestScenarioRemoteDataSourceImpl().softDelete(id);
