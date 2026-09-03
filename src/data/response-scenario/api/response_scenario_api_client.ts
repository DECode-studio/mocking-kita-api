import { apiRequest } from '@/src/core/http-client/api-client';
import { ResponseScenario } from '@/src/domain/response-scenario/entity/response_scenario';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/data/common/remote-response';

export async function listResponseScenariosByRequestScenario(requestScenarioId: string): Promise<ResponseScenario[]> {
  return unwrapRemoteData(
    await apiRequest<RemoteEnvelope<ResponseScenario[]>>(
      `/api/request-scenarios/${encodeURIComponent(requestScenarioId)}/response-scenarios`
    )
  );
}

export async function getResponseScenario(id: string): Promise<ResponseScenario | null> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<ResponseScenario | null>>(`/api/response-scenarios/${encodeURIComponent(id)}`));
}

export async function createResponseScenarioRemote(input: Omit<ResponseScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<ResponseScenario> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<ResponseScenario>>('/api/response-scenarios', { method: 'POST', body: input }));
}

export async function updateResponseScenarioRemote(id: string, input: Partial<ResponseScenario>): Promise<ResponseScenario> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<ResponseScenario>>(`/api/response-scenarios/${encodeURIComponent(id)}`, { method: 'PUT', body: input }));
}

export async function softDeleteResponseScenarioRemote(id: string): Promise<void> {
  unwrapRemoteData(await apiRequest<RemoteEnvelope<void>>(`/api/response-scenarios/${encodeURIComponent(id)}`, { method: 'DELETE' }));
}
