import { ApiEnvironment } from '@/src/domain/api/entity/api_environment';
import { callDatabase } from '@/src/core/http-client/database-proxy-client';

export async function getApiEnvironmentsByApiId(apiId: string): Promise<ApiEnvironment[]> {
  const database = await callDatabase<{ apiEnvironments: ApiEnvironment[] }>('getDatabase');
  return database.apiEnvironments.filter((apiEnvironment) => apiEnvironment.apiId === apiId);
}

export async function getApiEnvironment(apiId: string, environmentId: string): Promise<ApiEnvironment | null> {
  const apiEnvironments = await getApiEnvironmentsByApiId(apiId);
  return apiEnvironments.find((apiEnvironment) => apiEnvironment.environmentId === environmentId) || null;
}

export async function upsertApiEnvironment(input: Omit<ApiEnvironment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ApiEnvironment> {
  return callDatabase<ApiEnvironment>('upsertApiEnv', input);
}

export async function removeApiEnvironmentsByApiId(_apiId: string): Promise<void> {
  throw new Error('removeApiEnvironmentsByApiId is server-only');
}

export async function removeApiEnvironmentsByEnvironmentId(_environmentId: string): Promise<void> {
  throw new Error('removeApiEnvironmentsByEnvironmentId is server-only');
}
