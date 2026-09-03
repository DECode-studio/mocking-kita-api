import { apiRequest } from '@/src/core/http-client/api-client';
import { RequestScenario } from '@/src/domain/request-scenario/entity/request_scenario';
import { RemoteEnvelope, unwrapRemoteData } from '@/src/data/common/remote-response';

export async function listRequestScenariosByApi(apiId: string): Promise<RequestScenario[]> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<RequestScenario[]>>(`/api/apis/${encodeURIComponent(apiId)}/request-scenarios`));
}

export async function getRequestScenario(id: string): Promise<RequestScenario | null> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<RequestScenario | null>>(`/api/request-scenarios/${encodeURIComponent(id)}`));
}

export async function createRequestScenarioRemote(input: Omit<RequestScenario, 'id' | 'createdAt' | 'updatedAt'>): Promise<RequestScenario> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<RequestScenario>>('/api/request-scenarios', { method: 'POST', body: input }));
}

export async function updateRequestScenarioRemote(id: string, input: Partial<RequestScenario>): Promise<RequestScenario> {
  return unwrapRemoteData(await apiRequest<RemoteEnvelope<RequestScenario>>(`/api/request-scenarios/${encodeURIComponent(id)}`, { method: 'PUT', body: input }));
}

export async function softDeleteRequestScenarioRemote(id: string): Promise<void> {
  unwrapRemoteData(await apiRequest<RemoteEnvelope<void>>(`/api/request-scenarios/${encodeURIComponent(id)}`, { method: 'DELETE' }));
}
