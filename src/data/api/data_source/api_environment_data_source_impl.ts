import { ApiEnvironment } from '@/src/domain/api/entity/api_environment';
import { getApiEnvironmentRemote, listApiEnvironmentsByApi, upsertApiEnvironmentRemote } from '../api/api_environment_api_client';

export async function getApiEnvironmentsByApiId(apiId: string): Promise<ApiEnvironment[]> {
  return listApiEnvironmentsByApi(apiId);
}

export async function getApiEnvironment(apiId: string, environmentId: string): Promise<ApiEnvironment | null> {
  return getApiEnvironmentRemote(apiId, environmentId);
}

export async function upsertApiEnvironment(input: Omit<ApiEnvironment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ApiEnvironment> {
  return upsertApiEnvironmentRemote(input);
}

export async function removeApiEnvironmentsByApiId(_apiId: string): Promise<void> {
  throw new Error('removeApiEnvironmentsByApiId is server-only');
}

export async function removeApiEnvironmentsByEnvironmentId(_environmentId: string): Promise<void> {
  throw new Error('removeApiEnvironmentsByEnvironmentId is server-only');
}
