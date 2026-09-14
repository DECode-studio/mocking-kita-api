import { apiRequest } from '@/src/core/http-client/api-client';
import { ResponseScenario } from '@/src/client/domain/response-scenario/entity/response_scenario';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/client/data/common/remote-response';
import { ResponseScenarioRemoteDataSource } from './response_scenario_data_source';

export class ResponseScenarioRemoteDataSourceImpl implements ResponseScenarioRemoteDataSource {
  async getByRequestScenarioId(requestScenarioId: string): Promise<ResponseScenario[]> {
    return unwrapRemoteData(
      await apiRequest<RemoteEnvelope<ResponseScenario[]>>(
        `/api/request-scenarios/${encodeURIComponent(requestScenarioId)}/response-scenarios`
      )
    );
  }

  async getById(id: string): Promise<ResponseScenario | null> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<ResponseScenario | null>>(`/api/response-scenarios/${encodeURIComponent(id)}`));
  }

  async create(input: Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<ResponseScenario> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<ResponseScenario>>('/api/response-scenarios', { method: 'POST', body: input }));
  }

  async update(id: string, input: Partial<ResponseScenario>): Promise<ResponseScenario> {
    return unwrapRemoteData(await apiRequest<RemoteEnvelope<ResponseScenario>>(`/api/response-scenarios/${encodeURIComponent(id)}`, { method: 'PUT', body: input }));
  }

  async softDelete(id: string): Promise<void> {
    unwrapRemoteData(await apiRequest<RemoteEnvelope<void>>(`/api/response-scenarios/${encodeURIComponent(id)}`, { method: 'DELETE' }));
  }

  async uploadFile(file: File): Promise<{ filePath: string; fileName: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Upload failed');
    }

    return {
      filePath: json.filePath,
      fileName: json.fileName,
    };
  }
}

// Standalone functions for backward compatibility / tests if needed
export const listResponseScenariosByRequestScenario = (requestScenarioId: string) => new ResponseScenarioRemoteDataSourceImpl().getByRequestScenarioId(requestScenarioId);
export const getResponseScenario = (id: string) => new ResponseScenarioRemoteDataSourceImpl().getById(id);
export const createResponseScenario = (input: Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'>) => new ResponseScenarioRemoteDataSourceImpl().create(input);
export const updateResponseScenario = (id: string, input: Partial<ResponseScenario>) => new ResponseScenarioRemoteDataSourceImpl().update(id, input);
export const softDeleteResponseScenario = (id: string) => new ResponseScenarioRemoteDataSourceImpl().softDelete(id);
